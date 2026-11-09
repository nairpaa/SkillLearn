import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Banner from '../components/Banner';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import StatusBlock from '../components/StatusBlock';
import { CheckIcon, CloseIcon } from '../components/Icons';
import { contentApi } from '../api/endpoints';
import { keys, useCourse, useLessonTracking, useQuiz } from '../hooks/queries';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts, NO_LIGATURES, radius } from '../theme';
import { NETWORK_MESSAGE, stripPrefix } from '../utils/format';
import { openLesson } from '../utils/lessons';
import { goBackOr, goHome } from '../utils/nav';

const KEYS = 'ABCDEFGHIJ';

// M09 Lesson: Quiz. Kunci jawaban tidak ada di klien, jadi pilihan tampil netral;
// semua jawaban dikirim sekali di akhir lalu hasil & pembahasan diambil dari server.
export default function QuizScreen({ navigation, route }) {
  useStatusBar('dark');
  const insets = useInsets();
  const qc = useQueryClient();
  const { slug, lessonIndex } = route.params || {};
  const courseQ = useCourse(slug);
  const course = courseQ.data;
  const lesson = course?.lessons.find((l) => l.index === lessonIndex);
  const quizQ = useQuiz(lesson?.quizId);
  const quiz = quizQ.data;
  const { recordHistory } = useLessonTracking();
  const recorded = useRef(false);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!course || !lesson || recorded.current) return;
    recorded.current = true;
    recordHistory(course, lesson);
  }, [course, lesson, recordHistory]);

  const exit = () => (navigation.canGoBack() ? navigation.goBack() : goHome(navigation));

  const ready = course && lesson && quiz;
  if (!ready) {
    const err = courseQ.error || quizQ.error;
    const notFound = courseQ.error?.isNotFound || quizQ.error?.isNotFound || (course && (!lesson || !lesson.quizId));
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBlock
          kind={notFound ? 'notfound' : err ? 'error' : 'loading'}
          notFoundTitle={course ? 'Quiz not found' : 'Course not found'}
          layout="detail"
          error={err}
          retrying={courseQ.isFetching || quizQ.isFetching}
          onRetry={() => (courseQ.error ? courseQ.refetch() : quizQ.refetch())}
          onBack={() => goHome(navigation)}
        />
      </View>
    );
  }

  const total = quiz.questions.length;
  const question = quiz.questions[Math.min(index, total - 1)];
  const selected = answers[index];
  const answered = selected !== undefined && selected !== null;
  const isLast = index === total - 1;
  const next = course.lessons[lesson.index + 1];

  const pick = (i) => {
    setSubmitError(null);
    setAnswers((a) => {
      const copy = [...a];
      copy[index] = i;
      return copy;
    });
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = Array.from({ length: total }, (_, i) => (Number.isInteger(answers[i]) ? answers[i] : -1));
      const res = await contentApi.submitQuiz(quiz.id, payload);
      setResult(res);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      // Server otomatis menandai lesson kuis selesai → segarkan progres & statistik
      qc.invalidateQueries({ queryKey: keys.course(slug) });
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: keys.me });
      qc.invalidateQueries({ queryKey: keys.history });
    } catch (e) {
      setSubmitError(e.isNetwork ? NETWORK_MESSAGE : e.message || "Couldn't submit your answers. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const onNext = () => {
    if (!answered || submitting) return;
    if (isLast) submit();
    else {
      setIndex((i) => i + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const retry = () => {
    setResult(null);
    setAnswers([]);
    setIndex(0);
    setSubmitError(null);
  };

  const progress = result ? 100 : ((index + (answered ? 1 : 0)) / total) * 100;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit quiz"
          onPress={exit}
          style={({ pressed }) => [styles.exit, pressed && { opacity: 0.7 }]}
        >
          <CloseIcon size={18} />
        </Pressable>
        <ProgressBar value={progress} style={{ flex: 1 }} />
        <Text style={styles.step}>{result ? 'Done' : `${index + 1}/${total}`}</Text>
      </View>

      {!result ? (
        <>
          <ScrollView ref={scrollRef} style={styles.root} contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>{stripPrefix(quiz.title, 'Quiz').toUpperCase()}</Text>
            <Text style={styles.question} accessibilityRole="header">
              {question.text}
            </Text>
            <View style={{ gap: 10 }} accessibilityRole="radiogroup">
              {question.options.map((opt, i) => {
                const on = selected === i;
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`Option ${KEYS[i]}: ${opt}`}
                    onPress={() => pick(i)}
                    style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && { opacity: 0.7 }]}
                  >
                    <View style={[styles.key, on && styles.keyOn]}>
                      <Text style={[styles.keyText, on && { color: colors.white }]}>{KEYS[i]}</Text>
                    </View>
                    <Text style={[styles.optionText, question.mono && styles.mono]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
            {submitError ? <Banner>{submitError}</Banner> : null}
          </ScrollView>
          <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button
              title={isLast ? 'See results' : 'Next question'}
              disabled={!answered}
              busy={submitting}
              busyLabel="Checking…"
              onPress={onNext}
            />
          </View>
        </>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.root}
          contentContainerStyle={[styles.results, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
        >
          <Text style={styles.eyebrow}>QUIZ COMPLETE</Text>
          <View style={styles.scoreRow} accessible accessibilityLabel={`${result.score} of ${result.total} correct`}>
            <Text style={styles.score}>{`${result.score}/${result.total}`}</Text>
            <Text style={styles.scoreLabel}>correct</Text>
          </View>
          <Text style={styles.verdict}>
            {result.score === result.total
              ? `Perfect score. You are ready for the ${next?.type === 'Practice' ? 'practice lesson' : 'next lesson'}.`
              : `Review the lesson, then try again or move on to ${next?.type === 'Practice' ? 'practice' : 'the next lesson'}.`}
          </Text>
          <View style={{ gap: 8 }}>
            {quiz.questions.map((qq, i) => {
              const r = result.review?.[i] || {};
              const ok = !!r.correct;
              return (
                <View key={i} style={[styles.review, { backgroundColor: ok ? colors.primaryTint : colors.dangerTint }]}>
                  <View style={[styles.dot, { backgroundColor: ok ? colors.primary : colors.danger }]}>
                    {ok ? <CheckIcon size={12} /> : <CloseIcon size={11} color={colors.white} strokeWidth={3} />}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.reviewQ}>{qq.text}</Text>
                    {!ok && Number.isInteger(r.correctIndex) ? (
                      <Text style={styles.reviewMeta}>
                        {r.chosenIndex >= 0 ? `Your answer: ${KEYS[r.chosenIndex]} · ` : ''}
                        {`Correct: ${KEYS[r.correctIndex]} · `}
                        <Text style={qq.mono ? styles.mono : null}>{qq.options[r.correctIndex]}</Text>
                      </Text>
                    ) : null}
                    {r.explanation ? <Text style={[styles.reviewWhy, { color: ok ? colors.primaryHover : colors.dangerInk }]}>{r.explanation}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ flex: 1, minHeight: 8 }} />
          <Button
            title={next ? (next.type === 'Practice' ? 'Next: Practice' : `Next: ${next.title}`) : 'Back to course'}
            onPress={() => (next ? openLesson(navigation, course, next, 'replace') : goBackOr(navigation))}
          />
          <Button title="Retry quiz" variant="secondary" height={50} onPress={retry} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.page },
  topBar: { paddingLeft: 8, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  exit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  step: { fontFamily: fonts.mono, fontSize: 12, color: colors.inkMuted, minWidth: 28, textAlign: 'right' },
  content: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20, gap: 18 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14, letterSpacing: 0.88, color: colors.inkMuted },
  question: { fontFamily: fonts.bold, fontSize: 21, lineHeight: 28.35, color: colors.ink },
  option: {
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionOn: { borderColor: colors.ink },
  key: { width: 28, height: 28, borderRadius: radius.sm, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' },
  keyOn: { backgroundColor: colors.ink },
  keyText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  optionText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
  mono: { fontFamily: fonts.mono, fontSize: 13.5, fontVariant: NO_LIGATURES },
  bottom: { paddingTop: 12, paddingHorizontal: 20, backgroundColor: colors.page },
  results: { flexGrow: 1, paddingTop: 28, paddingHorizontal: 20, gap: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  score: { fontFamily: fonts.extrabold, fontSize: 52, lineHeight: 60, letterSpacing: -1.56, color: colors.primary },
  scoreLabel: { fontFamily: fonts.semibold, fontSize: 17, color: colors.inkMuted },
  verdict: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.inkBody },
  review: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.lg },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  reviewQ: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
  reviewMeta: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18, color: colors.dangerInk },
  reviewWhy: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19.5 },
});
