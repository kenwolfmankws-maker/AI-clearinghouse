#!/usr/bin/env node
/*
 Pre-commit guard to prevent accidental secret or heavy files.
 Blocks commits that:
  - include .env (except .env.example)
  - include node_modules/
  - add lines containing likely OpenAI keys (sk-...)
*/

const { execSync } = require('child_process');

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only -z', { encoding: 'utf8' });
    return out ? out.split('\u0000').filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getStagedPatch() {
  try {
    return execSync('git diff --cached -U0', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function fail(msg) {
  console.error(`\n[pre-commit] ${msg}\n`);
  process.exit(1);
}

(function main() {
  const files = getStagedFiles();
  if (!files.length) process.exit(0);

  // 1) Block .env files (except template)
  const badEnv = files.find(f => /(^|\/)\.env(\..+)?$/.test(f) && !/\.env\.example$/.test(f));
  if (badEnv) {
    fail(`Refusing to commit '${badEnv}'. Put secrets in local .env only (git-ignored).`);
  }

  // 2) Block node_modules
  const badNM = files.find(f => f.includes('node_modules/'));
  if (badNM) {
    fail(`Refusing to commit dependency artifacts: '${badNM}'. node_modules must not be tracked.`);
  }

  // 3) Scan added lines for likely secrets (OpenAI key pattern sk-...)
  const patch = getStagedPatch();
  const addedLines = patch.split('\n').filter(l => l.startsWith('+'));
  const secretPattern = /sk-[A-Za-z0-9-_]{10,}/;
  if (addedLines.some(l => secretPattern.test(l))) {
    fail('Detected something that looks like a secret (sk-...). Remove it before committing.');
  }

  process.exit(0);
})();
