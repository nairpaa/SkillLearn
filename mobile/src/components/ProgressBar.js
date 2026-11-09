import { View } from 'react-native';
import { colors } from '../theme';

export default function ProgressBar({ value = 0, height = 6, track = colors.line, fill = colors.primary, style }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={[{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }, style]}
    >
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: fill }} />
    </View>
  );
}
