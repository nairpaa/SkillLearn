// Unit test sanitasi Markdown: konten artikel dari API tidak boleh bisa menjalankan script.
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Markdown } from '../components/Markdown';

afterEach(cleanup);

const renderMd = (md) => render(<Markdown>{md}</Markdown>).container;

describe('Markdown (XSS)', () => {
  it('HTML mentah tidak dirender sebagai elemen', () => {
    const c = renderMd('Halo <img src=x onerror="alert(1)"> <script>alert(2)</script> <iframe src="https://evil.example"></iframe>');
    expect(c.querySelector('img')).toBeNull();
    expect(c.querySelector('script')).toBeNull();
    expect(c.querySelector('iframe')).toBeNull();
    expect(c.innerHTML).not.toMatch(/onerror=/i);
  });

  it('link javascript: / data: / vbscript: dibuang', () => {
    const c = renderMd('[a](javascript:alert(1)) [b](data:text/html,<script>alert(1)</script>) [c](vbscript:msgbox(1)) [d](JaVaScRiPt:alert(1))');
    for (const a of c.querySelectorAll('a')) {
      expect(a.getAttribute('href') || '').not.toMatch(/^(javascript|data|vbscript):/i);
    }
  });

  it('link eksternal dibuka di tab baru dengan rel noopener noreferrer', () => {
    const a = renderMd('[docs](https://react.dev)').querySelector('a');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('atribut event & style tidak bisa diselundupkan lewat gambar markdown', () => {
    const c = renderMd('![x" onerror="alert(1)](https://i.ytimg.com/vi/x/hqdefault.jpg)');
    const img = c.querySelector('img');
    // Teks berbahaya hanya jadi isi alt (sudah di-escape), bukan atribut sungguhan.
    expect(img.getAttributeNames().sort()).toEqual(['alt', 'loading', 'src']);
    expect(img.hasAttribute('onerror')).toBe(false);
  });

  it('fitur yang diharapkan tetap jalan: heading, code block, inline code, kotak Tip', () => {
    const c = renderMd('# Judul\n\nPakai `useState`.\n\n```jsx\nconst a = 1;\n```\n\n> **Tip:** simpan state seperlunya');
    expect(c.querySelector('h2').textContent).toBe('Judul');
    expect(c.querySelector('code.inline-code').textContent).toBe('useState');
    expect(c.textContent).toContain('const a = 1;');
    expect(c.querySelector('.md-tip')).not.toBeNull();
  });
});
