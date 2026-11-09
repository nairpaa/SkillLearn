import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Kotak kosong bergaris putus-putus: ikon, judul, satu kalimat bantuan, satu aksi
export default function EmptyState({ icon, iconBg = colors.lineSoft, tileSize = 48, title, body, children, style, padV = 32 }) {
  return (
    <View style={[styles.box, { paddingVertical: padV }, style]}>
      <View style={[styles.tile, { width: tileSize, height: tileSize, backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.lineDashed,
    borderRadius: radius.xl,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  tile: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19.5, color: colors.inkMuted, textAlign: 'center' },
});
