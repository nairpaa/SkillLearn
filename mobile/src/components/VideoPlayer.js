import { Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

// Halaman pembungkus iframe. baseUrl dipakai sebagai origin/referrer: YouTube menolak embed tanpa Referer
// (error 153 "Video player configuration error") kalau URL embed dibuka langsung di WebView.
const BASE_URL = 'https://skilllearn.app/';

export function embedUrl(videoId, start = 0) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&start=${Number(start) || 0}&rel=0`;
}

function html(src) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;padding:0;height:100%;background:${colors.ink};overflow:hidden}iframe{position:absolute;inset:0;width:100%;height:100%;border:0}</style>
</head><body><iframe src="${src}" title="Lesson video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></body></html>`;
}

export default function VideoPlayer({ videoId, start }) {
  return (
    <WebView
      style={styles.web}
      containerStyle={styles.web}
      source={{ html: html(embedUrl(videoId, start)), baseUrl: BASE_URL }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      setSupportMultipleWindows={false}
      onShouldStartLoadWithRequest={(req) => {
        // Isi iframe (YouTube) boleh jalan. Kalau halaman utama mau pindah (mis. tap logo YouTube),
        // buka di browser saja supaya app nggak "nyasar" ke youtube.com di dalam WebView.
        if (req.isTopFrame === false) return true;
        if (req.url === 'about:blank' || req.url.startsWith(BASE_URL)) return true;
        if (/^https:\/\//.test(req.url)) Linking.openURL(req.url).catch(() => {});
        return false;
      }}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: colors.ink },
});
