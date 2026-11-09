// @ts-check
// SkillLearn Importer v2 — plugin Figma lokal.
//
// Yang dibuat:
//   1. Variables "SkillLearn" (warna, spacing, radius, ukuran), text styles, dan effect styles dari tokens.json
//   2. Layar web & mobile sebagai LAYER YANG BISA DIEDIT (frame, teks, ikon vektor) dari skilllearn-layers.json.
//      Warna yang sama dengan token otomatis terhubung ke variable-nya, teks yang cocok memakai text style-nya.
//   3. Kanvas referensi (PNG) di halaman Reference.
//
// Cocok untuk paket Figma gratis (Starter): maksimal 3 halaman, dan halaman kosong "Page 1" dipakai ulang.

figma.showUI(__html__, { width: 380, height: 500, themeColors: true });

/** @param {string} text @param {boolean} [done] */
const say = (text, done = false) => figma.ui.postMessage({ status: text, done });

const WEIGHT = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };
const GAP_X = 120;
const GAP_Y = 200;

/** @typedef {{ r: number, g: number, b: number, a: number }} Rgba */
/** @typedef {{ f: string, w: number, s: number, i: boolean, c: Rgba, ls: number, u: boolean, lh: number | null }} TextSt */

/** @param {number} v */
const hex2 = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
/** @param {RGB | RGBA} c */
const toHex = (c) => `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}`.toUpperCase();

/** @param {string} hex @returns {Rgba} */
function hexToRgba(hex) {
  const h = hex.replace('#', '');
  /** @param {number} i */
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
}

/** @param {string | number} v */
const px = (v) => parseFloat(String(v));

// ---------------------------------------------------------------------------
// Halaman (paket Starter maksimal 3 halaman)
// ---------------------------------------------------------------------------

/** @param {string} name @returns {Promise<PageNode>} */
async function ensurePage(name) {
  await figma.loadAllPagesAsync();
  const existing = figma.root.children.find((p) => p.name === name);
  if (existing) return existing;
  // Halaman bawaan yang masih kosong ("Page 1") dipakai ulang supaya tidak memakan jatah halaman.
  const blank = figma.root.children.find((p) => /^Page \d+$/.test(p.name) && p.children.length === 0);
  if (blank) {
    blank.name = name;
    return blank;
  }
  try {
    const page = figma.createPage();
    page.name = name;
    return page;
  } catch (e) {
    // Jatah halaman habis: taruh di halaman yang sedang dibuka, di bawah isi yang sudah ada.
    say(`Halaman "${name}" tidak bisa dibuat (batas paket Figma). Isinya ditaruh di halaman aktif.`);
    return figma.currentPage;
  }
}

/** Posisi Y kosong di bawah semua isi halaman. @param {PageNode} page */
function freeY(page) {
  let bottom = -GAP_Y * 2;
  for (const n of page.children) bottom = Math.max(bottom, n.y + n.height);
  return bottom + GAP_Y * 2;
}

// ---------------------------------------------------------------------------
// Token → variables & styles
// ---------------------------------------------------------------------------

/**
 * @param {any} obj @param {string[]} prefix @param {{ path: string[], token: any }[]} out
 */
function walk(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) out.push({ path: prefix.concat(k), token: v });
    else if (v && typeof v === 'object') walk(v, prefix.concat(k), out);
  }
  return out;
}

