import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';

// Set gaya status bar tiap kali layar dapat fokus (bukan saat mount),
// supaya waktu tekan back warnanya ikut balik ke layar sebelumnya.
// 'dark' = ikon gelap (layar terang), 'light' = ikon putih (layar teal/gelap)
export function useStatusBar(style) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style, true);
    }, [style])
  );
}
