// Test rate limit yang tersimpan di MongoDB.
// IP pengirim disimulasikan lewat X-Forwarded-For (TRUST_PROXY=loopback di test), jadi tiap skenario tidak saling ganggu.
import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PASSWORD, close, createUser, login, loggedInUser, models, request, resetLimits, settle, testOutbox, uniqueEmail } from '../helpers.js';

after(close);
beforeEach(resetLimits);

let ipSeq = 10;
const nextIp = () => `203.0.113.${++ipSeq}`;
const tryLogin = (email, password, ip) => request().post('/api/auth/login').set('X-Forwarded-For', ip).send({ email, password });

describe('lockout login (IP + email)', () => {
  it('5 kali gagal → percobaan ke-6 kena 429 + Retry-After ±15 menit, walau password benar', async () => {
    const { email } = await createUser();
    const ip = nextIp();
    for (let i = 0; i < 5; i++) assert.equal((await tryLogin(email, 'SalahBanget1', ip)).status, 401);
    const locked = await tryLogin(email, PASSWORD, ip);
    assert.equal(locked.status, 429);
    assert.equal(locked.body.error, 'TOO_MANY_ATTEMPTS');
    const retry = Number(locked.headers['retry-after']);
    assert.ok(retry > 14 * 60 && retry <= 15 * 60, `Retry-After ${retry}`);
  });

  it('kunci hanya untuk kombinasi IP + email itu; IP lain tetap bisa login', async () => {
    const { email } = await createUser();
    const ip = nextIp();
    for (let i = 0; i < 5; i++) await tryLogin(email, 'SalahBanget1', ip);
    assert.equal((await tryLogin(email, PASSWORD, nextIp())).status, 200);
  });

  it('terkunci lagi dalam 24 jam → kunci berikutnya 1 jam', async () => {
    const { email } = await createUser();
    const ip = nextIp();
    for (let i = 0; i < 5; i++) await tryLogin(email, 'SalahBanget1', ip);
    const first = await tryLogin(email, 'SalahBanget1', ip);
    assert.equal(first.status, 429);
    assert.ok(Number(first.headers['retry-after']) <= 15 * 60);
    // Anggap kunci pertama sudah lewat.
    await models.RateLimit.collection.updateOne({ _id: `login:${ip}:${email}` }, { $set: { lockedUntil: new Date(Date.now() - 1000) } });
    for (let i = 0; i < 5; i++) await tryLogin(email, 'SalahBanget1', ip);
    const res = await tryLogin(email, PASSWORD, ip);
    assert.equal(res.status, 429);
    assert.ok(Number(res.headers['retry-after']) > 59 * 60);
  });

  it('login berhasil mengosongkan hitungan gagal', async () => {
    const { email } = await createUser();
    const ip = nextIp();
    for (let i = 0; i < 4; i++) await tryLogin(email, 'SalahBanget1', ip);
    assert.equal((await tryLogin(email, PASSWORD, ip)).status, 200);
    for (let i = 0; i < 4; i++) await tryLogin(email, 'SalahBanget1', ip);
    assert.equal((await tryLogin(email, PASSWORD, ip)).status, 200);
  });

  it('batas per IP: lebih dari 20 login gagal / 15 menit dari satu IP → 429 (email apa pun)', async () => {
    const ip = nextIp();
    for (let i = 0; i < 20; i++) assert.equal((await tryLogin(uniqueEmail('spray'), 'SalahBanget1', ip)).status, 401, `percobaan ${i + 1}`);
    assert.equal((await tryLogin(uniqueEmail('spray'), 'SalahBanget1', ip)).status, 429);
  });
});

