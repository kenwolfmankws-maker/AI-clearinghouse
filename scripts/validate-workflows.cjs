#!/usr/bin/env node
/**
 * Simple GitHub Actions workflow validator
 * Flags suspicious git/npm commands outside of explicit run: | blocks.
 */
const fs = require('fs');
const path = require('path');

const workflowsDir = path.join(__dirname, '..', '.github', 'workflows');
const suspiciousPatterns = [
  /^\s*git\s+(add|commit|push)\b/i,
  /^\s*npm\s+(run\s+)?(start|test|search|verify)\b/i,
  /^\s*node\s+scripts\//i
];

let hadError = false;

function validateFile(file) {
  const content = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let inRunBlock = false;
  for (let i = 0; i < content.length; i++) {
    const line = content[i];
    // Detect start of run block
    if (/^\s*run:\s*\|\s*$/.test(line)) {
      inRunBlock = true;
      continue;
    }
    // run block ends when indentation decreases or blank line? We'll approximate:
    // If line starts at 0 or no leading spaces and not empty while we were inside, treat as exit.
    if (inRunBlock && /^\S/.test(line)) {
      inRunBlock = false;
    }
    if (!inRunBlock) {
      for (const pat of suspiciousPatterns) {
        if (pat.test(line)) {
          console.error(`[VIOLATION] ${path.basename(file)}:${i + 1}: Suspicious command outside run block -> ${line.trim()}`);
          hadError = true;
        }
      }
    }
  }
}

if (!fs.existsSync(workflowsDir)) {
  console.error('No workflows directory found.');
  process.exit(1);
}

for (const entry of fs.readdirSync(workflowsDir)) {
  if (!entry.endsWith('.yml') && !entry.endsWith('.yaml')) continue;
  validateFile(path.join(workflowsDir, entry));
}

if (hadError) {
  console.error('\nValidation failed. Fix violations before committing.');
  process.exit(2);
}
console.log('Workflow validation passed.');
