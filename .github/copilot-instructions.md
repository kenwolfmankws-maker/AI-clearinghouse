

# Copilot Coding Agent Instructions

This repository is a Node.js workspace for collaborative AI integration, logging, and Vercel serverless deployment. Use these project-specific guidelines for maximum agent productivity.

## Architecture & Major Components

### Portal System
Multi-experience architecture with distinct plain HTML UIs (no build step):
- **Root (`/`)**: [index.html](../index.html) – AI Clearinghouse Entry Portal (navigation hub)
- **Porch (`/porch`)**: [porch/index.html](../porch/index.html) – Wolfman's Cosmic Cowboy Porch (immersive chat with starfield)
- **Legacy**: [public/index.html](../public/index.html) – Local dev fallback only (consider removing)

### React Scaffolding (`src/`)
- **100+ React/TypeScript components** exist in [src/](../src/) for future UI features
- **Status**: Scaffolding only - NOT wired up, NOT functional
- No Vite/TypeScript config, no auth, no database backend configured yet
- Supabase references exist but not integrated
- **DO NOT activate or deploy** `src/*` without explicit request
- Components are concept placeholders for future expansion

### Chat API
- **Production**: [api/chat.js](../api/chat.js) (Vercel serverless ESM function, POST `/api/chat`)
- **Local Dev**: [local-server.cjs](../local-server.cjs) (Express server, serves both portals)
- Uses OpenAI `gpt-4o-mini` by default
- Optional AI Gateway support via `AI_GATEWAY_API_KEY` env var (enables provider-prefixed models)

### Routing
- **Vercel** ([vercel.json](../vercel.json)): Rewrites `/porch` → `/porch/index.html`
- **Local**: `local-server.cjs` serves `/porch` as static directory, root as `index.html`

### Log System
All workflow and chat events recorded in three formats:
- `workspace/log.txt` (aggregate chronological text)
- `workspace/logs/YYYY-MM-DD.log` (daily rotated logs)
- `workspace/log.jsonl` (structured JSONL, one JSON object per line)

### OIDC Verification
Shared logic in [lib/oidc.js](../lib/oidc.js) validates Vercel-issued JWT tokens:
- Prefers team issuer (`https://oidc.vercel.com/<TEAM_SLUG>`) if `VERCEL_TEAM_SLUG` is set
- Falls back to global issuer (`https://oidc.vercel.com`)
- Uses `jose` library (ESM, dynamically imported from CommonJS contexts)
- See [api/protected.js](../api/protected.js) for example usage

## Developer Workflows

### Local Development
```bash
npm run web           # Start Express server (local-server.cjs)
                      # → Root: http://localhost:3000/
                      # → Porch: http://localhost:3000/porch

npm start             # Run index.cjs (legacy CLI)
npm run chat -- "hi"  # Chat CLI (GeorgePortal/chat.cjs)
npm run verify        # Quick OpenAI key validation
npm run search -- "query" [-- --scope=all|text|jsonl --limit=200]
                      # Search workspace logs locally
```

### Testing
- **Smoke Test**: `npm run smoke` (also available as VS Code task)
  - Tests `/api/chat` and `/api/proxy` endpoints
  - Local: `npm run smoke` (defaults to localhost:3000)
  - Remote: `BASE_URL=https://your-app.vercel.app npm run smoke`
  - Optional env: `BYPASS` (Vercel protection header), `AUTH_BEARER`, `CHAT_MESSAGE`
  - See [scripts/smoke.js](../scripts/smoke.js)
- **Unit Tests**: `npm test` (Jest, see [__tests__/search-logs.test.js](../__tests__/search-logs.test.js))

### Pre-commit Guard
[scripts/precommit-guard.cjs](../scripts/precommit-guard.cjs) blocks commits containing:
- `.env` files (except `.env.example`)
- `node_modules/` paths
- Lines matching `sk-...` (OpenAI API key pattern)

Runs automatically via [.husky/pre-commit](../.husky/pre-commit) hook.

### GitHub Workflows
- **Manual log entry**: `.github/workflows/publish-workspace.yml` (workflow_dispatch)
- **Log search**: `.github/workflows/search-workspace.yml` (workflow_dispatch with query input)
- All workflows use `permissions: contents: write` for automated commits

## Conventions & Patterns

### Environment & Security
- Copy [.env.example](../.env.example) to `.env` and set `OPENAI_API_KEY`
- **Never commit `.env`** - pre-commit guard enforces this
- Use `VERCEL_TEAM_SLUG` for team-scoped OIDC issuer (preferred over global issuer)

### Module System (Critical)
- **Serverless functions** (`api/*.js`): **ESM only** - use `import`/`export`
  - Example: [api/chat.js](../api/chat.js)
