import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useCompleteLesson } from '../api/queries';
import { CodeEditor } from '../components/CodeEditor';
import { CheckIcon, XIcon } from '../components/Icons';
import { Markdown } from '../components/Markdown';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui';
import { useCategoryMap } from '../components/useCategoryMap';
import { shortTitle } from '../lib/format';
import { runChecks } from '../lib/practice';
import { useRecordOpen } from '../components/useRecordOpen';

// Isi editor & centang task disimpan per lesson di sessionStorage (bukan token, aman),
// biar nggak hilang kalau halaman ke-refresh.
const storeKey = (lessonId) => `sl-practice:${lessonId}`;
function loadDraft(lessonId) {
  try {
    return JSON.parse(sessionStorage.getItem(storeKey(lessonId))) || null;
  } catch {
    return null;
  }
}

export default function Practice({ course, lesson }) {
  const cats = useCategoryMap();
  const cat = cats[course.category] || {};
  const p = lesson.practice || { fileName: 'main.txt', starterCode: '', tasks: [], checks: [] };
  const tasks = p.tasks || [];
  const checks = p.checks || [];
  const complete = useCompleteLesson();
  const toast = useToast();
  useRecordOpen(course, lesson);

  const [draft] = useState(() => loadDraft(lesson.id));
  const [code, setCode] = useState(draft?.code ?? p.starterCode ?? '');
  const [done, setDone] = useState(() =>
    tasks.map((_, i) => (Array.isArray(draft?.done) ? Boolean(draft.done[i]) : lesson.status === 'done'))
  );
  const [results, setResults] = useState(null);
  const [hint, setHint] = useState(false);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(storeKey(lesson.id), JSON.stringify({ code, done }));
    } catch {
      /* storage penuh / diblokir: abaikan */
    }
  }, [code, done, lesson.id]);

  const doneCount = done.filter(Boolean).length;
  const passed = results ? results.filter((r) => r.pass).length : 0;
  const minutes = lesson.minutes ? `~${lesson.minutes} min` : lesson.duration;

  const submit = () => {
    if (complete.isPending) return;
    if (doneCount < tasks.length) {
      setBanner({ kind: 'info', text: `Finish all ${tasks.length} tasks before submitting.` });
      return;
    }
    complete.mutate(
      { courseId: course.id, lessonId: lesson.id, slug: course.slug },
      {
        onSuccess: () =>
          setBanner({ kind: 'success', text: `Practice submitted. ${shortTitle(course.title)} lesson ${lesson.index + 1} is complete.` }),
        onError: () => toast.show("Couldn't submit your practice. Try again."),
      }
    );
  };

  return (
    <div className="page lesson-page practice-page">
      <title>{`${lesson.title} · SkillLearn`}</title>
      <header className="lesson-header">
        <Link to={`/courses/${course.slug}`} className="lesson-header-back wide">
          ← Back to course
        </Link>
        <div className="lesson-header-center">
          <h1 className="lesson-header-title">{lesson.title}</h1>
          <span className="lesson-header-sub">
            {shortTitle(course.title)} · Lesson {lesson.index + 1}
          </span>
        </div>
        <div className="lesson-header-end wide">
          <Button size="xs" onClick={submit} busy={complete.isPending} busyLabel="Submitting…">
            Submit practice
          </Button>
        </div>
      </header>
      {banner && (
        <div className={`practice-banner ${banner.kind}`} role={banner.kind === 'success' ? 'status' : 'alert'}>
          <span>{banner.text}</span>
          {banner.kind === 'success' && <Link to="/profile#history">View history</Link>}
        </div>
      )}
      <main id="main" className="practice-grid">
        <section className="practice-side" aria-label="Instructions">
          <span className="eyebrow" style={{ color: cat.ink }}>
            Practice · {minutes}
          </span>
          <Markdown className="md md-compact practice-md">{lesson.contentMd}</Markdown>
          <div className="tasks-head">
            <h2 className="tasks-title">Tasks</h2>
            <span className="tasks-count">
              {doneCount} of {tasks.length} done
            </span>
          </div>
          <ul className="tasks">
            {tasks.map((t, i) => (
              <li key={i}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done[i]}
                  className={`task${done[i] ? ' is-done' : ''}`}
                  onClick={() => {
                    setDone((d) => d.map((x, j) => (j === i ? !x : x)));
                    setBanner(null);
                  }}
                >
                  <span className="task-box" aria-hidden="true">
                    {done[i] && <CheckIcon size={13} strokeWidth={3.2} />}
                  </span>
                  <span className="task-text">{t}</span>
                </button>
              </li>
            ))}
          </ul>
          {hint && p.hint && (
            <div className="hint-box" id="practice-hint">
              <Markdown inline>{p.hint}</Markdown>
            </div>
          )}
          <div className="practice-spacer" />
          {p.hint && (
            <Button variant="secondary" size="sm" block onClick={() => setHint((h) => !h)} aria-expanded={hint} aria-controls="practice-hint">
              {hint ? 'Hide hint' : 'Show hint'}
            </Button>
          )}
        </section>
        <section className="practice-work" aria-label="Code">
          <div className="editor-panel">
            <div className="editor-tabs">
              <span className="editor-file">{p.fileName}</span>
              <button type="button" className="run-btn" onClick={() => setResults(runChecks(code, checks))}>
                ▶ Run code
              </button>
            </div>
            <CodeEditor value={code} onChange={setCode} fileName={p.fileName} />
          </div>
          <div className="preview" aria-live="polite">
            <div className="preview-head">
              <span className="eyebrow muted">Preview</span>
              {results && (
                <span className={`preview-count${passed === results.length ? '' : ' partial'}`}>
                  {passed} of {results.length} checks passed
                </span>
              )}
            </div>
            {!results ? (
              <p className="preview-empty">Click Run code to check your code here.</p>
            ) : (
              <ul className="checks">
                {results.map((r, i) => (
                  <li key={i} className={r.pass ? 'pass' : 'fail'}>
                    <span className="check-dot" aria-hidden="true">
                      {r.pass ? <CheckIcon size={12} strokeWidth={3.2} /> : <XIcon size={12} strokeWidth={3.2} />}
                    </span>
                    <span>
                      <span className="sr-only">{r.pass ? 'Passed: ' : 'Failed: '}</span>
                      {r.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
