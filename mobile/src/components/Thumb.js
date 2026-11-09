import { useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { categoryColors } from '../theme';
import Stripes from './Stripes';

// hqdefault.jpg YouTube itu 4:3 dengan pita hitam atas-bawah untuk video 16:9.
// Kotaknya dibuat ~1/3 lebih tinggi lalu di-crop, supaya pita hitamnya nggak kelihatan.
const isYoutubeHq = (url) => /^https:\/\/i\.ytimg\.com\/vi\/[^/]+\/(hq|sd)default\.jpg/.test(url);

const styles = StyleSheet.create({
  ytCrop: { position: 'absolute', left: 0, right: 0, top: '-17%', bottom: '-17%' },
});

// Thumbnail course: foto asli kalau ada thumbnailUrl, kalau tidak placeholder bergaris warna kategori
export default function Thumb({ course, style, band = 8, children }) {
  const [failed, setFailed] = useState(false);
  const { tint } = categoryColors(course?.category);
  const url = !failed && course?.thumbnailUrl;
  return (
    <Stripes tint={tint} band={band} style={style}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={isYoutubeHq(url) ? styles.ytCrop : StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      {children}
    </Stripes>
  );
}
