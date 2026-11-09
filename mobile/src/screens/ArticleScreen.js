import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Markdown from '../components/Markdown';
import StatusBlock from '../components/StatusBlock';
import { ArrowLeftIcon, BookmarkIcon } from '../components/Icons';
import { useCourse, useFavoriteToggle, useLessonTracking } from '../hooks/queries';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { categoryColors, colors, fonts, radius } from '../theme';
import { shortTitle } from '../utils/format';
import { openLesson } from '../utils/lessons';
import { goHome } from '../utils/nav';

// M08 Lesson: Article
export default function ArticleScreen({ navigation, route }) {
  useStatusBar('dark');
  const insets = useInsets();
  const { slug, lessonIndex } = route.params || {};
  const q = useCourse(slug);
  const course = q.data;
  const lesson = course?.lessons.find((l) => l.index === lessonIndex);
  const toggleFavorite = useFavoriteToggle();
  const { recordHistory, completeLesson } = useLessonTracking();
  const recorded = useRef(false);

  // Catat riwayat sekali saat artikel dibuka
  useEffect(() => {
    if (!course || !lesson || recorded.current) return;
    recorded.current = true;
    recordHistory(course, lesson);
  }, [course, lesson, recordHistory]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <BackButton align="center" label="Back to course" onPress={() => (navigation.canGoBack() ? navigation.goBack() : goHome(navigation))} />
        <Text style={styles.headerTitle}>{course && lesson ? `Lesson ${lesson.index + 1} of ${course.lessonCount || course.lessons.length}` : ''}</Text>
        {course ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={course.isFavorite ? 'Saved. Remove course from favorites' : 'Save course'}
            accessibilityState={{ selected: !!course.isFavorite }}
            onPress={() => toggleFavorite(course)}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}
          >
            <BookmarkIcon size={20} filled={!!course.isFavorite} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>
    </View>
  );

  if (!course || !lesson) {
    return (
      <View style={styles.root}>
        {header}
        <StatusBlock
          kind={q.error?.isNotFound || (course && !lesson) ? 'notfound' : q.error ? 'error' : 'loading'}
          notFoundTitle={course ? 'Lesson not found' : 'Course not found'}
          layout="detail"
          error={q.error}
          retrying={q.isFetching}
          onRetry={() => q.refetch()}
          onBack={() => goHome(navigation)}
        />
      </View>
    );
  }

  const { ink } = categoryColors(course.category);
  const prev = course.lessons[lesson.index - 1];
  const next = course.lessons[lesson.index + 1];

  // Aturan API: artikel selesai saat tombol Next/Finish ditekan
  const markDone = () => {
    if (lesson.status !== 'done') completeLesson(course, lesson).catch(() => {});
  };
  const onNext = () => {
    markDone();
    if (next) openLesson(navigation, course, next, 'replace');
    else navigation.goBack();
  };
  const onPrev = () => (prev ? openLesson(navigation, course, prev, 'replace') : navigation.goBack());

  return (
    <View style={styles.root}>
      {header}
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: ink }]}>{`${lesson.type} · ${lesson.duration}`.toUpperCase()}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {lesson.title}
        </Text>
        <Text style={styles.byline}>{`${course.author} · ${shortTitle(course.title)}`}</Text>
        {lesson.contentMd ? <Markdown content={lesson.contentMd} /> : null}
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={prev ? `Previous lesson: ${prev.title}` : 'Back to course'}
          onPress={onPrev}
          style={({ pressed }) => [styles.prev, pressed && { opacity: 0.7 }]}
        >
          <ArrowLeftIcon size={20} />
        </Pressable>
        <Button
          title={next ? `Next: ${next.title}` : 'Finish'}
          onPress={onNext}
          style={{ flex: 1, paddingHorizontal: 14 }}
          textStyle={{ fontSize: 15 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.white, zIndex: 5 },
  headerRow: {
    height: 52,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.inkMuted },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 28, gap: 16 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 13, letterSpacing: 0.8 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.56, color: colors.ink },
  byline: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  bottom: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
  },
  prev: {
    width: 54,
    height: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
