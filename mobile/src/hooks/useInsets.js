import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WEB_FAKE_INSETS } from '../config';

const FAKE = { top: 47, bottom: 34, left: 0, right: 0 };

// Inset asli dari perangkat. Di web (khusus screenshot) bisa dipalsukan biar mirip iPhone di desain.
export function useInsets() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web' && WEB_FAKE_INSETS) return FAKE;
  return insets;
}
