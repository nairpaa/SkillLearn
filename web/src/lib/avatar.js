// Kecilkan foto profil jadi 256×256 JPEG (crop tengah) sebelum dikirim ke API.
// Server cuma menerima data URL ≤ 60 KB, jadi kualitas diturunkan pelan-pelan sampai muat.
// Sengaja pakai createImageBitmap/FileReader (data:), bukan blob: URL, karena CSP img-src
// hanya mengizinkan 'self', data: dan i.ytimg.com.

const MAX_BYTES = 58 * 1024; // sedikit di bawah 60 KB biar aman
const SIZE = 256;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export class AvatarError extends Error {}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* lanjut ke fallback */
    }
  }
  const url = await readAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new AvatarError('decode'));
    img.src = url;
  });
}

function base64Bytes(dataUrl) {
  const b64 = dataUrl.split(',')[1] || '';
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return (b64.length * 3) / 4 - pad;
}

export async function resizeAvatar(file) {
  if (!file || !TYPES.includes(file.type)) throw new AvatarError('Choose a PNG, JPEG or WebP image.');
  if (file.size > 15 * 1024 * 1024) throw new AvatarError('This photo is too large. Choose one under 15 MB.');
  let img;
  try {
    img = await decode(file);
  } catch {
    throw new AvatarError("We couldn't read this image. Try another photo.");
  }
  const w = img.width;
  const h = img.height;
  const side = Math.min(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  // latar putih supaya PNG transparan nggak jadi hitam waktu diubah ke JPEG
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, SIZE, SIZE);
  if (typeof img.close === 'function') img.close();

  for (let q = 0.86; q >= 0.4; q -= 0.08) {
    const url = canvas.toDataURL('image/jpeg', q);
    if (base64Bytes(url) <= MAX_BYTES) return url;
  }
  throw new AvatarError('This photo is too detailed to shrink. Try another one.');
}
