// Opsi B deploy API: Vercel Functions (kalau Render tidak bisa dipakai).
// Semua request diarahkan ke function ini oleh server/vercel.json; Express membaca path aslinya dari req.url.
// Koneksi MongoDB dibuka saat request pertama dan dipakai ulang (lihat config/db.js).
import app from '../src/app.js';

export default app;
