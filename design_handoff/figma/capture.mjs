// Captures every screen + state listed in ../screens.json as full-page PNGs (2x).
// Output: ./out/<platform>__<id>-<name>__<state>.png  → import with the Figma plugin in ./plugin
//
//   cd figma && npm install && npx playwright install chromium
//   npm run capture            # writes ./out/*.png
//   npm run serve              # only serves ../design on http://localhost:4321 (for html.to.design etc.)
//
// Needs internet for Google Fonts.

import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../design');
const out = path.resolve(here, 'out');
const cfg = JSON.parse(await readFile(path.resolve(here, '../screens.json'), 'utf8'));
const PORT = Number(process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'SkillLearn UI.dc.html';
    const file = path.resolve(root, rel);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    await stat(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(PORT, r));
const base = `http://localhost:${PORT}/`;
console.log('Serving', root, 'at', base);

if (process.argv.includes('--serve')) {
  for (const s of cfg.screens) console.log(' ', s.id.padEnd(4), base + encodeURI(s.file));
} else {
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch();
  let n = 0;
  for (const s of cfg.screens) {
    const vp = s.viewport || cfg.viewports[s.platform] || cfg.viewports.web;
    for (const st of s.states) {
      // fresh context per state = clean localStorage (demo user "Alya Rahma", default favorites)
      const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
      const page = await ctx.newPage();
      const url = base + encodeURI(s.file) + (st.hash ? '#' + st.hash : '');
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200); // simulated API latency is 450 ms
      const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const file = path.join(out, `${s.platform}__${s.id}-${slug}__${st.id}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await ctx.close();
      n++;
      console.log('✓', path.basename(file));
    }
  }
  await browser.close();
  server.close();
  console.log(`\n${n} screenshots in ${out}\nNext: Figma → Plugins → Development → Import plugin from manifest… → figma/plugin/manifest.json`);
}
