#!/usr/bin/env node
// Local OIDC token verifier using shared lib/oidc.js
// Usage:
//   node oidc-test.cjs "<JWT>"
// or set TOKEN env var:
//   set TOKEN=eyJ... && node oidc-test.cjs

const { verifyToken } = require('./lib/oidc');

async function main() {
  try {
    const token = process.env.TOKEN || process.argv[2];
    if (!token) {
      console.error('Usage: node oidc-test.cjs "<JWT>"\nOr set TOKEN env var.');
      process.exit(2);
    }
    const { payload, issuerUsed } = await verifyToken(token);
    console.log('OK');
    console.log(JSON.stringify({ issuer: issuerUsed, sub: payload.sub, aud: payload.aud, exp: payload.exp, iat: payload.iat, nbf: payload.nbf }, null, 2));
  } catch (err) {
    console.error('FAIL');
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
