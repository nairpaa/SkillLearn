import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import BackButton from '../components/BackButton';
import Banner from '../components/Banner';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { CheckIcon, MailIcon } from '../components/Icons';
import { authApi } from '../api/endpoints';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts } from '../theme';
import { isValidEmail, NETWORK_MESSAGE, tooManyAttemptsMessage } from '../utils/format';

// Skor 0–3 persis seperti prototipe: panjang ≥ 8, ada angka, (huruf besar/simbol & ≥ 10)
function strengthOf(pw) {
  if (!pw) return 0;
  return (pw.length >= 8 ? 1 : 0) + (/\d/.test(pw) ? 1 : 0) + (/[A-Z]|[^A-Za-z0-9]/.test(pw) && pw.length >= 10 ? 1 : 0);
}
const METER = [colors.line, colors.danger, colors.accent, colors.primary];
const HINT = ['8+ characters, with one number.', 'Weak: add a number.', 'Good password.', 'Strong password.'];

// M02 Register → selalu berakhir di "Check your inbox" (server balas 202 walau email sudah terdaftar)
export default function RegisterScreen({ navigation }) {
  useStatusBar('dark');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const refs = { email: useRef(null), password: useRef(null), confirm: useRef(null) };

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const strength = strengthOf(form.password);
  const goBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Splash'));

  const submit = async () => {
    if (busy) return;
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name (at least 2 characters).';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!isValidEmail(form.email)) e.email = 'Enter a valid email, e.g. name@student.ac.id.';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    else if (!/\d/.test(form.password)) e.password = 'Include at least one number.';
    if (!form.confirm) e.confirm = 'Repeat your password.';
    else if (form.confirm !== form.password) e.confirm = "Passwords don't match.";
    if (!terms) e.terms = 'Accept the Terms to continue.';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;

    setBusy(true);
    setBanner(null);
    try {
      const email = form.email.trim().toLowerCase();
      await authApi.register(form.name.trim(), email, form.password);
      setSentTo(email);
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR' && err.fields) setErrors({ name: err.fields.name, email: err.fields.email, password: err.fields.password });
      else if (err.status === 429) setBanner(tooManyAttemptsMessage(err));
      else if (err.isNetwork) setBanner(NETWORK_MESSAGE);
      else setBanner(err.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout>
        <View style={{ height: 56 }} />
        <View style={styles.mailTile}>
          <MailIcon size={30} strokeWidth={2.5} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Check your inbox
        </Text>
        <Text style={styles.body}>
          We sent a verification link to <Text style={styles.strong}>{sentTo}</Text>. Open it to activate your account, then log in.
        </Text>
        <View style={{ flex: 1 }} />
        <Button title="Go to log in" onPress={() => navigation.replace('Login')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout gap={14}>
      <BackButton onPress={goBack} label="Back" />
      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          Create account
        </Text>
        <Text style={styles.subtitle}>Register to access all materials.</Text>
      </View>
      {banner ? <Banner>{banner}</Banner> : null}
      <TextField
        label="Full name"
        value={form.name}
        onChangeText={set('name')}
        error={errors.name}
        placeholder="Your name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => refs.email.current?.focus()}
        maxLength={80}
      />
      <TextField
        ref={refs.email}
        label="Email"
        value={form.email}
        onChangeText={set('email')}
        error={errors.email}
        placeholder="you@student.ac.id"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => refs.password.current?.focus()}
        maxLength={254}
      />
      <TextField
        ref={refs.password}
        label="Password"
        value={form.password}
        onChangeText={set('password')}
        error={errors.password}
        placeholder="8+ characters, one number"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => refs.confirm.current?.focus()}
        maxLength={128}
        footer={
          <View style={styles.meterRow} accessibilityLabel={`Password strength: ${HINT[strength]}`}>
            <View style={styles.meter}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.meterBar, { backgroundColor: i <= strength ? METER[strength] : colors.line }]} />
              ))}
            </View>
            <Text style={[styles.meterHint, { color: strength === 0 ? colors.inkMuted : METER[strength] }]}>{HINT[strength]}</Text>
          </View>
        }
      />
      <TextField
        ref={refs.confirm}
        label="Confirm password"
        value={form.confirm}
        onChangeText={set('confirm')}
        error={errors.confirm}
        placeholder="Repeat password"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
        maxLength={128}
      />
      <View style={{ gap: 4 }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: terms }}
          accessibilityLabel="I agree to the Terms and Privacy Policy"
          onPress={() => {
            setTerms((t) => !t);
            if (errors.terms) setErrors((e) => ({ ...e, terms: undefined }));
          }}
          style={({ pressed }) => [styles.termsRow, pressed && { opacity: 0.7 }]}
        >
          <View
            style={[
              styles.checkbox,
              terms
                ? { backgroundColor: colors.primary, borderColor: colors.primary }
                : { borderColor: errors.terms ? colors.danger : colors.lineControl },
            ]}
          >
            {terms ? <CheckIcon size={14} /> : null}
          </View>
          <Text style={styles.termsText}>I agree to the Terms and Privacy Policy</Text>
        </Pressable>
        {errors.terms ? <Text style={styles.error}>{errors.terms}</Text> : null}
      </View>
      <View style={{ flex: 1, minHeight: 12 }} />
      <Button title="Create account" busy={busy} busyLabel="Creating account…" onPress={submit} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Pressable accessibilityRole="link" onPress={() => navigation.replace('Login')} hitSlop={12} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text style={styles.footerLink}>Log in</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 6, marginBottom: 4 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.56, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.inkMuted },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.inkMuted },
  strong: { fontFamily: fonts.bold, color: colors.ink },
  mailTile: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meter: { flexDirection: 'row', gap: 4 },
  meterBar: { width: 24, height: 4, borderRadius: 2 },
  meterHint: { fontFamily: fonts.semibold, fontSize: 12 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  termsText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted },
  error: { fontFamily: fonts.semibold, fontSize: 12, color: colors.danger },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', minHeight: 24 },
  footerText: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted },
  footerLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
});
