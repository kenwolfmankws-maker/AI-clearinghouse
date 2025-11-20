// Vercel Serverless Function: GET /api/proxy
// Calls an external API using a Vercel-issued OIDC token for Authorization.
// Uses dynamic import to interop with ESM-only '@vercel/oidc' in a CommonJS project.
// Env:
//   - OIDC_PROXY_URL (optional): target URL to call. Defaults to https://api.example.com

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const target = process.env.OIDC_PROXY_URL || 'https://api.example.com';

  let getVercelOidcToken;
  try {
    // Import at runtime to avoid ESM/CJS issues
    ({ getVercelOidcToken } = await import('@vercel/oidc'));
  } catch (e) {
    console.error('[proxy] Failed to import @vercel/oidc', e);
    return res.status(500).json({ error: 'Server misconfigured: missing @vercel/oidc' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const token = await getVercelOidcToken();
    if (!token) {
      console.warn('[proxy] getVercelOidcToken returned empty token');
      clearTimeout(timeout);
      return res.status(503).json({ error: 'Unable to mint OIDC token' });
    }

    const upstream = await fetch(target, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = upstream.headers.get('content-type') || '';
    let body;
    try {
      body = contentType.includes('application/json') ? await upstream.json() : await upstream.text();
    } catch (parseErr) {
      body = { error: 'Failed to parse upstream response' };
    }

    // Normalize to JSON response for clients
    const payload = {
      ok: upstream.ok,
      status: upstream.status,
      url: target,
      data: body,
    };

    const status = upstream.ok ? 200 : upstream.status;
    return res.status(status).json(payload);
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('[proxy] Upstream request timed out');
      return res.status(504).json({ error: 'Upstream timeout' });
    }
    console.error('[proxy] Error calling upstream:', err?.message || err);
    return res.status(502).json({ error: 'Bad Gateway', detail: err?.message });
  }
};
