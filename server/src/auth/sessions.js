import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import RetiredToken from '../models/RetiredToken.js';
import { REFRESH_ABSOLUTE_DAYS, REFRESH_SLIDING_DAYS } from '../config/constants.js';
import { env } from '../config/env.js';
import { addDays, randomToken, securityLog, sha256 } from '../services/http.js';

export const REFRESH_COOKIE = 'sl_rt';
const MAX_SESSIONS_PER_USER = 10;
// Masa tenggang setelah rotasi: token yang BARU SAJA diganti masih diterima sebentar, untuk kasus wajar
// seperti dua tab refresh bersamaan atau respons yang hilang saat server bangun dari tidur (timeout klien 60 detik).
// Syaratnya ketat: hanya token tepat sebelumnya, dari user-agent yang sama, maksimal 3 kali per rotasi, dan dicatat di log.
// Klien mendapat refresh token yang SAMA dengan pemenang (rotasi idempoten), jadi tidak ada yang "tertinggal".
const ROTATION_GRACE_MS = 2 * 60 * 1000;
const MAX_GRACE_USES = 3;

// Token berikutnya diturunkan dari token lama + id sesi memakai HMAC dengan kunci rahasia server.
// Hasilnya acak bagi siapa pun tanpa kunci, tapi selalu sama untuk token lama yang sama, sehingga
// request yang kalah balapan bisa diberi token baru yang identik tanpa menyimpan token asli di database.
function nextTokenFor(sessionId, oldHash) {
  return crypto.createHmac('sha256', env.refreshSecret || 'dev').update(`${sessionId}:${oldHash}`).digest('base64url');
}

const uaOf = (req) => (req.get('user-agent') || '').slice(0, 300);

function cookieOptions() {
  return {
    httpOnly: true, // tidak bisa dibaca JavaScript → aman dari pencurian lewat XSS
    secure: env.isProd, // production wajib HTTPS
    sameSite: 'strict', // tidak ikut terkirim dari situs lain (CSRF)
    path: '/api/auth', // cuma dikirim ke endpoint auth
  };
}

export function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(), expires: expiresAt });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
}

// Membuat sesi baru saat login. Yang disimpan cuma hash refresh token-nya.
export async function createSession(user, req) {
  const refreshToken = randomToken();
  const now = new Date();
  const session = await Session.create({
    userId: user._id,
    family: crypto.randomUUID(),
    tokenHash: sha256(refreshToken),
    userAgent: uaOf(req),
    ip: req.clientIp,
    expiresAt: addDays(now, REFRESH_SLIDING_DAYS),
    absoluteExpiresAt: addDays(now, REFRESH_ABSOLUTE_DAYS),
  });

  // Simpan maksimal 10 sesi terbaru per pengguna, supaya login berulang tidak memenuhi database.
  const old = await Session.find({ userId: user._id }).sort({ createdAt: -1 }).skip(MAX_SESSIONS_PER_USER).select('_id').lean();
  if (old.length) await Session.deleteMany({ _id: mongoose.trusted({ $in: old.map((s) => s._id) }) });

  return { session, refreshToken };
}

export class SessionError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