describe('batas endpoint lain', () => {
  it('register: 5 per jam per IP', async () => {
    const ip = nextIp();
    for (let i = 0; i < 5; i++) {
      const res = await request().post('/api/auth/register').set('X-Forwarded-For', ip).send({ name: 'Tes Rate', email: uniqueEmail('rl'), password: PASSWORD });
      assert.equal(res.status, 202);
    }
    const sixth = await request().post('/api/auth/register').set('X-Forwarded-For', ip).send({ name: 'Tes Rate', email: uniqueEmail('rl'), password: PASSWORD });
    assert.equal(sixth.status, 429);
    assert.ok(sixth.headers['retry-after']);
  });

  it('forgot-password: email yang sama maksimal 3 link per jam, tetap dijawab 202', async () => {
    const { email } = await createUser();
    await settle();
    const before = testOutbox.filter((m) => m.to === email).length;
    for (let i = 0; i < 5; i++) {
      assert.equal((await request().post('/api/auth/forgot-password').set('X-Forwarded-For', nextIp()).send({ email })).status, 202);
      await settle();
    }
    assert.equal(testOutbox.filter((m) => m.to === email).length - before, 3);
  });

  it('forgot-password: 10 per jam per IP', async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i++) await request().post('/api/auth/forgot-password').set('X-Forwarded-For', ip).send({ email: uniqueEmail('f') });
    assert.equal((await request().post('/api/auth/forgot-password').set('X-Forwarded-For', ip).send({ email: uniqueEmail('f') })).status, 429);
  });

  it('verify-email & reset-password: masing-masing 10 per jam per IP (kuota terpisah)', async () => {
    const ip = nextIp();
    const verify = () => request().post('/api/auth/verify-email').set('X-Forwarded-For', ip).send({ token: 'x'.repeat(43), password: PASSWORD });
    for (let i = 0; i < 10; i++) assert.equal((await verify()).status, 400);
    assert.equal((await verify()).status, 429);
    // Salah ketik password di verifikasi tidak menghabiskan kuota reset password.
    assert.equal((await request().post('/api/auth/reset-password').set('X-Forwarded-For', ip).send({ token: 'x'.repeat(43), password: PASSWORD })).status, 400);
  });

  it('refresh: 30 per menit per refresh token', async () => {
    const { email } = await createUser();
    const { refreshToken } = await login(email);
    const ip = nextIp();
    for (let i = 0; i < 30; i++) {
      await request().post('/api/auth/refresh').set('X-Client', 'mobile').set('X-Forwarded-For', ip).send({ refreshToken });
    }
    const res = await request().post('/api/auth/refresh').set('X-Client', 'mobile').set('X-Forwarded-For', ip).send({ refreshToken });
    assert.equal(res.status, 429);
  });

  it('per pengguna: 100 request per menit', async () => {
    const user = await loggedInUser();
    const ip = nextIp();
    for (let i = 0; i < 100; i++) {
      const res = await request().get('/api/categories').set(user.auth).set('X-Forwarded-For', ip);
      assert.equal(res.status, 200, `request ${i + 1}`);
    }
    assert.equal((await request().get('/api/categories').set(user.auth).set('X-Forwarded-For', ip)).status, 429);
  });

  it('hitungan tersimpan di MongoDB dengan TTL', async () => {
    await tryLogin(uniqueEmail('ttl'), 'SalahBanget1', nextIp());
    const doc = await models.RateLimit.findOne({ _id: /^login:/ }).lean();
    assert.ok(doc.expireAt instanceof Date);
    const indexes = await models.RateLimit.collection.indexes();
    assert.ok(indexes.some((i) => i.key.expireAt === 1 && i.expireAfterSeconds === 0));
  });
});

describe('perbaikan hasil review keamanan', () => {
  it('[#5] 15 percobaan login paralel: hanya 5 yang dicek, sisanya 429', async () => {
    const { email } = await createUser();
    const ip = nextIp();
    const results = await Promise.all(Array.from({ length: 15 }, () => tryLogin(email, 'SalahBanget1', ip)));
    const codes = results.map((r) => r.status);
    assert.equal(codes.filter((c) => c === 401).length, 5, codes.join(','));
    assert.equal(codes.filter((c) => c === 429).length, 10, codes.join(','));
    // Satu ledakan percobaan = satu kunci (15 menit), bukan langsung 1 jam.
    const after = await tryLogin(email, PASSWORD, ip);
    assert.ok(Number(after.headers['retry-after']) <= 15 * 60);
  });

  it('[#6] ganti password: 5 tebakan salah per 15 menit, berikutnya 429', async () => {
    const user = await loggedInUser();
    for (let i = 0; i < 5; i++) {
      const res = await request().post('/api/auth/change-password').set(user.auth).send({ currentPassword: 'TebakanSalah1', newPassword: 'BaruSekali88y' });
      assert.equal(res.status, 400);
    }
    const blocked = await request().post('/api/auth/change-password').set(user.auth).send({ currentPassword: PASSWORD, newPassword: 'BaruSekali88y' });
    assert.equal(blocked.status, 429);
  });

  it('[C] hapus akun: 5 tebakan password salah per 15 menit, berikutnya 429', async () => {
    const user = await loggedInUser();
    for (let i = 0; i < 5; i++) {
      assert.equal((await request().delete('/api/me').set(user.auth).send({ password: 'TebakanSalah1' })).status, 400);
    }
    assert.equal((await request().delete('/api/me').set(user.auth).send({ password: PASSWORD })).status, 429);
  });

  it('[E] login_locked dicatat sekali per kunci, bukan tiap percobaan saat terkunci', async (t) => {
    const lines = [];
    const spy = t.mock.method(console, 'warn', (msg) => lines.push(String(msg)));
    const { email } = await createUser();
    const ip = nextIp();
    for (let i = 0; i < 10; i++) await tryLogin(email, 'SalahBanget1', ip);
    spy.mock.restore();
    assert.equal(lines.filter((l) => l.includes('"login_locked"')).length, 1);
  });

  it('[review] memori lockout 24 jam baru dimulai saat terkunci, bukan saat percobaan pertama', async () => {
    const { email } = await createUser();
    const ip = nextIp();
    assert.equal((await tryLogin(email, PASSWORD, ip)).status, 200);
    const doc = await models.RateLimit.collection.findOne({ _id: `login:${ip}:${email}` });
    assert.equal(doc.lockoutsResetAt, null);
    assert.ok(doc.expireAt instanceof Date, 'dokumen tetap punya TTL');
  });
});
