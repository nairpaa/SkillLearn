import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { colors, size } from '../theme';
import { useInsets } from '../hooks/useInsets';

// Kerangka layar auth: putih, padding 24, aman dari keyboard (form tetap bisa di-scroll)
export default function AuthLayout({ children, gap = 16 }) {
  const insets = useInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <ScrollView
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { gap, paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 12) + 20 },
        ]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  content: { flexGrow: 1, paddingHorizontal: size.authPadding },
});
