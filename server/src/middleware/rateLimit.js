import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import RateLimit from '../models/RateLimit.js';
import { securityLog, sha256 } from '../services/http.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Store express-rate-limit yang menyimpan hitungan di MongoDB (collection "ratelimits").
// Pakai driver native + update pipeline, jadi increment dan reset jendela waktu terjadi atomik
// dalam satu operasi, aman walau ada banyak request bersamaan.
export class MongoStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  id(key) {
    return `${this.prefix}:${key}`;
  }

  async increment(key) {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + this.windowMs);
    const active = { $gt: ['$resetAt', now] };
    const doc = await RateLimit.collection.findOneAndUpdate(
      { _id: this.id(key) },
      [
        {
          $set: {
            count: { $cond: [active, { $add: [{ $ifNull: ['$count', 0] }, 1] }, 1] },
            resetAt: { $cond: [active, '$resetAt', windowEnd] },
          },
        },
        { $set: { expireAt: '$resetAt' } },
      ],
      { upsert: true, returnDocument: 'after', includeResultMetadata: false }
    );
    return { totalHits: doc.count, resetTime: doc.resetAt };
  }

  async get(key) {
    const doc = await RateLimit.collection.findOne({ _id: this.id(key) });
    if (!doc || doc.resetAt <= new Date()) return undefined;
    return { totalHits: doc.count, resetTime: doc.resetAt };
  }

  // decrement dipanggil express-rate-limit setelah respons terkirim (tanpa ditunggu). Error di sini
  // (mis. MongoDB putus sesaat) ditangkap, supaya tidak jadi unhandled rejection yang menghentikan proses.
  async decrement(key) {
    try {
      await RateLimit.collection.updateOne({ _id: this.id(key), count: { $gt: 0 } }, { $inc: { count: -1 } });
    } catch (err) {
      console.error('[rate-limit] Gagal mengurangi hitungan:', err.message);
    }
  }

  async resetKey(key) {
    try {
      await RateLimit.collection.deleteOne({ _id: this.id(key) });
    } catch (err) {
      console.error('[rate-limit] Gagal mereset hitungan:', err.message);
    }
  }
}

// IP klien hasil resolveClientIp (lihat middleware/clientIp.js), dikelompokkan per subnet /56 untuk IPv6.
const byIp = (req) => ipKeyGenerator(req.clientIp || req.ip);

function tooMany(res, resetTime, message = 'Too many requests. Try again later.') {
  const seconds = Math.max(1, Math.ceil(((resetTime?.getTime?.() ?? Date.now()) - Date.now()) / 1000));
  res.set('Retry-After', String(seconds));
  res.status(429).json({ error: 'TOO_MANY_ATTEMPTS', message });
}

function limiter(prefix, { windowMs, limit, key, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: new MongoStore(prefix),
    keyGenerator: key ?? ((req) => byIp(req)),
    handler: (req, res, next, options) => tooMany(res, req.rateLimit?.resetTime, message ?? options.message?.message),
  });
}



export const ipLimiter = limiter('ip', { windowMs: MINUTE, limit: 300 });
export const userLimiter = limiter('user', { windowMs: MINUTE, limit: 100, key: (req) => req.user.id });
// Login yang berhasil tidak dihitung, jadi satu jaringan kampus/kos yang ramai tidak ikut terblokir.
export const loginIpLimiter = limiter('login-ip', {
  windowMs: 15 * MINUTE,
  limit: 20,
  skipSuccessfulRequests: true,
  message: 'Too many attempts. Try again in 15 minutes.',
});
export const registerLimiter = limiter('register', {
  windowMs: HOUR,
  limit: 5,
  message: 'Too many sign-ups from this network. Try again in an hour.',
});
export const forgotIpLimiter = limiter('forgot-ip', { windowMs: HOUR, limit: 10, key: byIp });
export const verifyLimiter = limiter('verify-ip', { windowMs: HOUR, limit: 10, key: byIp });
export const resetLimiter = limiter('reset-ip', { windowMs: HOUR, limit: 10, key: byIp });
// Refresh dibatasi per token (hash-nya), cadangannya per IP kalau token tidak dikirim.
export const refreshLimiter = limiter('refresh', {
  windowMs: MINUTE,
  limit: 30,
  key: (req) => {
    const raw = req.cookies?.sl_rt || req.body?.refreshToken;
    return typeof raw === 'string' && raw ? sha256(raw) : `ip:${byIp(req)}`;
  },
});

