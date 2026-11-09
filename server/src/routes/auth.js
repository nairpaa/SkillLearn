import { Router } from 'express';
import User from '../models/User.js';
import AuthToken from '../models/AuthToken.js';
import { env } from '../config/env.js';
import { ACCESS_TOKEN_TTL, RESET_TOKEN_MINUTES, VERIFY_TOKEN_HOURS } from '../config/constants.js';
import { burnTime, hashPassword, verifyPassword } from '../auth/password.js';
import { issueAccessToken } from '../auth/tokens.js';
import { consumeOneTimeToken, createOneTimeToken, findOneTimeToken, markTokenUsed } from '../auth/oneTimeTokens.js';
import {
  REFRESH_COOKIE,
  SessionError,
  clearRefreshCookie,
  createSession,
  revokeAllSessions,
  revokeSession,
  rotateSession,
  setRefreshCookie,
} from '../auth/sessions.js';
import { requireAuth } from '../middleware/auth.js';
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyEmailInput,
  parse,
} from '../middleware/validate.js';
import {
  allowEvent,
  clearLoginFailures,
  forgotIpLimiter,
  loginIpLimiter,
  refreshLimiter,
  registerLimiter,
  reauthLimiter,
  reserveLoginAttempt,
  resetLimiter,
  sendLocked,
  verifyLimiter,
  userLimiter,
} from '../middleware/rateLimit.js';
import { sendAccountExistsEmail, sendResetEmail, sendVerificationEmail } from '../services/emails.js';
import { defer } from '../services/defer.js';
import { HttpError, addMinutes, securityLog } from '../services/http.js';

const router = Router();
const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const recently = (date, ms) => date && Date.now() - date.getTime() < ms;

export const DEMO_LOCKED = 'Demo accounts can’t change their password or be deleted. Create your own account to try this.';

/**
 * Kirim pasangan token.
 * - mode 'cookie' (web): refresh token di cookie httpOnly, TIDAK pernah di body.
 * - mode 'body' (mobile): refresh token di body (disimpan di SecureStore).
 * refreshToken null = balapan refresh dalam masa tenggang: cukup access token baru.
 */
async function sendTokenPair(res, mode, user, session, refreshToken) {
  const body = { accessToken: await issueAccessToken(user, session._id), expiresIn: ACCESS_TOKEN_TTL };
  if (refreshToken) {
    if (mode === 'body') body.refreshToken = refreshToken;
    else setRefreshCookie(res, refreshToken, session.expiresAt);
  }
  res.json(body);
}

// Token verifikasi membawa hash password + nama dari pendaftaran yang memicunya.
async function sendVerification(user, { passwordHash, name }) {
  const token = await createOneTimeToken(user._id, 'verify', addMinutes(new Date(), VERIFY_TOKEN_HOURS * 60), { passwordHash, name });
  await User.updateOne({ _id: user._id }, { $set: { lastVerificationSentAt: new Date() } });
  await sendVerificationEmail(user, token);
}

// POST /api/auth/register
// Selalu 202 "Check your inbox", baik email baru maupun sudah terdaftar (anti user enumeration).
// Semua kerja database & email dijalankan SETELAH respons, jadi lama respons juga tidak membocorkan apa pun.
router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password } = parse(RegisterInput, req.body);
  const passwordHash = await hashPassword(password);
  res.status(202).json({ message: 'Check your inbox' });

  defer(async () => {
    const existing = await User.findOne({ email });
    if (!existing) {
      const user = await User.create({ name, email, passwordHash });
      await allowEvent('verify-mail', email, 3, 60 * 60 * 1000);
      await sendVerification(user, { passwordHash, name });
    } else if (!existing.emailVerifiedAt) {
      // Akun belum aktif (bisa jadi didaftarkan orang lain duluan). Pendaftaran ini dapat link SENDIRI
      // yang terikat ke password-nya; data akun baru diganti saat link dibuka + password dikonfirmasi.
      // Jeda 1 menit + maksimal 3 email verifikasi per jam per alamat, supaya tidak bisa dipakai nge-spam.
      if (!recently(existing.lastVerificationSentAt, ONE_MINUTE) && (await allowEvent('verify-mail', email, 3, 60 * 60 * 1000))) {
        await sendVerification(existing, { passwordHash, name });
      }
    } else if (!recently(existing.lastNoticeSentAt, FIVE_MINUTES)) {
      existing.lastNoticeSentAt = new Date();
      await existing.save();
      await sendAccountExistsEmail(existing);
    }
  });
});

