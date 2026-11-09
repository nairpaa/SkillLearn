// npm run db:check  (MONGODB_URI diambil dari environment / .env)
// Mengecek connection string database production sebelum deploy:
// bisa konek, bisa menulis ke database aplikasi, dan TIDAK bisa membaca database lain (hak akses minimum).
import mongoose from 'mongoose';
import { env } from '../config/env.js';

const SYSTEM = ['admin', 'local', 'config'];
let ok = true;
const line = (pass, text) => {
  if (!pass) ok = false;
  console.log(`${pass ? '✔' : '✘'} ${text}`);
};

try {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
  const conn = mongoose.connection;
  line(true, `Konek ke database "${conn.name}"`);

  const probe = conn.db.collection('_cek_koneksi');
  const { insertedId } = await probe.insertOne({ dibuat: new Date() });
  await probe.deleteOne({ _id: insertedId });
  await conn.db.dropCollection('_cek_koneksi').catch(() => {});
  line(true, `Bisa menulis ke "${conn.name}"`);

  const { databases } = await conn.client.db('admin').admin().listDatabases({ nameOnly: true });
  const others = databases.map((d) => d.name).filter((n) => n !== conn.name && !SYSTEM.includes(n));
  for (const name of others) {
    let readable = false;
    try {
      const cols = await conn.client.db(name).listCollections({}, { nameOnly: true }).toArray();
      if (cols[0]) await conn.client.db(name).collection(cols[0].name).findOne({}, { projection: { _id: 1 } });
      readable = true;
    } catch {
      readable = false;
    }
    line(!readable, readable ? `Bisa membaca database lain "${name}" (hak akses terlalu luas)` : `Database lain "${name}" tidak bisa dibaca`);
  }
  if (!others.length) line(true, 'Tidak bisa melihat database lain');
} catch (err) {
  line(false, `Gagal: ${err.codeName || ''} ${err.message}`);
} finally {
  await mongoose.disconnect();
}

console.log(ok ? '\nDatabase siap dipakai.' : '\nPerbaiki dulu poin bertanda ✘.');
process.exitCode = ok ? 0 : 1;
