// Minimal static file server (sandbox-safe — no os.getcwd reliance).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/Anjali/Documents/GitHub/Tender-Analzer';
const PORT = parseInt(process.env.PORT || '4180', 10);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, {'Content-Type':'text/plain'}); res.end('Not found: ' + urlPath); return; }
    res.writeHead(200, {'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(PORT, () => console.log('static-server on http://localhost:' + PORT + ' root=' + ROOT));