// Hitungan sederhana tanpa middleware, untuk batas "3 email reset per jam per alamat".
// Mengembalikan true kalau masih boleh.
export async function allowEvent(prefix, key, limit, windowMs) {
  const store = new MongoStore(prefix);
  store.init({ windowMs });
  const { totalHits } = await store.increment(key);
  return totalHits <= limit;
}

// Percobaan memasukkan ulang password yang salah per akun (ganti password, hapus akun): 5 per 15 menit,
// yang berhasil tidak dihitung. Tanpa ini, pemegang access token curian bisa menebak password tanpa batas.
export const reauthLimiter = limiter('reauth', {
  windowMs: 15 * MINUTE,
  limit: 5,
  skipSuccessfulRequests: true,
  key: (req) => `user:${req.user.id}`,
  message: 'Too many attempts. Try again in 15 minutes.',
});

// ---------- Lockout login bertahap ----------
// Maksimal 5 percobaan dalam 15 menit untuk kombinasi IP + email; percobaan ke-6 → dikunci 15 menit.
// Kalau terkunci lagi dalam 24 jam, kunci berikutnya 1 jam.
//
// Slot percobaan "dipesan" secara atomik SEBELUM password dicek (argon2 lambat). Dengan begitu
// 15 request paralel tidak bisa lolos bersamaan: hanya 5 yang sampai ke pengecekan password.

const LOGIN_WINDOW = 15 * MINUTE;
const LOGIN_MAX_ATTEMPTS = 5;
const LOCKOUT_MEMORY = 24 * HOUR;

const loginKey = (req, email) => `login:${byIp(req)}:${email}`;

// Mengembalikan tanggal akhir kunci kalau percobaan ini ditolak, atau null kalau boleh lanjut.
export async function reserveLoginAttempt(req, email) {
  const now = new Date();
  const locked = { $gt: ['$lockedUntil', now] };
  const windowActive = { $gt: ['$resetAt', now] };
  const memoryActive = { $gt: ['$lockoutsResetAt', now] };
  const nextCount = { $cond: [windowActive, { $add: [{ $ifNull: ['$count', 0] }, 1] }, 1] };
  const lockouts = { $cond: [memoryActive, { $ifNull: ['$lockouts', 0] }, 0] };
  const lockMs = { $cond: [{ $gte: [lockouts, 1] }, HOUR, 15 * MINUTE] };
  const crossing = { $and: [{ $not: [locked] }, { $gt: [nextCount, LOGIN_MAX_ATTEMPTS] }] };

  const doc = await RateLimit.collection.findOneAndUpdate(
    { _id: loginKey(req, email) },
    [
      {
        $set: {
          // Percobaan yang melewati batas langsung memasang kunci (sekali per ledakan percobaan).
          lockedUntil: { $cond: [locked, '$lockedUntil', { $cond: [crossing, { $add: [now, lockMs] }, '$lockedUntil'] }] },
          lockouts: { $cond: [crossing, { $add: [lockouts, 1] }, lockouts] },
          lockedAt: { $cond: [crossing, now, '$lockedAt'] },
          lockoutsResetAt: { $cond: [memoryActive, '$lockoutsResetAt', new Date(now.getTime() + LOCKOUT_MEMORY)] },
          count: { $cond: [{ $or: [locked, crossing] }, 0, nextCount] },
          resetAt: { $cond: [{ $or: [locked, crossing] }, now, { $cond: [windowActive, '$resetAt', new Date(now.getTime() + LOGIN_WINDOW)] }] },
        },
      },
      { $set: { expireAt: { $max: ['$lockoutsResetAt', '$lockedUntil'] } } },
    ],
    { upsert: true, returnDocument: 'after', includeResultMetadata: false }
  );

  if (doc.lockedUntil && doc.lockedUntil > now) {
    // Dicatat sekali saja: oleh request yang memasang kunci, bukan setiap percobaan saat terkunci.
    if (doc.lockedAt?.getTime() === now.getTime()) {
      securityLog('login_locked', { ip: req.clientIp, until: doc.lockedUntil.toISOString() });
    }
    return doc.lockedUntil;
  }
  return null;
}

// Login berhasil: hitungan percobaan dikosongkan (riwayat kunci tetap diingat untuk kunci bertahap).
export async function clearLoginFailures(req, email) {
  await RateLimit.collection.updateOne({ _id: loginKey(req, email) }, { $set: { count: 0 } });
}

export function sendLocked(res, lockedUntil) {
  const minutes = Math.max(1, Math.ceil((lockedUntil - Date.now()) / MINUTE));
  tooMany(res, lockedUntil, `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`);
}