// POST /api/auth/verify-email  { token, password }
// Link dari email + password yang dipakai saat mendaftar. Tanpa password yang cocok, link tidak bisa
// mengaktifkan akun: inilah yang mencegah orang lain mendaftar duluan memakai email korban.
router.post('/verify-email', verifyLimiter, async (req, res) => {
  const { token, password } = parse(VerifyEmailInput, req.body);
  const doc = await findOneTimeToken(token, 'verify');
  if (!doc) throw new HttpError(400, 'TOKEN_INVALID', 'This link is invalid or has expired.');

  const user = await User.findById(doc.userId).select('+passwordHash');
  if (!user) throw new HttpError(400, 'TOKEN_INVALID', 'This link is invalid or has expired.');
  const expectedHash = doc.passwordHash || user.passwordHash;
  if (!(await verifyPassword(expectedHash, password))) {
    throw new HttpError(400, 'WRONG_PASSWORD', 'Enter the password you chose when you signed up.', {
      fields: { password: 'Enter the password you chose when you signed up.' },
    });
  }
  if (!(await markTokenUsed(doc))) throw new HttpError(400, 'TOKEN_INVALID', 'This link is invalid or has expired.');

  if (!user.emailVerifiedAt) {
    user.passwordHash = expectedHash;
    if (doc.name) user.name = doc.name;
    user.emailVerifiedAt = new Date();
    await user.save();
    // Link verifikasi lain untuk akun ini (mis. dari pendaftaran orang lain) tidak berlaku lagi.
    await AuthToken.deleteMany({ userId: user._id, purpose: 'verify' });
    await revokeAllSessions(user._id);
  }
  res.status(204).end();
});

// POST /api/auth/login
router.post('/login', loginIpLimiter, async (req, res) => {
  const { email, password } = parse(LoginInput, req.body);

  // Slot percobaan dipesan dulu (atomik), baru password dicek.
  const lockedUntil = await reserveLoginAttempt(req, email);
  if (lockedUntil) return sendLocked(res, lockedUntil);

  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user ? await verifyPassword(user.passwordHash, password) : await burnTime(password);

  if (!ok) {
    securityLog('login_failed', { userId: user ? String(user._id) : null, ip: req.clientIp });
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect. Check both and try again.' });
  }

  await clearLoginFailures(req, email);

  // 403 hanya muncul kalau password benar, jadi tidak membocorkan apa-apa ke orang yang tidak tahu password-nya.
  if (!user.emailVerifiedAt) {
    if (!recently(user.lastVerificationSentAt, FIVE_MINUTES)) {
      defer(() => sendVerification(user, { passwordHash: user.passwordHash, name: user.name }));
    }
    return res.status(403).json({
      error: 'EMAIL_NOT_VERIFIED',
      message: `Verify your email first. We sent a new link to ${user.email}.`,
    });
  }

  const { session, refreshToken } = await createSession(user, req);
  await sendTokenPair(res, req.get('x-client') === 'mobile' ? 'body' : 'cookie', user, session, refreshToken);
});

