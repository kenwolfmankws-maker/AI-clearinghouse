# Copilot instructions for this workspace

This workspace is a saved/compiled front‑end bundle (not the source repo). Treat it as static build artifacts of a React app with Tailwind CSS and UI primitives.

## Big picture
  - CSS overrides by appending new rules after `index-DzWrDgnG.css` (prefer specificity/utility classes instead of editing the generated CSS).
- Risky edits (avoid): renaming hashed assets, mass‑editing minified bundles, removing exported Tailwind utilities.

## How to preview/debug
- This folder is typically referenced by a sibling HTML page (e.g., `…/AI Clearinghouse Hub.html`). Open that HTML file in a browser; ensure relative paths still resolve to this `_files` directory.
- A minimal preview host `preview.html` is included. Serve this folder over HTTP and open `/` (it will route to `preview.html`).
- Browser devtools are your best friend; source maps aren’t included, so step through minified code sparingly.

## Conventions visible in the bundle
- Tailwind utility‑first classes drive layout/spacing. Prefer adding classes on markup rather than editing CSS.
- Design tokens via CSS variables (light/dark schemes) are applied on `:root` and `.dark`.
- React, shadcn/ui, and Recharts selectors exist in CSS; do not strip those even if currently unused in a snapshot.

## Integration patterns to respect
- Events SDK (`events.js.download`):
  - Requires `window.__SITE_ID__`. Debounces duplicate URL tracking (`MIN_TRACK_INTERVAL` 500ms) and maintains 30‑min sessions / 30‑day user IDs in `localStorage` (`events_session`/`events_user`).
  - Updates activity on `mousedown/mousemove/keypress/scroll/touchstart/click`, `visibilitychange`, and `beforeunload`.
- Creative tracker (inline IIFE pattern):
  - Tracks SPA navigations by wrapping `history.pushState`/`replaceState` and `popstate`.
  - Persists `{ duration, creativeEvents[] }` to `localStorage: creative_session` on `beforeunload`.

## Examples
- Add an extra client‑only tracker without build:
  - Create `creative-tracker.js` with the provided IIFE and include it after core scripts in the host HTML.
- Adjust theme colors: override CSS variables after importing `index-DzWrDgnG.css` instead of editing that file.

## Preview & overlay controls
- Serve locally (HTTP required for ES modules):
  - Recommended: `node server.js [port]` (defaults to 8082). Then open `http://127.0.0.1:PORT/`.
  - On Windows PowerShell you can also pass the port as an argument: `node .\server.js 8090`.
  - The server serves `.download` as JavaScript so modules can load directly.
- Pass a site id via query: `?site=rosie-garden-portal` (also persisted to `localStorage.SITE_ID`).
- Overlay visibility controls (creative tracker):
  - Start hidden: append `?overlay=off` (also accepts `false`/`0`).
  - Toggle at runtime: press Ctrl+Shift+O or click the small "Overlay: On/Off" button near the bottom-right.
  - State persists in `localStorage.creative_overlay_enabled`.
  - SPA “view” events are debounced (~250ms) and de‑duplicated per URL to avoid double‑fires.
  - Click "Copy Logs" to copy a recent event log for debugging.

## Loader options (module-loader.js)
- By default the loader prefers the main `.js` bundle, but if it detects a truncated placeholder it automatically falls back to the full `.download` bundle.
- You can force the `.download` bundle via `?preferDownload=on`.
- Disable the events SDK if needed with `?events=off`.
- Advanced overrides:
  - `?bundle=<path>` to specify a custom bundle URL.
  - `?eventsPath=<path>` to specify a custom events SDK URL.
cd "C:\Users\kensm\OneDrive\Documents\GitHub\AI-clearinghouse"

git add .
git commit -m "Planted Rosie’s Garden — first bloom inside the Hub 🌿"
git push origin main

## Supabase runtime config (optional)
- Provide runtime configuration without rebuilding:
  - `?supabaseUrl=https://YOUR-PROJECT.supabase.co`
  - `?supabaseAnon=YOUR_ANON_KEY`
- The creative tracker can optionally rewrite outgoing Supabase requests to the provided host and inject the `apikey` header (anon key). Disable rewriting with `?supabaseRewrite=off`.
- The overlay shows Supabase URL, whether the anon key is set, and the last auth response status.

## Optional event posting (dev only)
- You can send creative events to a custom endpoint for debugging:
  - Provide a URL via `?creativeEndpoint=https://example.test/collect` or set `localStorage.creativeEndpoint`.
  - Alternatively, set `window.__CREATIVE_ENDPOINT__` before loading `creative-tracker.js`.
- The tracker uses `navigator.sendBeacon` when available, falling back to `fetch` with `keepalive`. Payload shape:
  - `{ siteId, sessionId, ts, time, url, event, data }`
- To disable sending, remove the query/localStorage/variable or set it to an empty value.

## When you need the source
- For meaningful UI or logic changes, locate the original React/Vite/Tailwind project (this folder is a compiled snapshot). Implement changes there, then rebuild and replace the generated assets.

## Known gotchas
- The checked-in `index-DsuFIb4Z.js` may be a truncated placeholder from a saved page; the loader auto-detects this and uses `index-DsuFIb4Z.js.download` instead.
- If the overlay reports `empty_root`, check the logs for `loader_error` or `resource_error` (missing chunks/paths). Copy Logs and inspect status codes.
- The preview includes both containers with ids "root" and "app" so apps mounting to either will render.
