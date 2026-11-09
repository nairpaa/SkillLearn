import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from '../components/Avatar';
import BottomSheet from '../components/BottomSheet';
import Button from '../components/Button';
import CourseRow from '../components/CourseRow';
import EmptyState from '../components/EmptyState';
import Segmented from '../components/Segmented';
import StatusBlock from '../components/StatusBlock';
import { Bone, Pulse, RowSkeleton } from '../components/Skeleton';
import { BookmarkIcon, ClockIcon } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useFavoriteToggle, useFavorites, useHistory, useMe } from '../hooks/queries';
import { useCategoryNames } from '../hooks/useCategoryNames';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts, radius } from '../theme';
import { relativeTime } from '../utils/format';
import { openLesson } from '../utils/lessons';
import { goHomeTab } from '../utils/nav';

const SEGMENTS = [
  { value: 'fav', label: 'Favorites' },
  { value: 'hist', label: 'History' },
];

function InlineError({ error, onRetry }) {
  return (
    <View style={styles.inlineError} accessibilityRole="alert">
      <Text style={styles.inlineErrorText}>Couldn't load content. Check your internet connection and try again.</Text>
      <Button title="Try again" height={40} onPress={onRetry} style={{ alignSelf: 'flex-start', borderRadius: radius.md }} textStyle={{ fontSize: 14 }} />
      {error?.caption ? <Text style={styles.caption}>{error.caption}</Text> : null}
    </View>
  );
}

