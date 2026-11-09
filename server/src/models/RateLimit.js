import mongoose from 'mongoose';

// Penyimpanan hitungan rate limit. Disimpan di MongoDB (bukan memori) supaya hitungan
// tidak hilang saat server restart/tidur, dan sama di semua instance.
// _id berisi nama limiter + key, misalnya "login:203.0.113.5:alya@student.ac.id".
const rateLimitSchema = new mongoose.Schema(
  {
    _id: String,
    count: Number,
    resetAt: Date,
    lockedUntil: Date,
    lockouts: Number,
    lockoutsResetAt: Date,
    expireAt: Date,
  },
  { versionKey: false }
);

rateLimitSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RateLimit', rateLimitSchema, 'ratelimits');
