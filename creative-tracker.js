// creative-tracker.js (user-provided overlay + simple logging)
(() => {
  if (window.__creativeTrackerLoaded) return;
  window.__creativeTrackerLoaded = true;

  // --- SITE_ID detection ---
  const params = new URLSearchParams(location.search);
  const siteFromQuery = params.get('site');
  const siteFromStorage = localStorage.getItem('SITE_ID');
  const SITE_ID = siteFromQuery || siteFromStorage || (window.__SITE_ID__ || 'dev-local');
  window.__SITE_ID__ = SITE_ID;
  try { localStorage.setItem('SITE_ID', SITE_ID); } catch {}

  // --- Simple event log ---
  const creativeEvents = [];
  const sessionStart = Date.now();
  function safeParseLS(key){
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; }
  }
  const logEvent = (name, data = {}) => {
    const evt = { name, time: new Date().toLocaleTimeString(), data };
    creativeEvents.push(evt);
    if (creativeEvents.length > 10) creativeEvents.shift();
    console.log(`[${SITE_ID}] creative event:`, evt);
    renderOverlay();
    sendIfConfigured(name, data, evt.time);
    // Persist a lightweight creative_session snapshot for auxiliary UIs/debug
    try {
      const duration = Math.max(0, Math.floor((Date.now() - sessionStart) / 1000));
      const persist = creativeEvents.map(e => ({ time: e.time, type: e.name, page: e.data && e.data.page }));
      localStorage.setItem('creative_session', JSON.stringify({ duration, creativeEvents: persist }));
    } catch {}
  };
  // --- Supabase runtime status (optional) ---
  const supaStatus = {
    get url() {
      try {
        const p = new URLSearchParams(location.search);
        return p.get('supabaseUrl') || localStorage.getItem('supabaseUrl') || (window.__SUPABASE_URL__ || '');
      } catch { return window.__SUPABASE_URL__ || ''; }
    },
    get anonSet() {
      try {
        const p = new URLSearchParams(location.search);
        const v = p.get('supabaseAnon') || localStorage.getItem('supabaseAnon') || window.__SUPABASE_ANON_KEY__;
        return !!(v && String(v).length > 10);
      } catch { return !!window.__SUPABASE_ANON_KEY__; }
    },
    lastAuth: null // { url, status, bodyPreview }
  };


  // Optional network posting
  const endpointFromQuery = params.get('creativeEndpoint');
  const endpointFromStorage = localStorage.getItem('creativeEndpoint');
  const CREATIVE_ENDPOINT = endpointFromQuery || endpointFromStorage || (window.__CREATIVE_ENDPOINT__ || '');
  if (endpointFromQuery) {
    try { localStorage.setItem('creativeEndpoint', endpointFromQuery); } catch {}
  }
  function sendIfConfigured(name, data, time) {
    if (!CREATIVE_ENDPOINT) return;
    const payload = {
      siteId: SITE_ID,
      sessionId: sessionStorage.getItem('sessionId'),
      ts: Date.now(),
      time,
      url: location.pathname + location.search,
      event: name,
      data
    };
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(CREATIVE_ENDPOINT, blob);
      } else {
        fetch(CREATIVE_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
          mode: 'no-cors'
        }).catch(() => {});
      }
    } catch {}
  }

  // --- Overlay UI ---
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.7)',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '8px 10px',
    borderRadius: '8px',
    zIndex: 99999,
    maxWidth: '250px',
    maxHeight: '150px',
    overflowY: 'auto',
    pointerEvents: 'none',
    opacity: '0.8',
    transition: 'opacity 0.3s ease',
  });
  document.body.appendChild(overlay);

  // On-screen toggle button (kept clickable when overlay is hidden)
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.textContent = 'Overlay: On';
  Object.assign(toggleBtn.style, {
    position: 'fixed',
    bottom: '168px', // sit just above overlay's maxHeight (150) + padding/margin
    right: '10px',
    background: 'rgba(0,0,0,0.6)',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '6px 8px',
    borderRadius: '6px',
    zIndex: 100000,
    border: '1px solid rgba(0,255,0,0.4)',
    cursor: 'pointer',
    pointerEvents: 'auto',
  });
  document.body.appendChild(toggleBtn);

  // Copy logs button
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'Copy Logs';
  Object.assign(copyBtn.style, {
    position: 'fixed',
    bottom: '196px', // above toggle
    right: '10px',
    background: 'rgba(0,0,0,0.6)',
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: '12px',
    padding: '6px 8px',
    borderRadius: '6px',
    zIndex: 100000,
    border: '1px solid rgba(0,255,0,0.4)',
    cursor: 'pointer',
    pointerEvents: 'auto',
    marginBottom: '4px',
  });
  document.body.appendChild(copyBtn);

  // --- Overlay visibility controls ---
  const OVERLAY_KEY = 'creative_overlay_enabled';
  function getParamBoolean(key) {
    const v = params.get(key);
    if (v == null) return null;
    const s = String(v).toLowerCase();
    if (['0','false','off','no'].includes(s)) return false;
    if (['1','true','on','yes'].includes(s)) return true;
    return null;
  }
  // Precedence: query param -> localStorage -> default true
  const overlayParam = getParamBoolean('overlay');
  let overlayEnabled = overlayParam ?? (localStorage.getItem(OVERLAY_KEY) !== 'false');
  function applyOverlayVisibility() {
    try { localStorage.setItem(OVERLAY_KEY, String(overlayEnabled)); } catch {}
    overlay.style.display = overlayEnabled ? 'block' : 'none';
    toggleBtn.textContent = overlayEnabled ? 'Overlay: On' : 'Overlay: Off';
  }
  applyOverlayVisibility();

  function renderOverlay() {
    const user = safeParseLS('events_user');
    const session = safeParseLS('events_session');
    const creative = safeParseLS('creative_session');
    const duration = creative && typeof creative.duration === 'number' ? creative.duration : '—';

    overlay.innerHTML = `
      <div><strong>SITE:</strong> ${SITE_ID}</div>
      <div><strong>Session:</strong> ${sessionStorage.getItem('sessionId') || '(none)'}</div>
      <div><strong>Events user:</strong> ${user && user.id ? user.id : '—'}</div>
      <div><strong>Events session:</strong> ${session && session.id ? session.id : '—'}</div>
      <div><strong>Supabase URL:</strong> ${supaStatus.url || '—'}</div>
      <div><strong>Supabase anon key:</strong> ${supaStatus.anonSet ? 'set' : '—'}</div>
      ${supaStatus.lastAuth ? `<div><strong>Last auth:</strong> ${supaStatus.lastAuth.status} · ${supaStatus.lastAuth.url.replace(/https?:\/\//,'')}</div>` : ''}
      <div><strong>Creative duration:</strong> ${duration}s</div>
      <hr style="border:0;border-top:1px solid #0f0;opacity:.3">
      ${creativeEvents.map(e => `<div>• [${e.time}] ${e.name}</div>`).join('')}
    `;
  }

  // --- Session init ---
  const sessionId = sessionStorage.getItem('sessionId') || Math.random().toString(36).slice(2);
  sessionStorage.setItem('sessionId', sessionId);
  renderOverlay();

  // --- Debounce helper ---
  function debounce(fn, wait = 200) {
    let t = null;
    return function debounced() {
      const ctx = this; const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait);
    };
  }

  // --- SPA navigation hooks (debounced + de-duped) ---
  let lastViewURL = '';
  function emitViewIfChanged() {
    const url = location.pathname + location.search;
    if (url === lastViewURL) return; // avoid duplicate consecutive views
    lastViewURL = url;
    logEvent('view', { page: url });
  }
  const onNavChange = debounce(emitViewIfChanged, 250);

  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function () {
    _push.apply(this, arguments);
    onNavChange();
  };
  history.replaceState = function () {
    _replace.apply(this, arguments);
    onNavChange();
  };
  window.addEventListener('popstate', onNavChange);

  // Keyboard toggle: Ctrl+Shift+O
  window.addEventListener('keydown', (e) => {
    const isToggle = (e.key === 'O' || e.key === 'o') && e.ctrlKey && e.shiftKey;
    if (!isToggle) return;
    overlayEnabled = !overlayEnabled;
    applyOverlayVisibility();
    logEvent('overlay_toggle', { enabled: overlayEnabled });
  });

  // Button toggle
  toggleBtn.addEventListener('click', () => {
    overlayEnabled = !overlayEnabled;
    applyOverlayVisibility();
    logEvent('overlay_toggle', { enabled: overlayEnabled });
  });

  // Copy logs -> clipboard
  copyBtn.addEventListener('click', async () => {
    try {
      const payload = JSON.stringify({ site: SITE_ID, session: sessionStorage.getItem('sessionId'), events: creativeEvents }, null, 2);
      await navigator.clipboard.writeText(payload);
      logEvent('copied_logs', { count: creativeEvents.length });
    } catch (err) {
      logEvent('console_error', { message: 'Clipboard write failed: ' + String(err) });
    }
  });

  // --- Example triggers ---
  onNavChange(); // initial view (debounced)
  window.addEventListener('click', e => logEvent('click', { tag: e.target.tagName }));

  console.log(`Creative Tracker active for SITE_ID="${SITE_ID}"`);

  // --- Global diagnostics: surface runtime errors in the overlay ---
  window.addEventListener('error', (e) => {
    const info = {
      message: e.message,
      source: e.filename || e.fileName || '(inline) ',
      line: e.lineno || 0,
      col: e.colno || 0
    };
    logEvent('error', info);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason || {};
    const info = {
      message: r && r.message ? r.message : String(r),
      stack: r && r.stack ? String(r.stack).slice(0, 500) : undefined
    };
    logEvent('unhandledrejection', info);
  });

  // Listen for custom loader notes/errors and surface them in the overlay
  window.addEventListener('creative-log', (e) => {
    const detail = e && e.detail ? e.detail : {};
    logEvent('note', detail);
  });
  window.addEventListener('creative-error', (e) => {
    const detail = e && e.detail ? e.detail : {};
    logEvent('loader_error', detail);
  });

  // Capture resource load errors (scripts/links/images)
  window.addEventListener('error', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK' || t.tagName === 'IMG')) {
      const url = t.src || t.href || '(unknown)';
      logEvent('resource_error', { tag: t.tagName, url });
    }
  }, true);

  // Patch console to surface errors/warnings
  (function patchConsole(){
    try {
      const orig = {
        error: console.error,
        warn: console.warn
      };
      console.error = function(...args){
        try { logEvent('console_error', { message: args.map(String).join(' ') }); } catch {}
        return orig.error.apply(this, args);
      };
      console.warn = function(...args){
        try {
          const msg = args.map(String).join(' ');
          // Demote noisy dev-only warnings
          if (/Supabase key appears incomplete/i.test(msg)) {
            logEvent('note', { message: msg });
          } else {
            logEvent('console_warn', { message: msg });
          }
        } catch {}
        return orig.warn.apply(this, args);
      };
    } catch {}
  })();

  // Patch fetch to report failed requests
  (function patchFetch(){
    try {
      const origFetch = window.fetch && window.fetch.bind(window);
      if (!origFetch) return;
      window.fetch = async function(input, init){
        try {
          // Optional Supabase rewrite/injection
          let reqUrl = typeof input === 'string' ? input : (input && input.url) || String(input);
          const supaUrl = (function(){
            try {
              const p = new URLSearchParams(location.search);
              return p.get('supabaseUrl') || localStorage.getItem('supabaseUrl') || (window.__SUPABASE_URL__ || '');
            } catch { return window.__SUPABASE_URL__ || ''; }
          })();
          const supaAnon = (function(){
            try {
              const p = new URLSearchParams(location.search);
              return p.get('supabaseAnon') || localStorage.getItem('supabaseAnon') || (window.__SUPABASE_ANON_KEY__ || '');
            } catch { return window.__SUPABASE_ANON_KEY__ || ''; }
          })();
          const rewriteEnabled = (function(){
            try {
              const p = new URLSearchParams(location.search);
              const v = p.get('supabaseRewrite');
              if (v == null) return true; // default on
              const s = String(v).toLowerCase();
              if (['0','false','off','no'].includes(s)) return false;
              if (['1','true','on','yes'].includes(s)) return true;
              return true;
            } catch { return true; }
          })();

          let rewritten = false;
          if (supaUrl && rewriteEnabled) {
            try {
              const target = new URL(reqUrl, location.origin);
              const base = new URL(supaUrl);
              const isSupabasePath = /\/(auth|rest|storage|functions)\//.test(target.pathname);
              const isDefaultLocal = /localhost:9999/.test(target.host);
              const differentHost = target.host !== base.host;
              if (isSupabasePath && (isDefaultLocal || differentHost)) {
                reqUrl = base.origin + target.pathname + (target.search || '');
                rewritten = true;
                // Ensure apikey header present
                init = init || {};
                const hdrs = new Headers(init.headers || {});
                if (supaAnon && hdrs.get('apikey') !== supaAnon) hdrs.set('apikey', supaAnon);
                init.headers = hdrs;
                logEvent('note', { message: 'Rewrote Supabase request', to: reqUrl });
              }
            } catch {}
          }

          const res = await origFetch(reqUrl, init);
          const url = reqUrl;
          if (!res.ok) {
            logEvent('fetch_error', { url, status: res.status, statusText: res.statusText });
          }
          // Capture last auth response for overlay if this is a Supabase auth call
          try {
            const u = new URL(url, location.origin);
            const looksSupabase = /supabase\.(co|in|red)$/.test(u.hostname) || (supaUrl && u.hostname === new URL(supaUrl).hostname);
            if (looksSupabase && /\/auth\//.test(u.pathname)) {
              let bodyPreview = '';
              try {
                const clone = res.clone();
                const ct = (clone.headers.get('content-type') || '').toLowerCase();
                if (ct.includes('application/json')) {
                  const txt = await clone.text();
                  bodyPreview = txt.slice(0, 300);
                }
              } catch {}
              supaStatus.lastAuth = { url: u.pathname, status: res.status, bodyPreview };
              logEvent('auth_response', { url: u.pathname, status: res.status });
            }
          } catch {}
          return res;
        } catch (err) {
          const url = typeof input === 'string' ? input : (input && input.url) || String(input);
          logEvent('fetch_error', { url, message: String(err) });
          throw err;
        }
      };
    } catch {}
  })();

  // Patch navigator.sendBeacon to surface outgoing beacons (e.g., analytics)
  (function patchBeacon(){
    try {
      if (!('sendBeacon' in navigator)) return;
      const orig = navigator.sendBeacon.bind(navigator);
      navigator.sendBeacon = function(url, data){
        let size = 0;
        try { size = data ? (data.size || (typeof data === 'string' ? data.length : 0)) : 0; } catch {}
        const ok = orig(url, data);
        const info = { url: String(url), ok, size };
        if (/famous\.ai\/event/.test(String(url))) {
          logEvent('events_beacon', info);
        } else {
          logEvent('beacon', info);
        }
        return ok;
      };
    } catch {}
  })();

  // If the app didn't mount anything into #root shortly after load, note it.
  setTimeout(() => {
    const root = document.getElementById('root');
    if (!root) return;
    const empty = root.childElementCount === 0 && (root.textContent || '').trim() === '';
    if (empty) {
      logEvent('empty_root', { hint: 'No app content detected; check network/console for missing chunks or runtime errors.' });
    }
  }, 1200);
})();
