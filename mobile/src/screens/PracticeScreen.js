import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import BackButton from '../components/BackButton';
import Banner from '../components/Banner';
import Button from '../components/Button';
import Markdown from '../components/Markdown';
import Segmented from '../components/Segmented';
import StatusBlock from '../components/StatusBlock';
import { CheckIcon, CloseIcon } from '../components/Icons';
import { useCourse, useLessonTracking } from '../hooks/queries';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts, NO_LIGATURES, radius } from '../theme';
import { shortTitle, stripPrefix } from '../utils/format';
import { goHome } from '../utils/nav';

const CODE_FONT = 12;
const CODE_LINE = 21; // 1.75
const CHAR_W = CODE_FONT * 0.6; // JetBrains Mono: lebar karakter ≈ 0.6em

const TABS = [
  { value: 'tasks', label: 'Tasks' },
  { value: 'code', label: 'Code' },
  { value: 'preview', label: 'Preview' },
];

// Jalankan regex checks dari server terhadap isi editor
function runChecks(checks, code) {
  return (checks || []).map((c) => {
    let pass = false;
    try {
      pass = new RegExp(c.pattern, c.flags || '').test(code);
    } catch {
      pass = false;
    }
    return { label: c.label, pass };
  });
}

// M10 Lesson: Practice — segmented Tasks / Code / Preview
export default function PracticeScreen({ navigation, route }) {
  useStatusBar('dark');
  const insets = useInsets();
  const { width } = useWindowDimensions();
  const { slug, lessonIndex } = route.params || {};
  const q = useCourse(slug);
  const course = q.data;
  const lesson = course?.lessons.find((l) => l.index === lessonIndex);
  const practice = lesson?.practice;
  const { recordHistory, completeLesson } = useLessonTracking();

  const [tab, setTab] = useState('tasks');
  const [done, setDone] = useState([]);
  const [code, setCode] = useState(null);
  const [results, setResults] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [banner, setBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const recorded = useRef(false);

  useEffect(() => {
    if (!course || !lesson || recorded.current) return;
    recorded.current = true;
    recordHistory(course, lesson);
    // lesson yang sudah selesai: anggap semua task sudah dicentang
    setDone((practice?.tasks || []).map(() => lesson.status === 'done'));
    setCode(practice?.starterCode ?? '');
  }, [course, lesson, practice, recordHistory]);

  const source = code ?? practice?.starterCode ?? '';
  const lineCount = useMemo(() => source.split('\n').length, [source]);
  const editorWidth = useMemo(() => {
    const longest = source.split('\n').reduce((m, l) => Math.max(m, l.length), 0);
    return Math.max(width - 30 - 14 - 14, longest * CHAR_W + 24);
  }, [source, width]);

  const back = () => (navigation.canGoBack() ? navigation.goBack() : goHome(navigation));

  if (!course || !lesson || !practice) {
    const notFound = q.error?.isNotFound || (course && (!lesson || !practice));
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBlock
          kind={notFound ? 'notfound' : q.error ? 'error' : 'loading'}
          notFoundTitle={course ? 'Practice not found' : 'Course not found'}
          layout="detail"
          error={q.error}
          retrying={q.isFetching}
          onRetry={() => q.refetch()}
          onBack={() => goHome(navigation)}
        />
      </View>
    );
  }

  const tasks = practice.tasks || [];
  const doneCount = done.filter(Boolean).length;
  const passed = results ? results.filter((r) => r.pass).length : 0;

  const run = () => {
    setResults(runChecks(practice.checks, source));
    setTab('preview');
  };

  const submit = async () => {
    if (submitting) return;
    if (doneCount < tasks.length) {
      setBanner({ kind: 'info', text: `Finish all ${tasks.length} tasks before submitting.` });
      return;
    }
    setSubmitting(true);
    try {
      await completeLesson(course, lesson, { silent: true });
      setBanner({ kind: 'success', text: `Practice submitted. ${shortTitle(course.title)} lesson ${lesson.index + 1} is complete.` });
    } catch (e) {
      setBanner({ kind: 'error', text: e.isNetwork ? "Couldn't submit. Check your internet connection and try again." : e.message || "Couldn't submit. Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.titleRow}>
          <BackButton align="center" label="Back to course" onPress={back} />
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {stripPrefix(lesson.title, 'Practice')}
            </Text>
            <Text style={styles.subtitle}>{`Practice · Lesson ${lesson.index + 1}`}</Text>
          </View>
        </View>
        <Segmented options={TABS} value={tab} onChange={setTab} style={styles.segmented} />
      </View>
      {banner ? <Banner kind={banner.kind} style={styles.banner}>{banner.text}</Banner> : null}

      {tab === 'code' ? (
        <View style={styles.editor}>
          <View style={styles.editorHead}>
            <Text style={styles.fileName}>{practice.fileName || 'App.jsx'}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Run code"
              onPress={run}
              hitSlop={6}
              style={({ pressed }) => [styles.runBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.runText}>▶ Run</Text>
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.editorBody}>
            <View style={styles.editorRow}>
              <Text style={styles.lineNos} accessibilityElementsHidden importantForAccessibility="no">
                {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <TextInput
                  value={source}
                  onChangeText={(v) => {
                    setCode(v);
                    setBanner(null);
                  }}
                  multiline
                  scrollEnabled={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  spellCheck={false}
                  textAlignVertical="top"
                  accessibilityLabel={`Code editor, ${practice.fileName || 'App.jsx'}`}
                  style={[styles.codeInput, { width: editorWidth, minHeight: lineCount * CODE_LINE }, Platform.OS === 'web' && styles.webNoOutline]}
                  selectionColor={colors.accent}
                />
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          {tab === 'tasks' ? (
            <>
              {lesson.contentMd ? <Markdown content={lesson.contentMd} size="md" gap={12} /> : null}
              <View style={styles.tasksHead}>
                <Text style={styles.tasksTitle}>Tasks</Text>
                <Text style={styles.tasksCount}>{`${doneCount} of ${tasks.length} done`}</Text>
              </View>
              {tasks.map((t, i) => {
                const on = !!done[i];
                return (
                  <Pressable
                    key={i}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={t}
                    onPress={() => {
                      setDone((d) => tasks.map((_, j) => (j === i ? !d[j] : !!d[j])));
                      setBanner(null);
                    }}
                    style={({ pressed }) => [styles.task, { backgroundColor: on ? colors.primaryTint : colors.page }, pressed && { opacity: 0.7 }]}
                  >
                    <View style={[styles.box, on ? styles.boxOn : null]}>{on ? <CheckIcon size={13} /> : null}</View>
                    <Text style={styles.taskText}>{t}</Text>
                  </Pressable>
                );
              })}
              {practice.hint ? (
                showHint ? (
                  <View style={styles.hint}>
                    <Text style={styles.hintText}>
                      <Text style={{ fontFamily: fonts.bold }}>Hint: </Text>
                      {practice.hint}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowHint(true)}
                    style={({ pressed }) => [styles.hintBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Text style={styles.hintBtnText}>Show hint</Text>
                  </Pressable>
                )
              ) : null}
            </>
          ) : (
            <>
              <View style={styles.previewHead}>
                <Text style={styles.eyebrow}>PREVIEW</Text>
                {results ? <Text style={styles.checksLabel}>{`${passed} of ${results.length} checks passed`}</Text> : null}
              </View>
              {!results ? (
                <Text style={styles.muted}>Run your code from the Code tab to see the app here.</Text>
              ) : (
                <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
                  {results.map((r, i) => (
                    <View key={i} style={[styles.check, { backgroundColor: r.pass ? colors.primaryTint : colors.dangerTint }]}>
                      <View style={[styles.checkDot, { backgroundColor: r.pass ? colors.primary : colors.danger }]}>
                        {r.pass ? <CheckIcon size={12} /> : <CloseIcon size={10} color={colors.white} strokeWidth={3} />}
                      </View>
                      <Text style={[styles.checkText, { color: r.pass ? colors.primaryHover : colors.dangerInk }]}>
                        {r.label}
                      </Text>
                    </View>
                  ))}
                  <Pressable accessibilityRole="button" onPress={() => setTab('code')} style={({ pressed }) => [styles.hintBtn, pressed && { opacity: 0.6 }]}>
                    <Text style={styles.hintBtnText}>Edit code</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title="Submit practice" busy={submitting} busyLabel="Submitting…" onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.white, paddingBottom: 12 },
  titleRow: { paddingLeft: 8, paddingRight: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
  segmented: { marginTop: 12, marginHorizontal: 20 },
  banner: { marginHorizontal: 20, marginBottom: 8 },
  content: { paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  tasksHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  tasksTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  tasksCount: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkMuted },
  task: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: radius.lg, minHeight: 52 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.lineControl,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  taskText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20.3, color: colors.ink },
  hint: { padding: 14, borderRadius: radius.lg, backgroundColor: colors.accentTint, borderWidth: 1, borderColor: colors.accentBorder },
  hintText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.accentInkStrong },
  hintBtn: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  hintBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  editor: { flex: 1, backgroundColor: colors.code.bg },
  editorHead: {
    height: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  fileName: { fontFamily: fonts.mono, fontSize: 12, color: colors.white },
  runBtn: { height: 34, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.accent, justifyContent: 'center' },
  runText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  editorBody: { paddingVertical: 12, paddingHorizontal: 14 },
  editorRow: { flexDirection: 'row', gap: 10 },
  lineNos: {
    width: 20,
    textAlign: 'right',
    fontFamily: fonts.mono,
    fontSize: CODE_FONT,
    lineHeight: CODE_LINE,
    color: colors.code.lineNo,
    includeFontPadding: false,
  },
  codeInput: {
    padding: 0,
    margin: 0,
    fontFamily: fonts.mono,
    fontSize: CODE_FONT,
    lineHeight: CODE_LINE,
    color: colors.code.text,
    includeFontPadding: false,
    fontVariant: NO_LIGATURES,
  },
  webNoOutline: { outlineStyle: 'none' },
  previewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.88, color: colors.inkMuted },
  checksLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary },
  muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.inkMuted },
  check: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.lg },
  checkDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkText: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  bottom: { paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
});
