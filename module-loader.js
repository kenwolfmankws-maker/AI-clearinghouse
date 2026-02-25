// module-loader.js
// Loads .download assets with correct MIME types by creating blob URLs
(function () {
  const params = new URLSearchParams(location.search);
  function getBooleanParam(key, def) {
    const v = params.get(key);
    if (v == null) return def;
    const s = String(v).toLowerCase();
    if (['0','false','off','no'].includes(s)) return false;
    if (['1','true','on','yes'].includes(s)) return true;
    return def;
  }
  function getStringParam(key) {
    const v = params.get(key);
    return v == null ? null : String(v);
  }

  async function fetchTextFirstAvailable(candidates) {
    for (const url of candidates) {
      try {
        emit('creative-log', { loader: 'module-loader', step: 'fetch_attempt', url });
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) {
          const code = await res.text();
          emit('creative-log', { loader: 'module-loader', step: 'fetch_ok', url });
          return { url, code };
        } else {
          emit('creative-log', { loader: 'module-loader', step: 'fetch_not_ok', url, status: res.status });
        }
      } catch (err) {
        emit('creative-log', { loader: 'module-loader', step: 'fetch_error', url, message: String(err) });
      }
    }
    throw new Error('No candidate URLs available: ' + candidates.join(', '));
  }
  function emit(type, detail) {
    try { window.dispatchEvent(new CustomEvent(type, { detail })); } catch {}
  }
  function loadClassicScript(urlOrCandidates) {
    const candidates = Array.isArray(urlOrCandidates) ? urlOrCandidates : [urlOrCandidates];
    return fetchTextFirstAvailable(candidates).then(({ url, code }) => {
      const blob = new Blob([code], { type: 'text/javascript' });
      const src = URL.createObjectURL(blob);
      const s = document.createElement('script');
      s.src = src;
      return new Promise((resolve, reject) => {
        s.onload = () => { URL.revokeObjectURL(src); emit('creative-log', { loader: 'module-loader', step: 'loaded', url }); resolve(); };
        s.onerror = (e) => {
          URL.revokeObjectURL(src);
          const err = e && e.error ? e.error : e;
          emit('creative-error', { loader: 'module-loader', step: 'error', url, message: String(err && err.message ? err.message : err), name: err && err.name, stack: err && err.stack ? String(err.stack).slice(0,500) : undefined });
          reject(e);
        };
        document.head.appendChild(s);
      });
    });
  }

  async function loadModule(urlOrCandidates) {
    const candidates = Array.isArray(urlOrCandidates) ? urlOrCandidates : [urlOrCandidates];
    const preferDownload = getBooleanParam('preferDownload', false);
    // Prefer native module loading when we have a real .js URL to preserve relative imports,
    // but only if the asset isn't a truncated placeholder.
    const jsCandidate = !preferDownload && candidates.find(u => typeof u === 'string' && !/\.download($|\?)/.test(u));
    if (jsCandidate) {
      try {
        // Peek at the JS to detect placeholder/truncated content and avoid parse errors.
        const res = await fetch(jsCandidate, { cache: 'no-cache' });
        if (res.ok) {
          const peek = await res.text();
          const looksTruncated = /truncated for brevity/i.test(peek) || /keeping full content identical/i.test(peek);
          if (looksTruncated) {
            emit('creative-log', { loader: 'module-loader', step: 'skip_js_truncated', url: jsCandidate });
          } else {
            emit('creative-log', { loader: 'module-loader', step: 'module_tag_attempt', url: jsCandidate });
            await new Promise((resolve, reject) => {
              const s = document.createElement('script');
              s.type = 'module';
              s.src = jsCandidate;
              s.onload = () => { emit('creative-log', { loader: 'module-loader', step: 'loaded', url: jsCandidate }); resolve(); };
              s.onerror = (e) => {
                const err = e && e.error ? e.error : e;
                emit('creative-error', { loader: 'module-loader', step: 'error', url: jsCandidate, message: String(err && err.message ? err.message : err), name: err && err.name, stack: err && err.stack ? String(err.stack).slice(0,500) : undefined });
                reject(e);
              };
              document.head.appendChild(s);
            });
            return; // success or thrown above
          }
        }
      } catch (e) {
        // If peek fails, continue to fallback path
        emit('creative-log', { loader: 'module-loader', step: 'peek_failed', url: jsCandidate, message: String(e && e.message ? e.message : e) });
      }
    }

    // Fallback: fetch text and import from a blob URL (works for .download assets and single-file bundles).
    // Reorder to prefer .download when available.
    const ordered = candidates.slice().sort((a,b) => (/\.download($|\?)/.test(a)?-1:1) - (/\.download($|\?)/.test(b)?-1:1));
    const { url, code } = await fetchTextFirstAvailable(ordered);
    // If the selected URL is a .download, prefer loading via <script type="module"> now that our server serves it with JS MIME.
    if (/\.download($|\?)/.test(url)) {
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.type = 'module';
        s.src = url;
        s.onload = () => { emit('creative-log', { loader: 'module-loader', step: 'loaded', url }); resolve(); };
        s.onerror = (e) => {
          const err = e && e.error ? e.error : e;
          emit('creative-error', { loader: 'module-loader', step: 'error', url, message: String(err && err.message ? err.message : err), name: err && err.name, stack: err && err.stack ? String(err.stack).slice(0,500) : undefined });
          reject(e);
        };
        document.head.appendChild(s);
      });
      return;
    }

    // Otherwise, fall back to blob import.
    const blob = new Blob([code], { type: 'text/javascript' });
    const src = URL.createObjectURL(blob);
    try {
      await import(src);
      emit('creative-log', { loader: 'module-loader', step: 'loaded', url });
    } catch (e) {
      const err = e;
      emit('creative-error', { loader: 'module-loader', step: 'error', url, message: String(err && err.message ? err.message : err), name: err && err.name, stack: err && err.stack ? String(err.stack).slice(0,500) : undefined });
      throw e;
    } finally {
      URL.revokeObjectURL(src);
    }
  }

  // 1) Ensure SITE_ID is set prior to any SDKs
  // site-id-bootstrap.js is a normal .js file and can be loaded directly in HTML before this loader

  // 2) Optionally load events SDK (classic script). Prefer .js, fall back to .download.
  const eventsEnabled = getBooleanParam('events', true);
  const eventsOverride = getStringParam('eventsPath');
  const eventCandidates = eventsOverride ? [eventsOverride] : ['events.js', 'events.js.download'];
  const loadEvents = eventsEnabled
    ? loadClassicScript(eventCandidates)
        .catch(err => { console.warn('[module-loader] events.js failed:', err); emit('creative-error', { loader: 'module-loader', step: 'error', url: eventCandidates.join(' | '), message: String(err) }); })
    : Promise.resolve(emit('creative-log', { loader: 'module-loader', step: 'skip', url: eventCandidates.join(' | '), reason: 'events param disabled' }));

  loadEvents.finally(() => {
    // 3) Load main app bundle (ES module). Prefer .js, fall back to .download.
    const bundleOverride = getStringParam('bundle');
    const bundleCandidates = bundleOverride ? [bundleOverride] : ['index-DsuFIb4Z.js', 'index-DsuFIb4Z.js.download'];
    loadModule(bundleCandidates)
      .catch(err => { console.error('[module-loader] main module failed:', err); emit('creative-error', { loader: 'module-loader', step: 'error', url: bundleCandidates.join(' | '), message: String(err) }); });
  });
})();
