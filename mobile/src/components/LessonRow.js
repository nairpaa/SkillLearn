import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { CheckIcon } from './Icons';

// Lingkaran 28px: done = teal + ✓, current = accent + nomor, todo = abu + nomor
function LessonRow({ lesson, onPress, highlighted }) {
  const s = lesson.status;
  const current = highlighted ?? s === 'current';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Lesson ${lesson.index + 1}: ${lesson.title}. ${lesson.type}, ${lesson.duration}. ${
        s === 'done' ? 'Completed' : s === 'current' ? 'Up next' : 'Not started'
      }`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, current && { backgroundColor: colors.primaryTint }, pressed && { opacity: 0.7 }]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: s === 'done' ? colors.primary : s === 'current' ? colors.accent : colors.lineSoft },
        ]}
      >
        {s === 'done' ? <CheckIcon size={13} /> : <Text style={styles.num}>{lesson.index + 1}</Text>}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.meta}>{`${lesson.type} · ${lesson.duration}`}</Text>
      </View>
    </Pressable>
  );
}

export default memo(LessonRow);

const styles = StyleSheet.create({
  row: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    minHeight: 56,
  },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  num: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 19, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.inkMuted },
});
