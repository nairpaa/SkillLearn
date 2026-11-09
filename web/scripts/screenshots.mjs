// Ambil screenshot semua layar + state pakai Chromium headless (playwright-core).
// Pakai:  node scripts/screenshots.mjs [baseUrl] [--only=nama1,nama2] [--write]
//   baseUrl default http://localhost:5173 (dev) — bisa juga http://localhost:4173 (preview + CSP)
//   --write : ikut jalankan alur yang MENGUBAH data akun demo (play video, submit quiz/practice).
//             Setelah itu jalankan `npm run seed` di server untuk mengembalikan data demo.
// Hasil: web/screenshots/*.png + ringkasan error console / pelanggaran CSP di akhir.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'screenshots');
mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const BASE = (args.find((a) => /^https?:/.test(a)) || 'http://localhost:5173').replace(/\/$/, '');
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const WRITE = args.includes('--write');
const PREFIX = (args.find((a) => a.startsWith('--prefix=')) || '--prefix=').slice(9);

const USERS = {
  alya: { email: 'alya@student.ac.id', password: 'Belajar123' },
  baru: { email: 'baru@student.ac.id', password: 'Belajar123' },
};

const problems = [];
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });

async function newContext(label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  ctx.on('page', (p) => watch(p, label));
  return ctx;
}

function watch(page, label) {
  page.on('console', (msg) => {
    const t = msg.text();
    if (msg.type() === 'error' || /Content Security Policy|Refused to/i.test(t)) {
      // 4xx dari API yang memang sengaja dites (401 login salah, 404 course, dll) bukan masalah
      if (/Failed to load resource: the server responded with a status of (400|401|403|404|429)/.test(t)) return;
      problems.push(`[${label}] console.${msg.type()}: ${t}`);
    }
  });
  page.on('pageerror', (err) => problems.push(`[${label}] pageerror: ${err.message}`));
}

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

const want = (name) => !only.length || only.some((o) => name.includes(o));

async function shot(page, name, { fullPage = true, settleFirst = true } = {}) {
  if (!want(name)) return;
  if (settleFirst) await settle(page);
  await page.screenshot({ path: join(outDir, `${PREFIX}${name}.png`), fullPage });
  console.log('✓', name);
}

async function go(page, path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await settle(page);
}

async function login(page, who) {
  await go(page, '/login');
  await page.fill('input[type="email"]', USERS[who].email);
  await page.fill('input[autocomplete="current-password"]', USERS[who].password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
  await settle(page);
}

// ---------------- Guest ----------------
{
  const ctx = await newContext('guest');
  const page = await ctx.newPage();

  await go(page, '/login');
  await shot(page, 'web__W01-login__default');
  await go(page, '/login?expired=1');
  await shot(page, 'web__W01-login__session-expired');
  await go(page, '/login');
  await page.click('button[type="submit"]');
  await shot(page, 'web__W01-login__field-errors');
  if (want('web__W01-login__invalid')) {
    await page.fill('input[type="email"]', 'nobody-here@student.ac.id');
    await page.fill('input[autocomplete="current-password"]', 'WrongPass123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="alert"]');
    await shot(page, 'web__W01-login__invalid');
  }
  // busy state: tahan request login sebentar
  if (want('web__W01-login__busy')) {
    await go(page, '/login');
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 4000));
      await route.abort().catch(() => {});
    });
    await page.fill('input[type="email"]', 'alya@student.ac.id');
    await page.fill('input[autocomplete="current-password"]', 'whatever123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(300);
    await shot(page, 'web__W01-login__busy', { settleFirst: false });
    await page.unroute('**/api/auth/login');
  }

  await go(page, '/register');
  await shot(page, 'web__W02-register__default');
  await page.click('button[type="submit"]');
  await shot(page, 'web__W02-register__field-errors');
  await go(page, '/register');
  await page.fill('#' + (await page.locator('input[autocomplete="name"]').getAttribute('id')), 'Budi Santoso');
  await page.fill('input[type="email"]', 'budi@student.ac.id');
  await page.locator('input[autocomplete="new-password"]').nth(0).fill('belajar2026');
  await page.locator('input[autocomplete="new-password"]').nth(1).fill('belajar2025');
  await page.check('input[type="checkbox"]');
  await page.click('button[type="submit"]');
  await shot(page, 'web__W02-register__strength-mismatch');
  if (want('web__W02-register__check-inbox')) {
    // jangan benar-benar register (rate limit 5/jam): response 202 disimulasikan
    await page.route('**/api/auth/register', (route) =>
      route.fulfill({ status: 202, contentType: 'application/json', body: '{"message":"Check your inbox"}' })
    );
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('belajar2026');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Check your inbox');
    await shot(page, 'web__W02-register__check-inbox');
    await page.unroute('**/api/auth/register');
  }

  await go(page, '/forgot-password');
  await shot(page, 'web__W03-forgot-password__default');
  if (want('web__W03-forgot-password__sent')) {
    await page.fill('input[type="email"]', 'alya@student.ac.id');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Check your inbox');
    await page.waitForTimeout(2200);
    await shot(page, 'web__W03-forgot-password__sent');
  }

  await go(page, '/verify-email?token=bogus-token-123');
  await page.waitForSelector('text=Link invalid or expired');
  await shot(page, 'web__X01-verify-email__invalid');
  if (want('web__X01-verify-email__success')) {
    await page.route('**/api/auth/verify-email', (route) => route.fulfill({ status: 204 }));
    await go(page, '/verify-email?token=simulated-ok');
    await page.waitForSelector('text=Email verified');
    await shot(page, 'web__X01-verify-email__success');
    await page.unroute('**/api/auth/verify-email');
  }
  await go(page, '/reset-password?token=bogus-token-123');
  await shot(page, 'web__X02-reset-password__default');
  await page.locator('input[autocomplete="new-password"]').nth(0).fill('Belajar2026!');
  await page.locator('input[autocomplete="new-password"]').nth(1).fill('Belajar2026!');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Link invalid or expired');
  await shot(page, 'web__X02-reset-password__invalid');

  // guard: halaman privat tanpa sesi → login
  await go(page, '/profile');
  if (!page.url().includes('/login')) problems.push('[guest] /profile did not redirect to /login');
  await ctx.close();
}

