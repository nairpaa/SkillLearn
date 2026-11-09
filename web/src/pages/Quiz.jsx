import { useState } from 'react';
import { Link } from 'react-router';
import { useQuiz, useSubmitQuiz } from '../api/queries';
import { StatusBlock } from '../components/StatusBlock';
import { useToast } from '../components/Toast';
import { Button, ButtonLink } from '../components/ui';
import { lessonHref, shortTitle } from '../lib/format';
import { useRecordOpen } from '../components/useRecordOpen';

const KEYS = 'ABCDEFGHIJ';

function QuizHeader({ course, lesson, title, step }) {
  return (
    <header className="lesson-header">
      <Link to={`/courses/${course.slug}`} className="lesson-header-back">
        ✕ Exit quiz
      </Link>
      <div className="lesson-header-center">
        <span className="lesson-header-title">{title}</span>
        <span className="lesson-header-sub">
          {shortTitle(course.title)} · Lesson {lesson.index + 1}
        </span>
      </div>
      <span className="lesson-header-step">{step}</span>
    </header>
  );
}

function verdictText(perfect, next) {
  if (perfect) {
    return next
      ? `Perfect score. You are ready for the ${next.type.toLowerCase()} lesson.`
      : 'Perfect score. You finished the last lesson of this course.';
  }
  return next
    ? `Review the earlier lessons, then try again or move on to ${next.type === 'Practice' ? 'practice' : 'the next lesson'}.`
    : 'Review the earlier lessons, then try again to improve your score.';
}

export default function Quiz({ course, lesson }) {
  const quizQ = useQuiz(lesson.quizId);
  const submit = useSubmitQuiz();
  const toast = useToast();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  useRecordOpen(course, lesson);

  const quiz = quizQ.data;
  const next = course.lessons[lesson.index + 1];

  if (quizQ.isPending || quizQ.isError) {
    const kind = quizQ.isPending ? 'loading' : quizQ.error?.status === 404 ? 'notfound' : 'error';
    return (
      <div className="page lesson-page">
        <title>{`${lesson.title} · SkillLearn`}</title>
        <QuizHeader course={course} lesson={lesson} title={lesson.title} step="" />
        <main>
          <StatusBlock
            kind={kind}
            layout="detail"
            nfTitle="Quiz not found"
            error={quizQ.error}
            onRetry={() => quizQ.refetch()}
            retrying={quizQ.isFetching}
          />
        </main>
      </div>
    );
  }

  const total = quiz.questions.length;
  const q = quiz.questions[Math.min(i, total - 1)];
  const selected = answers[i];
  const answered = selected !== undefined && selected !== null;
  const isLast = i === total - 1;
  const finished = Boolean(result);
  const progress = finished ? 100 : ((i + (answered ? 1 : 0)) / total) * 100;

  const choose = (idx) => {
    setAnswers((a) => {
      const n = [...a];
      n[i] = idx;
      return n;
    });
  };

  const goNext = () => {
    if (!answered) return;
    if (!isLast) {
      setI(i + 1);
      return;
    }
    // soal terakhir: kirim semua jawaban sekali, kunci jawaban baru kelihatan dari response
    const payload = quiz.questions.map((_, k) => (Number.isInteger(answers[k]) ? answers[k] : -1));
    submit.mutate(
      { quizId: quiz.id, answers: payload, slug: course.slug },
      {
        onSuccess: (res) => setResult(res),
        onError: () => toast.show("Couldn't submit your answers. Try again."),
      }
    );
  };

  const retry = () => {
    setResult(null);
    setAnswers([]);
    setI(0);
    submit.reset();
  };

  return (
    <div className="page lesson-page">
      <title>{`${quiz.title} · SkillLearn`}</title>
      <QuizHeader course={course} lesson={lesson} title={quiz.title} step={finished ? 'Done' : `${i + 1} / ${total}`} />
      <div className="quiz-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <main id="main" className="quiz-main">
        {!finished ? (
          <div className="quiz-body">
            <div className="eyebrow quiz-eyebrow" id="q-label">
              Question {i + 1} of {total}
            </div>
            <h1 className="quiz-question" id="q-text">
              {q.text}
            </h1>
            <div className="quiz-options" role="radiogroup" aria-labelledby="q-label q-text">
              {q.options.map((opt, k) => (
                <label key={`${i}-${k}`} className={`quiz-option${selected === k ? ' is-selected' : ''}`}>
                  <input
                    type="radio"
                    name={`q-${i}`}
                    className="sr-only"
                    checked={selected === k}
                    onChange={() => choose(k)}
                  />
                  <span className="quiz-key" aria-hidden="true">
                    {KEYS[k]}
                  </span>
                  <span className={`quiz-opt-text${q.mono ? ' mono' : ''}`}>{opt}</span>
                </label>
              ))}
            </div>
            <div className="quiz-actions">
              {i > 0 && (
                <Button variant="secondary" size="lg" onClick={() => setI(i - 1)} disabled={submit.isPending}>
                  Previous
                </Button>
              )}
              <Button size="lg" onClick={goNext} disabled={!answered} busy={submit.isPending} busyLabel="Checking…" className="quiz-next">
                {isLast ? 'See results' : 'Next question'}
              </Button>
            </div>
          </div>
        ) : (
          <section className="quiz-result" aria-labelledby="result-score">
            <div className="eyebrow quiz-eyebrow">Quiz complete</div>
            <div className="quiz-score" id="result-score">
              <span className="quiz-score-num">
                {result.score}/{result.total}
              </span>
              <span className="quiz-score-label">correct</span>
            </div>
            <p className="quiz-verdict">{verdictText(result.score === result.total, next)}</p>
            <ol className="quiz-review">
              {result.review.map((r, k) => {
                const question = quiz.questions[k];
                const chosen = r.chosenIndex >= 0 ? question.options[r.chosenIndex] : null;
                return (
                  <li key={k} className={`review-row ${r.correct ? 'ok' : 'bad'}`}>
                    <span className="review-dot" aria-hidden="true">
                      {r.correct ? '✓' : '✕'}
                    </span>
                    <span className="review-text">
                      <span className="review-q">
                        <span className="sr-only">{r.correct ? 'Correct: ' : 'Incorrect: '}</span>
                        {question.text}
                      </span>
                      {!r.correct && (
                        <span className="review-ans">
                          Your answer: <span className={question.mono ? 'mono' : ''}>{chosen ?? 'No answer'}</span> · Correct:{' '}
                          <span className={question.mono ? 'mono' : ''}>{question.options[r.correctIndex]}</span>
                        </span>
                      )}
                      {r.explanation && (
                        <span className="review-why">
                          {r.correct ? 'Correct. ' : 'Not quite. '}
                          {r.explanation}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="quiz-result-actions">
              <Button variant="secondary" size="md" onClick={retry}>
                Retry quiz
              </Button>
              {next ? (
                <ButtonLink to={lessonHref(course.slug, next)} size="md">
                  Next: {shortTitle(next.title)} →
                </ButtonLink>
              ) : (
                <ButtonLink to={`/courses/${course.slug}`} size="md">
                  Back to course
                </ButtonLink>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
