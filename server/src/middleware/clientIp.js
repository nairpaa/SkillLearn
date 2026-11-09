import crypto from 'node:crypto';
import net from 'node:net';
import { env } from '../config/env.js';

// IP asli klien untuk rate limit, lockout, dan log keamanan.
//
// Jalur web: browser → function proxy Vercel (web/api/proxy.js) → API. Tanpa bantuan, API hanya melihat
// IP server Vercel, sehingga semua pengguna web berbagi satu kuota rate limit. Proxy kita mengirim IP klien
// di header X-SkillLearn-Client-IP plus rahasia bersama; header itu HANYA dipercaya kalau rahasianya cocok.
// Jalur mobile / langsung: memakai req.ip (diatur TRUST_PROXY sesuai jumlah proxy di depan server).
const SECRET_HEADER = 'x-skilllearn-proxy-secret';
const IP_HEADER = 'x-skilllearn-client-ip';

function secretMatches(given) {
  if (!env.proxySecret || typeof given !== 'string') return false;
  const a = Buffer.from(given);
  const b = Buffer.from(env.proxySecret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function resolveClientIp(req, res, next) {
  const forwarded = (req.get(IP_HEADER) || '').trim();
  req.clientIp = secretMatches(req.get(SECRET_HEADER)) && net.isIP(forwarded) ? forwarded : req.ip;
  next();
}