// POST /api/auth/refresh
router.post('/refresh', refreshLimiter, async (req, res) => {
  const { refreshToken: bodyToken } = parse(RefreshInput, req.body);
  const cookieToken = req.cookies?.[REFRESH_COOKIE];
  // Mode ditentukan dari ASAL token, bukan header: token dari cookie tidak pernah dibalas di body
  // (kalau tidak, skrip di halaman bisa menukar cookie httpOnly jadi token yang bisa dibaca).
  const mode = bodyToken ? 'body' : 'cookie';

  // Jalur cookie (web) dijaga dari CSRF: wajib header X-Requested-With (tidak bisa dikirim
  // situs lain tanpa izin CORS) dan Origin harus aplikasi kita sendiri.
  if (mode === 'cookie') {
    const origin = req.get('origin');
    let sameHost = false;
    try {
      sameHost = Boolean(origin) && new URL(origin).host === req.get('host');
    } catch {
      sameHost = false;
    }
    if (!req.get('x-requested-with') || !(env.appOrigins.includes(origin) || sameHost)) {
      return res.status(403).json({ error: 'INVALID_ORIGIN', message: 'Request origin is not allowed.' });
    }
  }

  try {
    const { session, refreshToken } = await rotateSession(bodyToken || cookieToken, req);
    const user = await User.findById(session.userId);
    if (!user) throw new SessionError('SESSION_INVALID');
    await sendTokenPair(res, mode, user, session, refreshToken);
  } catch (err) {
    if (!(err instanceof SessionError)) throw err;
    if (mode === 'cookie') clearRefreshCookie(res);
    res.status(401).json({ error: err.code, message: 'Your session expired. Log in again to continue where you left off.' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, userLimiter, async (req, res) => {
  const { allDevices = false } = parse(LogoutInput, req.body);
  // Akun demo dipakai bersama banyak orang: "keluar dari semua perangkat" hanya mengeluarkan perangkat ini.
  const demo = allDevices && (await User.exists({ _id: req.user.id, isDemo: true }));
  if (allDevices && !demo) await revokeAllSessions(req.user.id);
  else await revokeSession(req.user.sid, req.user.id);
  clearRefreshCookie(res);
  res.status(204).end();
});

// POST /api/auth/forgot-password
// Selalu 202 dan langsung dijawab; pencarian akun & kirim email jalan di belakang.
// Email yang sama maksimal dapat 3 link per jam. Akun demo tidak bisa di-reset.
router.post('/forgot-password', forgotIpLimiter, async (req, res) => {
  const { email } = parse(ForgotPasswordInput, req.body);
  res.status(202).json({ message: 'If an account exists for this email, a reset link is on its way.' });

  defer(async () => {
    const user = await User.findOne({ email });
    if (!user || user.isDemo) return;
    if (!(await allowEvent('forgot-email', email, 3, 60 * 60 * 1000))) return;
    const token = await createOneTimeToken(user._id, 'reset', addMinutes(new Date(), RESET_TOKEN_MINUTES));
    await sendResetEmail(user, token);
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', resetLimiter, async (req, res) => {
  const { token, password } = parse(ResetPasswordInput, req.body);
  const userId = await consumeOneTimeToken(token, 'reset');
  if (!userId) throw new HttpError(400, 'TOKEN_INVALID', 'This link is invalid or has expired.');

  const passwordHash = await hashPassword(password);
  // Bisa membuka link di email = terbukti pemilik email, jadi sekalian dianggap terverifikasi.
  // (Token reset tidak pernah dibuat untuk akun demo, lihat /forgot-password.)
  await User.updateOne({ _id: userId }, { $set: { passwordHash } });
  await User.updateOne({ _id: userId, emailVerifiedAt: null }, { $set: { emailVerifiedAt: new Date() } });
  await AuthToken.deleteMany({ userId, purpose: 'verify' });
  await revokeAllSessions(userId);
  securityLog('password_reset', { userId: String(userId), ip: req.clientIp });
  res.status(204).end();
});

// POST /api/auth/change-password  [ext]
router.post('/change-password', requireAuth, userLimiter, reauthLimiter, async (req, res) => {
  const { currentPassword, newPassword } = parse(ChangePasswordInput, req.body);
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user || !(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new HttpError(400, 'WRONG_PASSWORD', 'Current password is incorrect.', {
      fields: { currentPassword: 'Current password is incorrect.' },
    });
  }
  if (user.isDemo) throw new HttpError(403, 'DEMO_ACCOUNT', DEMO_LOCKED);
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await revokeAllSessions(user._id, req.user.sid); // perangkat lain keluar, perangkat ini tetap login
  securityLog('password_changed', { userId: String(user._id), ip: req.clientIp });
  res.status(204).end();
});

export default router;
