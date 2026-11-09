import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { createNavigationContainerRef, NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { AuthProvider } from './src/auth/AuthContext';
import { ToastProvider } from './src/components/Toast';
import RootNavigator from './src/navigation/RootNavigator';
import { linking } from './src/navigation/linking';
import { colors } from './src/theme';

// Splash native tetap tampil sampai font selesai dimuat (biar nggak kedip font sistem)
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      // 4xx (404, 401, validasi) nggak perlu diulang; error jaringan/5xx dicoba sekali lagi
      retry: (count, error) => count < 1 && error?.code !== 'ERR_TIMEOUT' && (!error?.status || error.status >= 500),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

const navigationRef = createNavigationContainerRef();
// Khusus dev di web: dipakai skrip screenshot untuk membuka state not-found tanpa reload halaman
if (__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined') window.__skilllearnNav = navigationRef;

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.page, card: colors.white, text: colors.ink, border: colors.line },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    JetBrainsMono_500Medium,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <View style={{ flex: 1, backgroundColor: colors.page }}>
              <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking} documentTitle={{ formatter: () => 'SkillLearn' }}>
                <RootNavigator />
              </NavigationContainer>
            </View>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
