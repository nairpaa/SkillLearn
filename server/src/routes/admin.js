import { Router } from 'express';
import Course from '../models/Course.js';
import Favorite from '../models/Favorite.js';
import History from '../models/History.js';
import Progress from '../models/Progress.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import mongoose from 'mongoose';
import { CourseCreateInput, CourseUpdateInput, IdParam, parse } from '../middleware/validate.js';
import { createCourse, loadUserState, toDetail, toSummary } from '../services/courses.js';
import { HttpError, notFound } from '../services/http.js';

// Kelola course lewat API (tanpa UI, sesuai handoff). Dipasang di belakang requireRole('admin').
const router = Router();

router.post('/courses', async (req, res) => {
  const data = parse(CourseCreateInput, req.body);
  if (await Course.exists({ slug: data.slug })) {
    throw new HttpError(409, 'CONFLICT', 'A course with this slug already exists.', { fields: { slug: 'Slug is already used.' } });
  }
  const order = data.order ?? ((await Course.countDocuments()) + 1);
  const course = await createCourse({ ...data, order });
  const state = await loadUserState(req.user.id, [course._id]);
  res.status(201).json(toDetail(course.toObject(), state));
});

router.patch('/courses/:id', async (req, res) => {
  const { id } = parse(IdParam, req.params);
  const update = parse(CourseUpdateInput, req.body);
  const course = await Course.findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after', runValidators: true }).lean();
  if (!course) throw notFound('Course not found.');
  res.json(toSummary(course));
});

router.delete('/courses/:id', async (req, res) => {
  const { id } = parse(IdParam, req.params);
  const course = await Course.findById(id).lean();
  if (!course) throw notFound('Course not found.');

  const quizIds = (await Quiz.find({ courseId: id }).select('_id').lean()).map((q) => q._id);
  await Promise.all([
    Quiz.deleteMany({ courseId: id }),
    QuizAttempt.deleteMany({ quizId: mongoose.trusted({ $in: quizIds }) }),
    Favorite.deleteMany({ courseId: id }),
    History.deleteMany({ courseId: id }),
    Progress.deleteMany({ courseId: id }),
  ]);
  await Course.deleteOne({ _id: id });
  res.status(204).end();
});

export default router;
