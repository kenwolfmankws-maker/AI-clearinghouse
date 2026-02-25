// debug-overlay.js
(function () {
  if (window.__DEBUG_OVERLAY_LOADED__) return;
  window.__DEBUG_OVERLAY_LOADED__ = true;

  const el = document.createElement('div');
  el.id = 'debug-overlay';
  el.innerHTML = `
    <div class="dbg-header">Debug · <span class="dbg-badge">SITE</span>
      <button class="dbg-toggle" title="Toggle">▾</button>
    </div>
    <div class="dbg-body">
      <div><strong>siteId</strong>: <code id="dbg-site"></code></div>
      <div><strong>events_user</strong>: <code id="dbg-user"></code></div>
      <div><strong>events_session</strong>: <code id="dbg-session"></code></div>
      <div><strong>creative_session</strong> (duration s): <code id="dbg-duration"></code></div>
      <div><strong>creativeEvents</strong> (last 5):
        <ol id="dbg-events" class="dbg-list"></ol>
      </div>
    </div>`;
  document.body.appendChild(el);

  const style = document.createElement('style');
  style.textContent = `
  #debug-overlay { position: fixed; bottom: 12px; left: 12px; z-index: 99999; 
    font: 12px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; 
    background: rgba(15,23,42,0.9); color: #e5e7eb; border: 1px solid rgba(148,163,184,0.4); border-radius: 8px; min-width: 280px; max-width: 380px; }
  #debug-overlay .dbg-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-bottom: 1px solid rgba(148,163,184,0.2); }
  #debug-overlay .dbg-badge { background: #334155; color: #93c5fd; padding: 2px 6px; border-radius: 6px; font-weight: 600; }
  #debug-overlay .dbg-toggle { background: transparent; border: 0; color: #e5e7eb; cursor: pointer; font-size: 12px; }
  #debug-overlay .dbg-body { padding: 8px; max-height: 40vh; overflow: auto; }
  #debug-overlay code { color: #93c5fd; }
  #debug-overlay .dbg-list { margin: 6px 0 0 18px; padding: 0; }
  #debug-overlay .dbg-list li { margin: 2px 0; }
  `;
  document.head.appendChild(style);

  const refs = {
    site: el.querySelector('#dbg-site'),
    user: el.querySelector('#dbg-user'),
    session: el.querySelector('#dbg-session'),
    duration: el.querySelector('#dbg-duration'),
    events: el.querySelector('#dbg-events'),
  };

  const toggleBtn = el.querySelector('.dbg-toggle');
  let open = true;
  toggleBtn.addEventListener('click', () => {
    open = !open;
    el.querySelector('.dbg-body').style.display = open ? 'block' : 'none';
    toggleBtn.textContent = open ? '▾' : '▸';
  });

  function safeParse(k) {
    try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch { return null; }
  }

  function render() {
    refs.site.textContent = String(window.__SITE_ID__ || 'unset');

    const user = safeParse('events_user');
    const session = safeParse('events_session');
    const creative = safeParse('creative_session');

    refs.user.textContent = user ? user.id : '—';
    refs.session.textContent = session ? session.id : '—';
    refs.duration.textContent = creative ? creative.duration : '—';

    refs.events.innerHTML = '';
    const list = creative && Array.isArray(creative.creativeEvents) ? creative.creativeEvents.slice(-5).reverse() : [];
    for (const evt of list) {
      const li = document.createElement('li');
      li.textContent = `${evt.time} · ${evt.type} ${evt.page ? '(' + evt.page + ')' : ''}`;
      refs.events.appendChild(li);
    }
  }

  render();
  const iv = setInterval(render, 2000);
  window.addEventListener('beforeunload', () => clearInterval(iv));
})();
(function enhanceOverlay() {
  const overlay = document.getElementById('creative-overlay');
  if (!overlay) return;

  // Basic style upgrade
  overlay.style.background = 'rgba(0, 128, 0, 0.85)';
  overlay.style.color = '#fff';
  overlay.style.font = '12px monospace';
  overlay.style.padding = '10px';
  overlay.style.borderRadius = '8px';
  overlay.style.position = 'fixed';
  overlay.style.bottom = '10px';
  overlay.style.right = '10px';
  overlay.style.zIndex = '9999';
  overlay.style.width = '260px';
  overlay.style.maxHeight = '180px';
  overlay.style.overflowY = 'auto';
  overlay.style.boxShadow = '0 0 10px rgba(0,0,0,0.4)';

  const siteId = localStorage.getItem('SITE_ID') || 'unknown';
  const sessionId = sessionStorage.getItem('creativeSessionId') || 'none';
  const events = [];

  const updateOverlay = () => {
    overlay.innerHTML = `
      <div style="font-weight:bold;">🌱 Creative Tracker</div>
      <div>Site: <b>${siteId}</b></div>
      <div>Session: ${sessionId}</div>
      <hr style="border:none;border-top:1px solid #fff;margin:5px 0;">
      <div><b>Recent events:</b></div>
      ${events.slice(-10).map(e => `<div>${e}</div>`).join('')}
    `;
  };

  const logEvent = (type) => {
    const t = new Date().toLocaleTimeString();
    events.push(`${type} @ ${t}`);
    updateOverlay();
  };

  // Start with page view
  logEvent('page_view');

  // Watch clicks
  document.addEventListener('click', () => logEvent('click'));
  document.addEventListener('keydown', (e) => logEvent(`key: ${e.key}`));
})();

