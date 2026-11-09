// Screenshot UI versi web (react-native-web) di viewport 390×844 untuk dibandingkan dengan design_handoff/screenshots.
// Butuh: Expo web jalan di http://localhost:8081 (EXPO_PUBLIC_WEB_FAKE_INSETS=1) dan API di localhost:8080.
// Jalankan: node scripts/screenshots.mjs [filter]
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'screenshots');
const BASE = process.env.WEB_URL || 'http://localhost:8081';
const only = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/usr/bin/chromium' });

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 300));
  });
  return page;
}

const shot = async (page, name, { full = true } = {}) => {
  if (only && !name.includes(only)) return;
  await page.waitForTimeout(700);
  // ScrollView RNW punya tinggi tetap; perbesar viewport sesuai konten supaya screenshot full-length seperti desain
  let h = 844;
  if (full) {
    h = await page.evaluate(() => {
      let max = window.innerHeight;
      document.querySelectorAll('div').forEach((d) => {
        const s = getComputedStyle(d);
        const visible = d.checkVisibility ? d.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }) : d.offsetParent !== null;
        const r = d.getBoundingClientRect();
        const onScreen = r.width > 0 && r.left < window.innerWidth && r.right > 0;
        if (visible && onScreen && (s.overflowY === 'auto' || s.overflowY === 'scroll') && d.scrollHeight > d.clientHeight + 2) {
          max = Math.max(max, window.innerHeight + (d.scrollHeight - d.clientHeight));
        }
      });
      return Math.min(max, 4000);
    });
  }
  if (h !== 844) {
    await page.setViewportSize({ width: 390, height: h });
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  if (h !== 844) await page.setViewportSize({ width: 390, height: 844 });
  console.log('shot', name, h);
};

const clickText = async (page, text, opts = {}) => {
  await page.getByText(text, { exact: opts.exact ?? true }).first().click();
  await page.waitForTimeout(opts.wait ?? 900);
};
const fill = async (page, label, value) => {
  await page.getByLabel(label, { exact: true }).first().fill(value);
};

async function login(page, email) {
  await page.goto(BASE);
  await page.getByText('Log in', { exact: true }).first().waitFor();
  await clickText(page, 'Log in');
  await fill(page, 'Email', email);
  await fill(page, 'Password', 'Belajar123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByText('Popular courses').waitFor({ timeout: 70000 });
  await page.waitForTimeout(1200);
}

// --- Tamu: splash, login, register, forgot ---
if (!process.env.ONLY_STATES) {
  const page = await newPage();
  await page.goto(BASE);
  await page.getByText('Create account').first().waitFor({ timeout: 60000 });
  await shot(page, 'M00-splash');
  await clickText(page, 'Log in');
  await shot(page, 'M01-login');
  await fill(page, 'Email', 'bukan-email');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'M01-login__validation');
  await clickText(page, 'Forgot password?');
  await shot(page, 'M03-forgot-password');
  await page.goBack().catch(() => {});
  await page.goto(BASE);
  await page.getByText('Create account').first().waitFor();
  await clickText(page, 'Create account');
  await shot(page, 'M02-register');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'M02-register__validation');
  await page.context().close();
}

