// Minimal static file server (no deps)
// Usage: node server.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = __dirname;
const port = parseInt(process.env.PORT, 10) || parseInt(process.argv[2], 10) || 8082;

const mime = {
  '.html': 'text/html; charset=UTF-8',
  '.htm': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.mjs': 'text/javascript; charset=UTF-8',
  // Treat Vite-saved ".js.download" assets as JavaScript so modules can be loaded directly
  '.download': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8',
  '.map': 'application/json; charset=UTF-8',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body) res.end(body); else res.end();
}

function safeResolve(relPath) {
  const decoded = decodeURIComponent(relPath.split('?')[0]);
  const cleaned = decoded.replace(/\\+/g, '/');
  const filePath = path.join(root, cleaned);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(root)) {
    return null; // path traversal
  }
  return resolved;
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname || '/';

  // Default to preview.html for root
  if (pathname === '/') pathname = '/preview.html';

  const full = safeResolve(pathname);
  if (!full) {
    return send(res, 403, { 'Content-Type': 'text/plain; charset=UTF-8' }, 'Forbidden');
  }

  fs.stat(full, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return send(res, 404, { 'Content-Type': 'text/plain; charset=UTF-8' }, 'Not Found');
      }
      return send(res, 500, { 'Content-Type': 'text/plain; charset=UTF-8' }, 'Internal Server Error');
    }

    if (stats.isDirectory()) {
      // Try to serve preview.html inside directories
      const indexPath = path.join(full, 'preview.html');
      return fs.stat(indexPath, (e2, s2) => {
        if (!e2 && s2.isFile()) {
          return streamFile(indexPath, res);
        }
        return send(res, 403, { 'Content-Type': 'text/plain; charset=UTF-8' }, 'Forbidden');
      });
    }

    return streamFile(full, res);
  });
});

function streamFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const type = mime[ext] || 'application/octet-stream';
  const headers = {
    'Content-Type': type,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
  };

  const stream = fs.createReadStream(filePath);
  stream.on('open', () => {
    res.writeHead(200, headers);
    stream.pipe(res);
  });
  stream.on('error', (err) => {
    const status = err.code === 'ENOENT' ? 404 : 500;
    send(res, status, { 'Content-Type': 'text/plain; charset=UTF-8' }, err.message);
  });
}

server.listen(port, '127.0.0.1', () => {
  console.log(`Static server running at http://127.0.0.1:${port}/preview.html`);
});
