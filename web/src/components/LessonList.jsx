import { Link } from 'react-router';
import { lessonHref } from '../lib/format';
import { CheckIcon } from './Icons';

// Satu baris lesson. highlight = baris "sedang dipelajari" (bg primary-tint, nomor accent kalau belum selesai)
export function LessonRow({ slug, lesson, highlight, ariaCurrent, onSelect }) {
  const done = lesson.status === 'done';
  const state = done ? 'done' : highlight ? 'current' : 'todo';
  return (
    <li>
      <Link
        to={lessonHref(slug, lesson)}
        className={`lesson-row${highlight ? ' is-current' : ''}`}
        aria-current={ariaCurrent ? 'step' : undefined}
        onClick={onSelect}
      >
        <span className={`lesson-num ${state}`} aria-hidden="true">
          {done ? <CheckIcon size={14} strokeWidth={3} /> : lesson.index + 1}
        </span>
        <span className="lesson-text">
          <span className="lesson-title">{lesson.title}</span>
          <span className="lesson-meta">
            {lesson.type} · {lesson.duration}
            {done && <span className="sr-only"> · completed</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

export function LessonList({ course, highlightIndex, currentIndex, onSelect }) {
  return (
    <ol className="lesson-list" aria-label="Lessons">
      {course.lessons.map((l) => (
        <LessonRow
          key={l.id}
          slug={course.slug}
          lesson={l}
          highlight={l.index === highlightIndex}
          ariaCurrent={l.index === currentIndex}
          onSelect={onSelect}
        />
      ))}
    </ol>
  );
}
