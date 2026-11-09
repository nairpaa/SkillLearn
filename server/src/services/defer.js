import { waitUntil } from '@vercel/functions';

// Menjalankan pekerjaan SETELAH respons dikirim (misalnya kirim email).
// Tujuannya: lama respons register/forgot-password sama persis untuk email terdaftar maupun tidak,
// jadi waktu respons tidak bisa dipakai menebak email mana yang punya akun.
// Di Vercel, waitUntil menjaga function tetap hidup sampai pekerjaan selesai; di server biasa (Render) no-op.
const pending = new Set();

export function defer(task) {
  const p = Promise.resolve()
    .then(task)
    .catch((err) => console.error('[defer] Pekerjaan latar gagal:', err.message))
    .finally(() => pending.delete(p));
  pending.add(p);
  waitUntil(p);
  return p;
}

// Khusus test: tunggu semua pekerjaan latar selesai.
export async function settleDeferred() {
  while (pending.size) await Promise.all([...pending]);
}
