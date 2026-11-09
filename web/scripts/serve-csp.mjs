// Server statis kecil untuk menguji hasil build (dist/) dengan header keamanan PERSIS dari vercel.json
// (CSP, HSTS, X-Frame-Options, dst) + proxy /api ke Express lokal, mirip rewrite di Vercel.
// Pakai: npm run build && npm run preview:csp   → http://localhost:4173
// Opsi: PORT=4173 API=http://localhost:8080
//       NO_UPGRADE=1 → buang `upgrade-insecure-requests` dari CSP. Hanya perlu kalau app dibuka lewat
//       http://IP-VM (bukan localhost): directive itu memaksa semua request jadi https, dan di
//       production (Vercel, selalu https) memang itu yang diinginkan.
import { createServer, request as httpRequest } from 'node:http';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const PORT = Number(process.env.PORT || 4173);
const API = new URL(process.env.API || 'http://localhost:8080');

const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const headers = {};
for (const h of vercel.headers[0].headers) headers[h.key] = h.value;
if (process.env.NO_UPGRADE) {
  headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace(/;\s*upgrade-insecure-requests/, '');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
};

function sendFile(res, file) {
  const type = TYPES[extname(file)] || 'application/octet-stream';
  const cache = file.includes(`${join('dist', 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { ...headers, 'Content-Type': type, 'Cache-Control': cache });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // rewrite /api/* → Express (Host & Origin asli diteruskan, plus X-Forwarded-*)
  if (url.pathname.startsWith('/api/')) {
    const proxied = httpRequest(
      {
        hostname: API.hostname,
        port: API.port,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          'x-forwarded-for': req.socket.remoteAddress,
          'x-forwarded-host': req.headers.host,
          'x-forwarded-proto': 'http',
        },
      },
      (up) => {
        res.writeHead(up.statusCode, up.headers);
        up.pipe(res);
      }
    );
    proxied.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end('{"error":"BAD_GATEWAY","message":"API is not reachable."}');
    });
    req.pipe(proxied);
    return;
  }

  // file statis kalau ada, selain itu SPA fallback ke index.html
  const safe = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(dist, safe);
  try {
    if (file.startsWith(dist) && statSync(file).isFile()) return sendFile(res, file);
  } catch {
    /* tidak ada → fallback */
  }
  sendFile(res, join(dist, 'index.html'));
}).listen(PORT, '0.0.0.0', () => {
  console.log(`dist/ with production headers → http://localhost:${PORT}  (API → ${API.origin})`);
  console.log(`CSP: ${headers['Content-Security-Policy']}`);
});
