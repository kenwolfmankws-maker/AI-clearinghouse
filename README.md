# AI-clearinghouse

Minimal Node.js workspace with an OpenAI chat runner and a GitHub Actions workflow that records entries in three formats:

- Aggregate text log: `workspace/log.txt`
- Daily rotated logs: `workspace/logs/YYYY-MM-DD.log`
- Structured JSONL stream: `workspace/log.jsonl` (one JSON object per line)

## Setup

- Node 18+
- Copy `.env.example` to `.env` and set your key:
  - `OPENAI_API_KEY=sk-your-key-here`
- Do not commit `.env` (already ignored).

## Scripts

- `npm start` — run `index.js`
- `npm run chat -- "hello"` — call `GeorgePortal/chat.js`
- `npm run verify` — quick key check against OpenAI models API

## Run the workflow manually

The workflow `.github/workflows/publish-workspace.yml` is manual (workflow_dispatch).

1. Go to the GitHub repo → Actions → "Publish workspace" workflow
2. Click "Run workflow"
3. Fill inputs:
   - `entry`: short text to record (required)
   - `author`: display name (defaults to "Ken Wolfman Smalley")
4. The workflow appends a UTC timestamped line to all three log targets and commits them.

### Log Formats

| File | Purpose | Example Line |
|------|---------|--------------|
| `workspace/log.txt` | Full chronological history | `2025-11-07 18:22:14 UTC — Deployed chat module` |
| `workspace/logs/2025-11-07.log` | Per-day slice | `2025-11-07 18:22:14 UTC — Deployed chat module` |
| `workspace/log.jsonl` | Machine-readable | `{"timestamp":"2025-11-07T18:22:14Z","author":"Ken","entry":"Deployed chat module"}` |

Parse JSONL examples:

```bash
# Show last 5 entries
tail -n 5 workspace/log.jsonl | jq '.'

# Filter for lines mentioning "chat"
grep -i chat workspace/log.jsonl | jq -r '.timestamp + " " + .entry'
```

Notes:
- Workflow has `permissions: contents: write` to push commits
- Uses a concurrency group to avoid overlapping writes
- Commits only if a change is detected
- JSONL lines are produced with `jq -n` to ensure proper escaping

## Search the logs (workflow)

Use `.github/workflows/search-workspace.yml` to search recorded entries.

Inputs:
- `query` (required): case-insensitive search string
- `scope` (optional): `all` (default), `text`, or `jsonl`

Outputs:
- Job Summary includes a markdown view of matched text lines and JSONL rows
- An artifact `workspace-search-results` with raw outputs (`text.raw`, `jsonl.tsv`)

How to run:
1. GitHub repo → Actions → "Search workspace" → Run workflow
2. Enter your query (e.g., `chat`, `deploy`, `george`)
3. Inspect the run summary and download the artifact for full detail

## Troubleshooting

- If `npm run verify` fails, ensure `.env` exists and contains a valid key
- If pushes from the workflow fail, check branch protections for `main`
- If JSONL parsing fails, check for manual edits; each line should be valid JSON

## Next Ideas

- Upload daily log as artifact
- Rotate JSONL monthly (e.g. `workspace/log-2025-11.jsonl`)
- Provide a search workflow (dispatch with a query and return matches)

