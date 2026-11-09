import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { keepPreviousData } from '@tanstack/react-query';
import Chip from '../components/Chip';
import CourseRow from '../components/CourseRow';
import EmptyState from '../components/EmptyState';
import StatusBlock from '../components/StatusBlock';
import { CloseIcon, SearchIcon, SearchMinusIcon } from '../components/Icons';
import { RowSkeleton, Pulse } from '../components/Skeleton';
import { useCategories, useCourses, useFavoriteToggle } from '../hooks/queries';
import { useCategoryNames } from '../hooks/useCategoryNames';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts, radius } from '../theme';
import { pluralize } from '../utils/format';
import { goHomeTab } from '../utils/nav';

const TYPES = ['All', 'Video', 'Article', 'Quiz', 'Practice'];

// M05 Search: filter langsung (debounce 250 ms) + chip tipe
export default function SearchScreen({ navigation }) {
  useStatusBar('dark');
  const insets = useInsets();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [type, setType] = useState('All');
  const loadedOnce = useRef(false);
  const names = useCategoryNames();
  const cats = useCategories();
  const toggleFavorite = useFavoriteToggle();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const courses = useCourses(
    { q: debounced || undefined, type: type === 'All' ? undefined : type },
    { placeholderData: keepPreviousData }
  );
  if (courses.data) loadedOnce.current = true;

  const openCourse = useCallback((c) => navigation.navigate('CourseDetail', { slug: c.slug }), [navigation]);
  const openCategory = (id) => navigation.navigate('HomeTab', { screen: 'Category', params: { id }, initial: false });

  if (!loadedOnce.current) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBlock kind={courses.error ? 'error' : 'loading'} error={courses.error} retrying={courses.isFetching} onRetry={() => courses.refetch()} onBack={() => goHomeTab(navigation)} />
      </View>
    );
  }

  const list = courses.data || [];
  const showSkeleton = courses.isPending;
  const showError = !courses.data && courses.error;

  return (
    <ScrollView
      style={styles.root}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
    >
      <Text style={styles.title} accessibilityRole="header">
        Search
      </Text>
      <View style={styles.field}>
        <SearchIcon size={18} color={colors.primary} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="React, SEO, Figma…"
          placeholderTextColor={colors.inkSubtle}
          accessibilityLabel="Search courses"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          maxLength={60}
          style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' }]}
        />
        {q ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setQ('')}
            hitSlop={4}
            style={({ pressed }) => [styles.clear, pressed && { opacity: 0.7 }]}
          >
            <CloseIcon size={14} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        {TYPES.map((t) => (
          <Chip key={t} label={t} variant="filter" selected={type === t} onPress={() => setType(t)} />
        ))}
      </ScrollView>

      <Text style={styles.count} accessibilityLiveRegion="polite">
        {showSkeleton ? 'Searching…' : pluralize(list.length, 'course', 'courses')}
      </Text>

      {showError ? (
        <View style={{ marginHorizontal: -20, marginTop: -32 }}>
          <StatusBlock kind="error" error={courses.error} retrying={courses.isFetching} onRetry={() => courses.refetch()} onBack={() => goHomeTab(navigation)} />
        </View>
      ) : showSkeleton ? (
        <Pulse style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <RowSkeleton key={i} />
          ))}
        </Pulse>
      ) : list.length > 0 ? (
        <View style={{ gap: 10 }}>
          {list.map((c) => (
            <CourseRow key={c.id} course={c} categoryName={names[c.category]} onPress={() => openCourse(c)} onToggleFavorite={toggleFavorite} />
          ))}
        </View>
      ) : (
        <EmptyState
          icon={<SearchMinusIcon size={24} />}
          title={debounced ? `No results for “${debounced}”` : `No ${type.toLowerCase()} courses yet`}
          body="Try a shorter keyword or browse a category."
          padV={40}
          tileSize={52}
          style={styles.empty}
        >
          <View style={styles.emptyChips}>
            {(cats.data || []).map((k) => (
              <Chip key={k.id} label={k.name} variant="tint" onPress={() => openCategory(k.id)} />
            ))}
          </View>
        </EmptyState>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.page },
  content: { paddingHorizontal: 20, paddingBottom: 28, gap: 16 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 29, letterSpacing: -0.48, color: colors.ink },
  field: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 14,
    paddingRight: 6,
  },
  input: { flex: 1, minWidth: 0, height: 48, fontFamily: fonts.regular, fontSize: 16, color: colors.ink },
  clear: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center' },
  chipsScroll: { marginHorizontal: -20, flexGrow: 0 },
  chips: { paddingHorizontal: 20, gap: 8 },
  count: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted },
  empty: { borderRadius: radius.xxl, gap: 12 },
  emptyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
});
