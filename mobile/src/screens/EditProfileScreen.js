import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Avatar from '../components/Avatar';
import Banner from '../components/Banner';
import Button from '../components/Button';
import Chip from '../components/Chip';
import StatusBlock from '../components/StatusBlock';
import TextField from '../components/TextField';
import { authApi, meApi } from '../api/endpoints';
import { keys, useCategories, useMe } from '../hooks/queries';
import { useInsets } from '../hooks/useInsets';
import { useStatusBar } from '../hooks/useStatusBar';
import { colors, fonts } from '../theme';
import { pickAvatar } from '../utils/avatar';
import { NETWORK_MESSAGE } from '../utils/format';
import { goHome } from '../utils/nav';

const FALLBACK_INTERESTS = [
  { id: 'programming', name: 'Programming' },
  { id: 'design', name: 'Graphic Design' },
  { id: 'marketing', name: 'Digital Marketing' },
  { id: 'technology', name: 'Technology' },
];

// M12 Edit Profile
export default function EditProfileScreen({ navigation }) {
  useStatusBar('dark');
  const insets = useInsets();
  const qc = useQueryClient();
  const me = useMe();
  const cats = useCategories();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const scrollRef = useRef(null);
  const leaveTimer = useRef(null);

  // Isi form sekali dari data /me
  useEffect(() => {
    if (me.data && !form) {
      setForm({
        name: me.data.name || '',
        bio: me.data.bio || '',
        interests: me.data.interests || [],
        avatar: me.data.avatar || null,
        currentPassword: '',
        newPassword: '',
      });
    }
  }, [me.data, form]);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  const close = () => (navigation.canGoBack() ? navigation.goBack() : goHome(navigation));

  if (!form) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBlock kind={me.error ? 'error' : 'loading'} error={me.error} retrying={me.isFetching} onRetry={() => me.refetch()} onBack={() => goHome(navigation)} />
      </View>
    );
  }

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (banner?.kind === 'success') setBanner(null);
  };

  const toggleInterest = (id) =>
    setForm((f) => ({ ...f, interests: f.interests.includes(id) ? f.interests.filter((x) => x !== id) : [...f.interests, id] }));

  const choosePhoto = async () => {
    if (photoBusy) return;
    setPhotoBusy(true);
    setErrors((e) => ({ ...e, avatar: undefined }));
    try {
      const dataUrl = await pickAvatar();
      if (dataUrl) setForm((f) => ({ ...f, avatar: dataUrl }));
    } catch (e) {
      setErrors((x) => ({ ...x, avatar: e.message || "Couldn't use that photo. Try another one." }));
    } finally {
      setPhotoBusy(false);
    }
  };

  const save = async () => {
    if (busy) return;
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name (at least 2 characters).';
    const changingPassword = !!(form.currentPassword || form.newPassword);
    if (changingPassword) {
      if (!form.currentPassword) e.currentPassword = 'Enter your current password.';
      if (form.newPassword.length < 8) e.newPassword = 'Password must be at least 8 characters.';
      else if (!/\d/.test(form.newPassword)) e.newPassword = 'Include at least one number.';
    }
    setErrors(e);
    if (Object.values(e).some(Boolean)) {
      setBanner({ kind: 'error', text: 'Check the highlighted fields.' });
      return;
    }

    setBusy(true);
    setBanner(null);
    try {
      // Ganti password duluan: kalau password lama salah, profil belum ikut tersimpan setengah jalan
      if (changingPassword) {
        await authApi.changePassword(form.currentPassword, form.newPassword);
        setForm((f) => ({ ...f, currentPassword: '', newPassword: '' }));
      }
      const patch = { name: form.name.trim(), bio: form.bio.trim(), interests: form.interests };
      // avatar cuma dikirim kalau berubah (data URL bisa puluhan KB)
      if (form.avatar !== (me.data.avatar || null)) patch.avatar = form.avatar;
      const user = await meApi.update(patch);
      qc.setQueryData(keys.me, (old) => ({ ...(old || {}), ...user }));
      qc.invalidateQueries({ queryKey: keys.me });
      setBanner({ kind: 'success', text: 'Profile updated.' });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      leaveTimer.current = setTimeout(close, 1000);
    } catch (err) {
      if (err.fields) {
        setErrors({
          name: err.fields.name,
          bio: err.fields.bio,
          interests: err.fields.interests,
          avatar: err.fields.avatar,
          currentPassword: err.fields.currentPassword,
          newPassword: err.fields.newPassword,
        });
        setBanner({ kind: 'error', text: err.code === 'WRONG_PASSWORD' ? 'Current password is incorrect.' : err.message || 'Check the highlighted fields.' });
      } else if (err.isNetwork) setBanner({ kind: 'error', text: NETWORK_MESSAGE });
      else setBanner({ kind: 'error', text: err.message || 'Something went wrong. Try again.' });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } finally {
      setBusy(false);
    }
  };

  const interests = cats.data?.length ? cats.data : FALLBACK_INTERESTS;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'web' ? undefined : 'padding'}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Edit profile
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={save}
            style={({ pressed }) => [styles.headerBtn, { alignItems: 'flex-end' }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.saveText, busy && { color: colors.primaryBusy }]}>Save</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView ref={scrollRef} style={styles.root} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {banner ? <Banner kind={banner.kind}>{banner.text}</Banner> : null}
        <View style={styles.avatarBlock}>
          <Avatar name={form.name} uri={form.avatar} size={84} fontSize={28} />
          <View style={styles.photoActions}>
            <Pressable
              accessibilityRole="button"
              onPress={choosePhoto}
              disabled={photoBusy}
              style={({ pressed }) => [styles.photoBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.photoText}>{photoBusy ? 'Processing…' : form.avatar ? 'Change photo' : 'Upload photo'}</Text>
            </Pressable>
            {form.avatar ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                onPress={() => setForm((f) => ({ ...f, avatar: null }))}
                style={({ pressed }) => [styles.photoBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.photoText, { color: colors.dangerInk }]}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
          {errors.avatar ? <Text style={styles.error}>{errors.avatar}</Text> : null}
        </View>

        <TextField label="Full name" value={form.name} onChangeText={set('name')} error={errors.name} autoCapitalize="words" autoComplete="name" maxLength={80} />
        <TextField
          label="Email"
          value={me.data.email}
          editable={false}
          accessibilityHint="Email can't be changed"
          selectTextOnFocus={false}
        />
        <TextField
          label="Short bio"
          value={form.bio}
          onChangeText={set('bio')}
          error={errors.bio}
          multiline
          maxLength={160}
          counter={`${form.bio.length}/160`}
          placeholder="A line about what you're learning"
        />
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Interests</Text>
          <View style={styles.chips}>
            {interests.map((c) => (
              <Chip key={c.id} label={c.name} variant="toggle" height={40} selected={form.interests.includes(c.id)} onPress={() => toggleInterest(c.id)} />
            ))}
          </View>
          {errors.interests ? <Text style={styles.error}>{errors.interests}</Text> : null}
        </View>

        <View style={styles.divider} />
        <Text style={styles.section} accessibilityRole="header">
          Change password
        </Text>
        <TextField
          label="Current password"
          value={form.currentPassword}
          onChangeText={set('currentPassword')}
          error={errors.currentPassword}
          placeholder="••••••••"
          secureToggle
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          maxLength={128}
        />
        <TextField
          label="New password"
          value={form.newPassword}
          onChangeText={set('newPassword')}
          error={errors.newPassword}
          placeholder="8+ characters"
          secureToggle
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          maxLength={128}
        />
        <Button title="Save changes" busy={busy} busyLabel="Saving…" onPress={save} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  header: { backgroundColor: colors.white },
  headerRow: {
    height: 52,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerBtn: { minWidth: 64, height: 44, paddingHorizontal: 10, justifyContent: 'center' },
  cancel: { fontFamily: fonts.semibold, fontSize: 15, color: colors.inkMuted },
  headerTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  saveText: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  content: { paddingTop: 20, paddingHorizontal: 20, gap: 16 },
  avatarBlock: { alignItems: 'center', gap: 10 },
  photoActions: { flexDirection: 'row', gap: 4 },
  photoBtn: { height: 44, paddingHorizontal: 14, justifyContent: 'center' },
  photoText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 6 },
  section: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  error: { fontFamily: fonts.semibold, fontSize: 12, color: colors.danger, textAlign: 'center' },
});
