import mongoose from 'mongoose';

// Hash refresh token yang sudah dirotasi (diganti). Session.prevHashes hanya menyimpan 50 terakhir,
// jadi daftar lengkapnya disimpan di sini sampai sesi itu habis masa berlakunya (TTL).
// Kalau salah satu hash ini dipakai lagi → token dicuri → semua sesi pengguna dicabut.
const retiredTokenSchema = new mongoose.Schema(
  {
    _id: String, // hash SHA-256 token lama
    sessionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    expireAt: { type: Date, required: true },
  },
  { versionKey: false }
);

retiredTokenSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RetiredToken', retiredTokenSchema, 'retiredtokens');
