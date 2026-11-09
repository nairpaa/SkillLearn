// Bikin semua ikon app dari SVG logo SkillLearn pakai Chromium headless (sekali jalan, hasilnya di assets/).
// Jalankan: node scripts/make-icons.mjs
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEAL = '#0E5E52';
const ACCENT = '#F2A93B';

// Tangga + titik di grid 32×32 (sama dengan logo di desain)
const mark = (stroke, dot = ACCENT) =>
  `<path d="M8 23h5v-5h5v-5h5" stroke="${stroke}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="23.5" cy="8.5" r="2.6" fill="${dot}"/>`;

const icons = [
  // iOS/Android legacy: kotak teal penuh (iOS menambah rounded corner sendiri)
  { file: 'icon.png', size: 1024, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${TEAL}"/><g transform="translate(16 16) scale(.82) translate(-16 -16)">${mark('#fff')}</g></svg>` },
  // Adaptive icon Android: konten di dalam safe zone 66%
  { file: 'android-icon-foreground.png', size: 1024, transparent: true, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g transform="translate(16 16) scale(.55) translate(-16 -16)">${mark('#fff')}</g></svg>` },
  { file: 'android-icon-background.png', size: 1024, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${TEAL}"/></svg>` },
  { file: 'android-icon-monochrome.png', size: 1024, transparent: true, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g transform="translate(16 16) scale(.55) translate(-16 -16)">${mark('#fff', '#fff')}</g></svg>` },
  // Splash: logo versi putih (inverted) di atas latar teal
  { file: 'splash-icon.png', size: 512, transparent: true, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#fff"/>${mark(TEAL)}</svg>` },
  { file: 'favicon.png', size: 48, transparent: true, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="${TEAL}"/>${mark('#fff')}</svg>` },
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/usr/bin/chromium' });
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const icon of icons) {
  await page.setViewportSize({ width: icon.size, height: icon.size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${icon.svg.replace('<svg ', `<svg width="${icon.size}" height="${icon.size}" `)}</body></html>`
  );
  await page.screenshot({ path: path.join(root, 'assets', icon.file), omitBackground: !!icon.transparent, clip: { x: 0, y: 0, width: icon.size, height: icon.size } });
  console.log('wrote', icon.file);
}
await browser.close();