// --- Pengguna lama (Alya) ---
if (!process.env.ONLY_STATES) {
  const page = await newPage();
  await login(page, 'alya@student.ac.id');
  await shot(page, 'M04-home');
  await page.getByRole('tab', { name: 'Search' }).click();
  await page.waitForTimeout(1200);
  await shot(page, 'M05-search');
  await page.getByRole('textbox', { name: 'Search courses' }).fill('kotlin');
  await page.waitForTimeout(1500);
  await shot(page, 'M05-search__no-results');
  await page.getByRole('tab', { name: 'Home' }).click();
  await page.waitForTimeout(600);
  await clickText(page, 'Graphic Design', { wait: 1500 });
  await shot(page, 'M06-category');
  await page.getByRole('tab', { name: 'Home' }).click();
  await page.waitForTimeout(800);
  await page.getByText('CONTINUE LEARNING').click();
  await page.waitForTimeout(1500);
  await shot(page, 'M07-course-detail__in-progress');
  await page.getByRole('tab', { name: 'About' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'M07-course-detail__about');
  await page.getByRole('tab', { name: 'Lessons' }).click();
  await clickText(page, 'JSX explained', { wait: 1500 });
  await shot(page, 'M08-article');
  await page.getByRole('button', { name: 'Back to course' }).click();
  await page.waitForTimeout(800);
  await clickText(page, 'Quiz: Components', { wait: 1500 });
  await shot(page, 'M09-quiz');
  await page.getByRole('radio').first().click();
  await page.waitForTimeout(300);
  await shot(page, 'M09-quiz__selected');
  await page.getByRole('button', { name: 'Exit quiz' }).click();
  await page.waitForTimeout(800);
  await clickText(page, 'Practice: Build a to-do list', { wait: 1500 });
  await shot(page, 'M10-practice');
  await page.getByRole('tab', { name: 'Code' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'M10-practice__code', { full: false });
  await page.getByRole('button', { name: 'Run code' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'M10-practice__preview');
  await page.getByRole('button', { name: 'Submit practice' }).click();
  await page.waitForTimeout(400);
  await shot(page, 'M10-practice__submit-info');
  await page.getByRole('button', { name: 'Back to course' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Back', exact: true }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('tab', { name: 'Profile' }).click();
  await page.waitForTimeout(1500);
  await shot(page, 'M11-profile');
  await page.getByRole('tab', { name: 'History' }).click();
  await page.waitForTimeout(1200);
  await shot(page, 'M11-profile__history');
  await clickText(page, 'Log out');
  await page.waitForTimeout(600);
  await shot(page, 'M11-profile__logout-sheet', { full: false });
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(500);
  await clickText(page, 'Edit');
  await page.waitForTimeout(1000);
  await shot(page, 'M12-edit-profile');
  await page.context().close();
}

// --- Pengguna baru ---
if (!process.env.ONLY_STATES) {
  const page = await newPage();
  await login(page, 'baru@student.ac.id');
  await shot(page, 'M04-home__new-user');
  await page.getByRole('tab', { name: 'Profile' }).click();
  await page.waitForTimeout(1500);
  await shot(page, 'M11-profile__new-user');
  await page.getByRole('tab', { name: 'History' }).click();
  await page.waitForTimeout(1000);
  await shot(page, 'M11-profile__new-user-history');
  await page.getByRole('tab', { name: 'Home' }).click();
  await page.waitForTimeout(800);
  await page.getByText('Start your first course').click();
  await page.waitForTimeout(1500);
  await shot(page, 'M07-course-detail__not-started');
  await page.context().close();
}


// --- State khusus: error & not found (akun uji E2E_EMAIL, supaya data demo tidak berubah) ---
if (process.env.E2E_EMAIL) {
  const page = await newPage();
  const go = async (name, params) => {
    await page.evaluate(([n, pr]) => window.__skilllearnNav.navigate(n, pr), [name, params]);
    await page.waitForTimeout(1500);
  };
  await page.route('**/api/courses?**', (r) => r.abort('failed'));
  await page.route('**/api/courses', (r) => r.abort('failed'));
  await page.goto(BASE);
  await page.getByText('Log in', { exact: true }).first().waitFor({ timeout: 60000 });
  await clickText(page, 'Log in');
  await fill(page, 'Email', process.env.E2E_EMAIL);
  await fill(page, 'Password', 'Kursus2026x');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.getByText("Couldn't load content").first().waitFor({ timeout: 30000 });
  await shot(page, 'M04-home__error', { full: false });
  await page.unroute('**/api/courses?**');
  await page.unroute('**/api/courses');
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByText('Popular courses').waitFor({ timeout: 30000 });
  await go('Main', { screen: 'HomeTab', params: { screen: 'Category', params: { id: 'unknown' } } });
  await shot(page, 'M06-category__not-found', { full: false });
  await go('CourseDetail', { slug: 'xyz' });
  await shot(page, 'M07-course-detail__not-found', { full: false });
  await page.context().close();
}

await browser.close();