/** @param {any} tokens */
async function importTokens(tokens) {
  const all = walk(tokens, [], []);
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const col = collections.find((c) => c.name === 'SkillLearn') || figma.variables.createVariableCollection('SkillLearn');
  const mode = col.modes[0].modeId;
  const existing = await figma.variables.getLocalVariablesAsync();
  const byName = new Map(existing.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
  let nVar = 0;
  let nText = 0;
  let nFx = 0;

  for (const { path, token } of all) {
    const t = token.$type;
    if (t !== 'color' && t !== 'dimension') continue;
    const name = path.join('/');
    let v = byName.get(name);
    if (!v) v = figma.variables.createVariable(name, col, t === 'color' ? 'COLOR' : 'FLOAT');
    v.setValueForMode(mode, t === 'color' ? hexToRgba(token.$value) : px(token.$value));
    if (token.$description) v.description = token.$description;
    if (t === 'dimension') v.scopes = path[0] === 'radius' ? ['CORNER_RADIUS'] : path[0] === 'space' ? ['GAP', 'WIDTH_HEIGHT'] : ['WIDTH_HEIGHT'];
    nVar++;
  }

  const textStyles = await figma.getLocalTextStylesAsync();
  for (const { path, token } of all.filter((x) => x.token.$type === 'typography')) {
    const v = token.$value;
    const font = { family: v.fontFamily, style: WEIGHT[/** @type {keyof typeof WEIGHT} */ (v.fontWeight)] || 'Regular' };
    try {
      await figma.loadFontAsync(font);
    } catch {
      say('Font tidak tersedia di Figma: ' + font.family + ' ' + font.style);
      continue;
    }
    const name = 'SkillLearn/' + path.slice(1).join('/');
    const s = textStyles.find((x) => x.name === name) || figma.createTextStyle();
    s.name = name;
    s.fontName = font;
    s.fontSize = px(v.fontSize);
    s.lineHeight = { unit: 'PERCENT', value: Math.round(v.lineHeight * 100) };
    s.letterSpacing = { unit: 'PERCENT', value: v.letterSpacing ? parseFloat(v.letterSpacing) * 100 : 0 };
    s.textCase = v.textTransform === 'uppercase' ? 'UPPER' : 'ORIGINAL';
    if (token.$description) s.description = token.$description;
    nText++;
  }

  const fxStyles = await figma.getLocalEffectStylesAsync();
  for (const { path, token } of all.filter((x) => x.token.$type === 'shadow')) {
    const v = token.$value;
    const name = 'SkillLearn/shadow/' + path.slice(1).join('/');
    const s = fxStyles.find((x) => x.name === name) || figma.createEffectStyle();
    s.name = name;
    s.effects = [
      {
        type: 'DROP_SHADOW',
        color: hexToRgba(v.color),
        offset: { x: px(v.offsetX), y: px(v.offsetY) },
        radius: px(v.blur),
        spread: px(v.spread),
        visible: true,
        blendMode: 'NORMAL',
      },
    ];
    nFx++;
  }
  return `${nVar} variables, ${nText} text styles, ${nFx} effect styles`;
}

/** Warna variable SkillLearn berdasarkan hex, untuk menyambungkan fill ke token. */
async function loadColorVariables() {
  /** @type {Map<string, Variable>} */
  const map = new Map();
  const col = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === 'SkillLearn');
  if (!col) return map;
  const vars = await figma.variables.getLocalVariablesAsync('COLOR');
  for (const v of vars) {
    if (v.variableCollectionId !== col.id) continue;
    const val = v.valuesByMode[col.defaultModeId];
    if (val && typeof val === 'object' && 'r' in val && (!('a' in val) || val.a === 1)) {
      const key = toHex(val);
      // Kalau ada beberapa token dengan warna sama, pakai yang namanya paling pendek (biasanya token utama).
      const prev = map.get(key);
      if (!prev || v.name.length < prev.name.length) map.set(key, v);
    }
  }
  return map;
}

