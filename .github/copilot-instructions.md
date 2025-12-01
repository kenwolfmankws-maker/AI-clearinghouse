

# Copilot Coding Agent Instructions

This repository is a Node.js workspace for collaborative AI integration, logging, and Vercel serverless deployment. Use these project-specific guidelines for maximum agent productivity:

## Architecture & Major Components
- **Chat API**: `/api/chat.js` (Vercel serverless function, ESM module, POST `/api/chat`)
- **Local Development Server**: `local-server.js` (Express server for local dev, serves `public/index.html`)
- **CLI Chat Tool**: `index.js` (main chat script, runs with `npm start`)
- **Log System**: All workflow events are recorded in three formats (files created by workflows):
	- `workspace/log.txt` (aggregate text)
	- `workspace/logs/YYYY-MM-DD.log` (daily logs)
	- `workspace/log.jsonl` (structured JSONL)
- **OIDC Verification**: Shared logic in `lib/oidc.js` for JWT validation (used for future protected endpoints)
- **UI Components**: `index.html` (production) and `public/index.html` (local dev) provide chat interfaces; `GeorgePortal/ChatUI.jsx` (React component)

## Developer Workflows
- **Local Development**:
	- Start local server: `npm run web` (runs `local-server.js`, serves at http://localhost:3000)
	- Run chat CLI: `npm start` or pass message: `node index.js "hello"`
	- Verify OpenAI key: `npm run verify`
	- Search logs: `npm run search -- "query" [-- --scope=all|text|jsonl --limit=200]`
- **Testing**:
	- Run smoke test: VS Code task "Run smoke test" or `npm run smoke`
	- Jest tests: `npm test` (see `__tests__/search-logs.test.js`)
	- Lint: `npm run lint` (ESLint v9+ flat config)
- **Pre-commit Guard**:
	- `scripts/precommit-guard.js` blocks secrets, `.env`, and `node_modules/` from being committed. See `.husky/pre-commit`.
- **Workflow Automation**:
	- Manual log entry: `.github/workflows/publish-workspace.yml` (workflow_dispatch)
	- Log search: `.github/workflows/search-workspace.yml` (workflow_dispatch)
	- Vercel deploy: `.github/workflows/vercel-prebuilt-deploy.yml` (prebuilt output)

## Conventions & Patterns
- **Environment**: Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Never commit `.env`.
- **Module System**: 
	- `package.json` has `"type": "module"` (ESM by default)
	- API functions: ESM (`api/chat.js` uses `export default`)
	- CLI scripts: CommonJS (`index.js`, `scripts/*` use `require()`)
	- ESLint config: uses `.cjs` extension to work with ESM package
- **OIDC**: `lib/oidc.js` provides JWT validation helpers; prefers team issuer, falls back to global issuer
- **Logging**: All log updates must append to all three formats (`workspace/log.txt`, `workspace/logs/*.log`, `workspace/log.jsonl`). Use UTC timestamps.
- **Error Handling**: Always return structured JSON errors from APIs. Log errors to console for debugging.
- **Security**: Never commit secrets. Pre-commit guard (`scripts/precommit-guard.js`) enforces this.
- **Commits & PRs**: Atomic, descriptive commits. Open PRs for all significant changes. Reference related issues.

## Integration Points & Dependencies
- **OpenAI**: Used for chat endpoints (`api/chat.js`) and CLI (`index.js`). Key required in `.env`.
- **Vercel OIDC**: OIDC helpers in `lib/oidc.js` for future protected endpoint support. Uses `@vercel/oidc` and `jose` packages.
- **Express**: Local development server (`local-server.js`) for serving static files.
- **Jest**: For unit tests (`__tests__/` directory).
- **Vercel AI Gateway**: Optional runtime feature, supports provider-prefixed model names if `AI_GATEWAY_API_KEY` is set (mentioned in README but not yet implemented).
- **ESLint**: Code linting (v9+ flat config, `eslint.config.cjs`).

## Examples & Key Patterns
- **Add a new log entry**: Update all three log files in `workspace/` using UTC timestamp (see `.github/workflows/publish-workspace.yml` for the pattern).
- **Add a new API route**: Place in `api/` directory, use ESM syntax (`export default`), follow error and logging conventions from `api/chat.js`.
- **Search logs**: Use `scripts/search-logs.js` or npm script: `npm run search -- "query" [-- --scope=all|text|jsonl --limit=N]`
- **OIDC verification**: See `lib/oidc.js` for JWT validation helpers (ready for use in protected endpoints).

## References
Key files: 
- API: `api/chat.js`
- Servers: `local-server.js`, `index.js`
- Libraries: `lib/oidc.js`
- Scripts: `scripts/verify-key.js`, `scripts/search-logs.js`, `scripts/smoke.js`, `scripts/precommit-guard.js`
- Logs: `workspace/log.txt`, `workspace/log.jsonl`, `workspace/logs/` (created by workflows)
- UI: `index.html`, `public/index.html`, `GeorgePortal/ChatUI.jsx`
- Config: `package.json`, `.env.example`, `eslint.config.cjs`
- Docs: `README.md`
- Workflows: `.github/workflows/publish-workspace.yml`, `.github/workflows/search-workspace.yml`, `.github/workflows/vercel-prebuilt-deploy.yml`

---
For more details, see: https://gh.io/copilot-coding-agent-tips
