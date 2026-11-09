// Vercel Function: meneruskan semua request /api/* dari web ke server API (Render).
//
// Kenapa tidak cukup rewrite biasa di vercel.json? Dengan rewrite, server API hanya melihat IP server Vercel,
// sehingga SEMUA pengguna web berbagi satu kuota rate limit & lockout (satu orang iseng bisa mengunci login
// semua orang). Function ini mengirim IP asli pengunjung lewat header X-SkillLearn-Client-IP, ditemani
// rahasia bersama (PROXY_SHARED_SECRET) supaya server tahu header itu benar-benar dari proxy kita.
//
// Env di Vercel: API_ORIGIN (mis. https://skilllearn-api.onrender.com) dan PROXY_SHARED_SECRET.
// Domain tetap sama dengan web, jadi cookie refresh token tetap first-party (SameSite=Strict).

// Header yang tidak boleh diteruskan apa adanya (hop-by-hop, atau milik proxy ini sendiri).
const DROP_REQUEST = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'proxy-connection',
  'content-length',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'x-skilllearn-client-ip',
  'x-skilllearn-proxy-secret',
]);
const DROP_RESPONSE = new Set(['connection', 'keep-alive', 'transfer-encoding', 'content-encoding', 'content-length', 'set-cookie']);

// IP pengunjung menurut Vercel. Vercel menimpa header ini sendiri (klien tidak bisa memalsukannya).
export function clientIpOf(req) {
  const h = req.headers;
  const raw = h['x-real-ip'] || h['x-vercel-forwarded-for'] || h['x-forwarded-for'] || req.socket?.remoteAddress || '';
  return String(Array.isArray(raw) ? raw[0] : raw).split(',')[0].trim();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

// Body mentah dari stream; kalau runtime sudah membacanya lebih dulu, pakai req.body.
async function requestBody(req) {
  const raw = await readBody(req);
  if (raw || req.body === undefined || req.body === null) return raw;
  if (Buffer.isBuffer(req.body)) return req.body;
  return Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
}

export default async function handler(req, res) {
  const origin = (process.env.API_ORIGIN || '').replace(/\/+$/, '');
  const secret = process.env.PROXY_SHARED_SECRET || '';
  if (!origin || !secret) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'PROXY_NOT_CONFIGURED', message: 'API_ORIGIN / PROXY_SHARED_SECRET belum diisi di Vercel.' }));
    return;
  }

  // Hanya path /api/... yang diteruskan, dan tujuannya selalu host API kita sendiri (bukan open proxy).
  const path = req.url || '';
  const target = new URL(path, origin);
  // Dicek dua kali: path mentah DAN path setelah dinormalisasi (mis. /api/../x atau /api/%2e%2e/x ditolak).
  if (!path.startsWith('/api/') || !target.pathname.startsWith('/api/') || /%2e/i.test(path) || target.origin !== new URL(origin).origin) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'NOT_FOUND', message: 'Not found.' }));
    return;
  }

  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (!DROP_REQUEST.has(name.toLowerCase()) && value !== undefined) headers[name] = Array.isArray(value) ? value.join(', ') : value;
  }
  headers['x-skilllearn-client-ip'] = clientIpOf(req);
  headers['x-skilllearn-proxy-secret'] = secret;

  const method = (req.method || 'GET').toUpperCase();
  let upstream;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : await requestBody(req),
      redirect: 'manual',
      // Server gratis (Render) bisa butuh ±50 detik untuk bangun dari tidur.
      signal: AbortSignal.timeout(55000),
    });
  } catch {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'BAD_GATEWAY', message: 'The server is waking up. Try again in a moment.' }));
    return;
  }

  res.statusCode = upstream.status;
  upstream.headers.forEach((value, name) => {
    if (!DROP_RESPONSE.has(name.toLowerCase())) res.setHeader(name, value);
  });
  // Set-Cookie bisa lebih dari satu, jadi dibaca terpisah.
  const cookies = upstream.headers.getSetCookie?.() || [];
  if (cookies.length) res.setHeader('Set-Cookie', cookies);
  const body = Buffer.from(await upstream.arrayBuffer());
  res.end(body.length ? body : undefined);
}
