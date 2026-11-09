import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import BackButton from '../components/BackButton';
import Banner from '../components/Banner';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../auth/AuthContext';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts } from '../theme';
import { isValidEmail, NETWORK_MESSAGE, tooManyAttemptsMessage } from '../utils/format';

// M01 Login
export default function LoginScreen({ navigation }) {
  useStatusBar('dark');
  const { login, sessionExpired } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  // banner: { kind: 'error' | 'info', text }
  const [banner, setBanner] = useState(sessionExpired ? { kind: 'info', text: 'Your session expired. Log in again to continue.' } : null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef(null);

  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Splash'));

  const submit = async () => {
    if (busy) return;
    const next = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email, e.g. name@student.ac.id.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    setErrors(next);
    if (next.email || next.password) return;

    setBusy(true);
    setBanner(null);
    try {
      await login(email.trim().toLowerCase(), password);
      // sukses → navigator otomatis pindah ke Home karena status jadi 'authed'
    } catch (e) {
      setBusy(false);
      if (e.status === 401) setBanner({ kind: 'error', text: 'Email or password is incorrect. Check both and try again.' });
      else if (e.status === 429) setBanner({ kind: 'error', text: tooManyAttemptsMessage(e) });
      else if (e.status === 403 && e.code === 'EMAIL_NOT_VERIFIED')
        setBanner({ kind: 'info', text: `Verify your email first. We sent a new link to ${email.trim()}.` });
      else if (e.code === 'VALIDATION_ERROR' && e.fields)
        setErrors({ email: e.fields.email, password: e.fields.password });
      else if (e.isNetwork) setBanner({ kind: 'error', text: NETWORK_MESSAGE });
      else setBanner({ kind: 'error', text: e.message || 'Something went wrong. Try again.' });
    }
  };

  return (
    <AuthLayout>
      <BackButton onPress={goBack} label="Back" />
      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          Welcome back
        </Text>
        <Text style={styles.subtitle}>Log in to continue learning.</Text>
      </View>
      {banner ? <Banner kind={banner.kind}>{banner.text}</Banner> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={(v) => {
          setEmail(v);
          if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
          if (banner?.kind === 'error') setBanner(null);
        }}
        error={errors.email}
        placeholder="you@student.ac.id"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
        maxLength={254}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
          if (banner?.kind === 'error') setBanner(null);
        }}
        error={errors.password}
        placeholder="At least 8 characters"
        secureToggle
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        maxLength={128}
      />
      <Pressable
        accessibilityRole="link"
        onPress={() => navigation.navigate('ForgotPassword')}
        style={({ pressed }) => [styles.forgot, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>
      <View style={styles.spacer} />
      <Button title="Log in" busy={busy} busyLabel="Logging in…" onPress={submit} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>New here? </Text>
        <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Register')} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text style={styles.footerLink}>Create an account</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 6, marginBottom: 6 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.56, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.inkMuted },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center' },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary },
  spacer: { flex: 1, minHeight: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 24 },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted },
  footerLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
});
