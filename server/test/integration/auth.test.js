// Test integrasi alur autentikasi lewat HTTP (supertest + MongoDB in-memory).
import { after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ORIGIN,
  PASSWORD,
  close,
  createUser,
  lastMail,
  linkToken,
  login,
  models,
  request,
  resetLimits,
  settle,
  testOutbox,
  uniqueEmail,
} from '../helpers.js';

after(close);
beforeEach(resetLimits);

const webRefresh = (cookie, origin = ORIGIN) =>
  request().post('/api/auth/refresh').set('Cookie', cookie).set('Origin', origin).set('X-Requested-With', 'XMLHttpRequest');

describe('register & verifikasi email', () => {
  it('email baru → 202, akun dibuat belum terverifikasi, link verifikasi dikirim', async () => {
    const email = uniqueEmail('reg');
    const res = await request().post('/api/auth/register').send({ name: 'Alya Rahma', email, password: PASSWORD });
    assert.equal(res.status, 202);
    assert.equal(res.body.message, 'Check your inbox');
    await settle();
    const user = await models.User.findOne({ email }).select('+passwordHash');
    assert.equal(user.emailVerifiedAt, null);
    assert.match(user.passwordHash, /^\$argon2id\$/);
    assert.ok(await linkToken(email, 'verify-email'));
  });

  it('email sudah terdaftar → tetap 202 dengan pesan sama, pemilik dapat email pemberitahuan', async () => {
    const { email } = await createUser();
    const res = await request().post('/api/auth/register').send({ name: 'Orang Lain', email, password: 'BedaLagi77x' });
    assert.equal(res.status, 202);
    assert.equal(res.body.message, 'Check your inbox');
    await settle();
    assert.match(testOutbox.at(-1).subject, /already have a SkillLearn account/);
    assert.equal(await models.User.countDocuments({ email }), 1);
  });

  it('login sebelum verifikasi → 403 EMAIL_NOT_VERIFIED (hanya kalau password benar)', async () => {
    const { email } = await createUser({ verified: false });
    const ok = await request().post('/api/auth/login').send({ email, password: PASSWORD });
    assert.equal(ok.status, 403);
    assert.equal(ok.body.error, 'EMAIL_NOT_VERIFIED');
    const wrong = await request().post('/api/auth/login').send({ email, password: 'SalahBanget1' });
    assert.equal(wrong.status, 401);
  });

  it('verify-email sekali pakai; link kedua kali ditolak', async () => {
    const email = uniqueEmail('verify');
    await request().post('/api/auth/register').send({ name: 'Bima', email, password: PASSWORD });
    const token = await linkToken(email, 'verify-email');
    assert.equal((await request().post('/api/auth/verify-email').send({ token, password: PASSWORD })).status, 204);
    const again = await request().post('/api/auth/verify-email').send({ token, password: PASSWORD });
    assert.equal(again.status, 400);
    assert.equal(again.body.error, 'TOKEN_INVALID');
    assert.equal((await request().post('/api/auth/login').send({ email, password: PASSWORD })).status, 200);
  });

  it('token verifikasi kedaluwarsa ditolak', async () => {
    const email = uniqueEmail('expired');
    await request().post('/api/auth/register').send({ name: 'Citra', email, password: PASSWORD });
    const token = await linkToken(email, 'verify-email');
    await models.AuthToken.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await request().post('/api/auth/verify-email').send({ token, password: PASSWORD })).status, 400);
  });

  it('menolak field tambahan dan input bukan JSON', async () => {
    const extra = await request().post('/api/auth/register').send({ name: 'Dodi', email: uniqueEmail(), password: PASSWORD, role: 'admin' });
    assert.equal(extra.status, 400);
    assert.equal(extra.body.fields.role, 'Unknown field.');
    const bad = await request().post('/api/auth/register').set('Content-Type', 'application/json').send('{rusak');
    assert.equal(bad.status, 400);
  });
});

