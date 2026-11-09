import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Banner form: error (merah), info (kuning), success (teal)
export default function Banner({ kind = 'error', children, style }) {
  const k = KINDS[kind] || KINDS.error;
  return (
    <View
      style={[styles.box, k.box, style]}
      accessibilityRole={kind === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
    >
      <Text style={[styles.text, k.text]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.lg },
  text: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 19.5 },
});

const KINDS = {
  error: { box: { backgroundColor: colors.dangerTint }, text: { color: colors.dangerInk } },
  info: { box: { backgroundColor: colors.accentTint, borderWidth: 1, borderColor: colors.accentBorder }, text: { color: colors.accentInkStrong } },
  success: { box: { backgroundColor: colors.primary }, text: { color: colors.white } },
};
