#!/usr/bin/env node
// Local log search utility
// Searches:
//   - workspace/log.txt
//   - workspace/logs/**/ *.log (any .log under workspace/logs)
//   - workspace/log.jsonl (fields: timestamp, author, entry)
// Case-insensitive matching
// Options:
//   --scope=all|text|jsonl (default: all)
//   --limit=<n> (default: 200 lines)
//   --cwd=<path> (default: process.cwd())
//   --format=text|json (default: text) -> json emits structured array

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { query: '', scope: 'all', limit: 200, cwd: process.cwd(), format: 'text' };
  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      if (!args.query) args.query = arg;
      continue;
    }
    const [k, vRaw] = arg.replace(/^--/, '').split('=');
    const v = vRaw === undefined ? true : vRaw;
    if (k === 'scope' && typeof v === 'string') args.scope = v;
    else if (k === 'limit') args.limit = Number(v) || args.limit;
    else if (k === 'cwd' && typeof v === 'string') args.cwd = v;
    else if (k === 'format' && typeof v === 'string') args.format = v;
  }
  return args;
}

function listFilesRecursive(dir, extFilter) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch {}
    for (const e of entries) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (!extFilter || p.toLowerCase().endsWith(extFilter)) out.push(p);
    }
  }
  return out;
}

function searchTextFiles(files, query, limit) {
  const q = query.toLowerCase();
  const results = [];
  for (const file of files) {
    let content = '';
    try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(q)) {
        results.push({ file, lineNumber: i + 1, content: line });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

function searchJSONL(file, query, limit) {
  const res = [];
  if (!fs.existsSync(file)) return res;
  let data = '';
  try { data = fs.readFileSync(file, 'utf8'); } catch { return res; }
  const q = query.toLowerCase();
  for (const raw of data.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    try {
      const obj = JSON.parse(raw);
      const hay = [obj.timestamp, obj.author, obj.entry]
        .map(x => (x == null ? '' : String(x).toLowerCase()))
        .join(' ');
      if (hay.includes(q)) {
        res.push({ timestamp: obj.timestamp, author: obj.author, entry: obj.entry });
        if (res.length >= limit) return res;
      }
    } catch {}
  }
  return res;
}

function highlight(content, query) {
  const lower = content.toLowerCase();
  const qLower = query.toLowerCase();
  let idx = 0;
  let out = '';
  while (true) {
    const pos = lower.indexOf(qLower, idx);
    if (pos === -1) {
      out += content.slice(idx);
      break;
    }
    out += content.slice(idx, pos) + '\x1b[33m' + content.slice(pos, pos + query.length) + '\x1b[0m';
    idx = pos + query.length;
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.query) {
    console.error('Usage: npm run search -- "<query>" [--scope=all|text|jsonl] [--limit=200] [--format=text|json]');
    process.exit(2);
  }
  const root = args.cwd;
  const ws = path.join(root, 'workspace');
  const logTxt = path.join(ws, 'log.txt');
  const logsDir = path.join(ws, 'logs');
  const jsonl = path.join(ws, 'log.jsonl');

  const showText = args.scope === 'all' || args.scope === 'text';
  const showJSONL = args.scope === 'all' || args.scope === 'jsonl';

  const output = [];

  if (showText) {
    const files = [];
    if (fs.existsSync(logTxt)) files.push(logTxt);
    if (fs.existsSync(logsDir)) files.push(...listFilesRecursive(logsDir, '.log'));
    const textMatches = searchTextFiles(files, args.query, args.limit);
    if (args.format === 'json') {
      for (const m of textMatches) output.push({ type: 'text', file: m.file, line: m.lineNumber, content: m.content });
    } else {
      console.log('=== Text matches ===');
      if (textMatches.length) {
        console.log(textMatches.map(m => `${m.file}:${m.lineNumber}: ${highlight(m.content, args.query)}`).join('\n'));
      } else console.log('(no matches)');
      console.log('');
    }
  }

  if (showJSONL) {
    const jsonlMatches = searchJSONL(jsonl, args.query, args.limit);
    if (args.format === 'json') {
      for (const m of jsonlMatches) output.push({ type: 'jsonl', timestamp: m.timestamp, author: m.author, entry: m.entry });
    } else {
      console.log('=== JSONL matches (ts\tauthor\tentry) ===');
      if (jsonlMatches.length) {
        console.log(jsonlMatches.map(m => `${m.timestamp}\t${m.author}\t${highlight(m.entry, args.query)}`).join('\n'));
      } else console.log('(no matches)');
    }
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(output, null, 2));
  }
}

if (require.main === module) {
  try { main(); } catch (err) {
    console.error('Search failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

module.exports = { parseArgs, listFilesRecursive, searchTextFiles, searchJSONL, highlight };
