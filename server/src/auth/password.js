import argon2 from 'argon2';

// Parameter argon2id sesuai rekomendasi OWASP: memory 19 MiB, 2 iterasi, parallelism 1.
const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (password) => argon2.hash(password, OPTIONS);

// Hash "palsu" untuk email yang tidak terdaftar. Login dengan email asing tetap menjalankan
// argon2.verify, jadi lama prosesnya sama dan orang tidak bisa menebak email mana yang terdaftar.
let dummyHash = null;
async function getDummyHash() {
  dummyHash ??= await hashPassword('cuma-penyeimbang-waktu-1');
  return dummyHash;
}

export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash ?? (await getDummyHash()), password);
  } catch {
    return false; // hash rusak dianggap gagal, bukan error 500
  }
}

// Dipanggil saat email tidak ditemukan, supaya waktunya setara dengan pengecekan asli.
export async function burnTime(password) {
  await verifyPassword(null, password);
  return false;
}
