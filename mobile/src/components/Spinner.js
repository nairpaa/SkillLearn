import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { motion } from '../theme';

// Spinner ring 2px (putih 35% + ujung putih) sesuai tombol busy di desain
export default function Spinner({ size = 18, color = '#FFFFFF', track = 'rgba(255,255,255,0.35)' }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: motion.spinner, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: track,
        borderTopColor: color,
        transform: [{ rotate }],
      }}
    />
  );
}
