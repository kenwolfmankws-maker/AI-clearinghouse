const { verifyJWT } = require('@vercel/oidc');

/**
 * OIDC JWT verification utility
 * Verifies Vercel-issued OIDC tokens
 */

async function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required');
  }

  const options = {};

  // Configure issuer based on team slug
  if (process.env.VERCEL_TEAM_SLUG) {
    options.issuer = `https://oidc.vercel.com/${process.env.VERCEL_TEAM_SLUG}`;
  } else {
    options.issuer = 'https://oidc.vercel.com';
  }

  // Configure audience if provided
  if (process.env.OIDC_AUDIENCE) {
    options.audience = process.env.OIDC_AUDIENCE;
  }

  try {
    const { payload } = await verifyJWT(token, options);

    // Optional subject check
    if (process.env.OIDC_SUBJECT && payload.sub !== process.env.OIDC_SUBJECT) {
      throw new Error(`Subject mismatch: expected ${process.env.OIDC_SUBJECT}, got ${payload.sub}`);
    }

    // Determine issuer used (for logging)
    const issuerUsed = options.issuer;

    return { payload, issuerUsed };
  } catch (err) {
    throw new Error(`OIDC verification failed: ${err.message}`);
  }
}

module.exports = { verifyToken };


