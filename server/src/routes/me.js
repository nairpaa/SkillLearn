import { Router } from 'express';
import mongoose from 'mongoose';
import AuthToken from '../models/AuthToken.js';
import Course from '../models/Course.js';
import Favorite from '../models/Favorite.js';
import History from '../models/History.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Session from '../models/Session.js';
import User from '../models/User.js';
import { clearRefreshCookie } from '../auth/sessions.js';
import {
  CourseIdParam,
  DeleteAccountInput,
  HistoryInput,
  LimitQuery,
  ProfileUpdate,
  ProgressParams,
  parse,
} from '../middleware/validate.js';
import { SUMMARY_PROJECTION, computeProgress, findLesson, lessonDuration, summariesFor, toSummary } from '../services/courses.js';
import { completeLesson, recordView } from '../services/progress.js';
import { HttpError, notFound } from '../services/http.js';
import { verifyPassword } from '../auth/password.js';
import { reauthLimiter } from '../middleware/rateLimit.js';
import { DEMO_LOCKED } from './auth.js';

// Semua route di sini sudah melewati requireAuth. Setiap query SELALU memakai
// userId dari token (req.user.id), tidak pernah dari input klien. Itu inti anti-IDOR.
const router = Router();

async function publishedCourse(courseId) {
  const course = await Course.findOne({ _id: courseId, published: true }).lean();
  if (!course) throw notFound('Course not found.');
  return course;
}

// Statistik profil + kartu "Continue learning" di Home.
async function buildProfile(user) {
  const [progressDocs, bestScores] = await Promise.all([
    Progress.find({ userId: user._id }).sort({ lastViewedAt: -1 }).lean(),
    QuizAttempt.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: '$quizId', best: { $max: '$percent' } } },
    ]),
  ]);

  const courses = await Course.find({
    _id: mongoose.trusted({ $in: progressDocs.map((p) => p.courseId) }),
    published: true,
  })
    .select(SUMMARY_PROJECTION)
    .lean();
  const courseById = new Map(courses.map((c) => [String(c._id), c]));

  let inProgress = 0;
  let completed = 0;
  let continueLearning = null;

  for (const doc of progressDocs) {
    const course = courseById.get(String(doc.courseId));
    if (!course) continue;
    const { progress, currentLessonIndex } = computeProgress(course, doc);
    if (progress >= 100) completed += 1;
    else if (progress > 0 || doc.lastLessonId) inProgress += 1;

    // progressDocs sudah urut "terakhir dibuka", jadi yang pertama belum selesai = lanjutkan belajar.
    if (!continueLearning && progress < 100) {
      const lesson = course.lessons[currentLessonIndex];
      // Progres course ini sudah ada di tangan; cukup satu cek favorit, tanpa query ulang.
      const isFav = await Favorite.exists({ userId: user._id, courseId: course._id });
      const summary = toSummary(course, {
        favoriteIds: new Set(isFav ? [String(course._id)] : []),
        progressById: new Map([[String(course._id), doc]]),
      });
      continueLearning = {
        course: summary,
        progress,
        nextLesson: lesson && {
          id: String(lesson._id),
          index: currentLessonIndex,
          title: lesson.title,
          type: lesson.type,
          duration: lessonDuration(lesson),
        },
      };
    }
  }

  const quizAverage = bestScores.length
    ? Math.round(bestScores.reduce((sum, s) => sum + s.best, 0) / bestScores.length)
    : null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    bio: user.bio,
    interests: user.interests,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt,
    stats: { inProgress, completed, quizAverage },
    continueLearning,
  };
}

async function currentUser(req) {
  const user = await User.findById(req.user.id);
  if (!user) throw notFound('Account not found.');
  return user;
}

// GET /api/me
router.get('/', async (req, res) => {
  res.json(await buildProfile(await currentUser(req)));
});

// PATCH /api/me — hanya name, bio, interests, avatar (allowlist strict). { role: 'admin' } → 400.
router.patch('/', async (req, res) => {
  const update = parse(ProfileUpdate, req.body);
  const user = await currentUser(req);
  user.set(update);
  await user.save();
  res.json(await buildProfile(user));
});

