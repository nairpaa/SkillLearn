// @vitest-environment node
// Unit test function proxy Vercel (web/api/proxy.js) dengan server API tiruan.
import http from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import handler, { clientIpOf } from '../../api/proxy.js';

let upstream;
let proxy;
let proxyUrl;
let last;

const listen = (server) => new Promise((r) => server.listen(0, '127.0.0.1', () => r(`http://127.0.0.1:${server.address().port}`)));

beforeAll(async () => {
  upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    last = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString() };
    if (req.url.startsWith('/api/slow-fail')) return req.socket.destroy();
    res.statusCode = req.url.startsWith('/api/limited') ? 429 : 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '900');
    res.setHeader('Set-Cookie', ['sl_rt=abc; Path=/api/auth; HttpOnly; SameSite=Strict', 'other=1; Path=/']);
    res.end(JSON.stringify({ ok: true }));
  });
  process.env.API_ORIGIN = await listen(upstream);
  process.env.PROXY_SHARED_SECRET = 'rahasia-test';
  proxy = http.createServer(handler);
  proxyUrl = await listen(proxy);
});

afterAll(() => {
  upstream.close();
  proxy.close();
});

beforeEach(() => {
  last = null;
  process.env.PROXY_SHARED_SECRET = 'rahasia-test';
});

describe('proxy /api', () => {
  it('meneruskan method, path, query, body, cookie, dan header penting', async () => {
    const res = await fetch(`${proxyUrl}/api/auth/refresh?x=1&y=2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'sl_rt=lama',
        Origin: 'https://skilllearn.vercel.app',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: 'Bearer v4.public.X',
        'X-Real-IP': '198.51.100.7',
      },
      body: JSON.stringify({ a: 1 }),
    });
    expect(res.status).toBe(200);
    expect(last.method).toBe('POST');
    expect(last.url).toBe('/api/auth/refresh?x=1&y=2');
    expect(last.body).toBe('{"a":1}');
    expect(last.headers.cookie).toBe('sl_rt=lama');
    expect(last.headers.origin).toBe('https://skilllearn.vercel.app');
    expect(last.headers['x-requested-with']).toBe('XMLHttpRequest');
    expect(last.headers.authorization).toBe('Bearer v4.public.X');
  });

  it('menambahkan IP pengunjung + rahasia, dan membuang header palsu dari klien', async () => {
    await fetch(`${proxyUrl}/api/me`, {
      headers: {
        'X-Real-IP': '198.51.100.7',
        'X-SkillLearn-Client-IP': '6.6.6.6',
        'X-SkillLearn-Proxy-Secret': 'tebakan',
        'X-Forwarded-For': '6.6.6.6',
      },
    });
    expect(last.headers['x-skilllearn-client-ip']).toBe('198.51.100.7');
    expect(last.headers['x-skilllearn-proxy-secret']).toBe('rahasia-test');
    expect(last.headers['x-forwarded-for']).toBeUndefined();
  });

  it('meneruskan status, Retry-After, Cache-Control, dan SEMUA Set-Cookie', async () => {
    const res = await fetch(`${proxyUrl}/api/limited`);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('900');
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.getSetCookie()).toEqual(['sl_rt=abc; Path=/api/auth; HttpOnly; SameSite=Strict', 'other=1; Path=/']);
  });

  it('bukan open proxy: path di luar /api/ ditolak', async () => {
    for (const path of ['/etc/passwd', '/apix', '/', '//evil.example/api/x']) {
      last = null;
      const res = await fetch(`${proxyUrl}${path}`);
      expect(res.status, path).toBe(404);
      expect(last, path).toBeNull();
    }
  });

  it('API mati → 502 dengan pesan ramah', async () => {
    const res = await fetch(`${proxyUrl}/api/slow-fail`);
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('BAD_GATEWAY');
  });

  it('env belum diisi → 500 PROXY_NOT_CONFIGURED', async () => {
    process.env.PROXY_SHARED_SECRET = '';
    const res = await fetch(`${proxyUrl}/api/me`);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe('PROXY_NOT_CONFIGURED');
  });
});

describe('clientIpOf', () => {
  it('memakai header Vercel, ambil IP pertama', () => {
    expect(clientIpOf({ headers: { 'x-real-ip': '203.0.113.9' } })).toBe('203.0.113.9');
    expect(clientIpOf({ headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' } })).toBe('203.0.113.9');
    expect(clientIpOf({ headers: {}, socket: { remoteAddress: '127.0.0.1' } })).toBe('127.0.0.1');
  });
});

describe('proxy: path traversal', () => {
  it('path yang keluar dari /api setelah dinormalisasi ditolak', async () => {
    for (const path of ['/api/../health', '/api/%2e%2e/x', '/api/%2E%2E/%2E%2E/etc']) {
      last = null;
      const res = await fetch(`${proxyUrl}${path}`);
      expect(res.status, path).toBe(404);
      expect(last, path).toBeNull();
    }
  });
});
