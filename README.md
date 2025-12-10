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

### Deployment (Vercel)

This repo is configured for Vercel's default serverless routing:
- API: `api/chat.js` → available at `/api/chat`
- Static UI: `index.html` at repo root (for production) and legacy `public/index.html` for the local Express server

To deploy (direct OpenAI):
1. Push to `main`.
2. In Vercel → Project → Settings → Environment Variables, add `OPENAI_API_KEY` with your real key (Sensitive; Production + Preview).
3. Redeploy.
4. Visit your project URL and test `/api/chat`.

To deploy (AI Gateway optional):
1. Obtain an AI Gateway API key from Vercel.
2. Add `AI_GATEWAY_API_KEY` (Sensitive; Production + Preview) instead of or alongside `OPENAI_API_KEY`.
3. (Optional) Set `CHAT_MODEL` (e.g. `openai/gpt-4o-mini`, `anthropic/claude-sonnet-4`).
4. Redeploy and test.

Runtime selection:
- If `AI_GATEWAY_API_KEY` is present the serverless function uses baseURL `https://ai-gateway.vercel.sh/v1` and provider-prefixed model names.
- Otherwise it falls back to OpenAI with `OPENAI_API_KEY`.

OIDC enforcement (optional):
- Set `REQUIRE_OIDC_FOR_CHAT=true` to require a valid Vercel OIDC Bearer token for `/api/chat`.
- `/api/protected` always requires a token and returns decoded claims if valid.


## Scripts

- `npm start` — run `index.cjs`
- `npm run chat -- "hello"` — call `GeorgePortal/chat.cjs`
- `npm run verify` — quick key check against OpenAI models API
- `npm run search -- "query" [-- --scope=all|text|jsonl --limit=200]` — local log search (see below)

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

## Search the logs locally

Quickly search the workspace logs on your machine.

- Text sources scanned:
  - `workspace/log.txt`
  - `workspace/logs/**/*.log`
- JSONL source scanned:
  - `workspace/log.jsonl` (fields: timestamp, author, entry)

Usage (PowerShell-friendly examples):

- Search everywhere (default scope=all)
  - `npm run search -- "chat"`

- Only JSONL with a result cap
  - `npm run search -- "deploy" -- --scope=jsonl --limit=50`

- Only text logs
  - `npm run search -- "george" -- --scope=text`

Notes:
- Use the `--` separator before flags when passing options to the script via npm.
- Matching is case-insensitive. Output shows line matches for text and tab-separated rows for JSONL.

## Troubleshooting

- If `npm run verify` fails, ensure `.env` exists and contains a valid key
- If gateway mode errors, confirm model is prefixed (e.g. `openai/gpt-4o-mini`) and key set as `AI_GATEWAY_API_KEY`

### Protecting your own API with Vercel OIDC

This repo includes `/api/protected` which validates Vercel-issued OIDC JWTs:

Env vars:
- `VERCEL_TEAM_SLUG` — your team slug (used for team issuer)
- `OIDC_AUDIENCE` — the expected audience for your API
- `OIDC_SUBJECT` (optional) — require a specific subject

Verification rules:
- Issuer: `https://oidc.vercel.com/<TEAM_SLUG>` if provided, else global `https://oidc.vercel.com`
- JWKS: `https://oidc.vercel.com/<TEAM_SLUG>/.well-known/jwks` or global JWKS
- Algorithm: RS256 only; small clock tolerance applied

Call example (after obtaining a Vercel OIDC token in your environment):

```bash
curl -H "Authorization: Bearer <token>" https://<your-app>.vercel.app/api/protected
```
- If pushes from the workflow fail, check branch protections for `main`
- If JSONL parsing fails, check for manual edits; each line should be valid JSON

## Next Ideas

- Upload daily log as artifact
- Rotate JSONL monthly (e.g. `workspace/log-2025-11.jsonl`)
- Provide a search workflow (dispatch with a query and return matches)

