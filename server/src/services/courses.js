import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Favorite from '../models/Favorite.js';
import Progress from '../models/Progress.js';
import Quiz from '../models/Quiz.js';
import { CATEGORIES } from '../config/constants.js';

// Field berat yang tidak dibutuhkan untuk kartu/daftar course (isi artikel & latihan).
// Dipakai di query daftar supaya tidak menarik puluhan KB per lesson dari database.
export const SUMMARY_PROJECTION = '-lessons.contentMd -lessons.practice';

export const findLesson = (course, lessonId) => course.lessons.find((l) => String(l._id) === String(lessonId));

// ---------- Format durasi ----------

export function lessonDuration(lesson) {
  switch (lesson.type) {
    case 'Article':
      return `${lesson.minutes} min read`;
    case 'Quiz':
      return `${lesson.questionCount} question${lesson.questionCount === 1 ? '' : 's'}`;
    default:
      return `${lesson.minutes} min`;
  }
}

// 200 → "3h 20m", 50 → "50m"
export function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function courseStats(course) {
  const lessons = course.lessons ?? [];
  const minutes = lessons.reduce((sum, l) => sum + (l.minutes || 0), 0);
  const questionCount = lessons.reduce((sum, l) => sum + (l.type === 'Quiz' ? l.questionCount || 0 : 0), 0);
  return {
    lessonCount: lessons.length,
    questionCount,
    duration: course.type === 'Quiz' ? `${questionCount} questions` : formatMinutes(minutes),
  };
}

function thumbnailOf(course) {
  if (course.thumbnailUrl) return course.thumbnailUrl;
  const video = course.lessons?.find((l) => l.type === 'Video' && l.videoId);
  return video ? `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg` : null;
}

// ---------- Progres ----------

// Hitung status tiap lesson dari daftar lesson yang sudah selesai.
export function computeProgress(course, progressDoc) {
  const done = new Set((progressDoc?.completedLessonIds ?? []).map(String));
  const lessons = course.lessons ?? [];
  const doneCount = lessons.filter((l) => done.has(String(l._id))).length;
  const progress = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;
  let currentLessonIndex = lessons.findIndex((l) => !done.has(String(l._id)));
  if (currentLessonIndex === -1) currentLessonIndex = Math.max(0, lessons.length - 1);
  return { done, progress, currentLessonIndex };
}

// ---------- Serializer ----------

export function toSummary(course, state = {}) {
  const id = String(course._id);
  return {
    id,
    slug: course.slug,
    title: course.title,
    category: course.category,
    type: course.type,
    level: course.level,
    rating: course.rating,
    author: course.author,
    description: course.description,
    ...courseStats(course),
    thumbnailUrl: thumbnailOf(course),
    isFavorite: state.favoriteIds?.has(id) ?? false,
    progress: state.progressById ? computeProgress(course, state.progressById.get(id)).progress : 0,
  };
}

export function toDetail(course, state = {}) {
  const progressDoc = state.progressById?.get(String(course._id));
  const { done, progress, currentLessonIndex } = computeProgress(course, progressDoc);

  return {
    ...toSummary(course, state),
    progress,
    currentLessonIndex,
    lessons: course.lessons.map((l, index) => {
      const lesson = {
        id: String(l._id),
        index,
        title: l.title,
        type: l.type,
        duration: lessonDuration(l),
        minutes: l.minutes,
        status: done.has(String(l._id)) ? 'done' : index === currentLessonIndex ? 'current' : 'todo',
      };
      if (l.type === 'Video') Object.assign(lesson, { videoId: l.videoId, videoStart: l.videoStart || 0 });
      if (l.contentMd) lesson.contentMd = l.contentMd;
      if (l.type === 'Quiz') lesson.quizId = String(l.quizId);
      if (l.type === 'Practice' && l.practice) lesson.practice = l.practice;
      return lesson;
    }),
  };
}

// Ambil status favorit & progres milik user untuk sekumpulan course sekaligus (2 query saja).
export async function loadUserState(userId, courseIds) {
  const ids = mongoose.trusted({ $in: courseIds });
  const [favorites, progress] = await Promise.all([
    Favorite.find({ userId, courseId: ids }).select('courseId').lean(),
    Progress.find({ userId, courseId: ids }).lean(),
  ]);
  return {
    favoriteIds: new Set(favorites.map((f) => String(f.courseId))),
    progressById: new Map(progress.map((p) => [String(p.courseId), p])),
  };
}

export async function summariesFor(userId, courses) {
  const state = await loadUserState(
    userId,
    courses.map((c) => c._id)
  );
  return courses.map((c) => toSummary(c, state));
}

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}

// ---------- Membuat course (dipakai seed dan endpoint admin) ----------

// Lesson Quiz membawa soal inline; soalnya dipindah ke collection quizzes dan lesson cukup menyimpan quizId.
export async function createCourse(data) {
  const { lessons: lessonInputs, ...meta } = data;
  const course = new Course({ ...meta, lessons: [] });
  const quizzes = [];

  for (const input of lessonInputs) {
    const { questions, ...lesson } = input;
    course.lessons.push(lesson);
    const sub = course.lessons[course.lessons.length - 1];
    if (lesson.type === 'Quiz') {
      const quiz = new Quiz({ courseId: course._id, lessonId: sub._id, title: lesson.title, questions });
      sub.quizId = quiz._id;
      sub.questionCount = questions.length;
      sub.minutes = Math.max(2, questions.length); // kira-kira 1 menit per soal
      quizzes.push(quiz);
    }
  }

  await course.save();
  if (quizzes.length) await Quiz.insertMany(quizzes);
  return course;
}
