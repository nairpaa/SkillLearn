// SkillLearn Importer — Figma development plugin.
// Creates: Variables collection "SkillLearn" (colors, spacing, radius, sizes),
// text styles from typography tokens, effect styles from shadows,
// and pages "Web", "Mobile", "Reference" with one frame per captured screen/state.

figma.showUI(__html__, { width: 340, height: 330 });

const hexToRgba = (hex) => {
  const h = hex.replace('#', '');
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
};
const px = (v) => parseFloat(String(v));
const WEIGHT = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };
const say = (t) => figma.ui.postMessage({ status: t });

function walk(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) out.push({ path: prefix.concat(k), token: v });
    else if (v && typeof v === 'object') walk(v, prefix.concat(k), out);
  }
  return out;
}

async function importTokens(tokens) {
  const all = walk(tokens, [], []);
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let col = collections.find(c => c.name === 'SkillLearn');
  if (!col) col = figma.variables.createVariableCollection('SkillLearn');
  const mode = col.modes[0].modeId;
  const existing = await figma.variables.getLocalVariablesAsync();
  const byName = new Map(existing.filter(v => v.variableCollectionId === col.id).map(v => [v.name, v]));
  let nVar = 0, nText = 0, nFx = 0;

  for (const { path, token } of all) {
    const t = token.$type;
    if (t === 'color' || t === 'dimension') {
      const name = path.join('/');
      const type = t === 'color' ? 'COLOR' : 'FLOAT';
      let v = byName.get(name);
      if (!v) v = figma.variables.createVariable(name, col, type);
      v.setValueForMode(mode, t === 'color' ? hexToRgba(token.$value) : px(token.$value));
      if (token.$description) v.description = token.$description;
      if (t === 'dimension') v.scopes = path[0] === 'radius' ? ['CORNER_RADIUS'] : path[0] === 'space' ? ['GAP', 'WIDTH_HEIGHT'] : ['WIDTH_HEIGHT'];
      nVar++;
    }
  }

  const textStyles = await figma.getLocalTextStylesAsync();
  for (const { path, token } of all.filter(x => x.token.$type === 'typography')) {
    const v = token.$value;
    const font = { family: v.fontFamily, style: WEIGHT[v.fontWeight] || 'Regular' };
    try { await figma.loadFontAsync(font); } catch (e) { say('Font missing in Figma: ' + font.family + ' ' + font.style); continue; }
    const name = 'SkillLearn/' + path.slice(1).join('/');
    const s = textStyles.find(x => x.name === name) || figma.createTextStyle();
    s.name = name;
    s.fontName = font;
    s.fontSize = px(v.fontSize);
    s.lineHeight = { unit: 'PERCENT', value: Math.round(v.lineHeight * 100) };
    if (v.letterSpacing) s.letterSpacing = { unit: 'PERCENT', value: parseFloat(v.letterSpacing) * 100 };
    if (v.textTransform === 'uppercase') s.textCase = 'UPPER';
    if (token.$description) s.description = token.$description;
    nText++;
  }

  const fxStyles = await figma.getLocalEffectStylesAsync();
  for (const { path, token } of all.filter(x => x.token.$type === 'shadow')) {
    const v = token.$value;
    const name = 'SkillLearn/shadow/' + path.slice(1).join('/');
    const s = fxStyles.find(x => x.name === name) || figma.createEffectStyle();
    s.name = name;
    s.effects = [{ type: 'DROP_SHADOW', color: hexToRgba(v.color), offset: { x: px(v.offsetX), y: px(v.offsetY) }, radius: px(v.blur), spread: px(v.spread), visible: true, blendMode: 'NORMAL' }];
    nFx++;
  }
  return `${nVar} variables, ${nText} text styles, ${nFx} effect styles`;
}

async function getPage(name) {
  await figma.loadAllPagesAsync();
  return figma.root.children.find(p => p.name === name) || Object.assign(figma.createPage(), { name });
}

async function importImages(images) {
  // filename: <platform>__<ID>-<slug>__<state>.png
  const groups = {};
  for (const img of images) {
    const m = img.name.match(/^(web|mobile|reference)__([A-Z]\d+)-(.+?)__(.+)\.png$/);
    if (!m) continue;
    const [, platform, id, slug, state] = m;
    (groups[platform] = groups[platform] || {});
    (groups[platform][id] = groups[platform][id] || { slug, states: [] }).states.push({ state, bytes: img.bytes });
  }
  const PAGE = { web: 'Web', mobile: 'Mobile', reference: 'Reference' };
  let count = 0;
  for (const [platform, screens] of Object.entries(groups)) {
    const page = await getPage(PAGE[platform]);
    await figma.setCurrentPageAsync(page);
    let y = 0;
    for (const id of Object.keys(screens).sort()) {
      const { slug, states } = screens[id];
      let x = 0, rowH = 0;
      for (const st of states) {
        const image = figma.createImage(st.bytes);
        const { width, height } = await image.getSizeAsync();
        // capture.mjs → 2x (1440 web / 390 mobile); bundled screenshots/ → web 909 px for a 1280 layout, mobile 390 px at 1x
        const scale = platform === 'mobile' ? width / 390 : platform === 'web' ? (width >= 2000 ? 2 : width / 1280) : (width >= 2000 ? 2 : 1);
        const w = Math.round(width / scale), h = Math.round(height / scale);
        const f = figma.createFrame();
        f.name = `${id} ${slug.replace(/-/g, ' ')} / ${st.state}`;
        f.resize(w, h);
        f.x = x; f.y = y;
        f.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
        f.locked = false;
        page.appendChild(f);
        x += w + 80; rowH = Math.max(rowH, h); count++;
        say(`Placed ${count} frames…`);
      }
      y += rowH + 160;
    }
  }
  return `${count} screen frames`;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'import') return;
  try {
    const parts = [];
    if (msg.tokens) parts.push(await importTokens(msg.tokens));
    if (msg.images && msg.images.length) parts.push(await importImages(msg.images));
    const done = 'Done: ' + parts.join(' · ');
    say(done);
    figma.notify(done);
  } catch (e) {
    say('Error: ' + (e && e.message ? e.message : e));
  }
};
