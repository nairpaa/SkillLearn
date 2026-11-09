import mongoose from 'mongoose';

// Token sekali pakai untuk verifikasi email dan reset password.
// Yang disimpan hanya hash SHA-256, jadi bocornya database tidak membuat link di email bisa dipakai.
const authTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: ['verify', 'reset'], required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    // Khusus verifikasi email: password (hash) & nama dari pendaftaran yang memicu link ini.
    // Baru dipasang ke akun saat link dibuka DAN password-nya dimasukkan ulang dengan benar,
    // jadi orang yang mendaftar duluan memakai email korban tidak bisa mengambil alih akun.
    passwordHash: { type: String, select: false },
    name: { type: String },
  },
  { timestamps: true }
);

authTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AuthToken', authTokenSchema);
