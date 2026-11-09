import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, motion } from '../theme';

// Pulse opacity 1 → .45 → 1 selama 1.4 detik
export function Pulse({ children, style }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const half = motion.pulse / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 0.45, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View accessibilityLabel="Loading" accessibilityState={{ busy: true }} aria-busy style={[{ opacity: v }, style]}>
      {children}
    </Animated.View>
  );
}

export const Bone = ({ w = '100%', h = 14, r = 7, soft = false, style }) => (
  <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: soft ? colors.lineSoft : colors.line }, style]} />
);

export function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Bone w={72} h={72} r={10} />
      <View style={{ flex: 1, gap: 8 }}>
        <Bone w="85%" h={14} />
        <Bone w="50%" h={11} r={6} soft />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 6, header = true }) {
  return (
    <Pulse style={{ gap: 12 }}>
      {header ? (
        <>
          <Bone w="60%" h={28} r={10} />
          <View style={styles.searchBone} />
        </>
      ) : null}
      {Array.from({ length: count }, (_, i) => (
        <RowSkeleton key={i} />
      ))}
    </Pulse>
  );
}

export function DetailSkeleton() {
  return (
    <Pulse style={{ gap: 16 }}>
      <Bone w="100%" h={undefined} r={16} style={{ aspectRatio: 16 / 9 }} />
      <Bone w="70%" h={28} r={10} />
      <Bone w="40%" h={14} soft />
      <Bone w="95%" h={14} soft />
      <Bone w="88%" h={14} soft />
    </Pulse>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  searchBone: { height: 48, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
});
