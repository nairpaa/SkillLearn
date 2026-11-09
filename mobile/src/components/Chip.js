import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '../theme';

/**
 * variant:
 *  - 'filter'   chip tipe di Search (selected = latar ink, teks putih)
 *  - 'tint'     chip kategori di empty state Search (primary-tint)
 *  - 'outline'  chip "Other categories"
 *  - 'toggle'   chip minat di Edit Profile (selected = primary-tint + border primary)
 */
export default function Chip({ label, onPress, selected = false, variant = 'outline', height = 38, style, accessibilityRole = 'button' }) {
  const v = look(variant, selected);
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={label}
      accessibilityState={variant === 'filter' || variant === 'toggle' ? { selected } : undefined}
      onPress={onPress}
      hitSlop={height < 44 ? { top: (44 - height) / 2, bottom: (44 - height) / 2 } : undefined}
      style={({ pressed }) => [styles.chip, { height }, v.box, style, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.label, v.text]}>{label}</Text>
    </Pressable>
  );
}

function look(variant, selected) {
  switch (variant) {
    case 'filter':
      return selected
        ? { box: { backgroundColor: colors.ink, borderColor: colors.ink }, text: { color: colors.white } }
        : { box: { backgroundColor: colors.white, borderColor: colors.line }, text: { color: colors.inkMuted } };
    case 'tint':
      return { box: { backgroundColor: colors.primaryTint, borderColor: colors.primaryTint }, text: { color: colors.primary } };
    case 'toggle':
      return selected
        ? { box: { backgroundColor: colors.primaryTint, borderColor: colors.primary }, text: { color: colors.primary } }
        : { box: { backgroundColor: colors.white, borderColor: colors.line }, text: { color: colors.inkMuted } };
    default:
      return { box: { backgroundColor: colors.white, borderColor: colors.line }, text: { color: colors.ink } };
  }
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { fontFamily: fonts.semibold, fontSize: 13 },
});
