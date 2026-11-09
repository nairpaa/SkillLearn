import mongoose from 'mongoose';

// Progres belajar per user per course: daftar lesson yang sudah selesai.
// Persentase dihitung saat dibaca, jadi tetap benar walau admin menambah/menghapus lesson.
const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedLessonIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  lastLessonId: { type: mongoose.Schema.Types.ObjectId, default: null },
  lastViewedAt: { type: Date, default: Date.now },
});

progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
progressSchema.index({ userId: 1, lastViewedAt: -1 });

export default mongoose.model('Progress', progressSchema);
