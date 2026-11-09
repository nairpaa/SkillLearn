import mongoose from 'mongoose';

// Satu dokumen per user + lesson. Dibuka ulang cukup memperbarui viewedAt,
// jadi daftar riwayat tidak penuh dengan lesson yang sama berkali-kali.
const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: String,
  viewedAt: { type: Date, default: Date.now },
});

historySchema.index({ userId: 1, viewedAt: -1 });
historySchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model('History', historySchema);