/** Text style SkillLearn, dicari dari kombinasi font + ukuran. */
async function loadTextStyles() {
  /** @type {Map<string, TextStyle>} */
  const map = new Map();
  for (const s of await figma.getLocalTextStylesAsync()) {
    if (!s.name.startsWith('SkillLearn/')) continue;
    map.set(`${s.fontName.family}|${s.fontName.style}|${s.fontSize}`, s);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Layer
// ---------------------------------------------------------------------------

/** @type {Map<string, Variable>} */
let colorVars = new Map();
/** @type {Map<string, TextStyle>} */
let textStyleMap = new Map();
/** @type {Map<string, string>} */
const imageHashes = new Map();
/** @type {Map<string, FontName>} */
const fontCache = new Map();

/** @param {Rgba} c @returns {SolidPaint} */
function solid(c) {
  /** @type {SolidPaint} */
  const paint = { type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a };
  const v = c.a === 1 ? colorVars.get(toHex(c)) : undefined;
  return v ? figma.variables.setBoundVariableForPaint(paint, 'color', v) : paint;
}

/** @param {TextSt} st */
function styleName(st) {
  const base = WEIGHT[/** @type {keyof typeof WEIGHT} */ (st.w)] || 'Regular';
  if (!st.i) return base;
  return base === 'Regular' ? 'Italic' : `${base} Italic`;
}

/** Muat semua font yang dipakai sekali di awal. Kalau tidak ada di Figma, ganti Inter. @param {TextSt[]} styles */
async function loadFonts(styles) {
  for (const st of styles) {
    const key = `${st.f}|${styleName(st)}`;
    if (fontCache.has(key)) continue;
    const wanted = { family: st.f, style: styleName(st) };
    const candidates = [wanted, { family: st.f, style: WEIGHT[/** @type {keyof typeof WEIGHT} */ (st.w)] || 'Regular' }, { family: 'Inter', style: styleName(st) }, { family: 'Inter', style: 'Regular' }];
    for (const font of candidates) {
      try {
        await figma.loadFontAsync(font);
        fontCache.set(key, font);
        break;
      } catch {
        // coba kandidat berikutnya
      }
    }
  }
}

/** @param {TextSt} st @returns {FontName} */
const fontFor = (st) => fontCache.get(`${st.f}|${styleName(st)}`) || { family: 'Inter', style: 'Regular' };

/** @param {string} key @param {Record<string, string>} images */
function imageHash(key, images) {
  let hash = imageHashes.get(key);
  if (!hash) {
    hash = figma.createImage(figma.base64Decode(images[key])).hash;
    imageHashes.set(key, hash);
  }
  return hash;
}

/** Cocokkan teks dengan text style token kalau ukuran, line height, dan letter spacing-nya sama. @param {TextSt} st */
function matchTextStyle(st) {
  const s = textStyleMap.get(`${fontFor(st).family}|${fontFor(st).style}|${st.s}`);
  if (!s) return null;
  const lh = s.lineHeight.unit === 'PIXELS' ? s.lineHeight.value : s.lineHeight.unit === 'PERCENT' ? (s.lineHeight.value / 100) * s.fontSize : null;
  const ls = s.letterSpacing.unit === 'PIXELS' ? s.letterSpacing.value : (s.letterSpacing.value / 100) * s.fontSize;
  const lhOk = st.lh == null ? lh == null : lh != null && Math.abs(lh - st.lh) <= 0.6;
  return lhOk && Math.abs(ls - (st.ls || 0)) <= 0.15 ? s : null;
}

/**
 * @param {any} n
 * @param {FrameNode} parent
 * @param {Record<string, string>} images
 */
async function build(n, parent, images) {
  if (n.t === 'frame') {
    const f = figma.createFrame();
    parent.appendChild(f);
    f.name = n.name;
    f.resizeWithoutConstraints(Math.max(0.01, n.w), Math.max(0.01, n.h));
    f.x = n.x;
    f.y = n.y;
    /** @type {Paint[]} */
    const fills = (n.fills || []).map(solid);
    if (n.img && images[n.img]) fills.push({ type: 'IMAGE', imageHash: imageHash(n.img, images), scaleMode: 'FILL' });
    f.fills = fills;
    f.clipsContent = Boolean(n.clip);
    if (n.stroke) {
      f.strokes = [solid(n.stroke)];
      f.strokeAlign = 'INSIDE';
      const [t, r, b, l] = n.sw;
      if (t === r && r === b && b === l) f.strokeWeight = t;
      else {
        f.strokeTopWeight = t;
        f.strokeRightWeight = r;
        f.strokeBottomWeight = b;
        f.strokeLeftWeight = l;
      }
      if (n.dash) f.dashPattern = [4, 4];
    }
    const [tl, tr, br, bl] = n.r;
    if (tl === tr && tr === br && br === bl) f.cornerRadius = tl;
    else {
      f.topLeftRadius = tl;
      f.topRightRadius = tr;
      f.bottomRightRadius = br;
      f.bottomLeftRadius = bl;
    }
    if (n.fx) {
      // Figma hanya menerima spread pada frame yang punya fill dan memotong isinya.
      const spreadOk = fills.length > 0 && f.clipsContent;
      f.effects = n.fx.map((/** @type {any} */ e) => ({
        type: e.inset ? 'INNER_SHADOW' : 'DROP_SHADOW',
        color: { r: e.color.r, g: e.color.g, b: e.color.b, a: e.color.a },
        offset: { x: e.x, y: e.y },
        radius: e.blur,
        spread: spreadOk ? e.spread : 0,
        visible: true,
        blendMode: 'NORMAL',
      }));
    }
    if (n.o != null) f.opacity = n.o;
    for (const c of n.children || []) await build(c, f, images);
    return;
  }

  if (n.t === 'text') {
    const t = figma.createText();
    parent.appendChild(t);
    /** @type {TextSt} */
    const st = n.st;
    t.fontName = fontFor(st);
    t.characters = n.chars;
    t.fontSize = st.s;
    t.lineHeight = st.lh ? { unit: 'PIXELS', value: st.lh } : { unit: 'AUTO' };
    t.letterSpacing = { unit: 'PIXELS', value: st.ls || 0 };
    t.fills = [solid(st.c)];
    if (st.u) t.textDecoration = 'UNDERLINE';
    if (!n.ranges) {
      const style = matchTextStyle(st);
      if (style) await t.setTextStyleIdAsync(style.id);
    }
    for (const r of n.ranges || []) {
      /** @type {TextSt} */
      const rs = r.st;
      t.setRangeFontName(r.s, r.e, fontFor(rs));
      t.setRangeFontSize(r.s, r.e, rs.s);
      t.setRangeFills(r.s, r.e, [solid(rs.c)]);
      t.setRangeLetterSpacing(r.s, r.e, { unit: 'PIXELS', value: rs.ls || 0 });
      t.setRangeTextDecoration(r.s, r.e, rs.u ? 'UNDERLINE' : 'NONE');
    }
    t.textAlignHorizontal = n.align;
    if (n.wrap) {
      t.resize(Math.max(1, n.w), Math.max(1, t.height));
      t.textAutoResize = 'HEIGHT';
    } else {
      t.textAutoResize = 'WIDTH_AND_HEIGHT';
    }
    t.x = n.x;
    t.y = n.y;
    t.name = n.name;
    if (n.o != null) t.opacity = n.o;
    return;
  }

  if (n.t === 'svg') {
    try {
      const v = figma.createNodeFromSvg(n.svg);
      parent.appendChild(v);
      v.name = n.name;
      v.x = n.x;
      v.y = n.y;
      if (n.o != null) v.opacity = n.o;
    } catch {
      // SVG yang tidak bisa dibaca Figma dilewati saja, sisanya tetap jalan.
    }
  }
}

/** @param {any[]} list @param {TextSt[]} out */
function collectStyles(list, out) {
  for (const n of list) {
    if (n.t === 'text') {
      out.push(n.st);
      for (const r of n.ranges || []) out.push(r.st);
    }
    if (n.children) collectStyles(n.children, out);
  }
  return out;
}

/** @param {any} data */
async function importLayers(data) {
  const screens = /** @type {any[]} */ (data.screens);
  say('Memuat font…');
  await loadFonts(collectStyles(screens.flatMap((s) => s.children), []));

  const pages = { web: 'Web', mobile: 'Mobile' };
  let done = 0;
  let layers = 0;
  for (const platform of /** @type {('web' | 'mobile')[]} */ (['web', 'mobile'])) {
    const list = screens.filter((s) => s.platform === platform);
    if (!list.length) continue;
    const page = await ensurePage(pages[platform]);
    await figma.setCurrentPageAsync(page);
    let y = freeY(page);
    /** @type {SceneNode[]} */
    const created = [];
    const ids = [...new Set(list.map((s) => s.id))];
    for (const id of ids) {
      let x = 0;
      let rowH = 0;
      for (const s of list.filter((it) => it.id === id)) {
        say(`Membangun ${s.id} ${s.name} / ${s.state}  (${done + 1}/${screens.length})`);
        const frame = figma.createFrame();
        page.appendChild(frame);
        frame.name = `${s.id} ${s.name} / ${s.state}`;
        frame.resizeWithoutConstraints(s.w, s.h);
        frame.x = x;
        frame.y = y;
        frame.fills = [solid(s.bg)];
        frame.clipsContent = true;
        for (const c of s.children) await build(c, frame, data.images);
        layers += frame.findAll().length;
        created.push(frame);
        x += s.w + GAP_X;
        rowH = Math.max(rowH, s.h);
        done++;
      }
      y += rowH + GAP_Y;
    }
    figma.viewport.scrollAndZoomIntoView(created);
  }
  return `${done} layar (${layers} layer)`;
}

/** @param {{ name: string, bytes: Uint8Array }[]} images */
async function importReference(images) {
  const tiles = images
    .filter((img) => /^reference__R\d+/.test(img.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!tiles.length) return null;
  const page = await ensurePage('Reference');
  await figma.setCurrentPageAsync(page);
  // Potongan disusun rapat tanpa jarak, jadi terlihat sebagai satu kanvas utuh.
  const holder = figma.createFrame();
  page.appendChild(holder);
  holder.name = 'R00 Design canvas (foundations, flow, states)';
  holder.x = 0;
  holder.y = freeY(page);
  holder.fills = [];
  let y = 0;
  let width = 0;
  for (const tile of tiles) {
    const image = figma.createImage(tile.bytes);
    const { width: w, height: h } = await image.getSizeAsync();
    const scale = w >= 2000 ? 2 : 1; // PNG hasil capture beresolusi 2x
    const part = figma.createRectangle();
    holder.appendChild(part);
    part.name = tile.name.replace(/\.png$/, '');
    part.resize(w / scale, h / scale);
    part.x = 0;
    part.y = y;
    part.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
    y += h / scale;
    width = Math.max(width, w / scale);
  }
  holder.resizeWithoutConstraints(width, y);
  return `kanvas referensi (${tiles.length} potongan)`;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'import') return;
  try {
    const parts = [];
    if (msg.tokens) {
      say('Membuat variables & styles…');
      parts.push(await importTokens(msg.tokens));
    }
    colorVars = await loadColorVariables();
    textStyleMap = await loadTextStyles();
    if (msg.layers) parts.push(await importLayers(msg.layers));
    if (msg.images && msg.images.length) {
      say('Menaruh kanvas referensi…');
      const ref = await importReference(msg.images);
      if (ref) parts.push(ref);
    }
    const text = 'Selesai: ' + parts.join(' · ');
    say(text, true);
    figma.notify(text);
  } catch (e) {
    say('Error: ' + (e instanceof Error ? e.message : String(e)), true);
  }
};
