import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useFavorites, useHistory, useMe } from '../api/queries';
import { useAuth } from '../auth/AuthContext';
import { Thumb } from '../components/CourseCard';
import { Dialog } from '../components/Dialog';
import { BookmarkIcon, ClockIcon } from '../components/Icons';
import { StatusBlock, queryStatus, retryAll } from '../components/StatusBlock';
import { Avatar, Button, ButtonLink, EmptyState } from '../components/ui';
import { useCategoryMap } from '../components/useCategoryMap';
import { useFavoriteToggle } from '../components/useFavorite';
import { courseMeta, lessonHref, monthYear, relativeTime } from '../lib/format';

function FavoriteRow({ course, cat }) {
  const toggle = useFavoriteToggle();
  return (
    <li className="fav-row">
      <Link to={`/courses/${course.slug}`} className="fav-link">
        <Thumb course={course} tint={cat.tint} className="fav-thumb" stripe="stripes-sm" />
        <span className="fav-text">
          <span className="fav-title">{course.title}</span>
          <span className="fav-meta">
            {cat.name} · {courseMeta(course)}
          </span>
        </span>
      </Link>
      <button
        type="button"
        className="fav-remove"
        title="Remove from favorites"
        aria-label={`Remove ${course.title} from favorites`}
        onClick={() => toggle({ ...course, isFavorite: true })}
      >
        <BookmarkIcon size={16} filled />
      </button>
    </li>
  );
}

export default function Profile() {
  const meQ = useMe();
  const favQ = useFavorites();
  const histQ = useHistory();
  const cats = useCategoryMap();
  const { logout } = useAuth();
  const location = useLocation();
  const [confirm, setConfirm] = useState(false);
  const [allDevices, setAllDevices] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const cancelRef = useRef(null);
  const st = queryStatus(meQ, favQ, histQ);
  const ready = !st;

  // /profile#favorites atau #history dari nav → scroll ke kartunya setelah data siap
  useEffect(() => {
    if (!ready || !location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.focus({ preventScroll: true });
    }
  }, [ready, location.hash, location.key]);

  if (st) {
    return (
      <>
        <title>Profile · SkillLearn</title>
        <StatusBlock kind={st.kind === 'notfound' ? 'error' : st.kind} error={st.error} onRetry={retryAll(meQ, favQ, histQ)} />
      </>
    );
  }

  const me = meQ.data;
  const favorites = favQ.data;
  const history = histQ.data;
  const s = me.stats || {};
  const stats = [
    { v: String(s.inProgress ?? 0), k: 'In progress' },
    { v: String(s.completed ?? 0), k: 'Completed' },
    { v: s.quizAverage == null ? '–' : `${Math.round(s.quizAverage)}%`, k: 'Quiz average' },
  ];

  const doLogout = async () => {
    setLeaving(true);
    await logout({ allDevices });
  };

  return (
    <div className="container profile">
      <title>Profile · SkillLearn</title>
      <section className="profile-card" aria-label="Your profile">
        <Avatar name={me.name} src={me.avatar} size={84} fontSize={28} />
        <div className="profile-id">
          <h1 className="profile-name">{me.name}</h1>
          <p className="profile-sub">
            {me.email} · Joined {monthYear(me.createdAt)}
          </p>
        </div>
        <dl className="stat-tiles">
          {stats.map((x) => (
            <div key={x.k} className="stat-tile">
              <dt>{x.k}</dt>
              <dd>{x.v}</dd>
            </div>
          ))}
        </dl>
        <div className="profile-actions">
          <ButtonLink to="/profile/edit" variant="secondary" size="sm">
            Edit profile
          </ButtonLink>
          <button type="button" className="btn btn-ghost-danger btn-sm" onClick={() => setConfirm(true)}>
            Log out
          </button>
        </div>
      </section>

      <div className="profile-cols">
        <section id="favorites" className="panel" tabIndex={-1} aria-labelledby="fav-title">
          <div className="panel-head">
            <h2 id="fav-title" className="card-heading">
              Favorites
            </h2>
            <span className="panel-count">{favorites.length} saved</span>
          </div>
          {favorites.length ? (
            <ul className="fav-list">
              {favorites.map((c) => (
                <FavoriteRow key={c.id} course={c} cat={cats[c.category] || {}} />
              ))}
            </ul>
          ) : (
            <EmptyState
              small
              titleAs="h3"
              tone="primary"
              icon={<BookmarkIcon size={22} />}
              title="No favorites yet"
              text="Tap the bookmark on any course to keep it here for later."
              action={
                <ButtonLink to="/" size="xs" className="empty-action">
                  Browse courses
                </ButtonLink>
              }
            />
          )}
        </section>

        <section id="history" className="panel panel-history" tabIndex={-1} aria-labelledby="hist-title">
          <h2 id="hist-title" className="card-heading panel-head-solo">
            Learning history
          </h2>
          {history.length ? (
            <ul className="hist-list">
              {history.map((h) => (
                <li key={`${h.courseId}:${h.lessonId}`}>
                  <Link to={lessonHref(h.courseSlug, { index: h.lessonIndex, type: h.type })} className="hist-row">
                    <span className="hist-type">{h.type}</span>
                    <span className="hist-text">
                      <span className="hist-title">{h.lessonTitle}</span>
                      <span className="hist-course">{h.courseTitle}</span>
                    </span>
                    <time className="hist-when" dateTime={h.viewedAt}>
                      {relativeTime(h.viewedAt)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              small
              titleAs="h3"
              icon={<ClockIcon size={22} />}
              title="No learning history yet"
              text="Lessons you open will appear here, newest first."
              action={
                <ButtonLink to="/search" variant="secondary" size="xs" className="empty-action">
                  Start a course
                </ButtonLink>
              }
            />
          )}
        </section>
      </div>

      <Dialog
        open={confirm}
        onClose={() => !leaving && setConfirm(false)}
        title="Log out of SkillLearn?"
        initialFocusRef={cancelRef}
        actions={
          <>
            <Button ref={cancelRef} variant="secondary" onClick={() => setConfirm(false)} disabled={leaving}>
              Cancel
            </Button>
            <Button variant="danger" onClick={doLogout} busy={leaving} busyLabel="Logging out…">
              Log out
            </Button>
          </>
        }
      >
        <p>Your progress and favorites stay saved to your account. You'll need to log in again to keep learning.</p>
        <label className="check dialog-check">
          <span className="check-wrap">
            <input type="checkbox" checked={allDevices} onChange={(e) => setAllDevices(e.target.checked)} />
            <span className="check-box" aria-hidden="true">
              {allDevices && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5 10 17l9-10" />
                </svg>
              )}
            </span>
          </span>
          Log out of all devices
        </label>
      </Dialog>
    </div>
  );
}
