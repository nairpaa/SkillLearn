import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import BackButton from '../components/BackButton';
import Chip from '../components/Chip';
import CourseCard from '../components/CourseCard';
import StatusBlock from '../components/StatusBlock';
import Stripes from '../components/Stripes';
import { useCategories, useCourses, useFavoriteToggle } from '../hooks/queries';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { categoryColors, colors, fonts } from '../theme';
import { pluralize } from '../utils/format';

// M06 Category: hero band warna kategori + daftar course + kategori lain
export default function CategoryScreen({ navigation, route }) {
  useStatusBar('dark');
  const insets = useInsets();
  const id = route.params?.id;
  const cats = useCategories();
  const cat = cats.data?.find((c) => c.id === id);
  // Query course baru jalan setelah kategorinya valid (server menolak id kategori asing dengan 400)
  const courses = useCourses({ category: id }, { enabled: !!cat });
  const toggleFavorite = useFavoriteToggle();
  const goHome = () => navigation.popToTop();
  const openCourse = useCallback((c) => navigation.navigate('CourseDetail', { slug: c.slug }), [navigation]);

  const notFound = cats.data && !cat;
  const error = cats.error || courses.error;
  if (notFound || !cats.data || !courses.data) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBlock
          kind={notFound ? 'notfound' : error ? 'error' : 'loading'}
          notFoundTitle="Category not found"
          error={error}
          retrying={cats.isFetching || courses.isFetching}
          onRetry={() => (cats.error ? cats.refetch() : courses.refetch())}
          onBack={goHome}
        />
      </View>
    );
  }

  const { tint, ink } = { tint: cat.tint || categoryColors(cat.id).tint, ink: cat.ink || categoryColors(cat.id).ink };
  const others = cats.data.filter((o) => o.id !== cat.id);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 28 }}>
      <Stripes tint={tint} band={12} stripe="rgba(255,255,255,0.35)" style={{ paddingTop: insets.top }}>
        <View style={styles.hero}>
          <BackButton onPress={() => (navigation.canGoBack() ? navigation.goBack() : goHome())} label="Back" />
          <Text style={[styles.name, { color: ink }]} accessibilityRole="header">
            {cat.name}
          </Text>
          {cat.description ? <Text style={styles.desc}>{cat.description}</Text> : null}
          <Text style={styles.count}>{pluralize(courses.data.length, 'course', 'courses')}</Text>
        </View>
      </Stripes>
      <View style={styles.body}>
        {courses.data.map((c) => (
          <CourseCard key={c.id} course={c} onPress={() => openCourse(c)} onToggleFavorite={toggleFavorite} />
        ))}
        <Text style={styles.otherTitle} accessibilityRole="header">
          Other categories
        </Text>
        <View style={styles.chips}>
          {others.map((o) => (
            <Chip key={o.id} label={o.name} height={40} onPress={() => navigation.replace('Category', { id: o.id })} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.page },
  hero: { paddingTop: 4, paddingHorizontal: 20, paddingBottom: 28, gap: 10 },
  name: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  desc: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23.25, color: colors.inkBody },
  count: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
  body: { paddingTop: 20, paddingHorizontal: 20, gap: 12 },
  otherTitle: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
