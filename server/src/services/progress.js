import History from '../models/History.js';
import Progress from '../models/Progress.js';
import { computeProgress } from './courses.js';

// Catat lesson yang dibuka: riwayat (satu baris per lesson) + "terakhir dibuka" di progres course.
export async function recordView(userId, course, lesson) {
  const now = new Date();
  await Promise.all([
    History.updateOne(
      { userId, lessonId: lesson._id },
      { $set: { courseId: course._id, type: lesson.type, viewedAt: now } },
      { upsert: true }
    ),
    Progress.updateOne(
      { userId, courseId: course._id },
      { $set: { lastLessonId: lesson._id, lastViewedAt: now } },
      { upsert: true }
    ),
  ]);
}

// Tandai lesson selesai. $addToSet membuat pemanggilan berulang tetap aman (idempotent).
export async function completeLesson(userId, course, lesson) {
  const doc = await Progress.findOneAndUpdate(
    { userId, courseId: course._id },
    { $addToSet: { completedLessonIds: lesson._id }, $set: { lastLessonId: lesson._id, lastViewedAt: new Date() } },
    { upsert: true, returnDocument: 'after' }
  ).lean();
  const { progress, currentLessonIndex } = computeProgress(course, doc);
  return { progress, currentLessonIndex, completedLessonIds: doc.completedLessonIds.map(String) };
}
