import { createElement } from 'react';
import { View } from 'react-native';
import { colors } from '../theme';

// Versi web (cuma buat ngetes di browser): react-native-webview nggak jalan di web, jadi pakai <iframe> langsung
export function embedUrl(videoId, start = 0) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&start=${Number(start) || 0}&rel=0`;
}

export default function VideoPlayer({ videoId, start }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      {createElement('iframe', {
        src: embedUrl(videoId, start),
        title: 'Lesson video',
        allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
        referrerPolicy: 'strict-origin-when-cross-origin',
        allowFullScreen: true,
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
}
