// Parser Markdown mini. Sengaja nggak pakai library yang bisa merender HTML mentah:
// tag HTML di konten cuma tampil sebagai teks biasa (aman dari XSS / konten aneh).

const LIST_RE = /^\s*([-*+]|\d+[.)])\s+(.*)$/;
const BLOCK_START = /^\s*(```|~~~|#{1,6}\s|>|([-*+]|\d+[.)])\s)/;

export function parseBlocks(md) {
  const lines = String(md ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    let m = line.match(/^\s*(```|~~~)\s*([\w+#.-]*)/);
    if (m) {
      const fence = m[1];
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1; // lewati penutup fence
      blocks.push({ type: 'code', lang: m[2] || '', code: buf.join('\n') });
      continue;
    }

    m = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (m) {
      blocks.push({ type: 'heading', level: m[1].length, text: m[2] });
      i += 1;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i += 1;
      }
      blocks.push({ type: 'quote', text: buf.join(' ').replace(/\s+/g, ' ').trim() });
      continue;
    }

    m = line.match(LIST_RE);
    if (m) {
      const ordered = /\d/.test(m[1]);
      const start = ordered ? parseInt(m[1], 10) || 1 : 1;
      const items = [];
      while (i < lines.length) {
        const mm = lines[i].match(LIST_RE);
        if (mm && /\d/.test(mm[1]) === ordered) {
          items.push(mm[2]);
          i += 1;
        } else if (items.length && /^\s{2,}\S/.test(lines[i])) {
          items[items.length - 1] += ` ${lines[i].trim()}`;
          i += 1;
        } else break;
      }
      blocks.push({ type: 'list', ordered, start, items });
      continue;
    }

    const buf = [line.trim()];
    i += 1;
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) {
      buf.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'para', text: buf.join(' ') });
  }
  return blocks;
}

// Inline: `code`, **bold**, *italic*, [link](url), escape \*. Gambar diganti teks alt-nya.
const INLINE_SRC = /(`+)([\s\S]*?[^`])\1(?!`)|\*\*([\s\S]+?)\*\*|\*([^*\s][^*]*?)\*|\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|\\([\\`*_{}[\]()#+\-.!>])/g;

export function parseInline(text) {
  const src = String(text ?? '').replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  const out = [];
  let last = 0;
  let m;
  const pushText = (v) => {
    if (!v) return;
    const prev = out[out.length - 1];
    if (prev && prev.t === 'text') prev.v += v;
    else out.push({ t: 'text', v });
  };
  // regex baru per panggilan: parseInline rekursif, jadi lastIndex nggak boleh dipakai bareng
  const re = new RegExp(INLINE_SRC.source, 'g');
  while ((m = re.exec(src))) {
    pushText(src.slice(last, m.index));
    if (m[2] !== undefined) out.push({ t: 'code', v: m[2].trim() || m[2] });
    else if (m[3] !== undefined) out.push({ t: 'bold', children: parseInline(m[3]) });
    else if (m[4] !== undefined) out.push({ t: 'italic', children: parseInline(m[4]) });
    else if (m[5] !== undefined) out.push({ t: 'link', href: m[6], children: parseInline(m[5]) });
    else if (m[7] !== undefined) pushText(m[7]);
    last = re.lastIndex;
  }
  pushText(src.slice(last));
  return out;
}

export const hasInlineCode = (tokens) =>
  tokens.some((t) => t.t === 'code' || (t.children && hasInlineCode(t.children)));

export const plainText = (tokens) =>
  tokens.map((t) => (t.t === 'text' || t.t === 'code' ? t.v : plainText(t.children || []))).join('');

// Link dari konten hanya boleh dibuka kalau http/https. Skema lain (javascript:, intent:, file:, tel:)
// diabaikan supaya konten tidak bisa memicu aksi aneh di HP.
export const isSafeLink = (href) => /^https?:\/\/[^\s]+$/i.test(String(href ?? '').trim());
