import mongoose from 'mongoose';
import AuthToken from '../models/AuthToken.js';
import { randomToken, sha256 } from '../services/http.js';

const MAX_PENDING_VERIFY = 5;

// Membuat token sekali pakai (verifikasi email / reset password). Yang disimpan hanya hash SHA-256-nya.
// - reset  : token lama dihapus, hanya link terbaru yang berlaku.
// - verify : token lama DIPERTAHANKAN (maks 5), karena tiap link terikat ke password pendaftaran
//            masing-masing. Pemilik email cukup membuka link dari pendaftaran yang ia buat sendiri.
export async function createOneTimeToken(userId, purpose, expiresAt, { passwordHash, name } = {}) {
  if (purpose === 'verify') {
    const older = await AuthToken.find({ userId, purpose }).sort({ createdAt: -1 }).skip(MAX_PENDING_VERIFY - 1).select('_id').lean();
    if (older.length) await AuthToken.deleteMany({ _id: mongoose.trusted({ $in: older.map((t) => t._id) }) });
  } else {
    await AuthToken.deleteMany({ userId, purpose });
  }
  const token = randomToken();
  await AuthToken.create({ userId, purpose, tokenHash: sha256(token), expiresAt, passwordHash, name });
  return token;
}

// Lihat token tanpa memakainya (dipakai verifikasi email: password dicek dulu sebelum token dihabiskan).
export async function findOneTimeToken(token, purpose) {
  const doc = await AuthToken.findOne({ tokenHash: sha256(token), purpose, usedAt: null }).select('+passwordHash');
  if (!doc || doc.expiresAt < new Date()) return null;
  return doc;
}

// Tandai terpakai secara atomik: dua klik bersamaan pada link yang sama tidak bisa sama-sama berhasil.
export async function markTokenUsed(doc) {
  const res = await AuthToken.updateOne({ _id: doc._id, usedAt: null }, { $set: { usedAt: new Date() } });
  return res.modifiedCount === 1;
}

// Pakai token dalam satu langkah (reset password).
export async function consumeOneTimeToken(token, purpose) {
  const doc = await findOneTimeToken(token, purpose);
  if (!doc || !(await markTokenUsed(doc))) return null;
  return doc.userId;
}