describe('login', () => {
  it('email tidak terdaftar & password salah → 401 dengan pesan identik', async () => {
    const { email } = await createUser();
    const a = await request().post('/api/auth/login').send({ email, password: 'SalahBanget1' });
    const b = await request().post('/api/auth/login').send({ email: uniqueEmail('nobody'), password: 'SalahBanget1' });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.deepEqual(a.body, b.body);
    assert.equal(a.body.error, 'INVALID_CREDENTIALS');
  });

  it('web: access token di body, refresh token di cookie httpOnly + SameSite=Strict + Path=/api/auth', async () => {
    const { email } = await createUser();
    const { res, cookie } = await login(email, PASSWORD, { web: true });
    assert.match(res.body.accessToken, /^v4\.public\./);
    assert.equal(res.body.expiresIn, 900);
    assert.equal(res.body.refreshToken, undefined);
    const raw = res.headers['set-cookie'].find((c) => c.startsWith('sl_rt='));
    assert.match(raw, /HttpOnly/);
    assert.match(raw, /SameSite=Strict/);
    assert.match(raw, /Path=\/api\/auth/);
    assert.ok(cookie);
    assert.equal(res.headers['cache-control'], 'no-store');
  });

  it('mobile (X-Client: mobile): refresh token di body, tanpa cookie', async () => {
    const { email } = await createUser();
    const { res } = await login(email);
    assert.ok(res.body.refreshToken);
    assert.equal(res.headers['set-cookie'], undefined);
  });

  it('refresh token hanya disimpan sebagai hash SHA-256', async () => {
    const { email, user } = await createUser();
    const { refreshToken } = await login(email);
    const session = await models.Session.findOne({ userId: user._id });
    assert.notEqual(session.tokenHash, refreshToken);
    assert.match(session.tokenHash, /^[a-f0-9]{64}$/);
  });
});

describe('refresh token', () => {
  it('web: wajib X-Requested-With dan Origin aplikasi sendiri (anti CSRF)', async () => {
    const { email } = await createUser();
    const { cookie } = await login(email, PASSWORD, { web: true });
    const noHeader = await request().post('/api/auth/refresh').set('Cookie', cookie).set('Origin', ORIGIN);
    assert.equal(noHeader.status, 403);
    assert.equal(noHeader.body.error, 'INVALID_ORIGIN');
    assert.equal((await webRefresh(cookie, 'https://evil.example')).status, 403);
    const noOrigin = await request().post('/api/auth/refresh').set('Cookie', cookie).set('X-Requested-With', 'XMLHttpRequest');
    assert.equal(noOrigin.status, 403);
    assert.equal((await webRefresh(cookie)).status, 200);
  });

  it('rotasi: token lama tidak bisa dipakai lagi, reuse mencabut seluruh family', async () => {
    const { email } = await createUser();
    const { cookie: rt1 } = await login(email, PASSWORD, { web: true });
    const first = await webRefresh(rt1);
    assert.equal(first.status, 200);
    const rt2 = first.headers['set-cookie'].find((c) => c.startsWith('sl_rt=')).split(';')[0];
    assert.notEqual(rt2, rt1);

    // Token lama dipakai dari perangkat lain (user-agent berbeda) → bukan balapan wajar, dianggap pencurian.
    const reuse = await webRefresh(rt1).set('User-Agent', 'perangkat-penyerang/1.0');
    assert.equal(reuse.status, 401);
    assert.equal(reuse.body.error, 'SESSION_INVALID');
    // Token terbaru milik pengguna asli ikut dicabut.
    const after = await webRefresh(rt2);
    assert.equal(after.status, 401);
    assert.equal(after.body.error, 'SESSION_EXPIRED');
    // Access token dari sesi itu juga langsung mati.
    const me = await request().get('/api/me').set('Authorization', `Bearer ${first.body.accessToken}`);
    assert.equal(me.status, 401);
  });

  it('mobile: rotasi lewat body', async () => {
    const { email } = await createUser();
    const { refreshToken } = await login(email);
    const res = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken });
    assert.equal(res.status, 200);
    assert.ok(res.body.refreshToken);
    assert.notEqual(res.body.refreshToken, refreshToken);
  });

  it('refresh token kedaluwarsa (sliding 7 hari / absolut 30 hari) ditolak', async () => {
    const { email, user } = await createUser();
    const { refreshToken } = await login(email);
    await models.Session.updateOne({ userId: user._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const res = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'SESSION_EXPIRED');
  });

  it('sliding expiry tidak pernah melewati batas absolut', async () => {
    const { email, user } = await createUser();
    const { refreshToken } = await login(email);
    const limit = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    await models.Session.updateOne({ userId: user._id }, { $set: { absoluteExpiresAt: limit } });
    await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken });
    const s = await models.Session.findOne({ userId: user._id });
    assert.ok(s.expiresAt <= limit);
  });

  it('token sembarang → 401 SESSION_INVALID', async () => {
    const res = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken: 'x'.repeat(43) });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'SESSION_INVALID');
  });
});

