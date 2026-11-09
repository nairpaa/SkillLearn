import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Logo from '../components/Logo';
import Button from '../components/Button';
import { colors, fonts } from '../theme';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';

const PILLS = ['Programming', 'Graphic Design', 'Digital Marketing', 'Technology'];

// M00 Splash: layar sambutan teal untuk tamu
export default function SplashScreen({ navigation }) {
  useStatusBar('light');
  const insets = useInsets();
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 56, paddingBottom: Math.max(insets.bottom, 12) + 24 }]}
    >
      <Logo size={64} inverted />
      <Text style={styles.headline} accessibilityRole="header">
        Practical skills, outside the classroom.
      </Text>
      <Text style={styles.sub}>Articles, video tutorials, quizzes and hands-on practice.</Text>
      <View style={styles.pills}>
        {PILLS.map((p) => (
          <View key={p} style={styles.pill}>
            <Text style={styles.pillText}>{p}</Text>
          </View>
        ))}
      </View>
      <View style={styles.spacer} />
      <Button title="Create account" variant="white" onPress={() => navigation.navigate('Register')} />
      <Button title="Log in" variant="outlineWhite" onPress={() => navigation.navigate('Login')} />
      <Text style={styles.note}>An account is required to access all materials.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary },
  content: { flexGrow: 1, paddingHorizontal: 24, gap: 20 },
  headline: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 40, letterSpacing: -0.72, color: colors.white },
  sub: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 25.6, color: colors.primaryOnDark },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  pillText: { fontFamily: fonts.medium, fontSize: 13, color: colors.white },
  spacer: { flex: 1, minHeight: 40 },
  note: { fontFamily: fonts.regular, fontSize: 13, color: colors.primaryOnDark, textAlign: 'center' },
});
