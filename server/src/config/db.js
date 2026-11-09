import mongoose from 'mongoose';
import { env } from './env.js';

// Lapisan kedua anti NoSQL injection (lapisan pertama: validasi zod).
// sanitizeFilter membuat objek seperti { $ne: null } dari input dianggap nilai biasa, bukan operator.
// Konsekuensinya, operator yang memang kita tulis sendiri harus dibungkus mongoose.trusted().
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true);

// Koneksi dipakai ulang. Penting kalau dijalankan sebagai serverless function.
let connecting = null;

export default function connectDB() {
  if (!connecting) {
    connecting = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 })
      .then((conn) => {
        console.log(`MongoDB terhubung: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((err) => {
        connecting = null; // request berikutnya mencoba konek lagi
        throw err;
      });
  }
  return connecting;
}
