import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AuthLayout from '../components/AuthLayout';
import BackButton from '../components/BackButton';
import Banner from '../components/Banner';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { MailIcon } from '../components/Icons';
import { authApi } from '../api/endpoints';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts } from '../theme';
import { isValidEmail, NETWORK_MESSAGE, tooManyAttemptsMessage } from '../utils/format';

const COOLDOWN = 30;

// M03 Forgot password: form → "Check your inbox" + tombol kirim ulang dengan jeda 30 detik
export default function ForgotPasswordScreen({ navigation }) {
  useStatusBar('dark');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [cool, setCool] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const startCooldown = () => {
    setCool(COOLDOWN);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCool((c) => {
        if (c <= 1) clearInterval(timer.current);
        return c - 1;
      });
    }, 1000);
  };

  const send = async () => {
    const value = email.trim().toLowerCase();
    setBusy(true);
    setBanner(null);
    try {
      await authApi.forgotPassword(value);
      setSent(true);
      startCooldown();
    } catch (e) {
      if (e.code === 'VALIDATION_ERROR' && e.fields?.email) setError(e.fields.email);
      else if (e.status === 429) setBanner(tooManyAttemptsMessage(e));
      else if (e.isNetwork) setBanner(NETWORK_MESSAGE);
      else setBanner(e.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (busy) return;
    if (!email.trim()) return setError('Email is required.');
    if (!isValidEmail(email)) return setError('Enter a valid email, e.g. name@student.ac.id.');
    send();
  };

  const goLogin = () => (navigation.canGoBack() ? navigation.goBack() : navigation.replace('Login'));

  return (
    <AuthLayout gap={18}>
      <BackButton onPress={goLogin} label="Back to log in" />
      {!sent ? (
        <>
          <View style={styles.titleBlock}>
            <Text style={styles.title} accessibilityRole="header">
              Reset password
            </Text>
            <Text style={styles.body}>Enter the email you registered with. We'll send a link to set a new password.</Text>
          </View>
          {banner ? <Banner>{banner}</Banner> : null}
          <TextField
            label="Email"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError('');
            }}
            error={error}
            placeholder="you@student.ac.id"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
            maxLength={254}
          />
          <View style={{ flex: 1, minHeight: 24 }} />
          <Button title="Send reset link" busy={busy} busyLabel="Sending…" onPress={submit} />
        </>
      ) : (
        <>
          <View style={styles.mailTile}>
            <MailIcon size={28} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Check your inbox
          </Text>
          <Text style={styles.body}>
            If an account exists for <Text style={styles.strong}>{email.trim()}</Text>, a reset link is on its way. The link expires in 30 minutes.
          </Text>
          {banner ? <Banner>{banner}</Banner> : null}
          <View style={{ flex: 1, minHeight: 24 }} />
          <Button title="Back to log in" onPress={goLogin} />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: cool > 0 || busy }}
            disabled={cool > 0 || busy}
            onPress={send}
            style={({ pressed }) => [styles.resend, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.resendText, { color: cool > 0 || busy ? colors.inkSubtle : colors.primary }]}>
              {busy ? 'Sending…' : cool > 0 ? `Resend available in ${cool}s` : 'Resend link'}
            </Text>
          </Pressable>
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 6 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.56, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23.25, color: colors.inkMuted },
  strong: { fontFamily: fonts.bold, color: colors.ink },
  mailTile: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  resend: { height: 48, alignItems: 'center', justifyContent: 'center' },
  resendText: { fontFamily: fonts.semibold, fontSize: 15 },
});
