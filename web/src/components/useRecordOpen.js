import { useEffect, useRef } from 'react';
import { useRecordHistory } from '../api/queries';

// Catat history sekali per lesson yang dibuka (guard ref biar StrictMode nggak dobel)
export function useRecordOpen(course, lesson) {
  const record = useRecordHistory();
  const done = useRef(null);
  const key = course && lesson ? `${course.id}:${lesson.id}` : null;
  const { mutate } = record;
  useEffect(() => {
    if (!key || done.current === key) return;
    done.current = key;
    mutate({ courseId: course.id, lessonId: lesson.id });
  }, [key, mutate, course?.id, lesson?.id]);
}
