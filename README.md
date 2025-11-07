# AI-clearinghouse

Minimal Node.js workspace with an OpenAI chat runner and a simple GitHub Actions workflow to append entries to `workspace/log.txt`.

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
4. The workflow appends a UTC timestamped line to `workspace/log.txt` and commits it.

Notes:
- Workflow has `permissions: contents: write` to push commits
- Uses a concurrency group to avoid overlapping writes
- Commits only if a change is detected

## Troubleshooting

- If `npm run verify` fails, ensure `.env` exists and contains a valid key
- If pushes from the workflow fail, check branch protections for `main`