// Rotasi refresh token secara atomik: hanya satu request yang bisa menukar token lama dengan yang baru.
// Hasil: { session, refreshToken } (refresh token baru, sama untuk semua request dalam masa tenggang).
export async function rotateSession(rawToken, req) {
  const hash = sha256(rawToken || '');
  const now = new Date();

  const current = await Session.findOne({ tokenHash: hash }).lean();
  if (current) {
    if (current.revokedAt || current.expiresAt < now || current.absoluteExpiresAt < now) {
      throw new SessionError('SESSION_EXPIRED');
    }
    const nextToken = nextTokenFor(current._id, hash);
    const sliding = addDays(now, REFRESH_SLIDING_DAYS);
    const rotated = await Session.findOneAndUpdate(
      { _id: current._id, tokenHash: hash, revokedAt: null },
      {
        $set: {
          tokenHash: sha256(nextToken),
          // Sliding 7 hari, tapi tidak boleh melewati batas absolut 30 hari.
          expiresAt: sliding < current.absoluteExpiresAt ? sliding : current.absoluteExpiresAt,
          lastUsedAt: now,
          rotatedAt: now,
          rotatedUa: uaOf(req),
          graceUses: 0,
          ip: req.clientIp,
        },
        $push: { prevHashes: { $each: [hash], $slice: -50 } },
      },
      { returnDocument: 'after' }
    );
    if (rotated) {
      // Catat hash lama selama sesi masih berlaku, untuk deteksi pemakaian ulang di kemudian hari.
      await RetiredToken.updateOne(
        { _id: hash },
        { $setOnInsert: { sessionId: current._id, userId: current.userId, expireAt: current.absoluteExpiresAt } },
        { upsert: true }
      );
      return { session: rotated, refreshToken: nextToken };
    }
    // Kalah balapan dengan request lain yang memakai token yang sama: lanjut ke pengecekan di bawah.
  }

  const previous = await Session.findOne({ prevHashes: hash }).lean();
  if (!previous) {
    // Lebih tua dari 50 rotasi terakhir: cek arsip hash lama.
    const retired = await RetiredToken.findById(hash).lean();
    if (retired) {
      await Session.updateMany({ userId: retired.userId, revokedAt: null }, { $set: { revokedAt: now } });
      securityLog('refresh_token_reuse', { userId: String(retired.userId), ip: req.clientIp });
    }
    throw new SessionError('SESSION_INVALID');
  }

  // Masa tenggang: token tepat sebelumnya, token penggantinya belum dipakai (belum dirotasi lagi),
  // user-agent sama, masih dalam 2 menit, dan jatah pemakaian belum habis. Dicek & dihitung secara atomik.
  const nextToken = nextTokenFor(previous._id, hash);
  const grace =
    previous.prevHashes[previous.prevHashes.length - 1] === hash &&
    previous.tokenHash === sha256(nextToken) &&
    previous.rotatedUa === uaOf(req)
      ? await Session.findOneAndUpdate(
          {
            _id: previous._id,
            tokenHash: sha256(nextToken),
            revokedAt: null,
            rotatedAt: mongoose.trusted({ $gte: new Date(now.getTime() - ROTATION_GRACE_MS) }),
            graceUses: mongoose.trusted({ $lt: MAX_GRACE_USES }),
          },
          { $inc: { graceUses: 1 } },
          { returnDocument: 'after' }
        )
      : null;
  if (grace) {
    securityLog('refresh_grace', { userId: String(previous.userId), ip: req.clientIp, uses: grace.graceUses });
    return { session: grace, refreshToken: nextToken };
  }

  // Token yang sudah diganti dipakai lagi di luar syarat di atas → kemungkinan dicuri. Semua sesi pengguna
  // dicabut, jadi penyerang maupun pengguna asli harus login ulang (pengguna melihat banner "session expired").
  await Session.updateMany({ userId: previous.userId, revokedAt: null }, { $set: { revokedAt: now } });
  securityLog('refresh_token_reuse', { userId: String(previous.userId), ip: req.clientIp });
  throw new SessionError('SESSION_INVALID');
}

export async function isSessionActive(sessionId, userId) {
  if (!mongoose.isValidObjectId(sessionId)) return false;
  const session = await Session.findOne({ _id: sessionId, userId }).select('revokedAt absoluteExpiresAt').lean();
  return Boolean(session && !session.revokedAt && session.absoluteExpiresAt > new Date());
}

export function revokeSession(sessionId, userId) {
  return Session.updateOne({ _id: sessionId, userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

// exceptSessionId dipakai saat ganti password: sesi di perangkat ini tetap jalan.
export function revokeAllSessions(userId, exceptSessionId = null) {
  const filter = { userId, revokedAt: null };
  if (exceptSessionId) filter._id = mongoose.trusted({ $ne: exceptSessionId });
  return Session.updateMany(filter, { $set: { revokedAt: new Date() } });
}
