// Simple smoke test for deployed endpoints.
// Usage: BASE_URL=https://your-app.vercel.app node scripts/smoke.js
// Optional env:
//   - BYPASS: value for x-vercel-protection-bypass header
//   - AUTH_BEARER: full Authorization header value (e.g., "Bearer <token>")
//   - CHAT_MESSAGE: override chat prompt (default: "ping")

const BASE_URL = process.env.BASE_URL || process.argv[2];
if (!BASE_URL) {
  console.error('Usage: BASE_URL=https://your-app.vercel.app node scripts/smoke.js');
  process.exit(1);
}

const BYPASS = process.env.BYPASS || '';
const AUTH_BEARER = process.env.AUTH_BEARER || '';
const CHAT_MESSAGE = process.env.CHAT_MESSAGE || 'ping';

function makeHeaders(json = false) {
  const h = {};
  if (json) {
    h['content-type'] = 'application/json';
    h['accept'] = 'application/json';
  }
  if (BYPASS) h['x-vercel-protection-bypass'] = BYPASS;
  if (AUTH_BEARER) h['authorization'] = AUTH_BEARER;
  return h;
}

function withTimeout(promise, ms, label) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return {
    run: (init) => Promise.race([
      promise(ctrl, init),
      new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timeout after ${ms}ms`)), ms))
    ]).finally(() => clearTimeout(t)),
    signal: ctrl.signal,
  };
}


async function testChat() {
  const url = new URL('/api/chat', BASE_URL).toString();
  const w = withTimeout(async (ctrl) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: makeHeaders(true),
      body: JSON.stringify({ message: CHAT_MESSAGE }),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  }, 10000, 'chat');
  return w.run();
}

async function testProxy() {
  const url = new URL('/api/proxy', BASE_URL).toString();
  const w = withTimeout(async (ctrl) => {
    const res = await fetch(url, {
      method: 'GET',
      headers: makeHeaders(false),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  }, 10000, 'proxy');
  return w.run();
}

(async () => {
  console.log('Smoke: base =', BASE_URL);
  try {
    const chat = await testChat();
    console.log('Chat:', chat.status, chat.ok ? 'OK' : 'FAIL');
    if (!chat.ok) console.log(chat.data);
    else console.log(String(chat.data?.reply || '').slice(0, 120));
  } catch (e) {
    console.error('Chat error:', e.message);
  }

  try {
    const proxy = await testProxy();
    console.log('Proxy:', proxy.status, proxy.ok ? 'OK' : 'FAIL');
    if (!proxy.ok) console.log(proxy.data);
    else console.log(JSON.stringify(proxy.data).slice(0, 200));
  } catch (e) {
    console.error('Proxy error:', e.message);
  }
})();