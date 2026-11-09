import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, post, put } from './client';

export const qk = {
  me: ['me'],
  categories: ['categories'],
  courses: (params = {}) => ['courses', params],
  coursesAll: ['courses'],
  course: (slug) => ['course', slug],
  coursesDetailAll: ['course'],
  quiz: (id) => ['quiz', id],
  favorites: ['favorites'],
  history: ['history'],
};

function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const fetchMe = () => get('/me');

export function useMe(options = {}) {
  return useQuery({ queryKey: qk.me, queryFn: fetchMe, ...options });
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories, queryFn: () => get('/categories'), staleTime: 5 * 60 * 1000 });
}

export function useCourses(params = {}, options = {}) {
  return useQuery({
    queryKey: qk.courses(params),
    queryFn: ({ signal }) => get(`/courses${qs(params)}`, { signal }),
    ...options,
  });
}

// Versi search: data lama tetap tampil selama query baru jalan, biar grid nggak kedip tiap ketik
export function useCourseSearch(params) {
  return useCourses(params, { placeholderData: keepPreviousData });
}

export function useCourse(slug) {
  return useQuery({
    queryKey: qk.course(slug),
    queryFn: () => get(`/courses/${encodeURIComponent(slug)}`),
    enabled: Boolean(slug),
  });
}

export function useQuiz(id) {
  return useQuery({
    queryKey: qk.quiz(id),
    queryFn: () => get(`/quizzes/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
    staleTime: Infinity,
  });
}

export function useFavorites() {
  return useQuery({ queryKey: qk.favorites, queryFn: () => get('/me/favorites') });
}

export function useHistory() {
  return useQuery({ queryKey: qk.history, queryFn: () => get('/me/history?limit=20') });
}

// Setelah progress/history berubah, data yang berhubungan perlu di-refresh
export function invalidateLearning(qc, slug) {
  if (slug) qc.invalidateQueries({ queryKey: qk.course(slug) });
  qc.invalidateQueries({ queryKey: qk.me });
  qc.invalidateQueries({ queryKey: qk.history });
  qc.invalidateQueries({ queryKey: qk.coursesAll });
  qc.invalidateQueries({ queryKey: qk.favorites });
}

export function useRecordHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId }) => post('/me/history', { courseId, lessonId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.history });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}

export function useCompleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, lessonId }) =>
      put(`/me/progress/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`),
    onSuccess: (_data, vars) => invalidateLearning(qc, vars.slug),
  });
}

export function useSubmitQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, answers }) => post(`/quizzes/${encodeURIComponent(quizId)}/attempts`, { answers }),
    onSuccess: (_data, vars) => invalidateLearning(qc, vars.slug),
  });
}

// ---- Favorit: optimistic update ke semua cache yang memuat course tsb ----

function patchCourseFlag(qc, courseId, isFavorite) {
  qc.setQueriesData({ queryKey: qk.coursesAll }, (list) =>
    Array.isArray(list) ? list.map((c) => (c.id === courseId ? { ...c, isFavorite } : c)) : list
  );
  qc.setQueriesData({ queryKey: qk.coursesDetailAll }, (c) => (c && c.id === courseId ? { ...c, isFavorite } : c));
  qc.setQueryData(qk.me, (me) =>
    me?.continueLearning?.course?.id === courseId
      ? { ...me, continueLearning: { ...me.continueLearning, course: { ...me.continueLearning.course, isFavorite } } }
      : me
  );
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ course, save }) =>
      save ? put(`/me/favorites/${encodeURIComponent(course.id)}`) : del(`/me/favorites/${encodeURIComponent(course.id)}`),
    onMutate: async ({ course, save }) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: qk.favorites }),
        qc.cancelQueries({ queryKey: qk.coursesAll }),
        qc.cancelQueries({ queryKey: qk.coursesDetailAll }),
      ]);
      // simpan snapshot buat rollback kalau server nolak
      const snapshot = [
        ...qc.getQueriesData({ queryKey: qk.coursesAll }),
        ...qc.getQueriesData({ queryKey: qk.coursesDetailAll }),
        [qk.favorites, qc.getQueryData(qk.favorites)],
        [qk.me, qc.getQueryData(qk.me)],
      ];
      patchCourseFlag(qc, course.id, save);
      qc.setQueryData(qk.favorites, (list) => {
        if (!Array.isArray(list)) return list;
        const rest = list.filter((c) => c.id !== course.id);
        if (!save) return rest;
        // bentuk CourseSummary aja (tanpa lessons) biar konsisten sama response /me/favorites
        // eslint-disable-next-line no-unused-vars
        const { lessons, currentLessonIndex, ...summary } = course;
        return [{ ...summary, isFavorite: true }, ...rest];
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    // Setelah selesai (berhasil/gagal), samakan lagi semua tampilan dengan server, jadi balapan
    // Save → Undo yang cepat tidak meninggalkan kartu/detail yang statusnya berbeda dengan daftar favorit.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.favorites });
      qc.invalidateQueries({ queryKey: qk.coursesAll });
      qc.invalidateQueries({ queryKey: qk.coursesDetailAll });
      qc.invalidateQueries({ queryKey: qk.me });
    },
  });
}
