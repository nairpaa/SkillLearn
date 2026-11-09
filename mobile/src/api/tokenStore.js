import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Refresh token cuma boleh tinggal di SecureStore (Keychain/Keystore), jangan pernah AsyncStorage.
// Di web (dipakai buat ngetes UI saja) SecureStore nggak ada, jadi pakai memori biasa:
// refresh halaman = logout, dan itu memang sengaja.
const KEY = 'skilllearn.refreshToken';
let webMemory = null;
const isWeb = Platform.OS === 'web';

export async function getRefreshToken() {
  if (isWeb) return webMemory;
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token) {
  if (!token) return clearRefreshToken();
  if (isWeb) {
    webMemory = token;
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearRefreshToken() {
  if (isWeb) {
    webMemory = null;
    return;
  }
  try {
    await SecureStore.deleteItemAsync(KEY);
  } catch {
    // kalau gagal hapus ya sudah, token lama juga bakal ditolak server
  }
}
