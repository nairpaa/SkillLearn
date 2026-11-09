// npm run capture
// Membaca setiap layar prototype desain (design_handoff/design/*.dc.html) lalu mengubah DOM-nya
// menjadi daftar layer (kotak, teks, ikon SVG, gambar) dalam out/skilllearn-layers.json.
// File JSON itu yang dibaca plugin Figma untuk membangun layer yang BISA DIEDIT,
// bukan sekadar screenshot.
//
// Kanvas referensi (sangat panjang) tetap dipotong jadi beberapa PNG di out/reference/.
import { chromium } from 'playwright-core';
import crypto from 'node:crypto';
import http from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const handoff = path.resolve(here, '../design_handoff');
const designDir = path.join(handoff, 'design');
const outDir = path.join(here, 'out');
const cfg = JSON.parse(await readFile(path.join(handoff, 'screens.json'), 'utf8'));
const only = process.argv.slice(2); // opsional: batasi ke ID tertentu, mis. W04 M07

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
    const file = path.resolve(designDir, rel);
    if (!file.startsWith(designDir)) throw new Error('di luar folder');
    await stat(file);
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(4323, '127.0.0.1', resolve));
const base = 'http://127.0.0.1:4323/';

// ---------------------------------------------------------------------------
// Fungsi ini dijalankan DI DALAM halaman (browser). Hasilnya pohon layer siap pakai.
// ---------------------------------------------------------------------------
function extract() {
  const SKIP = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'HEAD', 'TEMPLATE', 'NOSCRIPT', 'TITLE']);
  const bgJobs = [];
  const num = (v) => parseFloat(v) || 0;
  const round = (v) => Math.round(v * 100) / 100;

  function color(str) {
    const m = str && str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const a = p.length > 3 ? p[3] : 1;
    if (!a) return null;
    return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a };
  }

  function shadows(str) {
    if (!str || str === 'none') return [];
    return str
      .split(/,(?![^(]*\))/)
      .map((s) => {
        const c = color((s.match(/rgba?\([^)]+\)/) || [])[0]);
        const [x = 0, y = 0, blur = 0, spread = 0] = s
          .replace(/rgba?\([^)]+\)/, '')
          .replace('inset', '')
          .trim()
          .split(/\s+/)
          .map(num);
        return c && { inset: /inset/.test(s), color: c, x, y, blur, spread };
      })
      .filter(Boolean);
  }

  function family(ff) {
    if (/jetbrains|mono/i.test(ff)) return 'JetBrains Mono';
    return 'Plus Jakarta Sans';
  }

  function textStyle(cs) {
    return {
      f: family(cs.fontFamily),
      w: Math.min(800, Math.max(400, Math.round(num(cs.fontWeight) / 100) * 100 || 400)),
      s: num(cs.fontSize),
      i: cs.fontStyle === 'italic',
      c: color(cs.color) || { r: 0, g: 0, b: 0, a: 1 },
      ls: cs.letterSpacing === 'normal' ? 0 : round(num(cs.letterSpacing)),
      u: cs.textDecorationLine.includes('underline'),
      lh: cs.lineHeight === 'normal' ? null : round(num(cs.lineHeight)),
    };
  }
  const sameStyle = (a, b) => a.f === b.f && a.w === b.w && a.s === b.s && a.i === b.i && a.u === b.u && JSON.stringify(a.c) === JSON.stringify(b.c);

  function transform(txt, tt) {
    if (tt === 'uppercase') return txt.toUpperCase();
    if (tt === 'lowercase') return txt.toLowerCase();
    if (tt === 'capitalize') return txt.replace(/\b\w/g, (c) => c.toUpperCase());
    return txt;
  }

  function radius(cs, w, h) {
    return ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft'].map((k) => {
      const v = cs[`border${k}Radius`].split(' ')[0];
      const r = v.endsWith('%') ? (num(v) / 100) * Math.min(w, h) : num(v);
      return round(Math.min(r, Math.min(w, h) / 2));
    });
  }

  function layerName(el) {
    const sc = el.getAttribute('data-sc-name');
    if (sc) return sc;
    const label = el.getAttribute('aria-label') || el.getAttribute('data-screen-label');
    if (label) return label;
    const tag = el.tagName.toLowerCase();
    const text = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    const kind = { button: 'Button', a: 'Link', input: 'Input', textarea: 'Textarea', label: 'Label', form: 'Form', nav: 'Nav' }[tag] || 'Box';
    return text ? `${kind} · ${text}` : kind;
  }

  // Kotak visual (punya background, border, shadow, gambar, atau memotong isi) jadi frame di Figma.
  function frameFor(el, cs, rect, origin) {
    const fills = [];
    const bg = color(cs.backgroundColor);
    if (bg) fills.push(bg);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((s) => {
      const style = cs[`border${s}Style`];
      const c = color(cs[`border${s}Color`]);
      const w = style === 'none' || style === 'hidden' || !c ? 0 : num(cs[`border${s}Width`]);
      return { w, c, dashed: style === 'dashed' || style === 'dotted' };
    });
    const strokeSide = sides.find((s) => s.w > 0);
    const fx = shadows(cs.boxShadow);
    // Outline (cincin fokus) ditiru dengan shadow ber-spread tanpa blur.
    if (cs.outlineStyle !== 'none' && num(cs.outlineWidth) > 0 && color(cs.outlineColor)) {
      fx.push({ inset: false, color: color(cs.outlineColor), x: 0, y: 0, blur: 0, spread: num(cs.outlineWidth) + num(cs.outlineOffset) });
    }
    const hasImg = cs.backgroundImage && cs.backgroundImage !== 'none';
    const clip = ['hidden', 'clip'].includes(cs.overflowX) || ['hidden', 'clip'].includes(cs.overflowY);
    if (!fills.length && !strokeSide && !fx.length && !hasImg && !clip) return null;

    const node = {
      t: 'frame',
      name: layerName(el),
      x: round(rect.left - origin.x),
      y: round(rect.top - origin.y),
      w: round(rect.width),
      h: round(rect.height),
      fills,
      r: radius(cs, rect.width, rect.height),
      clip,
      children: [],
    };
    if (strokeSide) {
      node.stroke = strokeSide.c;
      node.sw = sides.map((s) => s.w);
      if (strokeSide.dashed) node.dash = true;
    }
    if (fx.length) node.fx = fx;
    if (num(cs.opacity) < 1) node.o = num(cs.opacity);
    if (hasImg) {
      const id = String(bgJobs.length + 1);
      el.setAttribute('data-fig-bg', id);
      bgJobs.push(id);
      node.img = id;
    }
    return node;
  }

  function svgNode(svg, origin, opacity) {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')];
    const dst = [clone, ...clone.querySelectorAll('*')];
    // Warna/garis dari CSS ditulis jadi atribut, supaya Figma membacanya sama persis (termasuk currentColor).
    src.forEach((el, i) => {
      const cs = getComputedStyle(el);
      const d = dst[i];
      if (i > 0) {
        for (const [attr, val] of [
          ['fill', cs.fill],
          ['stroke', cs.stroke],
          ['stroke-width', cs.strokeWidth],
          ['stroke-linecap', cs.strokeLinecap],
          ['stroke-linejoin', cs.strokeLinejoin],
          ['opacity', cs.opacity],
        ]) {
          if (val && val !== 'normal') d.setAttribute(attr, val);
        }
      }
      [...d.attributes].forEach((a) => a.name.startsWith('data-') && d.removeAttribute(a.name));
      d.removeAttribute('style');
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', round(r.width));
    clone.setAttribute('height', round(r.height));
    const node = { t: 'svg', name: svg.getAttribute('aria-label') || 'Icon', x: round(r.left - origin.x), y: round(r.top - origin.y), w: round(r.width), h: round(r.height), svg: clone.outerHTML };
    if (opacity < 1) node.o = opacity;
    return node;
  }

  // Teks satu blok (boleh berisi <strong>, <a>, <code> inline) → satu text layer dengan style per rentang.
  function richText(el, origin, out, opacity) {
    const cs = getComputedStyle(el);
    const pieces = [];
    const textNodes = [];
    const inlineBoxes = [];
    (function rec(node) {
      for (const ch of node.childNodes) {
        if (ch.nodeType === 3) {
          const pcs = getComputedStyle(ch.parentElement);
          let txt = ch.textContent;
          if (!/^pre/.test(pcs.whiteSpace)) txt = txt.replace(/\s+/g, ' ');
          else if (pcs.whiteSpace === 'pre-line') txt = txt.replace(/[ \t]+/g, ' ');
          txt = transform(txt, pcs.textTransform);
          if (txt) {
            pieces.push({ txt, st: textStyle(pcs), pre: /^pre/.test(pcs.whiteSpace) });
            if (ch.textContent.trim()) textNodes.push(ch);
          }
        } else if (ch.nodeType === 1) {
          const ccs = getComputedStyle(ch);
          if (ccs.display === 'none' || ccs.visibility === 'hidden') continue;
          if (ch.tagName === 'BR') {
            pieces.push({ txt: '\n', st: null, pre: true });
            continue;
          }
          if (ch.tagName.toLowerCase() === 'svg') {
            const s = svgNode(ch, origin, opacity);
            if (s) out.push(s);
            continue;
          }
          inlineBoxes.push(ch);
          // Padding/border/margin horizontal elemen inline (mis. `code`) tidak ada di teks,
          // jadi ditiru dengan satu spasi tak-putus yang lebarnya diatur lewat letter-spacing.
          const padL = num(ccs.paddingLeft) + num(ccs.borderLeftWidth) + num(ccs.marginLeft);
          const padR = num(ccs.paddingRight) + num(ccs.borderRightWidth) + num(ccs.marginRight);
          const padPiece = (px) => ({ txt: '\u00A0', st: { ...textStyle(ccs), ls: round(px - spaceWidth(ccs)) }, pre: true });
          if (padL > 0.5) pieces.push(padPiece(padL));
          rec(ch);
          if (padR > 0.5) pieces.push(padPiece(padR));
        }
      }
    })(el);

    // Gabungkan potongan teks sambil meniru aturan spasi CSS (spasi ganda & spasi di tepi dibuang).
    let chars = '';
    const ranges = [];
    for (const p of pieces) {
      let txt = p.txt;
      if (!p.pre) {
        if (!chars || chars.endsWith(' ') || chars.endsWith('\n')) txt = txt.replace(/^ +/, '');
      }
      if (!txt) continue;
      if (txt === '\n') chars = chars.replace(/ +$/, '');
      const start = chars.length;
      chars += txt;
      if (p.st) ranges.push({ s: start, e: chars.length, st: p.st });
    }
    chars = chars.replace(/\s+$/, '');
    if (!chars.trim() || !textNodes.length) return;
    ranges.forEach((r) => (r.e = Math.min(r.e, chars.length)));

    // Style dasar = style yang paling banyak dipakai.
    const count = new Map();
    ranges.forEach((r) => {
      const k = JSON.stringify(r.st);
      count.set(k, (count.get(k) || 0) + (r.e - r.s));
    });
    const baseKey = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
    const baseStyle = JSON.parse(baseKey);
    const overrides = ranges.filter((r) => r.e > r.s && !sameStyle(r.st, baseStyle)).map((r) => ({ s: r.s, e: r.e, st: r.st }));

    // Kotak latar untuk elemen inline bergaya (mis. `code` berwarna) digambar di belakang teks.
    for (const box of inlineBoxes) {
      const bcs = getComputedStyle(box);
      for (const r of box.getClientRects()) {
        const f = frameFor(box, bcs, r, origin);
        if (f) {
          f.name = 'Inline · ' + (box.textContent || '').trim().slice(0, 20);
          delete f.img;
          f.clip = false;
          out.push(f);
        }
      }
    }

    // Posisi dari kotak glyph teks yang benar-benar dirender browser.
    const range = document.createRange();
    const rects = [];
    for (const tn of textNodes) {
      range.selectNodeContents(tn);
      for (const r of range.getClientRects()) if (r.width > 0 && r.height > 0) rects.push(r);
    }
    if (!rects.length) return;
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    const top = Math.min(...rects.map((r) => r.top));
    const lines = [];
    for (const r of [...rects].sort((a, b) => a.top - b.top)) {
      const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
      if (!line) lines.push({ top: r.top, h: r.height });
    }
    const multi = lines.length > 1 || chars.includes('\n');
    const glyphH = lines[0].h;
    const lh = baseStyle.lh || glyphH;
    const y = top - (lh - glyphH) / 2;

    let x = left;
    let width = right - left;
    let align = 'LEFT';
    if (multi && !/^pre/.test(cs.whiteSpace)) {
      // Teks beberapa baris: lebar mengikuti kotak isi elemen, supaya bungkusnya sama dengan desain.
      const er = el.getBoundingClientRect();
      const block = cs.display !== 'inline';
      const pl = block ? num(cs.paddingLeft) + num(cs.borderLeftWidth) : 0;
      const pr = block ? num(cs.paddingRight) + num(cs.borderRightWidth) : 0;
      x = er.left + pl;
      width = er.width - pl - pr;
      align = { center: 'CENTER', right: 'RIGHT', end: 'RIGHT', justify: 'JUSTIFIED' }[cs.textAlign] || 'LEFT';
    }

    const node = {
      t: 'text',
      name: chars.replace(/\s+/g, ' ').slice(0, 40),
      x: round(x - origin.x),
      y: round(y - origin.y),
      w: round(width),
      multi,
      // wrap = teks dibungkus mengikuti lebar kotak. Blok kode (white-space: pre) tidak dibungkus.
      wrap: multi && !/^pre/.test(cs.whiteSpace),
      align,
      chars,
      st: baseStyle,
    };
    if (overrides.length) node.ranges = overrides;
    if (opacity < 1) node.o = opacity;
    out.push(node);
  }

  function inputText(el, cs, rect, origin, out) {
    const isPw = el.type === 'password';
    const value = el.value;
    const placeholder = el.getAttribute('placeholder') || '';
    const chars = value ? (isPw ? '•'.repeat(value.length) : value) : placeholder;
    if (!chars) return;
    const st = textStyle(value ? cs : getComputedStyle(el, '::placeholder'));
    if (!value) st.c = color(getComputedStyle(el, '::placeholder').color) || st.c;
    const pl = num(cs.paddingLeft) + num(cs.borderLeftWidth);
    const pt = num(cs.paddingTop) + num(cs.borderTopWidth);
    const pb = num(cs.paddingBottom) + num(cs.borderBottomWidth);
    const lh = st.lh || st.s * 1.3;
    const multi = el.tagName === 'TEXTAREA';
    const y = multi ? rect.top + pt : rect.top + pt + (rect.height - pt - pb - lh) / 2;
    out.push({
      t: 'text',
      name: (value ? 'Value · ' : 'Placeholder · ') + chars.slice(0, 30),
      x: round(rect.left + pl - origin.x),
      y: round(y - origin.y),
      w: round(rect.width - pl * 2),
      multi,
      wrap: multi,
      align: 'LEFT',
      chars,
      st: { ...st, lh },
    });
  }

  const measureCtx = document.createElement('canvas').getContext('2d');
  function spaceWidth(cs) {
    measureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    return measureCtx.measureText('\u00A0').width;
  }

  const isInline = (el) => el.tagName === 'BR' || getComputedStyle(el).display === 'inline';

  function walk(el, origin, out, opacity) {
    if (SKIP.has(el.tagName)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || num(cs.opacity) === 0) return;
    if (el.tagName.toLowerCase() === 'svg') {
      const s = svgNode(el, origin, opacity);
      if (s) out.push(s);
      return;
    }
    const rect = el.getBoundingClientRect();
    let frame = null;
    if (rect.width > 0 && rect.height > 0 && el !== document.body) frame = frameFor(el, cs, rect, origin);

    let childOut = out;
    let childOrigin = origin;
    let childOpacity = opacity;
    if (frame) {
      out.push(frame);
      childOut = frame.children;
      childOrigin = { x: rect.left, y: rect.top };
    } else if (num(cs.opacity) < 1) {
      childOpacity = opacity * num(cs.opacity);
    }

    if (['INPUT', 'TEXTAREA'].includes(el.tagName)) {
      if (!['checkbox', 'radio', 'hidden', 'file'].includes(el.type)) inputText(el, cs, rect, childOrigin, childOut);
      return;
    }

    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const inlineOnly = [...el.children].every((c) => isInline(c) || c.tagName.toLowerCase() === 'svg');
    if (hasText && inlineOnly) {
      richText(el, childOrigin, childOut, childOpacity);
      return;
    }
    for (const ch of el.childNodes) {
      if (ch.nodeType === 1) walk(ch, childOrigin, childOut, childOpacity);
      else if (ch.nodeType === 3 && ch.textContent.trim()) {
        // Teks lepas di antara elemen blok: bungkus sementara supaya bisa diukur.
        const span = document.createElement('span');
        ch.replaceWith(span);
        span.appendChild(ch);
        richText(span, childOrigin, childOut, childOpacity);
      }
    }
  }

  const pageBg =
    color(getComputedStyle(document.body).backgroundColor) || color(getComputedStyle(document.documentElement).backgroundColor) || { r: 1, g: 1, b: 1, a: 1 };
  const children = [];
  walk(document.body, { x: 0, y: 0 }, children, 1);
  return { bg: pageBg, children, bgJobs };
}

// ---------------------------------------------------------------------------

function countNodes(list) {
  return list.reduce((n, c) => n + 1 + (c.children ? countNodes(c.children) : 0), 0);
}

await mkdir(path.join(outDir, 'reference'), { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' });
const images = {};
const screens = [];

for (const s of cfg.screens) {
  if (s.platform === 'reference') continue;
  if (only.length && !only.includes(s.id)) continue;
  const vp = cfg.viewports[s.platform];
  for (const st of s.states) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(base + encodeURI(s.file) + (st.hash ? '#' + st.hash : ''), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200); // latensi API simulasi di prototype 450 ms
    // Viewport dibuat setinggi halaman, jadi elemen sticky/fixed berada di posisi yang sama dengan screenshot penuh.
    const fullH = await page.evaluate(() => document.documentElement.scrollHeight);
    if (fullH > vp.height) {
      await page.setViewportSize({ width: vp.width, height: fullH });
      await page.waitForTimeout(300);
    }
    const height = Math.max(vp.height, await page.evaluate(() => document.documentElement.scrollHeight));
    const data = await page.evaluate(extract);

    // Latar bergambar (pola garis thumbnail, player video) diambil sebagai gambar, isinya disembunyikan dulu.
    const imgKeyById = {};
    for (const id of data.bgJobs) {
      const restore = await page.evaluate((jobId) => {
        const el = document.querySelector(`[data-fig-bg="${jobId}"]`);
        const saved = [el.style.color, ...[...el.querySelectorAll('*')].map((d) => d.style.visibility)];
        el.style.color = 'transparent';
        el.querySelectorAll('*').forEach((d) => (d.style.visibility = 'hidden'));
        return saved;
      }, id);
      const png = await page.locator(`[data-fig-bg="${id}"]`).screenshot({ animations: 'disabled' });
      await page.evaluate(
        ([jobId, saved]) => {
          const el = document.querySelector(`[data-fig-bg="${jobId}"]`);
          el.style.color = saved[0];
          [...el.querySelectorAll('*')].forEach((d, i) => (d.style.visibility = saved[i + 1]));
        },
        [id, restore]
      );
      const key = crypto.createHash('sha1').update(png).digest('hex').slice(0, 16);
      images[key] = png.toString('base64');
      imgKeyById[id] = key;
    }
    (function swap(list) {
      for (const n of list) {
        if (n.img) n.img = imgKeyById[n.img];
        if (n.children) swap(n.children);
      }
    })(data.children);

    screens.push({ platform: s.platform, id: s.id, name: s.name, state: st.id, w: vp.width, h: height, bg: data.bg, children: data.children });
    console.log(`✓ ${s.id} ${s.name} / ${st.id}  (${countNodes(data.children)} layer, ${data.bgJobs.length} gambar latar)`);
    await ctx.close();
  }
}

// Kanvas referensi: tetap gambar (isinya dokumentasi), dipotong di batas antar-section
// supaya tiap potongan di bawah batas gambar Figma (4096 px) dan tidak membelah konten.
if (!only.length || only.includes('R00')) {
  const ref = cfg.screens.find((s) => s.platform === 'reference');
  const vp = ref.viewport || cfg.viewports.web;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base + encodeURI(ref.file), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const { total, gaps } = await page.evaluate(() => {
    // Kandidat titik potong: celah kosong di antara blok-blok yang ditumpuk vertikal.
    const blocks = [...document.querySelectorAll('body *')]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 200 && r.height > 0)
      .map((r) => [r.top + scrollY, r.bottom + scrollY]);
    const total = document.documentElement.scrollHeight;
    const covered = new Uint8Array(total + 1);
    for (const [a, b] of blocks) for (let y = Math.max(0, Math.floor(a)); y < Math.min(total, Math.ceil(b)); y++) covered[y] = 1;
    // Baris yang hanya tertutup elemen pembungkus besar dianggap tetap kosong kalau tidak ada blok yang berakhir/mulai di sana.
    const edges = new Set();
    for (const [a, b] of blocks) {
      edges.add(Math.round(a));
      edges.add(Math.round(b));
    }
    return { total, gaps: [...edges].sort((x, y) => x - y) };
  });
  const MAX = 2000; // piksel logis → 4000 px di 2x
  const cuts = [0];
  while (total - cuts[cuts.length - 1] > MAX) {
    const start = cuts[cuts.length - 1];
    const candidates = gaps.filter((g) => g > start + 600 && g <= start + MAX);
    cuts.push(candidates.length ? candidates[candidates.length - 1] : start + MAX);
  }
  cuts.push(total);
  for (let i = 0; i < cuts.length - 1; i++) {
    const file = path.join(outDir, 'reference', `reference__R${String(i + 1).padStart(2, '0')}-design-canvas__default.png`);
    await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: cuts[i], width: vp.width, height: cuts[i + 1] - cuts[i] } });
  }
  console.log(`✓ R00 kanvas referensi → ${cuts.length - 1} potongan PNG di out/reference/`);
  await ctx.close();
}

await browser.close();
server.close();

const payload = { format: 'skilllearn-layers', version: 1, generatedAt: new Date().toISOString(), images, screens };
const file = path.join(outDir, 'skilllearn-layers.json');
await writeFile(file, JSON.stringify(payload));
const mb = (Buffer.byteLength(JSON.stringify(payload)) / 1024 / 1024).toFixed(1);
console.log(`\n${screens.length} layar, ${Object.keys(images).length} gambar unik → ${file} (${mb} MB)`);
