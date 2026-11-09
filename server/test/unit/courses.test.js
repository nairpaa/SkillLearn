// Unit test logika course: durasi, progres, dan serializer (kunci jawaban tidak boleh bocor).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeProgress, formatMinutes, lessonDuration, toDetail, toSummary } from '../../src/services/courses.js';

const id = (n) => ({ toString: () => `lesson${n}` });
const course = {
  _id: 'course1',
  slug: 'react',
  title: 'React',
  category: 'programming',
  type: 'Video',
  level: 'Beginner',
  rating: 4.8,
  author: 'A',
  description: 'D',
  thumbnailUrl: null,
  lessons: [
    { _id: id(0), title: 'V', type: 'Video', minutes: 8, videoId: 'SqcY0GlETPk', videoStart: 30 },
    { _id: id(1), title: 'A', type: 'Article', minutes: 6, contentMd: '## x' },
    { _id: id(2), title: 'Q', type: 'Quiz', minutes: 3, questionCount: 3, quizId: 'quiz1' },
    { _id: id(3), title: 'P', type: 'Practice', minutes: 30, contentMd: 'p', practice: { tasks: ['a'], checks: [] } },
  ],
};

describe('format durasi', () => {
  it('formatMinutes', () => {
    assert.equal(formatMinutes(50), '50m');
    assert.equal(formatMinutes(60), '1h');
    assert.equal(formatMinutes(200), '3h 20m');
  });

  it('lessonDuration per tipe', () => {
    assert.equal(lessonDuration(course.lessons[0]), '8 min');
    assert.equal(lessonDuration(course.lessons[1]), '6 min read');
    assert.equal(lessonDuration(course.lessons[2]), '3 questions');
    assert.equal(lessonDuration({ type: 'Quiz', questionCount: 1 }), '1 question');
  });
});

describe('computeProgress', () => {
  it('tanpa progres: 0%, lesson pertama current', () => {
    assert.deepEqual({ ...computeProgress(course, null), done: undefined }, { progress: 0, currentLessonIndex: 0, done: undefined });
  });

  it('lesson selesai tidak harus berurutan; current = yang pertama belum selesai', () => {
    const r = computeProgress(course, { completedLessonIds: ['lesson0', 'lesson2'] });
    assert.equal(r.progress, 50);
    assert.equal(r.currentLessonIndex, 1);
  });

  it('semua selesai: 100%, current = lesson terakhir', () => {
    const r = computeProgress(course, { completedLessonIds: ['lesson0', 'lesson1', 'lesson2', 'lesson3'] });
    assert.equal(r.progress, 100);
    assert.equal(r.currentLessonIndex, 3);
  });

  it('id lesson yang sudah dihapus dari course tidak dihitung', () => {
    assert.equal(computeProgress(course, { completedLessonIds: ['lesson0', 'hilang'] }).progress, 25);
  });
});

describe('serializer', () => {
  it('summary menghitung durasi, jumlah soal, thumbnail dari video pertama', () => {
    const s = toSummary(course, { favoriteIds: new Set(['course1']) });
    assert.equal(s.lessonCount, 4);
    assert.equal(s.duration, '47m');
    assert.equal(s.questionCount, 3);
    assert.equal(s.thumbnailUrl, 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg');
    assert.equal(s.isFavorite, true);
  });

  it('course bertipe Quiz menampilkan jumlah soal sebagai durasi', () => {
    assert.equal(toSummary({ ...course, type: 'Quiz' }).duration, '3 questions');
  });

  it('detail: status per lesson & field sesuai tipe, tanpa kunci jawaban', () => {
    const d = toDetail(course, { progressById: new Map([['course1', { completedLessonIds: ['lesson0'] }]]) });
    assert.deepEqual(d.lessons.map((l) => l.status), ['done', 'current', 'todo', 'todo']);
    assert.equal(d.lessons[0].videoStart, 30);
    assert.equal(d.lessons[2].quizId, 'quiz1');
    assert.equal(d.lessons[2].videoId, undefined);
    assert.ok(d.lessons[3].practice);
    assert.ok(!JSON.stringify(d).includes('correctIndex'));
  });
});
