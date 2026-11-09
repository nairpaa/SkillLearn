import { Router } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { CATEGORIES } from '../config/constants.js';
import { requireAuth } from '../middleware/auth.js';
import { userLimiter } from '../middleware/rateLimit.js';
import { CourseQuery, IdParam, QuizAttemptInput, SlugParam, parse } from '../middleware/validate.js';
import { SUMMARY_PROJECTION, findLesson, loadUserState, summariesFor, toDetail } from '../services/courses.js';
import { completeLesson, recordHistory } from '../services/progress.js';
import { HttpError, escapeRegExp, notFound } from '../services/http.js';

// Materi hanya bisa diakses setelah login. Auth dipasang di sini (bukan di daftar path app.js),
// jadi route baru yang ditambahkan ke file ini otomatis ikut terlindungi.
const router = Router();
router.use(requireAuth, userLimiter);

// GET /api/categories  [ext]
router.get('/categories', async (req, res) => {
  const counts = await Course.aggregate([{ $match: { published: true } }, { $group: { _id: '$category', total: { $sum: 1 } } }]);
  const byId = new Map(counts.map((c) => [c._id, c.total]));
  res.json(CATEGORIES.map((c) => ({ ...c, courseCount: byId.get(c.id) ?? 0 })));
});

// GET /api/courses?q=&category=&type=&limit=
router.get('/courses', async (req, res) => {
  const { q, category, type, limit = 20 } = parse(CourseQuery, req.query);
  const filter = { published: true };
  if (category) filter.category = category;
  if (type) filter.type = type;

  if (q) {
    // q sudah dibatasi 60 karakter dan di-escape, jadi aman dipakai sebagai regex.
    const pattern = new RegExp(escapeRegExp(q), 'i');
    const matchingCategories = CATEGORIES.filter((c) => pattern.test(c.name)).map((c) => c.id);
    filter.$or = [{ title: pattern }, { description: pattern }, { author: pattern }];
    if (matchingCategories.length) filter.$or.push({ category: mongoose.trusted({ $in: matchingCategories }) });
  }

  const courses = await Course.find(filter).select(SUMMARY_PROJECTION).sort({ order: 1, title: 1 }).limit(limit).lean();
  res.json(await summariesFor(req.user.id, courses));
});

// GET /api/courses/:slug
router.get('/courses/:slug', async (req, res) => {
  const { slug } = parse(SlugParam, req.params);
  const course = await Course.findOne({ slug, published: true }).lean();
  if (!course) throw notFound('Course not found.');
  const state = await loadUserState(req.user.id, [course._id]);
  res.json(toDetail(course, state));
});

async function loadQuiz(id) {
  const quiz = await Quiz.findById(id).lean();
  const course = quiz && (await Course.findOne({ _id: quiz.courseId, published: true }).lean());
  if (!quiz || !course) throw notFound('Quiz not found.');
  const lessonIndex = course.lessons.findIndex((l) => String(l._id) === String(quiz.lessonId));
  return { quiz, course, lessonIndex };
}

// GET /api/quizzes/:id  — soal TANPA kunci jawaban dan pembahasan
router.get('/quizzes/:id', async (req, res) => {
  const { id } = parse(IdParam, req.params);
  const { quiz, course, lessonIndex } = await loadQuiz(id);
  res.json({
    id: String(quiz._id),
    title: quiz.title,
    courseId: String(course._id),
    courseSlug: course.slug,
    courseTitle: course.title,
    lessonId: String(quiz.lessonId),
    lessonIndex,
    lessonCount: course.lessons.length,
    questions: quiz.questions.map((q) => ({ text: q.text, options: q.options, mono: Boolean(q.mono) })),
  });
});

// POST /api/quizzes/:id/attempts  — nilai dihitung di server, userId dari token
router.post('/quizzes/:id/attempts', async (req, res) => {
  const { id } = parse(IdParam, req.params);
  const { answers } = parse(QuizAttemptInput, req.body);
  const { quiz, course } = await loadQuiz(id);

  if (answers.length !== quiz.questions.length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Answer every question.', {
      fields: { answers: `Send exactly ${quiz.questions.length} answers.` },
    });
  }

  const review = quiz.questions.map((q, i) => ({
    correct: answers[i] === q.correctIndex,
    chosenIndex: answers[i],
    correctIndex: q.correctIndex,
    explanation: q.explanation || '',
  }));
  const score = review.filter((r) => r.correct).length;
  const total = quiz.questions.length;
  const percent = Math.round((score / total) * 100);

  await QuizAttempt.create({ userId: req.user.id, quizId: quiz._id, answers, score, total, percent });

  // Mengerjakan kuis = lesson kuis selesai dan tercatat di riwayat; semuanya jalan paralel.
  const lesson = findLesson(course, quiz.lessonId);
  const [best] = await Promise.all([
    QuizAttempt.findOne({ userId: req.user.id, quizId: quiz._id }).sort({ percent: -1 }).select('percent').lean(),
    lesson && recordHistory(req.user.id, course, lesson),
    lesson && completeLesson(req.user.id, course, lesson),
  ]);

  res.status(201).json({ score, total, percent, bestPercent: best?.percent ?? percent, review });
});

export default router;