// DELETE /api/me  { password } — hapus akun beserta semua data pribadinya (hak pengguna menurut UU PDP).
// Wajib konfirmasi password, jadi token yang bocor saja tidak cukup untuk menghapus akun.
router.delete('/', reauthLimiter, async (req, res) => {
  const { password } = parse(DeleteAccountInput, req.body);
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw new HttpError(400, 'WRONG_PASSWORD', 'Password is incorrect.', { fields: { password: 'Password is incorrect.' } });
  }
  if (user.isDemo) throw new HttpError(403, 'DEMO_ACCOUNT', DEMO_LOCKED);
  const userId = req.user.id;
  await Promise.all([
    Favorite.deleteMany({ userId }),
    History.deleteMany({ userId }),
    Progress.deleteMany({ userId }),
    QuizAttempt.deleteMany({ userId }),
    Session.deleteMany({ userId }),
    AuthToken.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });
  clearRefreshCookie(res);
  res.status(204).end();
});

// ---------- Favorit ----------

router.get('/favorites', async (req, res) => {
  const favorites = await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100).lean();
  const courses = await Course.find({
    _id: mongoose.trusted({ $in: favorites.map((f) => f.courseId) }),
    published: true,
  })
    .select(SUMMARY_PROJECTION)
    .lean();
  // $in tidak menjaga urutan, jadi diurutkan ulang sesuai waktu disimpan.
  const byId = new Map(courses.map((c) => [String(c._id), c]));
  const ordered = favorites.map((f) => byId.get(String(f.courseId))).filter(Boolean);
  res.json(await summariesFor(req.user.id, ordered));
});

router.put('/favorites/:courseId', async (req, res) => {
  const { courseId } = parse(CourseIdParam, req.params);
  await publishedCourse(courseId);
  await Favorite.updateOne({ userId: req.user.id, courseId }, { $setOnInsert: { userId: req.user.id, courseId } }, { upsert: true });
  res.status(204).end();
});

router.delete('/favorites/:courseId', async (req, res) => {
  const { courseId } = parse(CourseIdParam, req.params);
  await Favorite.deleteOne({ userId: req.user.id, courseId });
  res.status(204).end();
});

// ---------- Riwayat ----------

router.get('/history', async (req, res) => {
  const { limit = 20 } = parse(LimitQuery, req.query);
  const items = await History.find({ userId: req.user.id }).sort({ viewedAt: -1 }).limit(limit).lean();
  const courses = await Course.find({
    _id: mongoose.trusted({ $in: [...new Set(items.map((h) => String(h.courseId)))] }),
    published: true,
  })
    .select(SUMMARY_PROJECTION)
    .lean();
  const byId = new Map(courses.map((c) => [String(c._id), c]));

  const result = [];
  for (const h of items) {
    const course = byId.get(String(h.courseId));
    const lessonIndex = course?.lessons.findIndex((l) => String(l._id) === String(h.lessonId)) ?? -1;
    if (lessonIndex === -1) continue; // course/lesson sudah dihapus
    const lesson = course.lessons[lessonIndex];
    result.push({
      courseId: String(course._id),
      courseSlug: course.slug,
      courseTitle: course.title,
      category: course.category,
      lessonId: String(lesson._id),
      lessonIndex,
      lessonTitle: lesson.title,
      type: lesson.type,
      viewedAt: h.viewedAt,
    });
  }
  res.json(result);
});

router.post('/history', async (req, res) => {
  const { courseId, lessonId } = parse(HistoryInput, req.body);
  const course = await publishedCourse(courseId);
  const lesson = findLesson(course, lessonId);
  if (!lesson) throw notFound('Lesson not found.');
  await recordView(req.user.id, course, lesson);
  res.status(204).end();
});

// ---------- Progres [ext] ----------

router.put('/progress/:courseId/lessons/:lessonId', async (req, res) => {
  const { courseId, lessonId } = parse(ProgressParams, req.params);
  const course = await publishedCourse(courseId);
  const lesson = findLesson(course, lessonId);
  if (!lesson) throw notFound('Lesson not found.');
  res.json(await completeLesson(req.user.id, course, lesson));
});

export default router;
