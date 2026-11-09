import { api } from './client';

const qs = (params) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const MOBILE = { headers: { 'X-Client': 'mobile' } };

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }, { ...MOBILE, auth: false }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }, { auth: false }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }, { auth: false }),
  logout: () => api.post('/auth/logout', {}),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const contentApi = {
  categories: () => api.get('/categories'),
  courses: ({ q, category, type, limit } = {}) => api.get(`/courses${qs({ q, category, type, limit })}`),
  course: (slug) => api.get(`/courses/${encodeURIComponent(slug)}`),
  quiz: (id) => api.get(`/quizzes/${encodeURIComponent(id)}`),
  submitQuiz: (id, answers) => api.post(`/quizzes/${encodeURIComponent(id)}/attempts`, { answers }),
};

export const meApi = {
  me: () => api.get('/me'),
  update: (patch) => api.patch('/me', patch),
  favorites: () => api.get('/me/favorites'),
  addFavorite: (courseId) => api.put(`/me/favorites/${encodeURIComponent(courseId)}`),
  removeFavorite: (courseId) => api.del(`/me/favorites/${encodeURIComponent(courseId)}`),
  history: (limit = 20) => api.get(`/me/history${qs({ limit })}`),
  addHistory: (courseId, lessonId) => api.post('/me/history', { courseId, lessonId }),
  completeLesson: (courseId, lessonId) =>
    api.put(`/me/progress/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`),
};
