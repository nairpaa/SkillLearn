// Lingkungan test: MongoDB in-memory, kunci PASETO baru setiap run, email ditangkap di outbox.
// Semua modul src di-import SETELAH env disiapkan (env.js membaca process.env saat pertama di-import),
// jadi file test cukup mengambil semuanya dari sini.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PublicProtocol } from 'paseto';
import { ExportPublicKeyFactory, ExportSecretKeyFactory, GenerateKeyPairFactory } from 'paseto/v4/public';
import supertest from 'supertest';

process.env.NODE_ENV = 'test';
process.env.APP_ORIGIN = 'http://localhost:5173';
process.env.APP_URL = 'http://localhost:5173';
process.env.TRUST_PROXY = 'loopback';
process.env.PROXY_SHARED_SECRET = 'rahasia-proxy-test';

const v4 = new PublicProtocol(GenerateKeyPairFactory, ExportPublicKeyFactory, ExportSecretKeyFactory);
const pair = await v4.GenerateKeyPair({ extractable: true });
process.env.PASETO_SECRET_KEY = await v4.ExportSecretKey(pair.secretKey);
process.env.PASETO_PUBLIC_KEY = await v4.ExportPublicKey(pair.publicKey);
process.env.PASETO_KID = 'test';

export const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('skilllearn_test');

export const { default: app } = await import('../src/app.js');
const { default: connectDB } = await import('../src/config/db.js');
export const { default: mongoose } = await import('mongoose');
export const { testOutbox } = await import('../src/services/mailer.js');
export const { settleDeferred: settle } = await import('../src/services/defer.js');
export const { hashPassword } = await import('../src/auth/password.js');
export const { createCourse } = await import('../src/services/courses.js');
export const tokens = await import('../src/auth/tokens.js');
export const rateLimit = await import('../src/middleware/rateLimit.js');

const load = async (name) => (await import(`../src/models/${name}.js`)).default;
export const models = {
  User: await load('User'),
  Session: await load('Session'),
  AuthToken: await load('AuthToken'),
  Course: await load('Course'),
  Quiz: await load('Quiz'),
  Favorite: await load('Favorite'),
  History: await load('History'),
  Progress: await load('Progress'),
  QuizAttempt: await load('QuizAttempt'),
  RateLimit: await load('RateLimit'),
};

await connectDB();
// Index unik & TTL harus sudah ada sebelum test duplikasi berjalan.
await Promise.all(Object.values(models).map((m) => m.syncIndexes()));

export const request = () => supertest(app);
export const ORIGIN = 'http://localhost:5173';
export const PASSWORD = 'Rahasia99x';

let seq = 0;
export const uniqueEmail = (prefix = 'user') => `${prefix}.${process.pid}.${Date.now()}.${++seq}@student.ac.id`;

export async function close() {
  // Tunggu pekerjaan latar (email tertunda, pengurangan hitungan rate limit setelah respons) selesai dulu.
  await settle();
  await new Promise((r) => setTimeout(r, 100));
  await mongoose.disconnect();
  await mongod.stop();
}

export async function resetLimits() {
  await models.RateLimit.deleteMany({});
}

export async function createUser({ email = uniqueEmail(), password = PASSWORD, name = 'Tes Pengguna', role = 'student', verified = true, isDemo = false } = {}) {
  const user = await models.User.create({
    email,
    name,
    role,
    passwordHash: await hashPassword(password),
    emailVerifiedAt: verified ? new Date() : null,
    isDemo,
  });
  return { user, email, password };
}

// Login sebagai klien mobile (refresh token di body) atau web (refresh token di cookie).
export async function login(email, password = PASSWORD, { web = false, ip } = {}) {
  const req = request().post('/api/auth/login');
  if (!web) req.set('X-Client', 'mobile');
  if (ip) req.set('X-Forwarded-For', ip);
  const res = await req.send({ email, password });
  if (res.status !== 200) throw new Error(`login gagal ${res.status} ${JSON.stringify(res.body)}`);
  const cookie = (res.headers['set-cookie'] || []).find((c) => c.startsWith('sl_rt='));
  return { accessToken: res.body.accessToken, refreshToken: res.body.refreshToken, cookie: cookie?.split(';')[0], res };
}

export async function loggedInUser(opts = {}) {
  const created = await createUser(opts);
  const session = await login(created.email, created.password);
  return { ...created, ...session, auth: { Authorization: `Bearer ${session.accessToken}` } };
}

// Email dikirim setelah respons (lihat services/defer.js), jadi tunggu dulu pekerjaan latar selesai.
export async function lastMail(email) {
  await settle();
  return [...testOutbox].reverse().find((m) => m.to === email);
}

export async function linkToken(email, kind) {
  await settle();
  const mail = [...testOutbox].reverse().find((m) => m.to === email && m.text.includes(`/${kind}?token=`));
  return mail ? new URL(mail.text.match(/https?:\/\/\S+/)[0]).searchParams.get('token') : null;
}

// Course contoh lengkap: video, artikel, kuis (3 soal, jawaban benar 1-2-0), latihan.
export async function seedCourse(overrides = {}) {
  const slug = overrides.slug || `test-course-${process.pid}-${++seq}`;
  return createCourse({
    slug,
    order: seq,
    title: 'Test Course React',
    category: 'programming',
    type: 'Video',
    level: 'Beginner',
    rating: 4.5,
    author: 'Penguji',
    description: 'Course untuk pengujian otomatis',
    lessons: [
      { title: 'Intro video', type: 'Video', minutes: 8, videoId: 'SqcY0GlETPk' },
      { title: 'JSX article', type: 'Article', minutes: 6, contentMd: '## Judul\nIsi artikel' },
      {
        title: 'Quiz basics',
        type: 'Quiz',
        questions: [
          { text: 'Q1', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'karena b' },
          { text: 'Q2', options: ['a', 'b', 'c', 'd'], correctIndex: 2, explanation: 'karena c', mono: true },
          { text: 'Q3', options: ['a', 'b', 'c', 'd'], correctIndex: 0, explanation: 'karena a' },
        ],
      },
      {
        title: 'Practice todo',
        type: 'Practice',
        minutes: 30,
        contentMd: 'Kerjakan latihan',
        practice: { fileName: 'App.jsx', language: 'jsx', starterCode: '// mulai', tasks: ['a', 'b', 'c', 'd'], hint: 'h', checks: [{ label: 'pakai state', pattern: 'useState\\(', flags: '' }] },
      },
    ],
    ...overrides,
  });
}
