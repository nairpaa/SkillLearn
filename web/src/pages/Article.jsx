import { Link, useNavigate } from 'react-router';
import { useCompleteLesson } from '../api/queries';
import { LessonList } from '../components/LessonList';
import { Markdown } from '../components/Markdown';
import { BookmarkButtonLabeled } from '../components/SaveButton';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui';
import { useCategoryMap } from '../components/useCategoryMap';
import { lessonHref, shortTitle } from '../lib/format';
import { useRecordOpen } from '../components/useRecordOpen';

export default function Article({ course, lesson }) {
  const navigate = useNavigate();
  const cats = useCategoryMap();
  const cat = cats[course.category] || {};
  const complete = useCompleteLesson();
  const toast = useToast();
  useRecordOpen(course, lesson);

  const prev = course.lessons[lesson.index - 1];
  const next = course.lessons[lesson.index + 1];

  // "Next" / "Finish" = artikel dianggap selesai dibaca → simpan progress dulu baru pindah
  const finish = () => {
    complete.mutate(
      { courseId: course.id, lessonId: lesson.id, slug: course.slug },
      {
        onSuccess: () => navigate(next ? lessonHref(course.slug, next) : `/courses/${course.slug}`),
        onError: () => toast.show("Couldn't save your progress. Try again."),
      }
    );
  };

  return (
    <div className="container lesson-layout">
      <title>{`${lesson.title} · ${shortTitle(course.title)} · SkillLearn`}</title>
      <article className="article-card">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link> / <Link to={`/categories/${course.category}`}>{cat.name}</Link> /{' '}
          <Link to={`/courses/${course.slug}`} className="current">
            {shortTitle(course.title)}
          </Link>
        </nav>
        <header className="article-head">
          <div className="article-titles">
            <span className="eyebrow" style={{ color: cat.ink }}>
              Lesson {lesson.index + 1} · Article · {lesson.duration}
            </span>
            <h1 className="article-title">{lesson.title}</h1>
            <span className="article-byline">
              {course.author} · {shortTitle(course.title)}
            </span>
          </div>
          <BookmarkButtonLabeled course={course} size="sm" />
        </header>
        <Markdown>{lesson.contentMd}</Markdown>
        <footer className="article-foot">
          {prev ? (
            <Link to={lessonHref(course.slug, prev)} className="btn btn-secondary">
              ← {shortTitle(prev.title)}
            </Link>
          ) : (
            <Link to={`/courses/${course.slug}`} className="btn btn-secondary">
              ← Back to course
            </Link>
          )}
          <Button onClick={finish} busy={complete.isPending} busyLabel="Saving…" className="article-next">
            {next ? `Next: ${shortTitle(next.title)} →` : 'Finish course'}
          </Button>
        </footer>
      </article>
      <aside className="side-panel lesson-side" aria-labelledby="side-title">
        <div className="side-panel-head article-side-head">
          <h2 id="side-title" className="side-panel-title">
            {shortTitle(course.title)}
          </h2>
          <span className="muted side-sub">
            {course.lessonCount} lessons · {course.duration}
          </span>
        </div>
        <LessonList course={course} highlightIndex={lesson.index} currentIndex={lesson.index} />
      </aside>
    </div>
  );
}