describe('logout', () => {
  it('mencabut sesi ini saja; sesi lain tetap jalan', async () => {
    const { email } = await createUser();
    const a = await login(email);
    const b = await login(email);
    assert.equal((await request().post('/api/auth/logout').set('Authorization', `Bearer ${a.accessToken}`).send({})).status, 204);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${a.accessToken}`)).status, 401);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${b.accessToken}`)).status, 200);
    const refresh = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken: a.refreshToken });
    assert.equal(refresh.status, 401);
  });

  it('allDevices: semua sesi dicabut', async () => {
    const { email } = await createUser();
    const a = await login(email);
    const b = await login(email);
    await request().post('/api/auth/logout').set('Authorization', `Bearer ${a.accessToken}`).send({ allDevices: true });
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${b.accessToken}`)).status, 401);
  });
});

describe('lupa & reset password', () => {
  it('selalu 202 dengan pesan sama, terdaftar atau tidak', async () => {
    const { email } = await createUser();
    const a = await request().post('/api/auth/forgot-password').send({ email });
    const b = await request().post('/api/auth/forgot-password').send({ email: uniqueEmail('ghost') });
    assert.equal(a.status, 202);
    assert.equal(b.status, 202);
    assert.deepEqual(a.body, b.body);
    assert.ok(await linkToken(email, 'reset-password'));
  });

  it('reset: password baru dipakai, semua sesi dicabut, link sekali pakai', async () => {
    const { email } = await createUser();
    const session = await login(email);
    await request().post('/api/auth/forgot-password').send({ email });
    const token = await linkToken(email, 'reset-password');

    const weak = await request().post('/api/auth/reset-password').send({ token, password: 'password123' });
    assert.equal(weak.status, 400);

    assert.equal((await request().post('/api/auth/reset-password').send({ token, password: 'BaruSekali88y' })).status, 204);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${session.accessToken}`)).status, 401);
    assert.equal((await request().post('/api/auth/reset-password').send({ token, password: 'BaruSekali88y' })).status, 400);
    assert.equal((await request().post('/api/auth/login').send({ email, password: PASSWORD })).status, 401);
    assert.equal((await request().post('/api/auth/login').send({ email, password: 'BaruSekali88y' })).status, 200);
  });

  it('link reset kedaluwarsa (30 menit) ditolak', async () => {
    const { email } = await createUser();
    await request().post('/api/auth/forgot-password').send({ email });
    const token = await linkToken(email, 'reset-password');
    await models.AuthToken.updateMany({ purpose: 'reset' }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await request().post('/api/auth/reset-password').send({ token, password: 'BaruSekali88y' })).status, 400);
  });

  it('reset juga memverifikasi email yang belum terverifikasi', async () => {
    const { email, user } = await createUser({ verified: false });
    await request().post('/api/auth/forgot-password').send({ email });
    await request().post('/api/auth/reset-password').send({ token: await linkToken(email, 'reset-password'), password: 'BaruSekali88y' });
    assert.ok((await models.User.findById(user._id)).emailVerifiedAt);
  });
});

