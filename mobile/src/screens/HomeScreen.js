import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import CourseRow from '../components/CourseRow';
import ProgressBar from '../components/ProgressBar';
import StatusBlock from '../components/StatusBlock';
import Stripes from '../components/Stripes';
import { SearchIcon } from '../components/Icons';
import { useCategories, useCourses, useFavoriteToggle, useMe } from '../hooks/queries';
import { useCategoryNames } from '../hooks/useCategoryNames';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { categoryColors, colors, fonts, radius } from '../theme';
import { firstName, greeting, pluralize, shortTitle } from '../utils/format';

// M04 Home
export default function HomeScreen({ navigation }) {
  useStatusBar('dark');
  const insets = useInsets();
  const me = useMe();
  const cats = useCategories();
  const courses = useCourses({});
  const names = useCategoryNames();
  const toggleFavorite = useFavoriteToggle();
  const [refreshing, setRefreshing] = useState(false);

  const refetchAll = useCallback(() => Promise.all([me.refetch(), cats.refetch(), courses.refetch()]), [me, cats, courses]);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll().catch(() => {});
    setRefreshing(false);
  };

  const openCourse = useCallback((c) => navigation.navigate('CourseDetail', { slug: c.slug }), [navigation]);

  const ready = me.data && cats.data && courses.data;
  const error = me.error || cats.error || courses.error;
  if (!ready) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBlock
          kind={error ? 'error' : 'loading'}
          error={error}
          retrying={me.isFetching || cats.isFetching || courses.isFetching}
          onRetry={refetchAll}
          onBack={refetchAll}
        />
      </View>
    );
  }

  const user = me.data;
  const cont = user.continueLearning;
  const first = courses.data[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
    >
      <View style={styles.header}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text style={styles.hello}>{greeting()}</Text>
          <Text style={styles.name} accessibilityRole="header">
            {firstName(user.name)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          onPress={() => navigation.navigate('ProfileTab')}
          style={({ pressed }) => pressed && { opacity: 0.7 }}
        >
          <Avatar name={user.name} uri={user.avatar} size={44} fontSize={15} />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search courses"
        onPress={() => navigation.navigate('SearchTab')}
        style={({ pressed }) => [styles.search, pressed && { opacity: 0.7 }]}
      >
        <SearchIcon size={18} color={colors.inkMuted} />
        <Text style={styles.searchText}>Search courses</Text>
      </Pressable>

      {cont ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Continue learning ${shortTitle(cont.course.title)}, lesson ${cont.nextLesson.index + 1}: ${cont.nextLesson.title}, ${cont.progress}% complete`}
          onPress={() => openCourse(cont.course)}
          style={({ pressed }) => [styles.continue, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.eyebrow, { color: colors.primaryOnDark }]}>CONTINUE LEARNING</Text>
          <Text style={styles.continueTitle}>{shortTitle(cont.course.title)}</Text>
          <Text style={styles.continueSub}>{`Lesson ${cont.nextLesson.index + 1} · ${cont.nextLesson.title}`}</Text>
          <View style={styles.progressRow}>
            <ProgressBar value={cont.progress} track="rgba(255,255,255,0.2)" fill={colors.accent} style={{ flex: 1 }} />
            <Text style={styles.progressText}>{`${cont.progress}%`}</Text>
          </View>
        </Pressable>
      ) : first ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Start your first course: ${shortTitle(first.title)}`}
          onPress={() => openCourse(first)}
          style={({ pressed }) => [styles.getStarted, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.eyebrow, { color: colors.accentInk }]}>GET STARTED</Text>
          <Text style={styles.gsTitle}>Start your first course</Text>
          <Text style={styles.gsBody}>{`${shortTitle(first.title)} is a good first pick: ${first.lessonCount} short lessons for beginners.`}</Text>
          <View style={styles.gsButton}>
            <Text style={styles.gsButtonText}>Start course</Text>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Categories
        </Text>
        <View style={styles.grid}>
          {cats.data.map((k) => (
            <Pressable
              key={k.id}
              accessibilityRole="button"
              accessibilityLabel={`${k.name}, ${pluralize(k.courseCount ?? 0, 'course', 'courses')}`}
              onPress={() => navigation.navigate('Category', { id: k.id })}
              style={({ pressed }) => [styles.catTile, pressed && { opacity: 0.7 }]}
            >
              <Stripes tint={k.tint || categoryColors(k.id).tint} band={6} stripe="rgba(255,255,255,0.45)" style={styles.swatch} />
              <View style={{ gap: 2 }}>
                <Text style={styles.catName}>{k.name}</Text>
                <Text style={styles.catCount}>{pluralize(k.courseCount ?? 0, 'course', 'courses')}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Popular courses
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => navigation.navigate('SearchTab')}
            hitSlop={12}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>
        <View style={{ gap: 10 }}>
          {courses.data.map((c) => (
            <CourseRow key={c.id} course={c} categoryName={names[c.category]} onPress={() => openCourse(c)} onToggleFavorite={toggleFavorite} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: 20, paddingBottom: 28, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 19, color: colors.inkMuted },
  name: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 29, letterSpacing: -0.48, color: colors.ink },
  search: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchText: { fontFamily: fonts.regular, fontSize: 15, color: colors.inkSubtle },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 13, letterSpacing: 0.8 },
  continue: { backgroundColor: colors.primary, borderRadius: radius.xxl, padding: 18, gap: 10 },
  continueTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.white },
  continueSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.primaryOnDark },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressText: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  getStarted: {
    backgroundColor: colors.accentTint,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radius.xxl,
    padding: 18,
    gap: 8,
  },
  gsTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: colors.ink },
  gsBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19.5, color: colors.accentInkStrong },
  gsButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  gsButtonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.ink },
  seeAll: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catTile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.xl,
    padding: 14,
    gap: 10,
  },
  swatch: { width: 36, height: 36, borderRadius: radius.md },
  catName: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19, color: colors.ink },
  catCount: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
});
