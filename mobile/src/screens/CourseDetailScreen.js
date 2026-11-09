import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import LessonRow from '../components/LessonRow';
import Markdown from '../components/Markdown';
import ProgressBar from '../components/ProgressBar';
import StatusBlock from '../components/StatusBlock';
import Stripes from '../components/Stripes';
import VideoPlayer from '../components/VideoPlayer';
import { BookmarkIcon, PlayIcon } from '../components/Icons';
import { useCourse, useFavoriteToggle, useLessonTracking } from '../hooks/queries';
import { useCategoryNames } from '../hooks/useCategoryNames';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { categoryColors, colors, fonts, radius } from '../theme';
import { openLesson } from '../utils/lessons';
import { goHome } from '../utils/nav';
import { ratingText } from '../utils/format';

const isVideo = (l) => l?.type === 'Video' && !!l.videoId;

// M07 Course Detail: video 16:10 di bawah status bar gelap, tab Lessons/About, CTA lengket di bawah
export default function CourseDetailScreen({ navigation, route }) {
  const { slug, playIndex, playNonce } = route.params || {};
  const insets = useInsets();
  const q = useCourse(slug);
  const course = q.data;
  useStatusBar(course ? 'light' : 'dark');
  const names = useCategoryNames();
  const toggleFavorite = useFavoriteToggle();
  const { recordHistory, completeLesson } = useLessonTracking();
  const [tab, setTab] = useState('lessons');
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef(null);
  const handledNonce = useRef(null);

  // Video default: lesson "current" kalau video, kalau bukan ambil video terakhir sebelum itu / video pertama
  const defaultVideo = useMemo(() => {
    if (!course) return null;
    const cur = course.lessons[course.currentLessonIndex];
    if (isVideo(cur)) return cur.index;
    const vids = course.lessons.filter(isVideo);
    const before = vids.filter((l) => l.index <= course.currentLessonIndex).pop();
    return (before || vids[0])?.index ?? null;
  }, [course]);
  const videoLesson = course?.lessons.find((l) => l.index === (selected ?? defaultVideo)) || null;

  const play = useCallback(
    (lesson) => {
      if (!course || !isVideo(lesson)) return;
      setSelected(lesson.index);
      setPlaying(true);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      // Aturan API: lesson video dianggap selesai saat tombol play ditekan
      recordHistory(course, lesson);
      if (lesson.status !== 'done') completeLesson(course, lesson, { silent: true }).catch(() => {});
    },
    [course, recordHistory, completeLesson]
  );

  // Video dihentikan saat layar kehilangan fokus (mis. buka artikel), biar suaranya nggak jalan di belakang
  useFocusEffect(useCallback(() => () => setPlaying(false), []));

  // Dibuka dari lesson lain dengan permintaan "putar video lesson X"
  useEffect(() => {
    if (!course || playIndex == null || handledNonce.current === playNonce) return;
    handledNonce.current = playNonce;
    const l = course.lessons.find((x) => x.index === playIndex);
    if (l) play(l);
  }, [course, playIndex, playNonce, play]);

  const openRow = useCallback(
    (lesson) => (isVideo(lesson) ? play(lesson) : openLesson(navigation, course, lesson, 'push')),
    [course, navigation, play]
  );

  if (!course) {
    return (
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: colors.page }]}>
        <StatusBlock
          kind={q.error?.isNotFound || !slug ? 'notfound' : q.error ? 'error' : 'loading'}
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
  const current = course.lessons[course.currentLessonIndex] || course.lessons[0];
  const ctaLabel = course.progress > 0 ? `Continue lesson ${current.index + 1}` : 'Start course';
  const showPlayer = playing && videoLesson;

  return (
    <View style={styles.root}>
      <ScrollView ref={scrollRef} style={styles.root}>
        <View style={{ backgroundColor: colors.ink, paddingTop: insets.top }}>
          <View style={styles.video}>
            {showPlayer ? (
              <VideoPlayer key={videoLesson.id} videoId={videoLesson.videoId} start={videoLesson.videoStart} />
            ) : (
              <Stripes tint={colors.ink} stripe="rgba(255,255,255,0.04)" band={12} style={styles.placeholder}>
                {videoLesson ? (
                  <Image
                    source={{ uri: `https://i.ytimg.com/vi/${videoLesson.videoId}/hqdefault.jpg` }}
                    style={styles.videoThumb}
                    resizeMode="cover"
                  />
                ) : null}
                {videoLesson ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Play lesson ${videoLesson.index + 1}: ${videoLesson.title}`}
                    onPress={() => play(videoLesson)}
                    style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.7 }]}
                  >
                    <PlayIcon size={22} />
                  </Pressable>
                ) : null}
                <View style={styles.videoProgress}>
                  <ProgressBar value={course.progress} height={4} track="rgba(255,255,255,0.25)" fill={colors.accent} />
                </View>
              </Stripes>
            )}
            <BackButton
              color={colors.white}
              align="center"
              label="Back"
              onPress={() => (navigation.canGoBack() ? navigation.goBack() : goHome(navigation))}
              style={styles.back}
            />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[styles.eyebrow, { color: ink }]}>{`${names[course.category] || course.category} · ${course.level}`.toUpperCase()}</Text>
              <Text style={styles.title} accessibilityRole="header">
                {course.title}
              </Text>
              <Text style={styles.meta}>{`${course.lessonCount} lessons · ${course.duration} · ★ ${ratingText(course.rating)}`}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={course.isFavorite ? 'Saved. Remove from favorites' : 'Save to favorites'}
              accessibilityState={{ selected: !!course.isFavorite }}
              onPress={() => toggleFavorite(course)}
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}
            >
              <BookmarkIcon filled={!!course.isFavorite} />
            </Pressable>
          </View>

          {showPlayer ? (
            <View style={styles.notes}>
              <Text style={[styles.eyebrow, { color: colors.inkMuted }]}>{`NOW PLAYING · LESSON ${videoLesson.index + 1} — ${videoLesson.title}`.toUpperCase()}</Text>
              {videoLesson.contentMd ? <Markdown content={videoLesson.contentMd} size="md" gap={10} /> : null}
            </View>
          ) : null}

          <View style={styles.tabs} accessibilityRole="tablist">
            {[
              ['lessons', 'Lessons'],
              ['about', 'About'],
            ].map(([id, label]) => {
              const on = tab === id;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setTab(id)}
                  style={({ pressed }) => [styles.tab, { borderBottomColor: on ? colors.primary : 'transparent' }, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.tabText, { color: on ? colors.ink : colors.inkMuted }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {tab === 'lessons' ? (
            <View>
              <View style={styles.progressRow}>
                <ProgressBar value={course.progress} style={{ flex: 1 }} />
                <Text style={styles.progressText}>{`${course.progress}%`}</Text>
              </View>
              {course.lessons.map((l) => (
                <LessonRow key={l.id} lesson={l} onPress={() => openRow(l)} />
              ))}
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <Text style={styles.desc}>{course.description}</Text>
              <View style={styles.facts}>
                {[
                  ['Lessons', String(course.lessonCount)],
                  ['Duration', course.duration],
                  ['Level', course.level],
                  ['Rating', `★ ${ratingText(course.rating)}`],
                ].map(([k, v]) => (
                  <View key={k} style={styles.fact}>
                    <Text style={styles.factKey}>{k}</Text>
                    <Text style={styles.factVal}>{v}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.instructor}>
                Instructor: <Text style={styles.instructorName}>{course.author}</Text>
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Latar gelap tetap di belakang status bar, supaya ikon putih tetap terbaca saat konten di-scroll */}
      <View pointerEvents="none" style={[styles.statusBackdrop, { height: insets.top }]} />
      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title={ctaLabel} onPress={() => openRow(current)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  statusBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.ink },
  video: { aspectRatio: 16 / 10, backgroundColor: colors.ink },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // hqdefault 4:3 punya pita hitam; diperbesar sedikit supaya pitanya terpotong
  videoThumb: { position: 'absolute', left: 0, right: 0, top: '-17%', bottom: '-17%', opacity: 0.35 },
  playBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingLeft: 3 },
  videoProgress: { position: 'absolute', left: 16, right: 16, bottom: 12 },
  back: { position: 'absolute', left: 8, top: 4 },
  body: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 13, letterSpacing: 0.8 },
  title: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 27.5, letterSpacing: -0.44, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  saveBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notes: { backgroundColor: colors.page, borderRadius: radius.lg, padding: 14, gap: 10 },
  tabs: { flexDirection: 'row', gap: 22, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { minHeight: 40, justifyContent: 'flex-end', paddingBottom: 10, borderBottomWidth: 2, marginBottom: -1 },
  tabText: { fontFamily: fonts.semibold, fontSize: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  progressText: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  desc: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24.75, color: colors.inkBody },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fact: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.page, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  factKey: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMuted },
  factVal: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  instructor: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted },
  instructorName: { fontFamily: fonts.bold, color: colors.ink },
  cta: { paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
});
