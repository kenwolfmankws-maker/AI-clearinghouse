#!/usr/bin/env node
/**
 * OIDC JWT verification CLI
 * Usage:
 *   node scripts/oidc-test.js <jwt>
 *   or set TOKEN env var: TOKEN=<jwt> npm run oidc:test
 *
 * Relies on lib/oidc.js verifyToken().
 * Exits 0 on success, non-zero on failure.
 */

const path = require('path');
const fs = require('fs');

async function main() {
  const token = process.argv[2] || process.env.TOKEN;
  if (!token) {
    console.error('Usage: node scripts/oidc-test.js <jwt>\nOr set TOKEN env variable.');
    process.exit(2);
  }
  let verifier;
  try {
    verifier = require('../lib/oidc');
  } catch (e) {
    console.error('[oidc-test] Failed to load lib/oidc.js', e);
    process.exit(3);
  }

  try {
    const { verifyToken } = verifier;
    const { payload, issuerUsed } = await verifyToken(token);
    const summary = {
      issuer: issuerUsed,
      subject: payload.sub,
      audience: payload.aud,
      issued_at: payload.iat,
      expires_at: payload.exp,
      claims: payload,
    };
    console.log(JSON.stringify({ ok: true, ...summary }, null, 2));
    // Basic exp check
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('[oidc-test] WARNING: token is expired');
      process.exitCode = 1; // treat as warning
    }
  } catch (err) {
    const detail = err && (err.message || String(err));
    console.error(JSON.stringify({ ok: false, error: detail }, null, 2));
    process.exit(1);
  }
}

main();
