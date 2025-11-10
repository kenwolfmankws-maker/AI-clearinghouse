// Shared OIDC verification helpers for Vercel-issued JWTs
// Supports team issuer (preferred) and global issuer fallback.

async function getJose() {
  const mod = await import('jose');
  return mod;
}

function getIssuerConfig() {
  const team = process.env.VERCEL_TEAM_SLUG || '';
  return {
    teamIssuer: team ? `https://oidc.vercel.com/${team}` : null,
    teamJwks: team ? `https://oidc.vercel.com/${team}/.well-known/jwks` : null,
    globalIssuer: 'https://oidc.vercel.com',
    globalJwks: 'https://oidc.vercel.com/.well-known/jwks',
  };
}

async function verifyToken(token) {
  const { createRemoteJWKSet, jwtVerify } = await getJose();
  const { teamIssuer, teamJwks, globalIssuer, globalJwks } = getIssuerConfig();

  const audience = process.env.OIDC_AUDIENCE || (teamIssuer ? `https://vercel.com/${process.env.VERCEL_TEAM_SLUG}` : undefined);
  if (!audience) {
    console.warn('[oidc] OIDC_AUDIENCE not set; verification may fail');
  }

  async function tryVerify(issuer, jwksUrl) {
    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer,
      audience,
      algorithms: ['RS256'],
      clockTolerance: 5,
    });
    return { payload, issuerUsed: issuer };
  }

  let lastErr;
  if (teamIssuer && teamJwks) {
    try {
      return await tryVerify(teamIssuer, teamJwks);
    } catch (e) {
      lastErr = e;
    }
  }
  try {
    return await tryVerify(globalIssuer, globalJwks);
  } catch (e) {
    lastErr = e;
    throw lastErr || new Error('OIDC verification failed');
  }
}

async function verifyOidcFromRequest(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) {
    const err = new Error('Missing or invalid Authorization header');
    err.statusCode = 401;
    throw err;
  }
  const token = auth.slice('Bearer '.length).trim();
  const { payload, issuerUsed } = await verifyToken(token);

  const expectedSub = process.env.OIDC_SUBJECT;
  if (expectedSub && payload.sub !== expectedSub) {
    const err = new Error('Forbidden: subject mismatch');
    err.statusCode = 403;
    throw err;
  }
  return { claims: payload, issuer: issuerUsed };
}

module.exports = {
  verifyToken,
  verifyOidcFromRequest,
};
