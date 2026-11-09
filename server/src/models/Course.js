import mongoose from 'mongoose';
import { CATEGORY_IDS, LESSON_TYPES, LEVELS } from '../config/constants.js';

const checkSchema = new mongoose.Schema(
  { label: { type: String, required: true }, pattern: { type: String, required: true }, flags: { type: String, default: '' } },
  { _id: false }
);

const practiceSchema = new mongoose.Schema(
  {
    fileName: String,
    language: String,
    starterCode: String,
    tasks: [String],
    hint: String,
    checks: [checkSchema],
  },
  { _id: false }
);

// Lesson disimpan di dalam course (embedded), karena selalu dibaca bersama course-nya.
// Isi lesson tergantung tipenya: Video → videoId, Article/Practice → contentMd, Quiz → quizId.
const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, enum: LESSON_TYPES, required: true },
  minutes: { type: Number, min: 1, default: 5 },
  videoId: { type: String, match: /^[A-Za-z0-9_-]{11}$/ },
  videoStart: { type: Number, min: 0, default: 0 },
  contentMd: { type: String, maxlength: 20000 },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
  questionCount: { type: Number, default: 0 },
  practice: practiceSchema,
});

const courseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, match: /^[a-z0-9-]{1,64}$/ },
    order: { type: Number, default: 0 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: CATEGORY_IDS, required: true, index: true },
    type: { type: String, enum: LESSON_TYPES, required: true },
    level: { type: String, enum: LEVELS, default: 'Beginner' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    author: { type: String, trim: true, maxlength: 80 },
    description: { type: String, maxlength: 600 },
    thumbnailUrl: { type: String, default: null },
    published: { type: Boolean, default: true },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

courseSchema.index({ title: 'text' });
courseSchema.index({ published: 1, order: 1 });

export default mongoose.model('Course', courseSchema);
