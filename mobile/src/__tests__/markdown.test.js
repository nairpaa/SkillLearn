import { describe, expect, it } from 'vitest';
import { hasInlineCode, isSafeLink, parseBlocks, parseInline, plainText } from '../utils/markdown';

describe('parseBlocks', () => {
  it('mengenali heading, paragraf, code block, list, dan kotak tip', () => {
    const blocks = parseBlocks('## Judul\n\nParagraf satu\nlanjut.\n\n```jsx\nconst a = 1;\n```\n\n1. satu\n2. dua\n\n> **Tip:** hemat state');
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'para', 'code', 'list', 'quote']);
    expect(blocks[0]).toMatchObject({ level: 2, text: 'Judul' });
    expect(blocks[1].text).toBe('Paragraf satu lanjut.');
    expect(blocks[2]).toEqual({ type: 'code', lang: 'jsx', code: 'const a = 1;' });
    expect(blocks[3]).toMatchObject({ ordered: true, start: 1, items: ['satu', 'dua'] });
    expect(blocks[4].text).toBe('**Tip:** hemat state');
  });

  it('HTML mentah tetap jadi teks paragraf, bukan elemen', () => {
    const [b] = parseBlocks('<script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(b.type).toBe('para');
    expect(b.text).toContain('<script>');
  });

  it('input kosong / null aman', () => {
    expect(parseBlocks(null)).toEqual([]);
    expect(parseBlocks('\n\n')).toEqual([]);
  });
});

describe('parseInline', () => {
  it('code, bold, italic, link', () => {
    const t = parseInline('Pakai `useState`, **penting**, *miring*, [docs](https://react.dev)');
    expect(t.map((x) => x.t)).toEqual(['text', 'code', 'text', 'bold', 'text', 'italic', 'text', 'link']);
    expect(t.at(-1).href).toBe('https://react.dev');
    expect(hasInlineCode(t)).toBe(true);
    expect(plainText(t)).toBe('Pakai useState, penting, miring, docs');
  });

  it('gambar diganti teks alt-nya (tidak memuat URL luar)', () => {
    expect(plainText(parseInline('lihat ![diagram](https://evil.example/track.png) ini'))).toBe('lihat diagram ini');
  });
});

describe('isSafeLink', () => {
  it('hanya http/https yang boleh dibuka', () => {
    expect(isSafeLink('https://react.dev/learn')).toBe(true);
    expect(isSafeLink('http://example.com')).toBe(true);
    for (const bad of ['javascript:alert(1)', 'JAVASCRIPT:alert(1)', 'intent://scan#Intent;end', 'file:///etc/passwd', 'tel:123', 'data:text/html,x', 'https://', '', null, 'https://a b.com']) {
      expect(isSafeLink(bad), String(bad)).toBe(false);
    }
  });
});
