const fs = require('fs');
const os = require('os');
const path = require('path');

const { searchTextFiles, searchJSONL, highlight } = require('../scripts/search-logs');

function mkTempWorkspace() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-clearinghouse-test-'));
  const ws = path.join(dir, 'workspace');
  const logs = path.join(ws, 'logs');
  fs.mkdirSync(logs, { recursive: true });
  return { dir, ws, logs };
}

describe('search-logs utilities', () => {
  test('text search is case-insensitive and enforces limit', () => {
    const { ws } = mkTempWorkspace();
    const fileA = path.join(ws, 'log.txt');
    fs.writeFileSync(fileA, [
      'Hello CHAT bot',
      'nothing here',
      'another chat Line',
    ].join('\n'));

    const matches = searchTextFiles([fileA], 'chat', 1);
    expect(matches.length).toBe(1);
    // Content contains the matched line regardless of case
    expect(matches[0].content.toLowerCase()).toContain('chat');
  });

  test('JSONL search skips malformed rows and matches valid entries', () => {
    const { ws } = mkTempWorkspace();
    const jsonl = path.join(ws, 'log.jsonl');
    fs.writeFileSync(jsonl, [
      '{"timestamp":"2025-11-07T18:40:00Z","author":"Ken","entry":"George noted"}',
      '{bad json}',
      '{"timestamp":"2025-11-07T18:41:00Z","author":"Ann","entry":"Deploy started"}',
    ].join('\n'));

    const matches = searchJSONL(jsonl, 'george', 10);
    expect(matches.length).toBe(1);
    expect(matches[0].entry.toLowerCase()).toContain('george');
  });

  test('highlight wraps all occurrences with ANSI codes', () => {
    const line = 'Deploy deploy DePloy';
    const out = highlight(line, 'deploy');
    const yellow = '\x1b[33m';
    const reset = '\x1b[0m';
    // Count raw escape sequence occurrences without regex since escape codes contain '[' and 'm'
    const occurrences = out.split(yellow).length - 1;
    const resets = out.split(reset).length - 1;
    expect(occurrences).toBe(3);
    expect(resets).toBe(3);
  });
});
