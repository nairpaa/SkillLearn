import { describe, expect, it, vi } from 'vitest';

vi.mock('../theme', () => ({
  colors: { code: { comment: 'c', string: 's', tag: 't', keyword: 'k', fn: 'f', attr: 'a', punct: 'p', text: 'x' } },
}));
const { highlight } = await import('../utils/highlight');
const { isValidEmail, initials, relativeTime, tooManyAttemptsMessage } = await import('../utils/format');

describe('highlight', () => {
  it('menghasilkan token berwarna dan isi teks tetap utuh', () => {
    const lines = highlight('const a = "x"; // catatan\n<Card title="Hi" />');
    expect(lines).toHaveLength(2);
    const flat = JSON.stringify(lines);
    expect(flat).toContain('const');
    expect(flat).toContain('catatan');
  });
});

describe('format', () => {
  it('isValidEmail', () => {
    expect(isValidEmail(' alya@student.ac.id ')).toBe(true);
    expect(isValidEmail('alya@')).toBe(false);
  });

  it('initials & relativeTime', () => {
    expect(initials('Alya Rahma')).toBe('AR');
    const now = new Date('2026-11-09T10:00:00');
    expect(relativeTime('2026-11-08T09:00:00', now)).toBe('Yesterday');
  });

  it('pesan rate limit memakai Retry-After', () => {
    expect(tooManyAttemptsMessage({ retryAfter: 900 })).toMatch(/15 minutes/);
    expect(tooManyAttemptsMessage({})).toMatch(/15 minutes/);
  });
});
