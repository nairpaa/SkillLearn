import { useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateLearning, useCompleteLesson, useCourse, useRecordHistory } from '../api/queries';
import { BookmarkButtonLabeled } from '../components/SaveButton';
import { PlayIcon } from '../components/Icons';
import { LessonList } from '../components/LessonList';
import { Markdown } from '../components/Markdown';
import { StatusBlock } from '../components/StatusBlock';
import { ProgressBar } from '../components/ui';
import { useCategoryMap } from '../components/useCategoryMap';
import { formatRating, lessonHref, shortTitle } from '../lib/format';

const scrollBehavior = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

function mmss(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  return `${String(m).padStart(2, '0')}:00`;
}

// Player: awalnya placeholder gelap sesuai desain (tanpa memuat apa pun dari YouTube),
// baru diganti iframe youtube-nocookie waktu tombol play ditekan.
function VideoPlayer({ course, lesson, playing, onPlay }) {
  const label = `Lesson ${lesson.index + 1} — ${lesson.title}`;
  if (playing && lesson.videoId) {
    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(lesson.videoId)}?autoplay=1&start=${Number(lesson.videoStart) || 0}&rel=0`;
    return (
      <div className="player">
        <iframe
          className="player-frame"
          src={src}
          title={`${lesson.title} — ${shortTitle(course.title)}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  const done = lesson.status === 'done';
  return (
    <div className="player player-placeholder">
      <div className="player-caption">
        NOW PLAYING · {label.toUpperCase()}
      </div>
      <button type="button" className="player-play" onClick={onPlay} aria-label={`Play ${label}`}>
        <PlayIcon size={26} />
      </button>
      <div className="player-bar" aria-hidden="true">
        <span>00:00</span>
        <span className="player-track">
          <span style={{ width: done ? '100%' : '0%' }} />
        </span>
        <span>{mmss(lesson.minutes)}</span>
      </div>
    </div>
  );
}

