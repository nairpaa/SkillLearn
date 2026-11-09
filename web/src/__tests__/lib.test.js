// Unit test fungsi murni: cek latihan, highlighter, validasi & format.
import { describe, expect, it } from 'vitest';
import { runChecks } from '../lib/practice';
import { highlight } from '../lib/highlight';
import { EMAIL_RE, initials, passwordStrength, relativeTime, validateNewPassword } from '../lib/format';

describe('runChecks', () => {
  const checks = [
    { label: 'pakai useState', pattern: 'useState\\(' },
    { label: 'map', pattern: '\\.map\\(', flags: 'g' },
    { label: 'pola rusak', pattern: '([' },
    { label: 'flag aneh dibuang', pattern: 'HELLO', flags: 'iqz' },
  ];

  it('menilai tiap pola, pola rusak dihitung gagal tanpa crash', () => {
    const r = runChecks('const [a, setA] = useState([]); list.map(x => x); hello', checks);
    expect(r.map((x) => x.pass)).toEqual([true, true, false, true]);
  });

  it('daftar kosong / tanpa checks aman', () => {
    expect(runChecks('kode')).toEqual([]);
  });
});

describe('highlight', () => {
  it('memecah kode jadi token berjenis, teks HTML tetap teks (tidak jadi markup)', () => {
    const lines = highlight('const el = <h1 onclick="x">Hi</h1>;\n// komentar');
    expect(lines).toHaveLength(2);
    expect(lines[0].n).toBe(1);
    const kinds = lines[0].toks.map((t) => t.k);
    expect(kinds).toContain('kw');
    expect(kinds).toContain('tag');
    expect(lines[1].toks[0].k).toBe('com');
    expect(lines.flatMap((l) => l.toks).map((t) => t.t).join('')).toBe('const el = <h1 onclick="x">Hi</h1>;// komentar');
  });

  it('input kosong/null tidak error', () => {
    expect(highlight(null)).toHaveLength(1);
  });
});

describe('validasi form', () => {
  it('validateNewPassword sama dengan aturan server', () => {
    expect(validateNewPassword('')).toBe('Password must be at least 8 characters.');
    expect(validateNewPassword('pendek1')).toBe('Password must be at least 8 characters.');
    expect(validateNewPassword('tanpaangka')).toBe('Include at least one number.');
    expect(validateNewPassword('a1'.repeat(65))).toMatch(/128/);
    expect(validateNewPassword('Rahasia99x')).toBe('');
  });

  it('passwordStrength 0–3', () => {
    expect(passwordStrength('')).toBe(0);
    expect(passwordStrength('abcdefgh')).toBe(1);
    expect(passwordStrength('abcdefg1')).toBe(2);
    expect(passwordStrength('Abcdefghi1')).toBe(3);
  });

  it('EMAIL_RE', () => {
    expect(EMAIL_RE.test('alya@student.ac.id')).toBe(true);
    expect(EMAIL_RE.test('alya@student')).toBe(false);
    expect(EMAIL_RE.test('a b@c.id')).toBe(false);
  });

  it('initials & relativeTime', () => {
    expect(initials('Alya Rahma')).toBe('AR');
    expect(initials('')).toBe('?');
    const now = new Date('2026-11-09T10:00:00');
    expect(relativeTime('2026-11-09T09:40:00', now)).toMatch(/^Today/);
    expect(relativeTime('2026-11-08T09:40:00', now)).toBe('Yesterday');
  });
});
