

# Copilot Coding Agent Instructions

This repository is a Node.js workspace for collaborative AI integration, logging, and Vercel serverless deployment. Follow these project-specific guidelines for maximum agent productivity:

## Architecture & Major Components
**Chat API**: `/api/chat.js` (Vercel serverless, POST `/api/chat`) and `local-server.js` (Express for local dev, serves `public/index.html`).
**Protected API**: `/api/protected.js` validates Vercel OIDC JWTs for secure endpoints.
**Proxy API**: `/api/proxy.js` calls external APIs using Vercel OIDC tokens (dynamic ESM import pattern).
**Log System**: All workflow and chat events are recorded in three formats:
  - `workspace/log.txt` (aggregate text)
  - `workspace/logs/YYYY-MM-DD.log` (daily logs)
  - `workspace/log.jsonl` (structured JSONL)
**OIDC Verification**: Shared logic in `lib/oidc.js` for JWT validation, used by both serverless and CLI scripts.
**UI**: `index.html` (production) and `public/index.html` (local dev) provide chat interfaces.

## Developer Workflows
**Local Development**:
	- Start local server: `npm run web` (runs `local-server.js`)
	- Run chat CLI: `npm start` or `npm run chat -- "hello"`
	- Verify OpenAI key: `npm run verify`
	- Search logs: `npm run search -- "query" [-- --scope=all|text|jsonl --limit=200]`
**Testing**:
	- Run smoke test: VS Code task "Run smoke test" or `npm run smoke`
	- Jest tests: `npm test` (see `__tests__/search-logs.test.js`)
**Pre-commit Guard**:
	- `scripts/precommit-guard.js` blocks secrets, `.env`, and `node_modules/` from being committed. See `.husky/pre-commit`.
**Workflow Automation**:
	- Manual log entry: `.github/workflows/publish-workspace.yml` (workflow_dispatch)
	- Log search: `.github/workflows/search-workspace.yml` (workflow_dispatch)
	- Vercel deploy: `.github/workflows/vercel-prebuilt-deploy.yml` (prebuilt output)

## Conventions & Patterns
**Environment**: Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Never commit `.env`.
**Serverless Functions**: Use CommonJS, dynamic import for ESM-only modules (see `api/proxy.js`).
**OIDC**: Prefer team issuer for JWT validation; fallback to global issuer if not set.
**Logging**: All log updates must append to all three formats. Use UTC timestamps.
**Error Handling**: Always return structured JSON errors from APIs. Log errors to console for debugging.
**Security**: Never commit secrets. Pre-commit guard enforces this.
**Commits & PRs**: Atomic, descriptive commits. Open PRs for all significant changes. Reference related issues.

## Integration Points & Dependencies
**OpenAI**: Used for chat endpoints and CLI. Key required in `.env`.
**Vercel OIDC**: Used for protected endpoints and proxying external APIs.
**Express**: Local server for development and static file serving.
**Jest**: For unit tests.
**Vercel AI Gateway**: Optional, supports provider-prefixed model names if `AI_GATEWAY_API_KEY` is set.

## Examples
**Add a new log entry**: Update all three log files in `workspace/` using UTC timestamp (see `.github/workflows/publish-workspace.yml`).
**Add a new API route**: Place in `api/`, export as CommonJS module, follow error and logging conventions.
**Search logs**: Use `scripts/search-logs.js` or the npm script with appropriate flags.
**OIDC-protected endpoint**: See `/api/protected.js` and `lib/oidc.js` for validation patterns.

## References
Key files: `api/chat.js`, `api/protected.js`, `api/proxy.js`, `lib/oidc.js`, `local-server.js`, `scripts/search-logs.js`, `workspace/log.txt`, `workspace/log.jsonl`, `README.md`
For workflow details, see `.github/workflows/`

---
For more details, see: https://gh.io/copilot-coding-agent-tips