// Course tanpa video sama sekali: tetap tampil blok 16:9 (thumbnail / garis kategori) + tombol ke lesson berikutnya
function CoverBlock({ course, lesson, tint }) {
  return (
    <div className="player player-cover" style={{ backgroundColor: tint }}>
      {course.thumbnailUrl && <img src={course.thumbnailUrl} alt="" />}
      <div className="player-caption dark">UP NEXT · {`Lesson ${lesson.index + 1} — ${lesson.title}`.toUpperCase()}</div>
      <Link to={lessonHref(course.slug, lesson)} className="player-play" aria-label={`Open lesson ${lesson.index + 1}: ${lesson.title}`}>
        <PlayIcon size={26} />
      </Link>
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const courseQ = useCourse(slug);
  const cats = useCategoryMap();
  const recordHistory = useRecordHistory();
  const complete = useCompleteLesson();
  // index lesson yang sedang diputar; pindah lesson lain otomatis balik ke placeholder
  const [playingKey, setPlayingKey] = useState(null);
  const playerRef = useRef(null);
  const lessonParam = params.get('lesson');

  if (courseQ.isPending) return <StatusBlock kind="loading" layout="detail" />;
  if (courseQ.isError) {
    if (courseQ.error?.status === 404 || courseQ.error?.status === 400)
      return (
        <>
          <title>Course not found · SkillLearn</title>
          <StatusBlock kind="notfound" nfTitle="Course not found" />
        </>
      );
    return <StatusBlock kind="error" layout="detail" error={courseQ.error} onRetry={() => courseQ.refetch()} retrying={courseQ.isFetching} />;
  }

  const course = courseQ.data;
  const lessons = course.lessons || [];
  const cat = cats[course.category] || {};
  const current = lessons[course.currentLessonIndex] || lessons[0];

  // ?lesson=i yang bukan video diarahkan ke layar lesson-nya sendiri
  let selected = null;
  if (lessonParam !== null) {
    const idx = Number(lessonParam);
    const l = Number.isInteger(idx) ? lessons[idx] : null;
    if (l && l.type !== 'Video') return <Navigate to={`/courses/${course.slug}/lessons/${l.index}`} replace />;
    if (l) selected = l;
  }
  if (!selected) {
    selected =
      (current?.type === 'Video' && current) ||
      lessons.find((l) => l.type === 'Video' && l.index >= (current?.index ?? 0) && l.status !== 'done') ||
      lessons.find((l) => l.type === 'Video') ||
      null;
  }

  const play = (lesson) => {
    setPlayingKey(`${course.slug}:${lesson.index}`);
    // kunci pilihan lesson di URL: setelah progress tersimpan, currentLessonIndex berubah dan
    // tanpa ?lesson player bakal loncat ke lesson berikutnya di tengah video
    if (lessonParam === null) setParams({ lesson: String(lesson.index) }, { replace: true });
    const ids = { courseId: course.id, lessonId: lesson.id, slug: course.slug };
    // play = lesson video dianggap selesai (lihat tabel "Kapan lesson dianggap selesai" di API.md)
    recordHistory.mutate(ids);
    complete.mutate(ids, { onError: () => invalidateLearning(qc, course.slug) });
  };

  const started = course.progress > 0;
  const finished = course.progress >= 100;
  const ctaLabel = finished ? 'Review course' : started ? `Continue lesson ${current.index + 1}` : 'Start course';
  const ctaLesson = finished ? lessons[0] : current;

  const onCta = (e) => {
    if (!ctaLesson || ctaLesson.type !== 'Video') return; // tipe lain: biarkan Link pindah halaman
    e.preventDefault();
    setParams({ lesson: String(ctaLesson.index) });
    play(ctaLesson);
    playerRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  };

  const facts = [
    { k: 'Lessons', v: String(course.lessonCount ?? lessons.length) },
    { k: 'Duration', v: course.duration },
    { k: 'Level', v: course.level },
    { k: 'Rating', v: `★ ${formatRating(course.rating)}` },
  ];

  return (
    <div className="container detail">
      <title>{`${course.title} · SkillLearn`}</title>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link> / <Link to={`/categories/${course.category}`}>{cat.name}</Link> /{' '}
        <span className="current" aria-current="page">
          {course.title}
        </span>
      </nav>
      <div className="detail-grid">
        <div className="detail-main">
          <div ref={playerRef} className="player-anchor">
            {selected ? (
              <VideoPlayer
                course={course}
                lesson={selected}
                playing={playingKey === `${course.slug}:${selected.index}`}
                onPlay={() => play(selected)}
              />
            ) : (
              current && <CoverBlock course={course} lesson={current} tint={cat.tint} />
            )}
          </div>
          <div className="detail-head">
            <div className="detail-titles">
              <div className="eyebrow" style={{ color: cat.ink }}>
                {cat.name} · {course.level}
              </div>
              <h1 className="page-title">{course.title}</h1>
              <p className="detail-author">by {course.author}</p>
            </div>
            <div className="detail-actions">
              <BookmarkButtonLabeled course={course} />
              {ctaLesson && (
                <Link to={lessonHref(course.slug, ctaLesson)} className="btn btn-primary" onClick={onCta}>
                  {ctaLabel}
                </Link>
              )}
            </div>
          </div>
          <dl className="facts">
            {facts.map((f) => (
              <div key={f.k} className="fact">
                <dt>{f.k}</dt>
                <dd>{f.v}</dd>
              </div>
            ))}
          </dl>
          <section className="detail-section" aria-labelledby="about-title">
            <h2 id="about-title" className="card-heading">
              About this course
            </h2>
            <p className="detail-about">{course.description}</p>
          </section>
          {selected?.contentMd && (
            <section className="detail-section" aria-labelledby="notes-title">
              <h2 id="notes-title" className="card-heading">
                Lesson {selected.index + 1} notes
              </h2>
              <Markdown className="md md-compact detail-notes">{selected.contentMd}</Markdown>
            </section>
          )}
        </div>
        <aside className="side-panel detail-side" aria-labelledby="content-title">
          <div className="side-panel-head">
            <h2 id="content-title" className="side-panel-title">
              Course content
            </h2>
            <div className="side-progress">
              <ProgressBar value={course.progress} label="Course progress" />
              <span>{course.progress}%</span>
            </div>
          </div>
          <LessonList
            course={course}
            highlightIndex={course.currentLessonIndex}
            currentIndex={selected?.index}
            onSelect={(e) => {
              const href = e.currentTarget.getAttribute('href') || '';
              if (href.includes('?lesson=')) {
                // video di halaman yang sama → scroll ke player
                setTimeout(() => playerRef.current?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }), 0);
              }
            }}
          />
        </aside>
      </div>
    </div>
  );
}

