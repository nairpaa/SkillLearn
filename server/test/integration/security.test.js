// Skenario uji keamanan dari dokumen arsitektur (bagian 6) + header, CORS, dan penanganan error.
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ORIGIN, close, createUser, loggedInUser, models, request, resetLimits, seedCourse, uniqueEmail } from '../helpers.js';

after(close);
beforeEach(resetLimits);

let course;
let detail;
let a;
let b;
before(async () => {
  course = await seedCourse({ slug: 'sec-course' });
  a = await loggedInUser({ name: 'Pengguna A' });
  b = await loggedInUser({ name: 'Pengguna B' });
  detail = (await request().get('/api/courses/sec-course').set(a.auth)).body;
});

describe('user enumeration', () => {
  it('login, register, dan forgot memberi jawaban yang sama untuk email terdaftar maupun tidak', async () => {
    const ghost = uniqueEmail('ghost');
    const l1 = await request().post('/api/auth/login').send({ email: a.email, password: 'SalahBanget1' });
    const l2 = await request().post('/api/auth/login').send({ email: ghost, password: 'SalahBanget1' });
    assert.deepEqual([l1.status, l1.body], [l2.status, l2.body]);
    const r1 = await request().post('/api/auth/register').send({ name: 'X Y', email: a.email, password: 'CobaLagi99x' });
    const r2 = await request().post('/api/auth/register').send({ name: 'X Y', email: ghost, password: 'CobaLagi99x' });
    assert.deepEqual([r1.status, r1.body], [r2.status, r2.body]);
    const f1 = await request().post('/api/auth/forgot-password').send({ email: a.email });
    const f2 = await request().post('/api/auth/forgot-password').send({ email: uniqueEmail('ghost2') });
    assert.deepEqual([f1.status, f1.body], [f2.status, f2.body]);
  });
});

describe('IDOR', () => {
  it('B tidak bisa menghapus/membaca favorit A', async () => {
    await request().put(`/api/me/favorites/${course._id}`).set(a.auth);
    assert.equal((await request().delete(`/api/me/favorites/${course._id}`).set(b.auth)).status, 204);
    const favA = (await request().get('/api/me/favorites').set(a.auth)).body;
    assert.ok(favA.some((c) => c.id === String(course._id)), 'favorit A harus tetap ada');
    assert.equal((await request().get('/api/me/favorites').set(b.auth)).body.length, 0);
  });

  it('parameter userId dari klien ditolak, bukan dipakai', async () => {
    const res = await request().get(`/api/me/history?userId=${a.user._id}`).set(b.auth);
    assert.equal(res.status, 400);
    const body = await request().post('/api/me/history').set(b.auth).send({ courseId: detail.id, lessonId: detail.lessons[0].id, userId: String(a.user._id) });
    assert.equal(body.status, 400);
  });

  it('riwayat & progres B tidak bercampur dengan milik A', async () => {
    await request().post('/api/me/history').set(a.auth).send({ courseId: detail.id, lessonId: detail.lessons[1].id });
    await request().put(`/api/me/progress/${detail.id}/lessons/${detail.lessons[0].id}`).set(a.auth);
    assert.equal((await request().get('/api/me/history').set(b.auth)).body.length, 0);
    assert.equal((await request().get('/api/me').set(b.auth)).body.stats.inProgress, 0);
  });
});

describe('mass assignment & eskalasi role', () => {
  it('PATCH /me {role:"admin"} → 400 dan role tidak berubah', async () => {
    const res = await request().patch('/api/me').set(b.auth).send({ role: 'admin' });
    assert.equal(res.status, 400);
    assert.equal((await models.User.findById(b.user._id)).role, 'student');
    const mixed = await request().patch('/api/me').set(b.auth).send({ name: 'Boleh', email: 'ganti@x.id' });
    assert.equal(mixed.status, 400);
    assert.equal((await models.User.findById(b.user._id)).email, b.email);
  });
});

describe('NoSQL injection', () => {
  it('operator Mongo di body dan query ditolak 400', async () => {
    assert.equal((await request().post('/api/auth/login').send({ email: { $ne: null }, password: 'x' })).status, 400);
    assert.equal((await request().post('/api/auth/login').send({ email: a.email, password: { $ne: null } })).status, 400);
    assert.equal((await request().get('/api/courses?q[$ne]=x').set(a.auth)).status, 400);
    assert.equal((await request().get('/api/courses?category[$ne]=x').set(a.auth)).status, 400);
    assert.equal((await request().post('/api/auth/forgot-password').send({ email: { $gt: '' } })).status, 400);
    assert.equal((await request().post('/api/auth/verify-email').send({ token: { $ne: null } })).status, 400);
  });
});