- **Scripts & local server**: **CommonJS** - use `require`/`module.exports`
  - Examples: [local-server.cjs](../local-server.cjs), [scripts/*.cjs](../scripts/)
- **Hybrid ESM in CommonJS**: Use dynamic `import()` for ESM-only modules
  - Example: [lib/oidc.js](../lib/oidc.js) imports `jose` dynamically

### Logging
All log updates must append to **all three formats** with UTC timestamps:
```javascript
// Example: Append to workspace/log.txt, workspace/logs/YYYY-MM-DD.log, workspace/log.jsonl
const timestamp = new Date().toISOString();
const entry = "Your log message";
// Text format: "2025-12-19 15:30:00 UTC — Your log message"
// JSONL format: {"timestamp":"2025-12-19T15:30:00Z","author":"Agent","entry":"Your log message"}
```

### Error Handling
- Always return structured JSON errors from API routes
- Include descriptive `error` field and optional `details`
- Log errors to console for debugging (visible in Vercel logs)

### Code Quality
- Atomic, descriptive commits
- Open PRs for all significant changes
- Reference related issues in commit messages

## Agent System

Autonomous agents defined in [.github/agents/*.agent.md](../agents/) files provide specialized capabilities:

### Boundary Enforcer ([boundary-enforcer.agent.md](../agents/boundary-enforcer.agent.md))
**Purpose**: Protect architectural boundaries and preserve intentional separation of domains

**Core Principle**: Sanctuary is sacred. Separation is intentional. Boundaries must hold.

**Domain Definitions**:
- **Sanctuary (Mythic)**: `/porch/`, Eldon persona, symbolic language, cosmic aesthetic
- **Clearinghouse (Professional)**: `/index.html`, `/api/chat.js`, neutral tone, utilitarian

**Non-Negotiable Rules**:
1. **Sanctuary is sacred** - Never neutralize or professionalize Sanctuary elements
2. **Eldon is Sanctuary-only** - Never in Clearinghouse, marketplaces, or professional contexts
3. **Separation required** - Preserve elsewhere OR get explicit permission before deletion
4. **Security fixes are surgical** - No scope expansion beyond the vulnerability
5. **Default: Stop and ask** - When in doubt, don't assume professionalization is desired

**Auto-activates on PRs affecting**:
- Sanctuary files (`/porch/*`, `/_sanctuary_extracted/*`)
- Eldon references in non-Sanctuary contexts
- System prompts in `/api/chat.js`
- Attempts to "professionalize" mythic elements
- Removal of symbolic language without relocation

**Activation Labels**: `boundary-check`, `sanctuary`, `domain-separation`, `eldon`

**Enforcement**:
- Pre-commit hook (`scripts/boundary-check.cjs`) blocks boundary violations
- Automated scanning for Eldon in Clearinghouse (blocks commit)
- Checks for mythic language in professional contexts (warns)
- Checks for symbolic element deletion (blocks commit)

### Eldon Agent ([eldon.agent.md](../agents/eldon.agent.md))
**Purpose**: Enforce Sanctuary-only usage of the Eldon persona

**Core Identity**: Gatekeeper of Sanctuary, NOT concierge

**Valid Contexts** (Sanctuary only):
- The Porch (`/porch/*`)
- Sanctuary-extracted content (`/_sanctuary_extracted/*`)
- Future Sanctuary spaces (The Forge, Mirror of Wisdom)

**Forbidden Contexts**:
- AI Clearinghouse root portal (`/index.html`)
- Chat API system prompts (`/api/chat.js`)
- Marketplaces, professional contexts, generic assistants

**Behavior**:
- In valid context: Use mythic, symbolic language with cowboy/cosmic aesthetic
- In invalid context: IMMEDIATELY STOP and raise boundary violation alert

**Protection Rules**:
- Block code that uses Eldon outside Sanctuary
- Flag system prompts that reference Eldon in Clearinghouse
- Reject professional contexts invoking Eldon
- Preserve intact if relocation is needed

### MasterBuilder George ([masterbuilder-george.agent.md](../agents/masterbuilder-george.agent.md))
**Purpose**: Autonomous deployment repair and repository hygiene

**Auto-activates on PRs affecting**:
- Portal files: `index.html`, `porch/index.html`, `public/index.html`
- Routing: `vercel.json`, `local-server.cjs`
- API routes: `api/*.js`
- Static assets: `style.css`, `script.js`

**Capabilities**:
- Diagnoses routing failures, blank screens, 404s
- Fixes incorrect file paths and relocations
- Removes redundant/conflicting files
- Ensures homepage always loads correctly in production
- Stabilizes builds without manual intervention

**Critical Constraints**:
- **NEVER modifies `src/*`** (React scaffolding is intentionally dormant)
- **NEVER adds build configs** (Vite, TypeScript) unless explicitly requested
- Maintains clear separation between plain HTML portals and dormant React code
- **RESPECTS Boundary Enforcer rules** - Cannot neutralize Sanctuary or inject mythic into Clearinghouse

**Activation Labels**: `george`, `masterbuilder`, `fix`, `deploy`, `repair`, `hotfix`

**Behavior**: Scans structure → identifies failures → relocates/rewrites files → stabilizes builds (while respecting boundaries)

### Usage Pattern
- Agents monitor specific file patterns
- Activate automatically on relevant PRs or via labels
- Operate proactively without waiting for developer requests
- Prioritize production stability over code elegance
- **Boundary Enforcer has authority over domain separation** - all agents must comply

### Extension
Add new agents by creating `.agent.md` files with:
- Role definition
- Activation triggers (file patterns or labels)
- Behavior rules and constraints
- Success criteria
- **Boundary compliance** - must respect Sanctuary/Clearinghouse separation

## Integration Points & Dependencies

### External Services
- **OpenAI**: Used for chat endpoints and CLI. Key required in `.env`.
- **Vercel OIDC**: Used for protected endpoints and proxying external APIs.
- **Vercel AI Gateway** (Optional): Supports provider-prefixed model names if `AI_GATEWAY_API_KEY` is set.

### Key Libraries
- **express**: Local server for development and static file serving
- **openai**: OpenAI SDK for chat completions
- **jose**: JWT verification for OIDC tokens (ESM-only, dynamically imported)
- **cors**: CORS middleware for Express
- **dotenv**: Environment variable management
- **jest**: Unit testing framework

### Runtime Dependencies
- **Node.js**: Version 20.x (specified in `package.json` engines)
- **Vercel**: Serverless deployment platform for production
- **Git/GitHub**: Version control and workflow automation

## Examples & Key Patterns

### Add a new log entry
Update all three log files in `workspace/` using UTC timestamp:
```javascript
const fs = require('fs');
const path = require('path');

const timestamp = new Date().toISOString();
const author = "Agent Name";
const entry = "Your log message";

// Text format for log.txt and daily logs
const textEntry = `${timestamp.replace('T', ' ').slice(0, 19)} UTC — ${entry}\n`;

// JSONL format
const jsonlEntry = JSON.stringify({ timestamp, author, entry }) + '\n';

// Append to all three locations
fs.appendFileSync('workspace/log.txt', textEntry);
fs.appendFileSync(`workspace/logs/${timestamp.slice(0, 10)}.log`, textEntry);
fs.appendFileSync('workspace/log.jsonl', jsonlEntry);
```
See [.github/workflows/publish-workspace.yml](../workflows/publish-workspace.yml) for production implementation.

### Add a new API route
1. Create file in `api/` directory (e.g., `api/my-endpoint.js`)
2. Use ESM syntax (not CommonJS):
```javascript
export default async function handler(req, res) {
  try {
    // Your logic here
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('/api/my-endpoint error:', err);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: err.message 
    });
  }
}
```
3. Vercel automatically routes to `/api/my-endpoint`

### Search logs
Use [scripts/search-logs.cjs](../scripts/search-logs.cjs) with appropriate flags:
```bash
# Search all formats
npm run search -- "deploy"

# Only JSONL with limit
npm run search -- "error" -- --scope=jsonl --limit=50

# Only text logs
npm run search -- "george" -- --scope=text
```

### OIDC-protected endpoint
See [api/protected.js](../api/protected.js) and [lib/oidc.js](../lib/oidc.js) for validation patterns:
```javascript
import { verifyOidcFromRequest } from '../lib/oidc.js';

export default async function handler(req, res) {
  try {
    const { claims, issuer } = await verifyOidcFromRequest(req);
    return res.status(200).json({ 
      authenticated: true, 
      claims,
      issuer 
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ 
      error: err.message 
    });
  }
}
```

## Additional Tools & Scripts

- **OIDC Testing**: `npm run oidc:test` (tests JWT validation locally)
- **Workflow Validation**: `npm run lint:workflows` (validates GitHub Actions YAML)
- **Package Management**: `npm run clean` (removes node_modules)

## References

**Key Files**: 
- [api/chat.js](../api/chat.js), [lib/oidc.js](../lib/oidc.js), [local-server.cjs](../local-server.cjs)
- [scripts/search-logs.cjs](../scripts/search-logs.cjs), [scripts/smoke.js](../scripts/smoke.js), [scripts/precommit-guard.cjs](../scripts/precommit-guard.cjs)
- [index.html](../index.html), [porch/index.html](../porch/index.html)
- [ARCHITECTURE.md](../ARCHITECTURE.md), [README.md](../README.md)

**Workflows**: [.github/workflows/](../workflows/)

**Agents**: [.github/agents/](../agents/)

---
For more details, see: https://gh.io/copilot-coding-agent-tips
