import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_BYTES = 60 * 1024; // batas server untuk avatar (setelah base64 di-decode)
const SIZE = 256;

const decodedBytes = (b64) => Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);

// Pilih foto dari galeri → crop kotak di tengah → resize 256×256 → JPEG base64 (≤ 60 KB).
// Hasil: data URL siap dikirim ke PATCH /me, atau null kalau user batal.
export async function pickAvatar() {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  if (res.canceled || !res.assets?.length) return null;
  const asset = res.assets[0];
  const w = asset.width || SIZE;
  const h = asset.height || SIZE;
  const side = Math.min(w, h);

  // Kompresi diturunkan bertahap sampai ukurannya lolos batas server
  for (const compress of [0.75, 0.6, 0.45, 0.3, 0.15]) {
    const ctx = ImageManipulator.manipulate(asset.uri);
    if (w !== h) ctx.crop({ originX: Math.floor((w - side) / 2), originY: Math.floor((h - side) / 2), width: side, height: side });
    ctx.resize({ width: SIZE, height: SIZE });
    const image = await ctx.renderAsync();
    const out = await image.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
    const b64 = (out.base64 || '').replace(/^data:[^,]*,/, '').replace(/\s/g, '');
    if (b64 && decodedBytes(b64) <= MAX_BYTES) return `data:image/jpeg;base64,${b64}`;
  }
  throw new Error('Photo must be 60 KB or smaller.');
}