// M11 Profile
export default function ProfileScreen({ navigation }) {
  useStatusBar('dark');
  const insets = useInsets();
  const { logout } = useAuth();
  const me = useMe();
  const favorites = useFavorites();
  const [segment, setSegment] = useState('fav');
  const history = useHistory();
  const names = useCategoryNames();
  const toggleFavorite = useFavoriteToggle();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const openCourse = useCallback((c) => navigation.navigate('CourseDetail', { slug: c.slug }), [navigation]);
  const goBrowse = () => goHomeTab(navigation);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([me.refetch(), favorites.refetch(), history.refetch()]).catch(() => {});
    setRefreshing(false);
  };

  const doLogout = async () => {
    setLoggingOut(true);
    await logout();
    // navigator otomatis pindah ke Splash karena status jadi 'guest'
  };

  if (!me.data) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBlock kind={me.error ? 'error' : 'loading'} error={me.error} retrying={me.isFetching} onRetry={() => me.refetch()} onBack={goBrowse} />
      </View>
    );
  }

  const user = me.data;
  const stats = user.stats || {};
  const quizAvg = stats.quizAverage == null ? '–' : `${Math.round(stats.quizAverage)}%`;

  const renderFavorites = () => {
    if (favorites.isPending) return <ListLoading />;
    if (favorites.error && !favorites.data) return <InlineError error={favorites.error} onRetry={() => favorites.refetch()} />;
    if (!favorites.data.length)
      return (
        <EmptyState
          icon={<BookmarkIcon size={22} color={colors.primary} />}
          iconBg={colors.primaryTint}
          title="No favorites yet"
          body="Tap the bookmark on any course to keep it here for later."
        >
          <Button title="Browse courses" height={44} onPress={goBrowse} style={styles.emptyBtn} textStyle={{ fontSize: 14 }} />
        </EmptyState>
      );
    return (
      <View style={{ gap: 10 }}>
        {favorites.data.map((c) => (
          <CourseRow key={c.id} variant="favorite" course={c} categoryName={names[c.category]} onPress={() => openCourse(c)} onToggleFavorite={toggleFavorite} />
        ))}
      </View>
    );
  };

  const renderHistory = () => {
    if (history.isPending) return <ListLoading />;
    if (history.error && !history.data) return <InlineError error={history.error} onRetry={() => history.refetch()} />;
    if (!history.data.length)
      return (
        <EmptyState icon={<ClockIcon size={22} />} title="No learning history yet" body="Lessons you open will appear here, newest first.">
          <Button title="Start a course" variant="secondary" height={44} onPress={goBrowse} style={styles.emptyBtn} textStyle={{ fontSize: 14, fontFamily: fonts.bold }} />
        </EmptyState>
      );
    return (
      <View style={styles.historyCard}>
        {history.data.map((h, i) => (
          <Pressable
            key={`${h.courseId}-${h.lessonId}`}
            accessibilityRole="button"
            accessibilityLabel={`${h.lessonTitle}, ${h.type}, ${h.courseTitle}, ${relativeTime(h.viewedAt)}`}
            onPress={() => openLesson(navigation, { slug: h.courseSlug }, { index: h.lessonIndex, type: h.type })}
            style={({ pressed }) => [styles.historyRow, i === history.data.length - 1 && { borderBottomWidth: 0 }, pressed && { opacity: 0.7 }]}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Text style={styles.historyTitle} numberOfLines={1}>
                {h.lessonTitle}
              </Text>
              <Text style={styles.historyMeta} numberOfLines={1}>{`${h.type} · ${h.courseTitle}`}</Text>
            </View>
            <Text style={styles.historyWhen}>{relativeTime(h.viewedAt)}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.headRow}>
          <Text style={styles.pageTitle} accessibilityRole="header">
            Profile
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={() => navigation.navigate('EditProfile')}
            hitSlop={8}
            style={({ pressed }) => [styles.edit, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.userRow}>
          <Avatar name={user.name} uri={user.avatar} size={64} fontSize={22} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          {[
            [String(stats.inProgress ?? 0), 'In progress'],
            [String(stats.completed ?? 0), 'Completed'],
            [quizAvg, 'Quiz average'],
          ].map(([v, k]) => (
            <View key={k} style={styles.stat} accessible accessibilityLabel={`${k}: ${v === '–' ? 'none yet' : v}`}>
              <Text style={styles.statValue}>{v}</Text>
              <Text style={styles.statKey}>{k}</Text>
            </View>
          ))}
        </View>

        <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />

        {segment === 'fav' ? renderFavorites() : renderHistory()}

        <Pressable
          accessibilityRole="button"
          onPress={() => setConfirmOpen(true)}
          style={({ pressed }) => [styles.logout, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>

      <BottomSheet visible={confirmOpen} onClose={() => !loggingOut && setConfirmOpen(false)} accessibilityLabel="Log out of SkillLearn?">
        <Text style={styles.sheetTitle} accessibilityRole="header">
          Log out of SkillLearn?
        </Text>
        <Text style={styles.sheetBody}>Your progress and favorites stay saved. You'll need to log in again to keep learning.</Text>
        <Button title="Log out" variant="destructive" height={52} busy={loggingOut} busyLabel="Logging out…" onPress={doLogout} style={{ marginTop: 10 }} />
        <Button title="Cancel" variant="secondary" height={52} disabled={loggingOut} onPress={() => setConfirmOpen(false)} textStyle={{ fontSize: 16 }} />
      </BottomSheet>
    </>
  );
}

function ListLoading() {
  return (
    <Pulse style={{ gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <RowSkeleton key={i} />
      ))}
      <Bone w="40%" h={12} soft />
    </Pulse>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: 20, paddingBottom: 28, gap: 18 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 29, letterSpacing: -0.48, color: colors.ink },
  edit: { minHeight: 44, justifyContent: 'center', paddingLeft: 8 },
  editText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.ink },
  email: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, padding: 12, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, gap: 2 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.ink },
  statKey: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14.3, color: colors.inkMuted },
  emptyBtn: { marginTop: 4, borderRadius: radius.lg, paddingHorizontal: 18 },
  historyCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, paddingVertical: 4, paddingHorizontal: 14 },
  historyRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    alignItems: 'center',
    minHeight: 56,
  },
  historyTitle: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19, color: colors.ink },
  historyMeta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
  historyWhen: { fontFamily: fonts.regular, fontSize: 11, color: colors.inkMuted },
  logout: {
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  logoutText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.dangerInk },
  inlineError: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, padding: 16, gap: 10 },
  inlineErrorText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  caption: { fontFamily: fonts.mono, fontSize: 11, color: colors.inkSubtle },
  sheetTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.ink },
  sheetBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21.7, color: colors.inkMuted },
});
