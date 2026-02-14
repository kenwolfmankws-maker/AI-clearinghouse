// site-id-bootstrap.js
// Resolves window.__SITE_ID__ from query, then localStorage, then existing value, then 'dev-local'.
(function () {
  if (window.__SITE_ID_RESOLVED__) return;
  window.__SITE_ID_RESOLVED__ = true;

  // Normalize SPA pathname: avoid "/preview.html" confusing client-side routers
  try {
    if (location && (location.pathname === '/preview.html' || /\/preview\.html$/.test(location.pathname))) {
      const next = '/' + (location.search ? location.search.replace(/^\?/, '') : '');
      const withQuery = next === '/' ? '/' + (location.search || '') : next;
      const finalUrl = '/' + (location.search || '').replace(/^\?/, '') + (location.hash || '');
      // Use replaceState to avoid adding an extra entry to history
      history.replaceState(null, '', finalUrl || '/');
    }
  } catch {}

  try {
    const params = new URLSearchParams(location.search);
    // Accept multiple query param spellings for compatibility
    const qp = params.get('site') || params.get('siteId') || params.get('site_id');
    const stored = localStorage.getItem('site_id') || localStorage.getItem('SITE_ID');

    let resolved = qp || stored || window.__SITE_ID__ || 'dev-local';

    // If query param provided, persist for future loads (store both keys for compatibility)
    if (qp) {
      try { localStorage.setItem('site_id', qp); } catch {}
      try { localStorage.setItem('SITE_ID', qp); } catch {}
    }

    window.__SITE_ID__ = resolved;
    if (!stored) {
      try { localStorage.setItem('site_id', resolved); } catch {}
      try { localStorage.setItem('SITE_ID', resolved); } catch {}
    }

    console.debug('[site-id-bootstrap] SITE_ID =', window.__SITE_ID__);
  } catch (e) {
    // Fallback
    window.__SITE_ID__ = window.__SITE_ID__ || 'dev-local';
    console.warn('[site-id-bootstrap] failed to resolve SITE_ID, using', window.__SITE_ID__, e);
  }
})();
