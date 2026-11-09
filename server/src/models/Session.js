import mongoose from 'mongoose';

// Satu dokumen = satu sesi login (satu "family" refresh token).
// Refresh token dirotasi di dokumen yang sama: hash lama pindah ke prevHashes.
// Kalau hash lama dipakai lagi, berarti token itu dicuri/bocor → seluruh family dicabut.
const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    family: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    prevHashes: { type: [String], default: [], index: true },
    userAgent: { type: String, maxlength: 300 },
    ip: String,
    expiresAt: { type: Date, required: true }, // sliding 7 hari, maju setiap refresh
    absoluteExpiresAt: { type: Date, required: true }, // maksimal 30 hari sejak login
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: Date.now },
    rotatedAt: { type: Date, default: null }, // waktu rotasi terakhir, untuk masa tenggang balapan refresh
    rotatedUa: { type: String, default: null }, // user-agent yang melakukan rotasi terakhir
    graceUses: { type: Number, default: 0 }, // berapa kali masa tenggang sudah dipakai sejak rotasi terakhir
  },
  { timestamps: true }
);

// MongoDB otomatis membuang sesi yang sudah lewat batas absolut.
sessionSchema.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Session', sessionSchema);
