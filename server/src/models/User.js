import mongoose from 'mongoose';
import { CATEGORY_IDS, ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // Hash argon2id, tidak pernah ikut di query biasa. Kalau butuh: .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    bio: { type: String, default: '', maxlength: 160 },
    interests: { type: [{ type: String, enum: CATEGORY_IDS }], default: [] },
    // Foto profil kecil dalam bentuk data URL. Dibatasi 60 KB di validasi, jadi aman disimpan langsung.
    avatar: { type: String, default: null },
    role: { type: String, enum: ROLES, default: 'student' },
    emailVerifiedAt: { type: Date, default: null },
    // Dipakai untuk membatasi kirim ulang email verifikasi/peringatan, biar tidak bisa dipakai nge-spam.
    lastVerificationSentAt: { type: Date, default: null },
    lastNoticeSentAt: { type: Date, default: null },
    // Akun demo hasil seed: tidak bisa ganti password, reset password, atau dihapus lewat aplikasi,
    // supaya tetap utuh walau password-nya dibagikan ke penguji.
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
