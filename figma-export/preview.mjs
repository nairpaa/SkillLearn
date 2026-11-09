// npm run preview [ID...]
// Menggambar ulang out/skilllearn-layers.json sebagai HTML dengan aturan yang sama seperti plugin Figma
// (posisi absolut, stroke di dalam, teks satu baris tidak dibungkus, dst.), lalu menyimpan screenshot-nya
// di out/preview/. Dipakai untuk mengecek hasil capture tanpa harus membuka Figma.
import { chromium } from 'playwright-core';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(await readFile(path.join(here, 'out/skilllearn-layers.json'), 'utf8'));
const only = process.argv.slice(2);
const outDir = path.join(here, 'out/preview');
await mkdir(outDir, { recursive: true });

const rgba = (c, o = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${(c.a ?? 1) * o})`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function textCss(st) {
  return `font-family:'${st.f}';font-weight:${st.w};font-size:${st.s}px;${st.i ? 'font-style:italic;' : ''}color:${rgba(st.c)};letter-spacing:${st.ls}px;${st.u ? 'text-decoration:underline;' : ''}`;
}

function render(n) {
  const pos = `position:absolute;left:${n.x}px;top:${n.y}px;`;
  const op = n.o != null ? `opacity:${n.o};` : '';
  if (n.t === 'svg') return `<div style="${pos}width:${n.w}px;height:${n.h}px;line-height:0;${op}">${n.svg}</div>`;
  if (n.t === 'text') {
    const st = n.st;
    let html = '';
    const cuts = new Set([0, n.chars.length]);
    (n.ranges || []).forEach((r) => (cuts.add(r.s), cuts.add(r.e)));
    const pts = [...cuts].sort((a, b) => a - b);
    for (let i = 0; i < pts.length - 1; i++) {
      const r = (n.ranges || []).find((x) => x.s <= pts[i] && x.e >= pts[i + 1]);
      html += `<span style="${textCss(r ? r.st : st)}">${esc(n.chars.slice(pts[i], pts[i + 1]))}</span>`;
    }
    const size = n.wrap ? `width:${n.w}px;white-space:pre-wrap;` : 'white-space:pre;';
    return `<div style="${pos}${size}${textCss(st)}line-height:${st.lh ? st.lh + 'px' : 'normal'};text-align:${n.align.toLowerCase()};${op}">${html}</div>`;
  }
  // frame
  const fills = (n.fills || []).map((f) => `background-color:${rgba(f)};`).join('');
  const img = n.img ? `background-image:url(data:image/png;base64,${data.images[n.img]});background-size:100% 100%;` : '';
  const border = n.stroke
    ? `border-style:${n.dash ? 'dashed' : 'solid'};border-color:${rgba(n.stroke)};border-width:${n.sw.map((w) => w + 'px').join(' ')};`
    : '';
  const radius = `border-radius:${n.r.map((r) => r + 'px').join(' ')};`;
  const fx = n.fx?.length ? `box-shadow:${n.fx.map((e) => `${e.inset ? 'inset ' : ''}${e.x}px ${e.y}px ${e.blur}px ${e.spread}px ${rgba(e.color)}`).join(',')};` : '';
  const kids = (n.children || []).map(render).join('');
  // Stroke Figma "INSIDE" tidak menggeser isi, jadi anak diposisikan relatif ke tepi luar frame.
  const inner = `<div style="position:absolute;left:${-(n.stroke ? n.sw[3] : 0)}px;top:${-(n.stroke ? n.sw[0] : 0)}px;">${kids}</div>`;
  return `<div style="${pos}box-sizing:border-box;width:${n.w}px;height:${n.h}px;${fills}${img}${border}${radius}${fx}${n.clip ? 'overflow:hidden;' : ''}${op}">${inner}</div>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
for (const s of data.screens) {
  if (only.length && !only.includes(s.id)) continue;
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=block" rel="stylesheet">
<style>html,body{margin:0}body{position:relative;width:${s.w}px;height:${s.h}px;background:${rgba(s.bg)};overflow:hidden}</style></head>
<body>${s.children.map(render).join('')}</body></html>`;
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(outDir, `${s.platform}__${s.id}__${s.state}.png`);
  await page.screenshot({ path: file });
  await page.close();
  console.log('✓', path.basename(file));
}
await browser.close();
