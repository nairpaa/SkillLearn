import { Pressable } from 'react-native';
import { colors } from '../theme';
import { ArrowLeftIcon } from './Icons';

// Tombol kembali 44×44. align 'start' = panah rata kiri (layar auth), 'center' = di tengah kotak
export default function BackButton({ onPress, color = colors.ink, align = 'start', label = 'Go back', style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        { width: 44, height: 44, justifyContent: 'center', alignItems: align === 'start' ? 'flex-start' : 'center' },
        style,
        pressed && { opacity: 0.6 },
      ]}
    >
      <ArrowLeftIcon size={22} color={color} />
    </Pressable>
  );
}