describe('XSS', () => {
  it('payload HTML di bio disimpan apa adanya sebagai teks (React meng-escape saat render)', async () => {
    const payload = '<img src=x onerror=alert(1)>';
    const res = await request().patch('/api/me').set(b.auth).send({ bio: payload });
    assert.equal(res.status, 200);
    assert.equal(res.body.bio, payload);
    assert.match(res.headers['content-type'], /application\/json/);
  });
});

describe('token', () => {
  it('token milik akun yang sudah dihapus → 401', async () => {
    const tmp = await loggedInUser();
    await request().delete('/api/me').set(tmp.auth).send({ password: tmp.password });
    assert.equal((await request().get('/api/me').set(tmp.auth)).status, 401);
  });

  it('akun yang diubah jadi admin tetap butuh token baru (role dibaca dari token)', async () => {
    const tmp = await loggedInUser();
    await models.User.updateOne({ _id: tmp.user._id }, { $set: { role: 'admin' } });
    assert.equal((await request().post('/api/admin/courses').set(tmp.auth).send({})).status, 403);
  });
});

describe('header & konfigurasi HTTP', () => {
  it('header keamanan helmet ada, X-Powered-By hilang', async () => {
    const res = await request().get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.headers['content-security-policy'], "default-src 'none';frame-ancestors 'none'");
    assert.equal(res.headers['strict-transport-security'], 'max-age=63072000; includeSubDomains; preload');
    assert.equal(res.headers['x-frame-options'], 'DENY');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['cross-origin-resource-policy'], 'same-origin');
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  it('CORS hanya untuk origin yang terdaftar', async () => {
    const ok = await request().options('/api/courses').set('Origin', ORIGIN).set('Access-Control-Request-Method', 'GET');
    assert.equal(ok.headers['access-control-allow-origin'], ORIGIN);
    assert.equal(ok.headers['access-control-allow-credentials'], 'true');
    const evil = await request().options('/api/courses').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET');
    assert.equal(evil.headers['access-control-allow-origin'], undefined);
  });

  it('data pribadi & auth tidak boleh di-cache', async () => {
    assert.equal((await request().get('/api/me').set(a.auth)).headers['cache-control'], 'no-store');
    assert.equal((await request().post('/api/auth/login').send({ email: 'x@y.id', password: 'z' })).headers['cache-control'], 'no-store');
  });

  it('body lebih dari 100 KB ditolak 413', async () => {
    const res = await request().patch('/api/me').set(a.auth).send({ bio: 'x'.repeat(120 * 1024) });
    assert.equal(res.status, 413);
  });

  it('error tidak membocorkan stack trace; endpoint tak dikenal → 404 JSON', async () => {
    const res = await request().get('/api/tidak-ada').set(a.auth);
    assert.equal(res.status, 404);
    assert.equal(res.body.error, 'NOT_FOUND');
    const bad = await request().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    assert.equal(bad.status, 400);
    assert.ok(!JSON.stringify(bad.body).includes('at '));
  });
});

describe('[#1] IP klien dari proxy web', () => {
  it('header X-SkillLearn-Client-IP hanya dipercaya kalau rahasia proxy cocok', async () => {
    const trusted = await request().get('/api/health').set('X-SkillLearn-Client-IP', '198.51.100.23').set('X-SkillLearn-Proxy-Secret', 'rahasia-proxy-test');
    assert.equal(trusted.body.clientIp, '198.51.100.23');
    const forged = await request().get('/api/health').set('X-SkillLearn-Client-IP', '198.51.100.23').set('X-SkillLearn-Proxy-Secret', 'tebakan');
    assert.notEqual(forged.body.clientIp, '198.51.100.23');
    const noSecret = await request().get('/api/health').set('X-SkillLearn-Client-IP', '198.51.100.23');
    assert.notEqual(noSecret.body.clientIp, '198.51.100.23');
    const notIp = await request().get('/api/health').set('X-SkillLearn-Client-IP', 'bukan-ip').set('X-SkillLearn-Proxy-Secret', 'rahasia-proxy-test');
    assert.notEqual(notIp.body.clientIp, 'bukan-ip');
  });

  it('lockout memakai IP asli tiap pengunjung web, bukan IP proxy bersama', async () => {
    const { email } = await createUser();
    const via = (ip) => request().post('/api/auth/login').set('X-SkillLearn-Client-IP', ip).set('X-SkillLearn-Proxy-Secret', 'rahasia-proxy-test');
    for (let i = 0; i < 6; i++) await via('198.51.100.50').send({ email, password: 'SalahBanget1' });
    assert.equal((await via('198.51.100.50').send({ email, password: 'Rahasia99x' })).status, 429);
    // Pengunjung lain lewat proxy yang sama tidak ikut terkunci.
    assert.equal((await via('198.51.100.51').send({ email, password: 'Rahasia99x' })).status, 200);
  });
});

