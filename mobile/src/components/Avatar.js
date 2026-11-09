import { Image, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { initials } from '../utils/format';

// Avatar bulat: foto (data URL dari API) kalau ada, kalau tidak inisial di atas warna accent
export default function Avatar({ name, uri, size = 44, fontSize }) {
  const fs = fontSize || Math.round(size * 0.34);
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={uri ? `${name || 'User'} profile photo` : `${name || 'User'} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text style={{ fontFamily: size >= 60 ? fonts.extrabold : fonts.bold, fontSize: fs, color: colors.ink }}>{initials(name)}</Text>
      )}
    </View>
  );
}
