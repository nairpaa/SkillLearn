// npm run seed → isi ulang 8 course contoh beserta kuisnya, lalu buat 3 akun:
//   - alya@student.ac.id  : pengguna lama (ada progres, favorit, riwayat, nilai kuis)
//   - baru@student.ac.id  : pengguna baru (kosong, untuk melihat tampilan new-user)
//   - ADMIN_EMAIL         : admin (kelola course lewat /api/admin)
//
// Hati-hati: semua course, kuis, favorit, riwayat, progres, dan nilai kuis LAMA DIHAPUS.
// Akun pengguna lain tetap ada, tapi aktivitasnya ikut terhapus karena ID course berubah.
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { env } from '../config/env.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import Favorite from '../models/Favorite.js';
import History from '../models/History.js';
import Progress from '../models/Progress.js';
import QuizAttempt from '../models/QuizAttempt.js';
import RateLimit from '../models/RateLimit.js';
import Session from '../models/Session.js';
import AuthToken from '../models/AuthToken.js';
import User from '../models/User.js';
import { hashPassword } from '../auth/password.js';
import { createCourse } from '../services/courses.js';
import courseData from './courses/index.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function seedCourses() {
  await Promise.all(
    [Course, Quiz, Favorite, History, Progress, QuizAttempt, RateLimit].map((Model) => Model.deleteMany({}))
  );
  // Index dibangun ulang sesuai schema (penting untuk unique & TTL index).
  await Promise.all([Course, Quiz, Favorite, History, Progress, QuizAttempt, RateLimit, Session, AuthToken, User].map((M) => M.syncIndexes()));

  const courses = [];
  for (const [i, data] of courseData.entries()) {
    courses.push(await createCourse({ ...data, order: i + 1 }));
  }
  const lessons = courses.reduce((n, c) => n + c.lessons.length, 0);
  console.log(`Berhasil menambahkan ${courses.length} course dengan total ${lessons} lesson.`);
  return new Map(courses.map((c) => [c.slug, c]));
}

async function recreateUser({ email, name, password, role = 'student', createdAt, bio = '', interests = [], isDemo = false }) {
  const old = await User.findOne({ email });
  if (old) {
    await Promise.all([Session.deleteMany({ userId: old._id }), AuthToken.deleteMany({ userId: old._id })]);
    await User.deleteOne({ _id: old._id });
  }
  const user = new User({
    email,
    name,
    role,
    bio,
    interests,
    passwordHash: await hashPassword(password),
    emailVerifiedAt: new Date(),
    isDemo,
    createdAt,
  });
  await user.save({ timestamps: false });
  return user;
}

async function seedReturningUser(courses) {
  const user = await recreateUser({
    email: 'alya@student.ac.id',
    name: 'Alya Rahma',
    password: env.seed.demoPassword,
    createdAt: new Date('2026-03-02T08:00:00Z'),
    bio: 'Informatics student. Learning React and UI design.',
    interests: ['programming', 'design'],
    isDemo: true,
  });

  const now = Date.now();
  const at = (msAgo) => new Date(now - msAgo);
  const react = courses.get('react');
  const figma = courses.get('figma');
  const color = courses.get('color');

  // Favorit sama seperti di desain: React, Figma, JavaScript Quiz Sprint.
  await Favorite.insertMany(
    ['react', 'figma', 'js-quiz'].map((slug, i) => ({ userId: user._id, courseId: courses.get(slug)._id, createdAt: at((i + 1) * DAY) }))
  );

  // Progres: React baru 2 lesson (lanjut ke lesson 3), Figma 3 lesson, Color Theory selesai semua.
  const plan = [
    { course: react, done: [0, 1], viewed: [[2, 2 * HOUR], [1, DAY], [0, DAY + HOUR]] },
    { course: figma, done: [0, 1, 2], viewed: [[2, 2 * DAY], [1, 3 * DAY], [0, 3 * DAY + HOUR]] },
    { course: color, done: color.lessons.map((_, i) => i), viewed: color.lessons.map((_, i) => [i, 4 * DAY + (color.lessons.length - i) * HOUR]) },
  ];

  for (const { course, done, viewed } of plan) {
    const doneLessons = done.map((i) => course.lessons[i]);
    await Progress.create({
      userId: user._id,
      courseId: course._id,
      completedLessonIds: doneLessons.map((l) => l._id),
      lastLessonId: course.lessons[viewed[0][0]]._id,
      lastViewedAt: at(viewed[0][1]),
    });
    await History.insertMany(
      viewed.map(([i, ago]) => ({
        userId: user._id,
        courseId: course._id,
        lessonId: course.lessons[i]._id,
        type: course.lessons[i].type,
        viewedAt: at(ago),
      }))
    );
    // Kuis yang sudah selesai diberi nilai contoh (satu salah), supaya "Quiz average" terisi.
    for (const lesson of doneLessons.filter((l) => l.type === 'Quiz')) {
      const quiz = await Quiz.findById(lesson.quizId).lean();
      const answers = quiz.questions.map((q, i) => (i === 0 ? (q.correctIndex + 1) % q.options.length : q.correctIndex));
      const score = answers.filter((a, i) => a === quiz.questions[i].correctIndex).length;
      await QuizAttempt.create({
        userId: user._id,
        quizId: quiz._id,
        answers,
        score,
        total: quiz.questions.length,
        percent: Math.round((score / quiz.questions.length) * 100),
      });
    }
  }
  console.log('Akun demo (pengguna lama): alya@student.ac.id');
}

try {
  // Di production password demo wajib diisi sendiri, supaya tidak sama dengan yang tertulis di README.
  if (!env.seed.demoPassword) throw new Error('DEMO_PASSWORD wajib diisi di production (jangan pakai password dari README).');
  await connectDB();
  const courses = await seedCourses();
  await seedReturningUser(courses);
  await recreateUser({ email: 'baru@student.ac.id', name: 'Bima Pratama', password: env.seed.demoPassword, createdAt: new Date(), isDemo: true });
  console.log('Akun demo (pengguna baru) : baru@student.ac.id');
  console.log(`Password kedua akun demo  : ${env.seed.demoPassword}`);

  if (env.seed.adminPassword) {
    await recreateUser({ email: env.seed.adminEmail, name: 'SkillLearn Admin', password: env.seed.adminPassword, role: 'admin', createdAt: new Date() });
    console.log(`Akun admin               : ${env.seed.adminEmail} (password dari ADMIN_PASSWORD)`);
  } else {
    console.log('ADMIN_PASSWORD kosong, akun admin tidak dibuat.');
  }
} catch (err) {
  console.error('Seeding gagal:', err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
