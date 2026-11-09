import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi, meApi } from '../api/endpoints';
import { useToast } from '../components/Toast';

export const keys = {
  me: ['me'],
  categories: ['categories'],
  courses: (params) => ['courses', params],
  course: (slug) => ['course', slug],
  favorites: ['favorites'],
  history: ['history'],
  quiz: (id) => ['quiz', id],
};

export const useMe = () => useQuery({ queryKey: keys.me, queryFn: meApi.me });

export const useCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: contentApi.categories, staleTime: 10 * 60 * 1000 });

export const useCourses = (params = {}, options = {}) =>
  useQuery({ queryKey: keys.courses(params), queryFn: () => contentApi.courses(params), ...options });

export const useCourse = (slug) =>
  useQuery({ queryKey: keys.course(slug), queryFn: () => contentApi.course(slug), enabled: !!slug });

export const useFavorites = () => useQuery({ queryKey: keys.favorites, queryFn: meApi.favorites });

export const useHistory = () => useQuery({ queryKey: keys.history, queryFn: () => meApi.history(20) });

// staleTime Infinity: soal kuis nggak berubah selama dikerjakan, jangan sampai ke-refetch di tengah jalan
export const useQuiz = (id) =>
  useQuery({ queryKey: keys.quiz(id), queryFn: () => contentApi.quiz(id), enabled: !!id, staleTime: Infinity });

function toSummary(course) {
  if (!course) return course;
  const { lessons, currentLessonIndex, ...summary } = course;
  return summary;
}

// Update isFavorite di semua cache yang memuat course ini, biar bookmark langsung berubah di semua layar
function applyFavorite(qc, course, next) {
  const flag = (c) => (c && c.id === course.id ? { ...c, isFavorite: next } : c);
  qc.setQueriesData({ queryKey: ['courses'] }, (list) => (Array.isArray(list) ? list.map(flag) : list));
  qc.setQueriesData({ queryKey: ['course'] }, (d) => flag(d));
  qc.setQueryData(keys.favorites, (list) => {
    if (!Array.isArray(list)) return list;
    const rest = list.filter((c) => c.id !== course.id);
    return next ? [{ ...toSummary(course), isFavorite: true }, ...rest] : rest;
  });
  qc.setQueryData(keys.me, (me) => {
    const c = me?.continueLearning?.course;
    if (!c || c.id !== course.id) return me;
    return { ...me, continueLearning: { ...me.continueLearning, course: { ...c, isFavorite: next } } };
  });
}

export function useFavoriteToggle() {
  const qc = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({
    // scope yang sama → semua toggle favorit dijalankan berurutan, jadi PUT/DELETE nggak saling balapan
    scope: { id: 'favorites' },
    mutationFn: ({ course, next }) => (next ? meApi.addFavorite(course.id) : meApi.removeFavorite(course.id)),
    onMutate: ({ course, next }) => applyFavorite(qc, course, next),
    onError: (_err, { course, next }) => {
      applyFavorite(qc, course, !next);
      toast.show("Couldn't update favorites. Try again.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.favorites });
      qc.invalidateQueries({ queryKey: ['courses'], refetchType: 'none' });
    },
  });

  return useCallback(
    (course) => {
      if (!course) return;
      const next = !course.isFavorite;
      mutation.mutate({ course, next });
      toast.show(next ? 'Saved to favorites' : 'Removed from favorites', {
        actionLabel: 'Undo',
        onAction: () => mutation.mutate({ course: { ...course, isFavorite: next }, next: !next }),
      });
    },
    [mutation, toast]
  );
}

export function applyProgress(qc, slug, res) {
  if (!res) return;
  const done = new Set(res.completedLessonIds || []);
  qc.setQueryData(keys.course(slug), (d) => {
    if (!d) return d;
    return {
      ...d,
      progress: res.progress,
      currentLessonIndex: res.currentLessonIndex,
      lessons: d.lessons.map((l) => ({
        ...l,
        status: done.has(l.id) ? 'done' : l.index === res.currentLessonIndex ? 'current' : 'todo',
      })),
    };
  });
}

export function useLessonTracking() {
  const qc = useQueryClient();
  const toast = useToast();

  const recordHistory = useCallback(
    (course, lesson) => {
      if (!course?.id || !lesson?.id) return;
      meApi
        .addHistory(course.id, lesson.id)
        .then(() => {
          qc.invalidateQueries({ queryKey: keys.history });
          qc.invalidateQueries({ queryKey: keys.me });
        })
        .catch(() => {
          // riwayat bukan hal kritis, gagal ya diam saja
        });
    },
    [qc]
  );

  const completeLesson = useCallback(
    async (course, lesson, { silent = false } = {}) => {
      if (!course?.id || !lesson?.id) return null;
      try {
        const res = await meApi.completeLesson(course.id, lesson.id);
        applyProgress(qc, course.slug, res);
        qc.invalidateQueries({ queryKey: ['courses'] });
        qc.invalidateQueries({ queryKey: keys.me });
        qc.invalidateQueries({ queryKey: keys.favorites });
        return res;
      } catch (e) {
        if (!silent) toast.show("Couldn't save your progress. Check your connection.");
        throw e;
      }
    },
    [qc, toast]
  );

  return { recordHistory, completeLesson };
}
