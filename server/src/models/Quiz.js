import mongoose from 'mongoose';

// Kuis dipisah dari course supaya kunci jawaban (correctIndex) tidak ikut terbawa
// ke mana-mana. Klien hanya menerima soal dan pilihan, penilaian di server.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], validate: [(v) => v.length >= 2 && v.length <= 10, 'Pilihan jawaban 2 sampai 10'] },
    correctIndex: { type: Number, required: true, min: 0, max: 9 },
    explanation: String,
    mono: { type: Boolean, default: false },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    questions: [questionSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Quiz', quizSchema);
