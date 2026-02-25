// app-env.js
// Optional runtime configuration for Supabase in the compiled preview.
// Usage (query): ?supabaseUrl=https://your-project.supabase.co&supabaseAnon=ey...
(function(){
  try {
    const params = new URLSearchParams(location.search);
    const url = params.get('supabaseUrl');
    const anon = params.get('supabaseAnon');
    if (url) {
      window.__SUPABASE_URL__ = url;
      try { localStorage.setItem('supabaseUrl', url); } catch {}
      console.debug('[app-env] SUPABASE_URL set');
    } else if (!window.__SUPABASE_URL__) {
      try { window.__SUPABASE_URL__ = localStorage.getItem('supabaseUrl') || window.__SUPABASE_URL__; } catch {}
    }
    if (anon) {
      window.__SUPABASE_ANON_KEY__ = anon;
      try { localStorage.setItem('supabaseAnon', anon); } catch {}
      console.debug('[app-env] SUPABASE_ANON set');
    } else if (!window.__SUPABASE_ANON_KEY__) {
      try { window.__SUPABASE_ANON_KEY__ = localStorage.getItem('supabaseAnon') || window.__SUPABASE_ANON_KEY__; } catch {}
    }
  } catch (e) {
    console.warn('[app-env] failed to parse params', e);
  }
})();
