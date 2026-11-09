import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { setStatusBarStyle } from 'expo-status-bar';
import Logo from '../components/Logo';
import Spinner from '../components/Spinner';
import { colors } from '../theme';

// Tampil sebentar setelah splash native hilang, selama app mengecek refresh token di SecureStore
export default function BootScreen() {
  // Pakai API imperatif saja; komponen <StatusBar> bisa menimpa gaya yang diset layar lain
  useEffect(() => setStatusBarStyle('light', false), []);
  return (
    <View style={styles.root} accessibilityLabel="Loading SkillLearn">
      <Logo size={64} inverted />
      <View style={{ marginTop: 28 }}>
        <Spinner size={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