// ---------------- Returning user (Alya) ----------------
{
  const ctx = await newContext('alya');
  const page = await ctx.newPage();
  await login(page, 'alya');
  await shot(page, 'web__W04-home__default');

  // skeleton: tahan /api/courses
  if (want('web__W04-home__loading')) {
    await page.route('**/api/courses?**', async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.continue().catch(() => {});
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[aria-busy="true"]');
    await page.waitForTimeout(400);
    await shot(page, 'web__W04-home__loading', { settleFirst: false });
    await page.unroute('**/api/courses?**');
    await settle(page);
  }
  if (want('web__W04-home__error')) {
    await page.route('**/api/courses?**', (route) => route.abort('internetdisconnected'));
    await go(page, '/');
    await page.waitForSelector('text=Couldn\'t load content', { timeout: 20000 });
    await shot(page, 'web__W04-home__error');
    await page.unroute('**/api/courses?**');
    await page.locator('button:has-text("Try again")').click();
    await page.waitForSelector('text=Popular courses');
  }

  // toast + undo (state dikembalikan lagi lewat Undo)
  if (want('web__G01-toast')) {
    await go(page, '/');
    const btn = page.locator('.course-card .card-bookmark').nth(3);
    await btn.click();
    await page.waitForSelector('.toast');
    await page.mouse.move(5, 5);
    await shot(page, 'web__G01-toast__saved', { fullPage: false, settleFirst: false });
    await page.click('.toast-action');
    await page.waitForTimeout(800);
  }

  await go(page, '/search');
  await shot(page, 'web__W05-search__default');
  await go(page, '/search?q=kotlin');
  await shot(page, 'web__W05-search__no-results');
  await go(page, '/search?type=Article');
  await shot(page, 'web__W05-search__type-filter');
  await go(page, '/search?q=react');
  await shot(page, 'web__W05-search__query');

  await go(page, '/categories/programming');
  await shot(page, 'web__W06-category__default');
  await go(page, '/categories/unknown');
  await shot(page, 'web__W06-category__not-found');

  await go(page, '/courses/react');
  await shot(page, 'web__W07-course-detail__in-progress');
  await go(page, '/courses/seo');
  await shot(page, 'web__W07-course-detail__not-started');
  await go(page, '/courses/xyz');
  await shot(page, 'web__W07-course-detail__not-found');
  await go(page, '/courses/color');
  await shot(page, 'web__W07-course-detail__completed');

  await go(page, '/courses/react/lessons/1');
  await shot(page, 'web__W08-article__default');
  if (want('web__W08-article__copied')) {
    await page.click('.code-copy >> nth=0');
    await page.waitForTimeout(150);
    await shot(page, 'web__W08-article__copied', { fullPage: false, settleFirst: false });
  }

  await go(page, '/courses/react/lessons/4');
  await shot(page, 'web__W09-quiz__default');
  await page.click('.quiz-option >> nth=0');
  await shot(page, 'web__W09-quiz__selected');

  await go(page, '/courses/react/lessons/5');
  await shot(page, 'web__W10-practice__default');
  await page.click('.task >> nth=0');
  await page.click('.task >> nth=1');
  await page.locator('button:has-text("Show hint")').click();
  await page.click('.run-btn');
  await shot(page, 'web__W10-practice__run-hint');
  await page.locator('button:has-text("Submit practice")').click();
  await shot(page, 'web__W10-practice__submit-blocked');

  await go(page, '/profile');
  await shot(page, 'web__W11-profile__default');
  if (want('web__W11-profile__logout-dialog')) {
    await page.locator('button:has-text("Log out")').first().click();
    await page.waitForSelector('[role="dialog"]');
    await shot(page, 'web__W11-profile__logout-dialog', { fullPage: false, settleFirst: false });
    await page.keyboard.press('Escape');
  }

  await go(page, '/profile/edit');
  await shot(page, 'web__W12-edit-profile__default');
  await page.fill('#' + (await page.locator('input[autocomplete="name"]').getAttribute('id')), 'A');
  await page.locator('input[autocomplete="current-password"]').fill('abc');
  await page.click('button[type="submit"]');
  await shot(page, 'web__W12-edit-profile__field-errors');

  await go(page, '/this-page-does-not-exist');
  await shot(page, 'web__X03-404__default');

  // ---- Alur yang mengubah data (opsional) ----
  if (WRITE) {
    await go(page, '/courses/react');
    await page.click('.player-play');
    await page.waitForSelector('iframe.player-frame');
    await page.waitForTimeout(2500);
    await shot(page, 'web__W07-course-detail__playing', { settleFirst: false });

    // Article: tombol Next menandai selesai lalu pindah ke lesson berikutnya (video → detail?lesson=)
    await go(page, '/courses/react/lessons/1');
    await page.click('.article-next');
    await page.waitForURL((u) => u.pathname === '/courses/react' && u.search.includes('lesson=2'));
    if (!page.url().includes('lesson=2')) problems.push('[alya] article Next did not go to video lesson');

    await go(page, '/courses/react/lessons/4');
    for (let q = 0; q < 3; q++) {
      await page.click(`.quiz-option >> nth=${q === 2 ? 1 : q === 1 ? 1 : 0}`);
      await page.click('.quiz-next');
    }
    await page.waitForSelector('.quiz-result');
    await shot(page, 'web__W09-quiz__results');

    await go(page, '/courses/react/lessons/5');
    for (let t = 0; t < 4; t++) {
      const el = page.locator('.task').nth(t);
      if ((await el.getAttribute('aria-checked')) !== 'true') await el.click();
    }
    await page.locator('button:has-text("Submit practice")').click();
    await page.waitForSelector('.practice-banner.success');
    await shot(page, 'web__W10-practice__submitted');

    await go(page, '/profile/edit');
    await page.locator('textarea').fill('Informatics student. Learning React and UI design.');
    await page.click('button[type="submit"]');
    await page.waitForSelector('text=Profile updated');
    await shot(page, 'web__W12-edit-profile__saved', { settleFirst: false });
  }
  await ctx.close();
}

// ---------------- New user (Baru) — hanya baca, supaya akun tetap "baru" ----------------
{
  const ctx = await newContext('baru');
  const page = await ctx.newPage();
  await login(page, 'baru');
  await shot(page, 'web__W04-home__new-user');
  await go(page, '/profile');
  await shot(page, 'web__W11-profile__empty');
  await ctx.close();
}

// ---------------- Responsive (390 px) ----------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  ctx.on('page', (p) => watch(p, 'mobile'));
  const page = await ctx.newPage();
  await go(page, '/login');
  await shot(page, 'narrow__login');
  await login(page, 'alya');
  await shot(page, 'narrow__home');
  await go(page, '/courses/react');
  await shot(page, 'narrow__course-detail');
  await go(page, '/courses/react/lessons/1');
  await shot(page, 'narrow__article');
  await go(page, '/profile');
  await shot(page, 'narrow__profile');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) problems.push('[mobile] horizontal overflow on /profile');
  await ctx.close();
}

await browser.close();
console.log(`\n${problems.length} console problem(s)`);
problems.forEach((p) => console.log(' -', p));
