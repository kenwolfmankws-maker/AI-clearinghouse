const { cors } = require('@vercel/functions');
const { verifyToken } = require('../lib/oidc');

/**
 * Vercel serverless function for OIDC-protected endpoint
 * Always requires a valid Vercel OIDC Bearer token
 * Returns decoded claims if valid
 */

async function handler(req) {
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      return cors()(new Response(null, { status: 204 }));
    }
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return cors()(
        new Response(
          JSON.stringify({ error: 'Missing or invalid Authorization header' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const token = authHeader.substring(7);
    const { payload, issuerUsed } = await verifyToken(token);

    const response = {
      ok: true,
      issuer: issuerUsed,
      subject: payload.sub,
      audience: payload.aud,
      issued_at: payload.iat,
      expires_at: payload.exp,
      claims: payload,
    };

    return cors()(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  } catch (err) {
    const detail = err && (err.message || String(err));
    return cors()(
      new Response(
        JSON.stringify({ ok: false, error: detail }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );
  } catch (outerError) {
    // Catch any unexpected errors outside the main try-catch
    console.error('[api/protected] unexpected error:', outerError);
    return cors()(
      new Response(
        JSON.stringify({
          ok: false,
          error: outerError?.message || 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
  }
}

// Export for Vercel Functions v3
module.exports = handler;


