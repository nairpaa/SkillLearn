import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryColors, colors, fonts, radius } from '../theme';
import { ratingText } from '../utils/format';
import { BookmarkIcon } from './Icons';
import Thumb from './Thumb';

// Kartu course besar (dipakai di Category): thumb 130 + pill tipe + deskripsi
function CourseCard({ course, onPress, onToggleFavorite }) {
  const { ink } = categoryColors(course.category);
  const fav = !!course.isFavorite;
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${course.title}. ${course.type}. ${course.level}, ${course.duration}, rating ${ratingText(course.rating)}`}
        onPress={onPress}
        style={({ pressed }) => pressed && { opacity: 0.7 }}
      >
        <Thumb course={course} band={10} style={styles.thumb}>
          <View style={styles.pill}>
            <Text style={[styles.pillText, { color: ink }]}>{course.type}</Text>
          </View>
        </Thumb>
        <View style={styles.body}>
          <Text style={styles.title}>{course.title}</Text>
          {course.description ? (
            <Text style={styles.desc} numberOfLines={3}>
              {course.description}
            </Text>
          ) : null}
          <Text style={styles.meta}>{`${course.level} · ${course.duration} · ★ ${ratingText(course.rating)}`}</Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={fav ? 'Saved. Remove from favorites' : 'Save to favorites'}
        accessibilityState={{ selected: fav }}
        onPress={() => onToggleFavorite?.(course)}
        style={({ pressed }) => [styles.bookmark, pressed && { opacity: 0.7 }]}
      >
        <BookmarkIcon filled={fav} />
      </Pressable>
    </View>
  );
}

export default memo(CourseCard);

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, overflow: 'hidden' },
  thumb: { height: 130, padding: 12, alignItems: 'flex-start' },
  pill: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.white },
  pillText: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 15 },
  body: { padding: 14, gap: 6 },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 21.6, color: colors.ink },
  desc: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19.5, color: colors.inkMuted },
  meta: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
  bookmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
