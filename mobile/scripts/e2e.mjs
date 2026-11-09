// Uji alur end-to-end UI web (react-native-web) terhadap API asli, pakai akun baru supaya data demo tidak berubah.
// Butuh: Expo web di :8081, API di :8080, dan SERVER_LOG (log server berisi link verifikasi email).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'screenshots');
const BASE = process.env.WEB_URL || 'http://localhost:8081';
const API = process.env.API || 'http://localhost:8080/api';
const LOG = process.env.SERVER_LOG;
const email = process.env.E2E_EMAIL || `mobile.e2e.${Date.now()}@student.ac.id`;
const PASS = 'Kursus2026x';

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`);
};
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
const apiCalls = [];
page.on('request', (r) => {
  if (r.url().startsWith(API)) apiCalls.push(`${r.method()} ${r.url().slice(API.length)}`);
});
const visible = (text, exact = true) => page.getByText(text, { exact }).filter({ visible: true }).first().isVisible().catch(() => false);
const waitText = (text, timeout = 15000, exact = true) =>
  page.getByText(text, { exact }).filter({ visible: true }).first().waitFor({ timeout }).then(() => true, () => false);
const shot = (name) => page.screenshot({ path: path.join(OUT, `e2e-${name}.png`) });
const tap = async (role, name, opts = {}) => {
  await page.getByRole(role, { name, exact: true, ...opts }).first().click();
  await page.waitForTimeout(600);
};
const fill = (label, v) => page.getByLabel(label, { exact: true }).first().fill(v);

async function loginUi(pw = PASS) {
  await fill('Email', email);
  await fill('Password', pw);
  await page.getByRole('button', { name: 'Log in' }).click();
}

const reuse = !!process.env.E2E_EMAIL; // akun yang sudah terverifikasi → lewati register (rate limit 5/jam)
try {
  if (reuse) {
    await page.goto(BASE);
    await waitText('Create account', 60000);
    await tap('button', 'Log in');
  } else {
  // 1. Register → selalu "Check your inbox"
  await page.goto(BASE);
  await waitText('Create account', 60000);
  await tap('button', 'Create account');
  await fill('Full name', 'Mobile Tester');
  await fill('Email', email);
  await fill('Password', PASS);
  await fill('Confirm password', PASS);
  await tap('checkbox', 'I agree to the Terms and Privacy Policy');
  await page.getByRole('button', { name: 'Create account' }).click();
  check('register → Check your inbox', await waitText('Check your inbox', 30000));
  await shot('register-done');

  // 2. Login sebelum verifikasi → banner info EMAIL_NOT_VERIFIED
  await tap('button', 'Go to log in');
  await loginUi();
  check('login unverified → info banner', await waitText(`Verify your email first. We sent a new link to ${email}.`, 20000));
  await shot('login-unverified');

  // 3. Verifikasi lewat token di log server
  let verified = false;
  if (LOG) {
    const log = fs.readFileSync(LOG, 'utf8');
    const idx = log.lastIndexOf(`[mail] Untuk: ${email}`);
    const m = idx >= 0 && log.slice(idx).match(/verify-email\?token=([\w-]+)/);
    if (m) {
      const r = await fetch(`${API}/auth/verify-email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: m[1] }) });
      verified = r.status === 204;
    }
  }
  check('verify email via API', verified);

  // 4. Password salah → banner 401 (1 kegagalan saja)
  await loginUi('SalahBanget1');
  check('login wrong password → 401 banner', await waitText('Email or password is incorrect. Check both and try again.', 20000));

  }
  // 5. Login benar → Home pengguna baru (Get started)
  await loginUi();
  check('login → Home', await waitText('Popular courses', 60000));
  if (!reuse) {
  check('new user sees Get started card', await visible('Start your first course'));
  check('get-started copy', await visible('is a good first pick: 12 short lessons for beginners.', false));

  // 6. Favorit: toggle + toast + Undo
  const saveBtn = page.getByRole('button', { name: 'Save to favorites' }).first();
  await saveBtn.click();
  check('toast Saved to favorites', await waitText('Saved to favorites', 3000));
  await shot('toast');
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.waitForTimeout(1500);
  const favRes = await page.evaluate(async () => null);
  check('undo restores bookmark', (await page.getByRole('button', { name: 'Saved. Remove from favorites' }).count()) === 0);
  await page.getByRole('button', { name: 'Save to favorites' }).first().click();
  await page.waitForTimeout(1200);

  // 7. Course detail → play video (iframe youtube-nocookie) → progress
  await page.getByText('Start your first course').click();
  check('course detail opens', await page.getByRole('tab', { name: 'About' }).waitFor({ timeout: 20000 }).then(() => true, () => false));
  await page.getByRole('button', { name: /^Play lesson 1/ }).click();
  await page.waitForTimeout(2500);
  const iframeSrc = await page.locator('iframe').first().getAttribute('src').catch(() => null);
  check('video iframe src', !!iframeSrc && iframeSrc.startsWith('https://www.youtube-nocookie.com/embed/') && /autoplay=1&playsinline=1&start=\d+&rel=0/.test(iframeSrc), iframeSrc || '');
  check('POST /me/history on play', apiCalls.some((c) => c === 'POST /me/history'));
  check('PUT progress on play', apiCalls.some((c) => c.startsWith('PUT /me/progress/')));
  await page.waitForTimeout(1500);
  check('CTA becomes Continue lesson 2', await waitText('Continue lesson 2', 10000));
  await shot('video-playing');

  // 8. Artikel → Next → lesson berikutnya (video) diputar di Course Detail
  await page.getByText('JSX explained', { exact: true }).click();
  check('article opens', await waitText('Lesson 2 of 12', 15000));
  await page.getByRole('button', { name: 'Copy code' }).first().click();
  check('copy → Copied', await waitText('Copied', 3000));
  await page.getByRole('button', { name: /^Next: / }).click();
  await page.waitForTimeout(2500);
  check('next from article → video lesson 3 playing', await visible('NOW PLAYING · LESSON 3 — COMPONENTS & PROPS'));

  // 9. Kuis: jawab semua lalu See results
  await page.getByText('Quiz: Components', { exact: true }).click();
  check('quiz opens', await waitText('1/3', 15000));
  for (let i = 0; i < 3; i++) {
    await page.getByRole('radio').first().click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: i === 2 ? 'See results' : 'Next question' }).click();
    await page.waitForTimeout(700);
  }
  check('quiz results', await waitText('QUIZ COMPLETE', 20000));
  check('quiz score shown', await visible('correct'));
  await shot('quiz-results');
  check('POST attempts', apiCalls.some((c) => /^POST \/quizzes\/\w+\/attempts$/.test(c)));
  await page.getByRole('button', { name: 'Retry quiz' }).click();
  check('retry resets quiz', await waitText('1/3', 5000));
  await page.getByRole('button', { name: 'Exit quiz' }).click();
  await page.waitForTimeout(800);

  // 10. Practice: submit belum lengkap → info; centang semua → sukses
  await page.getByText('Practice: Build a to-do list', { exact: true }).click();
  check('practice opens', await waitText('Practice · Lesson 6', 15000));
  await page.getByRole('button', { name: 'Submit practice' }).click();
  check('practice info banner', await waitText('Finish all 4 tasks before submitting.', 3000));
  for (const cb of await page.getByRole('checkbox').all()) await cb.click();
  await page.getByRole('tab', { name: 'Code' }).click();
  const editor = page.getByLabel(/^Code editor/);
  const sol = (await editor.inputValue())
    .replace('// TODO: create state for the todo list and the input text', 'const [todos, setTodos] = useState([]);\n  const [text, setText] = useState("");')
    .replace('// TODO: add the text to the list, then clear the input', 'setTodos([...todos, text]);\n    setText("");')
    .replace('{/* TODO: render every todo with map() */}', '{todos.map(t => <li key={t}>{t}</li>)}');
  await editor.fill(sol);
  await page.getByRole('button', { name: 'Run code' }).click();
  check('run → 5 of 5 checks passed', await waitText('5 of 5 checks passed', 3000));
  await page.getByRole('button', { name: 'Submit practice' }).click();
  check('practice success banner', await waitText('Practice submitted. React Fundamentals lesson 6 is complete.', 15000));
  await shot('practice-success');
  await page.getByRole('button', { name: 'Back to course' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: 'Back', exact: true }).first().click();
  await page.waitForTimeout(1200);

  // 11. Home sekarang menampilkan Continue learning
  check('home shows CONTINUE LEARNING', await waitText('CONTINUE LEARNING', 15000));
  }

  // 12. Profile: stats, favorit, riwayat
  await page.getByRole('tab', { name: 'Profile' }).click();
  await page.waitForTimeout(1500);
  check('profile favorite listed', await visible('React Fundamentals: Build Your First App'));
  await page.getByRole('tab', { name: 'History' }).click();
  await page.waitForTimeout(1500);
  check('history listed', await visible('JSX explained'));
  await shot('profile-history');

  // 13. Edit profile: password lama salah → error field; lalu simpan nama baru
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await waitText('Change password', 10000);
  await page.getByLabel(/^Full name/).fill('Mobile Tester Dua');
  await page.getByLabel(/^Current password/).fill('SalahBanget1');
  await page.getByLabel(/^New password/).fill('Kursus2027x');
  await page.getByRole('button', { name: 'Save changes' }).click();
  check('wrong current password → field error', await waitText('Current password is incorrect.', 15000));
  await page.getByLabel(/^Current password/).fill('');
  await page.getByLabel(/^New password/).fill('');
  await page.getByRole('button', { name: 'Save changes' }).click();
  check('Profile updated banner', await waitText('Profile updated.', 15000));
  await page.waitForTimeout(1800);
  check('back to profile with new name', await visible('Mobile Tester Dua'));

  // 14. Error state: /courses gagal → StatusBlock error → Try again pulih
  await page.route('**/api/courses**', (r) => r.abort('failed'));
  await page.getByRole('tab', { name: 'Search' }).click();
  await page.getByRole('textbox', { name: 'Search courses' }).fill('react');
  check('search error state', await waitText("Couldn't load content", 20000));
  await shot('search-error');
  await page.unroute('**/api/courses**');
  await page.getByRole('button', { name: 'Try again' }).click();
  check('try again recovers', await waitText('1 course', 20000));

  // 15. Not found: detail course 404
  await page.route('**/api/courses/react', (r) => r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'NOT_FOUND', message: 'Course not found.' }) }));
  await page.getByRole('button', { name: /^React Fundamentals: Build Your First App\. Programming/ }).last().click();
  check('course not found state', await waitText('Course not found', 15000));
  await shot('course-not-found');
  await page.unroute('**/api/courses/react');
  await page.getByRole('button', { name: 'Back to Home' }).click();
  await page.waitForTimeout(1200);

  // 16. Access token kedaluwarsa → refresh sekali → request diulang dan berhasil
  const refreshBefore = apiCalls.filter((c) => c === 'POST /auth/refresh').length;
  let first = true;
  await page.route('**/api/courses/cloud', (r) => {
    if (first) {
      first = false;
      return r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'TOKEN_INVALID_OR_EXPIRED', message: 'x' }) });
    }
    return r.continue();
  });
  await page.getByRole('button', { name: /^Intro to Cloud Computing\. Technology/ }).last().click();
  const cloudOk = await waitText('Intro to Cloud Computing', 20000);
  await page.waitForTimeout(1000);
  const refreshAfter = apiCalls.filter((c) => c === 'POST /auth/refresh').length;
  check('401 → single refresh → retry succeeds', cloudOk && refreshAfter === refreshBefore + 1 && (await page.getByRole('tab', { name: 'About' }).isVisible()), `refresh calls +${refreshAfter - refreshBefore}`);
  await page.unroute('**/api/courses/cloud');
  await page.getByRole('button', { name: 'Back', exact: true }).first().click();
  await page.waitForTimeout(800);

  // 17. Refresh gagal → Login dengan banner session expired
  await page.route('**/api/auth/refresh', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'SESSION_INVALID', message: 'x' }) }));
  await page.route('**/api/courses/ads', (r) => r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'TOKEN_INVALID_OR_EXPIRED', message: 'x' }) }));
  await page.getByRole('button', { name: /^Social Media Ads for Beginners\. Digital Marketing/ }).last().click();
  check('session expired → Login banner', await waitText('Your session expired. Log in again to continue.', 20000));
  await shot('session-expired');
  await page.unroute('**/api/auth/refresh');
  await page.unroute('**/api/courses/ads');

  // 18. Login lagi lalu Log out → Splash
  await loginUi();
  await waitText('Popular courses', 30000);
  await page.getByRole('tab', { name: 'Profile' }).click();
  await page.waitForTimeout(800);
  await page.getByText('Log out', { exact: true }).first().click();
  await page.waitForTimeout(500);
  check('logout sheet', await visible('Log out of SkillLearn?'));
  await page.getByRole('button', { name: 'Log out', exact: true }).last().click();
  check('logout → Splash', await waitText('Practical skills, outside the classroom.', 15000));
  check('POST /auth/logout', apiCalls.includes('POST /auth/logout'));
} catch (e) {
  console.log('ERROR', e.message.split('\n').slice(0, 4).join(' | '));
  await shot('error').catch(() => {});
} finally {
  const refreshCalls = apiCalls.filter((c) => c === 'POST /auth/refresh').length;
  console.log(`\naccount: ${email}\nrefresh calls: ${refreshCalls}\n${results.filter((r) => r.ok).length}/${results.length} passed`);
  await browser.close();
}
