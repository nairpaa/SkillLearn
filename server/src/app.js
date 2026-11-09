// Aplikasi Express tanpa app.listen(), supaya bisa dipakai server biasa (index.js)
// maupun platform serverless yang cukup butuh export app-nya.
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { assertSecrets, env } from './config/env.js';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import meRoutes from './routes/me.js';
import adminRoutes from './routes/admin.js';
import { noStore, requireAuth, requireRole } from './middleware/auth.js';
import { resolveClientIp } from './middleware/clientIp.js';
import { ipLimiter, userLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundRoute } from './middleware/errorHandler.js';

assertSecrets();

const app = express();
app.disable('x-powered-by'); // tidak perlu memberi tahu dunia kita pakai Express
app.set('trust proxy', env.trustProxy); // IP asli klien di belakang proxy (dipakai rate limit)

// Urutan middleware mengikuti Gambar 6 di dokumen arsitektur:
// helmet → CORS → rate limit → body ≤ 100 KB → validasi zod (di route) → requireAuth → query di-scope userId.
app.use(
  helmet({
    // API cuma mengirim JSON, jadi CSP paling ketat: tidak boleh memuat apa pun.
    contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    xFrameOptions: { action: 'deny' },
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  })
);

// CORS hanya untuk origin web yang terdaftar. Aplikasi mobile bukan browser, jadi tidak kena CORS.
app.use(cors({ origin: env.appOrigins, credentials: true }));

app.use(resolveClientIp); // IP asli klien (lihat middleware/clientIp.js)
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/', (req, res) => res.json({ name: 'SkillLearn API', health: '/api/health' }));

// Pastikan MongoDB tersambung sebelum request API diproses.
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Gagal terhubung ke MongoDB:', err.message);
    res.status(503).json({ error: 'DB_UNAVAILABLE', message: 'The server is waking up. Try again in a moment.' });
  }
});

app.use('/api', ipLimiter);
app.get('/api/health', (req, res) => {
  const ok = mongoose.connection.readyState === 1;
  // clientIp = IP kamu menurut server. Dipakai mengecek TRUST_PROXY & proxy web setelah deploy.
  res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'error', database: ok ? 'connected' : 'disconnected', clientIp: req.clientIp });
});

app.use('/api/auth', noStore, authRoutes);
app.use('/api/me', noStore, requireAuth, userLimiter, meRoutes);
app.use('/api/admin', noStore, requireAuth, requireRole('admin'), userLimiter, adminRoutes);
for (const path of ['/api/categories', '/api/courses', '/api/quizzes']) {
  app.use(path, requireAuth, userLimiter);
}
app.use('/api', contentRoutes);

app.use(notFoundRoute);
app.use(errorHandler);

export default app;
