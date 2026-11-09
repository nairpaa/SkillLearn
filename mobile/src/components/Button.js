import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, size } from '../theme';
import Spinner from './Spinner';

/**
 * variant: primary | secondary | destructive | ghost | white | outlineWhite
 * busy: tombol disabled + spinner + busyLabel (mis. "Logging in…")
 */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  busy = false,
  busyLabel,
  disabled = false,
  height = size.button,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  accessibilityHint,
}) {
  const inactive = disabled || busy;
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { height, borderRadius: radius.lg },
        v.container,
        variant === 'primary' && disabled && !busy && { backgroundColor: colors.primaryDisabled },
        busy && v.busy,
        pressed && !inactive && v.pressed,
        style,
      ]}
    >
      {busy ? <Spinner size={18} color={v.spinner} track={v.spinnerTrack} /> : icon || null}
      <Text style={[styles.label, v.text, textStyle]} numberOfLines={1}>
        {busy && busyLabel ? busyLabel : title}
      </Text>
    </Pressable>
  );
}

export function IconButton({ onPress, accessibilityLabel, children, style, size: s = 44, disabled, hitSlop }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }, style, pressed && { opacity: 0.7 }]}
    >
      <View pointerEvents="none">{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18 },
  label: { fontFamily: fonts.bold, fontSize: 16 },
});

const VARIANTS = {
  primary: {
    container: { backgroundColor: colors.primary },
    pressed: { backgroundColor: colors.primaryHover },
    busy: { backgroundColor: colors.primaryBusy },
    text: { color: colors.white },
    spinner: colors.white,
  },
  secondary: {
    container: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lineStrong },
    pressed: { opacity: 0.7 },
    text: { color: colors.ink, fontFamily: fonts.semibold, fontSize: 15 },
    spinner: colors.ink,
    spinnerTrack: 'rgba(22,33,31,0.2)',
  },
  destructive: {
    container: { backgroundColor: colors.danger },
    pressed: { backgroundColor: colors.dangerHover },
    text: { color: colors.white },
    spinner: colors.white,
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    pressed: { opacity: 0.6 },
    text: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 15 },
    spinner: colors.primary,
    spinnerTrack: 'rgba(14,94,82,0.25)',
  },
  white: {
    container: { backgroundColor: colors.white },
    pressed: { opacity: 0.7 },
    text: { color: colors.primary },
    spinner: colors.primary,
    spinnerTrack: 'rgba(14,94,82,0.25)',
  },
  outlineWhite: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
    pressed: { opacity: 0.7 },
    text: { color: colors.white },
    spinner: colors.white,
  },
};
