import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryColors, colors, fonts, radius } from '../theme';
import { ratingText } from '../utils/format';
import { BookmarkIcon } from './Icons';
import Thumb from './Thumb';

/**
 * Baris course mobile: thumb 72×72, kategori, judul, meta, bookmark 44×44 di kanan.
 * variant 'favorite' = versi ringkas di Profile (thumb 60, subjudul nama kategori, bookmark di tengah)
 */
function CourseRow({ course, categoryName, onPress, onToggleFavorite, variant = 'default' }) {
  const { ink } = categoryColors(course.category);
  const fav = !!course.isFavorite;
  const compact = variant === 'favorite';
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${course.title}. ${categoryName || ''}. ${course.type}, ${course.duration}, rating ${ratingText(course.rating)}`}
        onPress={onPress}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}
      >
        <Thumb course={course} style={compact ? styles.thumbSmall : styles.thumb} />
        <View style={styles.body}>
          {compact ? null : <Text style={[styles.cat, { color: ink }]}>{categoryName}</Text>}
          <Text style={styles.title} numberOfLines={2}>
            {course.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {compact ? categoryName : `${course.type} · ${course.duration} · ★ ${ratingText(course.rating)}`}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={compact ? `Remove ${course.title} from favorites` : fav ? 'Saved. Remove from favorites' : 'Save to favorites'}
        accessibilityState={{ selected: fav }}
        onPress={() => onToggleFavorite?.(course)}
        style={({ pressed }) => [styles.bookmark, compact && styles.bookmarkCenter, pressed && { opacity: 0.7 }]}
      >
        <BookmarkIcon filled={fav} />
      </Pressable>
    </View>
  );
}

export default memo(CourseRow);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl },
  link: { paddingVertical: 10, paddingLeft: 10, paddingRight: 52, flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  thumbSmall: { width: 60, height: 60, borderRadius: radius.md },
  body: { flex: 1, minWidth: 0, gap: 4 },
  cat: { fontFamily: fonts.bold, fontSize: 11, lineHeight: 14 },
  title: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 18.2, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
  bookmark: { position: 'absolute', right: 6, top: 6, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  bookmarkCenter: { top: '50%', marginTop: -22 },
});
