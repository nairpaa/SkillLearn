import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, motion, radius, shadow } from '../theme';

const ToastContext = createContext({ show: () => {}, hide: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const opacity = useRef(new Animated.Value(0)).current;

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    Animated.timing(opacity, { toValue: 0, duration: motion.fast, useNativeDriver: true }).start(() => setToast(null));
  }, [opacity]);

  const show = useCallback(
    (message, { actionLabel, onAction } = {}) => {
      clearTimeout(timer.current);
      setToast({ message, actionLabel, onAction, id: Date.now() });
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: motion.fast, useNativeDriver: true }).start();
      // VoiceOver nggak otomatis membaca live region, jadi diumumkan manual
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
      timer.current = setTimeout(hide, motion.toast);
    },
    [hide, opacity]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={styles.layer}>
          <Animated.View
            key={toast.id}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.toast, shadow.toast, { opacity }]}
          >
            <Text style={styles.message}>{toast.message}</Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={toast.actionLabel}
                onPress={() => {
                  toast.onAction?.();
                  hide();
                }}
                style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.actionText}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  // Sesuai desain: di tengah, 100pt dari bawah (di atas tab bar)
  layer: { position: 'absolute', left: 20, right: 20, bottom: 100, alignItems: 'center' },
  toast: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingRight: 10,
    paddingLeft: 16,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  message: { flex: 1, color: colors.white, fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  action: { minHeight: 36, minWidth: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: colors.accent, fontFamily: fonts.bold, fontSize: 14 },
});
