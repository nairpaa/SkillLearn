import { Link } from 'react-router';
import { useCategories, useCourses, useMe } from '../api/queries';
import { CourseGrid } from '../components/CourseCard';
import { StatusBlock, queryStatus, retryAll } from '../components/StatusBlock';
import { ProgressBar } from '../components/ui';
import { firstName, greeting, lessonHref, plural, shortTitle } from '../lib/format';

export function isNewUser(me) {
  const s = me?.stats || {};
  return !me?.continueLearning && !s.inProgress && !s.completed && s.quizAverage == null;
}

function ContinueCard({ cl }) {
  const { course, progress, nextLesson } = cl;
  return (
    <section className="hero-card hero-continue" aria-labelledby="continue-title">
      <div className="eyebrow hero-eyebrow">Continue learning</div>
      <h2 id="continue-title" className="hero-card-title">
        {shortTitle(course.title)}
      </h2>
      {nextLesson && (
        <p className="hero-card-text">
          Next: Lesson {nextLesson.index + 1} · {nextLesson.title} ({nextLesson.duration})
        </p>
      )}
      <div className="hero-progress">
        <ProgressBar value={progress} label={`${shortTitle(course.title)} progress`} className="on-teal" />
        <span>{progress}%</span>
      </div>
      <Link to={lessonHref(course.slug, nextLesson)} className="hero-btn hero-btn-light">
        Resume
      </Link>
    </section>
  );
}

function GetStartedCard({ course, isNew }) {
  if (!course) return null;
  return (
    <section className="hero-card hero-start" aria-labelledby="start-title">
      <div className="eyebrow hero-eyebrow">Get started</div>
      <h2 id="start-title" className="hero-card-title">
        {isNew ? 'Start your first course' : 'Start a new course'}
      </h2>
      <p className="hero-card-text">
        {shortTitle(course.title)} is a good first pick: {course.lessonCount} short lessons for beginners.
      </p>
      <Link to={`/courses/${course.slug}`} className="hero-btn hero-btn-primary">
        Start course
      </Link>
    </section>
  );
}

export default function Home() {
  const meQ = useMe();
  const catQ = useCategories();
  const coursesQ = useCourses({ limit: 8 });
  const st = queryStatus(meQ, catQ, coursesQ);

  if (st) {
    return (
      <>
        <title>Home · SkillLearn</title>
        <StatusBlock kind={st.kind === 'notfound' ? 'error' : st.kind} error={st.error} onRetry={retryAll(meQ, catQ, coursesQ)} />
      </>
    );
  }

  const me = meQ.data;
  const courses = coursesQ.data;
  const isNew = isNewUser(me);
  const inProgress = me.stats?.inProgress || 0;
  const sub = isNew
    ? 'Your account is ready. Pick a course to get started.'
    : inProgress > 0
      ? `You have ${plural(inProgress, 'course')} in progress. Keep your streak going.`
      : 'Pick a course and keep your streak going.';
  const suggestion = courses.find((c) => !c.progress) || courses[0];

  return (
    <div className="container home">
      <title>Home · SkillLearn</title>
      <div className="home-hero">
        <div className="home-greet">
          <h1 className="home-title">
            {greeting()}, {firstName(me.name)}
          </h1>
          <p className="home-sub">{sub}</p>
        </div>
        {me.continueLearning ? <ContinueCard cl={me.continueLearning} /> : <GetStartedCard course={suggestion} isNew={isNew} />}
      </div>

      <section className="home-section" aria-labelledby="cat-title">
        <h2 id="cat-title" className="section-title">
          Categories
        </h2>
        <div className="cat-tiles">
          {catQ.data.map((k) => (
            <Link key={k.id} to={`/categories/${k.id}`} className="cat-tile">
              <span className="cat-swatch" style={{ backgroundColor: k.tint }} aria-hidden="true" />
              <span className="cat-tile-text">
                <span className="cat-tile-name">{k.name}</span>
                <span className="cat-tile-count">{plural(k.courseCount ?? 0, 'course')}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section" aria-labelledby="pop-title">
        <div className="section-head">
          <h2 id="pop-title" className="section-title">
            Popular courses
          </h2>
          <Link to="/search" className="see-all">
            See all
          </Link>
        </div>
        <CourseGrid courses={courses} />
      </section>
    </div>
  );
}

