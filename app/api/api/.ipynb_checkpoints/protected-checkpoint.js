// Vercel Serverless Function: GET /api/protected
// Validates Vercel OIDC Bearer token using team or global issuer JWKS
// Env:
//   - VERCEL_TEAM_SLUG: your team slug (recommended)
//   - OIDC_AUDIENCE: the expected audience string
//   - OIDC_SUBJECT (optional): enforce a specific subject claim

const { verifyOidcFromRequest } = require('../lib/oidc');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { claims: payload, issuer: issuerUsed } = await verifyOidcFromRequest(req);
    return res.status(200).json({
      ok: true,
      issuer: issuerUsed,
      aud: payload.aud,
      sub: payload.sub,
      exp: payload.exp,
      iat: payload.iat,
      nbf: payload.nbf,
      claims: payload,
    });
  } catch (err) {
    const status = err?.statusCode || 500;
    if (status >= 500) console.error('[oidc] error', err);
    return res.status(status).json({ error: status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Internal Server Error', detail: err?.message });
  }
};
