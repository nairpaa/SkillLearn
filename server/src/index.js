// Menjalankan API sebagai server biasa (lokal: npm run dev, Render: npm start).
import app from './app.js';
import connectDB from './config/db.js';
import { env } from './config/env.js';

try {
  await connectDB();
} catch (err) {
  console.error('Gagal terhubung ke MongoDB:', err.message);
  console.error('Pastikan MongoDB jalan dan MONGODB_URI di file .env sudah benar.');
  process.exit(1);
}

// 0.0.0.0 supaya bisa diakses dari perangkat lain di jaringan yang sama, bukan cuma localhost.
app.listen(env.port, '0.0.0.0', () => {
  console.log(`SkillLearn API jalan di http://localhost:${env.port}/api`);
});