describe('ganti password', () => {
  it('password lama salah → 400 WRONG_PASSWORD di field currentPassword', async () => {
    const { email } = await createUser();
    const { accessToken } = await login(email);
    const res = await request().post('/api/auth/change-password').set('Authorization', `Bearer ${accessToken}`).send({ currentPassword: 'SalahBanget1', newPassword: 'BaruSekali88y' });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'WRONG_PASSWORD');
    assert.ok(res.body.fields.currentPassword);
  });

  it('berhasil: sesi ini tetap, sesi lain dicabut', async () => {
    const { email } = await createUser();
    const here = await login(email);
    const other = await login(email);
    const res = await request().post('/api/auth/change-password').set('Authorization', `Bearer ${here.accessToken}`).send({ currentPassword: PASSWORD, newPassword: 'BaruSekali88y' });
    assert.equal(res.status, 204);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${here.accessToken}`)).status, 200);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${other.accessToken}`)).status, 401);
  });
});

describe('perbaikan hasil review keamanan', () => {
  it('[#2] mendaftar duluan memakai email korban tidak bisa mengambil alih akun', async () => {
    const email = uniqueEmail('victim');
    await request().post('/api/auth/register').send({ name: 'Penyerang', email, password: 'PunyaPenyerang1' });
    const attackerLink = await linkToken(email, 'verify-email');
    // Korban mendaftar setelah jeda kirim ulang (1 menit) lewat.
    await models.User.updateOne({ email }, { $set: { lastVerificationSentAt: new Date(Date.now() - 2 * 60 * 1000) } });
    await request().post('/api/auth/register').send({ name: 'Korban Asli', email, password: PASSWORD });
    const victimLink = await linkToken(email, 'verify-email');
    assert.notEqual(attackerLink, victimLink);

    // Link pendaftaran penyerang tidak bisa dipakai dengan password korban.
    const wrong = await request().post('/api/auth/verify-email').send({ token: attackerLink, password: PASSWORD });
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.error, 'WRONG_PASSWORD');

    // Korban memakai link miliknya → akun aktif dengan password & nama korban.
    assert.equal((await request().post('/api/auth/verify-email').send({ token: victimLink, password: PASSWORD })).status, 204);
    assert.equal((await request().post('/api/auth/login').send({ email, password: PASSWORD })).status, 200);
    assert.equal((await request().post('/api/auth/login').send({ email, password: 'PunyaPenyerang1' })).status, 401);
    assert.equal((await models.User.findOne({ email })).name, 'Korban Asli');
    // Link penyerang ikut hangus.
    assert.equal((await request().post('/api/auth/verify-email').send({ token: attackerLink, password: 'PunyaPenyerang1' })).status, 400);
  });

  it('[#2] password salah di halaman verifikasi tidak menghanguskan link', async () => {
    const email = uniqueEmail('verifypw');
    await request().post('/api/auth/register').send({ name: 'Dina', email, password: PASSWORD });
    const token = await linkToken(email, 'verify-email');
    assert.equal((await request().post('/api/auth/verify-email').send({ token, password: 'SalahBanget1' })).status, 400);
    assert.equal((await request().post('/api/auth/verify-email').send({ token, password: PASSWORD })).status, 204);
  });

  it('[#11] email verifikasi tidak memuat nama yang diisi pendaftar', async () => {
    const email = uniqueEmail('phish');
    await request().post('/api/auth/register').send({ name: 'https://evil.example/login Klik', email, password: PASSWORD });
    const mail = await lastMail(email);
    assert.ok(!mail.text.includes('evil.example'));
    assert.ok(!mail.html.includes('evil.example'));
  });

  it('[#3] register & forgot dijawab sebelum kerja database/email dijalankan', async () => {
    const { email } = await createUser();
    const before = testOutbox.length;
    const res = await request().post('/api/auth/forgot-password').send({ email });
    assert.equal(res.status, 202);
    assert.equal(testOutbox.length, before, 'email belum boleh terkirim saat respons diterima');
    await settle();
    assert.equal(testOutbox.length, before + 1);
  });

  it('[#7] refresh via cookie tidak pernah membalas refresh token di body, walau ada X-Client: mobile', async () => {
    const { email } = await createUser();
    const { cookie } = await login(email, PASSWORD, { web: true });
    const res = await webRefresh(cookie).set('X-Client', 'mobile');
    assert.equal(res.status, 200);
    assert.equal(res.body.refreshToken, undefined);
    assert.ok(res.headers['set-cookie'].some((c) => c.startsWith('sl_rt=')));
  });

  it('[#8/A] refresh bersamaan: tidak error 500, semua mendapat refresh token baru yang SAMA', async () => {
    const { email } = await createUser();
    const { refreshToken } = await login(email);
    const results = await Promise.all(
      Array.from({ length: 3 }, () => request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken }))
    );
    assert.deepEqual(results.map((r) => r.status), [200, 200, 200]);
    const tokens = new Set(results.map((r) => r.body.refreshToken));
    assert.equal(tokens.size, 1, 'rotasi idempoten: token baru identik');
    assert.notEqual([...tokens][0], refreshToken);
    const next = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken: [...tokens][0] });
    assert.equal(next.status, 200);
  });

  it('[A] respons refresh hilang: mengulang dengan token lama (≤2 menit, perangkat sama) mendapat token yang sama', async () => {
    const { email, user } = await createUser();
    const { refreshToken } = await login(email);
    const other = await login(email);
    const lost = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken });
    // Klien baru mencoba lagi 90 detik kemudian (masih dalam masa tenggang 2 menit).
    await models.Session.updateMany({ userId: user._id }, { $set: { rotatedAt: new Date(Date.now() - 90 * 1000) } });
    const retry = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken });
    assert.equal(retry.status, 200);
    assert.equal(retry.body.refreshToken, lost.body.refreshToken);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${other.accessToken}`)).status, 200, 'perangkat lain tidak ikut keluar');
  });

  it('[B] masa tenggang dibatasi: maks 3 kali, perangkat sama, ≤2 menit; selebihnya dianggap pencurian', async () => {
    const { email } = await createUser();
    const { refreshToken } = await login(email);
    const refresh = (ua) => {
      const r = request().post('/api/auth/refresh').set('X-Client', 'mobile');
      if (ua) r.set('User-Agent', ua);
      return r.send({ refreshToken });
    };
    assert.equal((await refresh()).status, 200); // rotasi asli
    for (let i = 0; i < 3; i++) assert.equal((await refresh()).status, 200, `tenggang ke-${i + 1}`);
    assert.equal((await refresh()).status, 401, 'jatah tenggang habis');

    // Perangkat lain (user-agent beda) langsung ditolak, walau masih dalam 2 menit.
    const b = await createUser();
    const s2 = await login(b.email);
    await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken: s2.refreshToken });
    assert.equal((await request().post('/api/auth/refresh').set('X-Client', 'mobile').set('User-Agent', 'curl/8').send({ refreshToken: s2.refreshToken })).status, 401);

    // Lewat 2 menit → pencurian.
    const c = await createUser();
    const s3 = await login(c.email);
    await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken: s3.refreshToken });
    await models.Session.updateMany({ userId: c.user._id }, { $set: { rotatedAt: new Date(Date.now() - 3 * 60 * 1000) } });
    assert.equal((await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken: s3.refreshToken })).status, 401);
  });

  it('[#10] reuse refresh token mencabut SEMUA sesi pengguna, bukan cuma satu', async () => {
    const { email } = await createUser();
    const a = await login(email);
    const other = await login(email);
    const first = await request().post('/api/auth/refresh').set('X-Client', 'mobile').send({ refreshToken: a.refreshToken });
    assert.equal(first.status, 200);
    const reuse = await request().post('/api/auth/refresh').set('X-Client', 'mobile').set('User-Agent', 'perangkat-penyerang/1.0').send({ refreshToken: a.refreshToken });
    assert.equal(reuse.status, 401);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${other.accessToken}`)).status, 401);
  });

  it('[#6] sesi per pengguna dibatasi 10 terbaru', async () => {
    const { email, user } = await createUser();
    for (let i = 0; i < 12; i++) await login(email, PASSWORD, { ip: `198.51.100.${i + 1}` });
    assert.equal(await models.Session.countDocuments({ userId: user._id }), 10);
  });

  it('[#4] akun demo: tidak bisa ganti password, dihapus, atau di-reset', async () => {
    const { email } = await createUser({ isDemo: true });
    const { accessToken } = await login(email);
    const auth = { Authorization: `Bearer ${accessToken}` };
    const change = await request().post('/api/auth/change-password').set(auth).send({ currentPassword: PASSWORD, newPassword: 'BaruSekali88y' });
    assert.equal(change.status, 403);
    assert.equal(change.body.error, 'DEMO_ACCOUNT');
    const del = await request().delete('/api/me').set(auth).send({ password: PASSWORD });
    assert.equal(del.status, 403);
    const before = testOutbox.filter((m) => m.to === email).length;
    assert.equal((await request().post('/api/auth/forgot-password').send({ email })).status, 202);
    await settle();
    assert.equal(testOutbox.filter((m) => m.to === email).length, before, 'akun demo tidak boleh dapat link reset');
    assert.equal((await request().post('/api/auth/login').send({ email, password: PASSWORD })).status, 200);
  });

  it('[D] email verifikasi maksimal 3 per jam per alamat', async () => {
    const email = uniqueEmail('spamverify');
    for (let i = 0; i < 5; i++) {
      await request().post('/api/auth/register').set('X-Forwarded-For', `198.51.100.${100 + i}`).send({ name: 'Spam', email, password: PASSWORD });
      await settle();
      await models.User.updateOne({ email }, { $set: { lastVerificationSentAt: new Date(Date.now() - 2 * 60 * 1000) } });
    }
    assert.equal(testOutbox.filter((m) => m.to === email).length, 3);
  });

  it('[7] akun demo: "keluar dari semua perangkat" hanya mengeluarkan perangkat ini', async () => {
    const { email } = await createUser({ isDemo: true });
    const a = await login(email);
    const b = await login(email);
    await request().post('/api/auth/logout').set('Authorization', `Bearer ${a.accessToken}`).send({ allDevices: true });
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${a.accessToken}`)).status, 401);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${b.accessToken}`)).status, 200);
  });

  it('[review] token yang lebih tua dari 50 rotasi tetap terdeteksi sebagai pencurian', async () => {
    const { email, user } = await createUser();
    const first = await login(email);
    const other = await login(email);
    let token = first.refreshToken;
    for (let i = 0; i < 52; i++) {
      const r = await request().post('/api/auth/refresh').set('X-Client', 'mobile').set('X-Forwarded-For', `198.51.100.${(i % 200) + 1}`).send({ refreshToken: token });
      assert.equal(r.status, 200, `rotasi ${i + 1}`);
      token = r.body.refreshToken;
    }
    assert.ok(!(await models.Session.exists({ prevHashes: (await import('node:crypto')).createHash('sha256').update(first.refreshToken).digest('hex') })));
    const replay = await request().post('/api/auth/refresh').set('X-Client', 'mobile').set('User-Agent', 'curl/8').send({ refreshToken: first.refreshToken });
    assert.equal(replay.status, 401);
    assert.equal((await request().get('/api/me').set('Authorization', `Bearer ${other.accessToken}`)).status, 401, 'semua sesi dicabut');
    assert.ok(await models.RetiredToken.countDocuments({ userId: user._id }) >= 52);
  });
});
