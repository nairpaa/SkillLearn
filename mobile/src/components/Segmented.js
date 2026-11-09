import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Segmented control abu-abu: tab aktif = latar putih
export default function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[styles.wrap, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [styles.item, on && styles.itemOn, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.label, { color: on ? colors.ink : colors.inkMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 44, padding: 4, borderRadius: radius.lg, backgroundColor: colors.line, flexDirection: 'row' },
  item: { flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  itemOn: { backgroundColor: colors.white },
  label: { fontFamily: fonts.bold, fontSize: 14 },
});
