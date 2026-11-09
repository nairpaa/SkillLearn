// Unit test utilitas keamanan: escape regex (ReDoS), hash token, token acak, password.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeRegExp, randomToken, sha256 } from '../../src/services/http.js';
import { isCommonPassword } from '../../src/auth/commonPasswords.js';
import { burnTime, hashPassword, verifyPassword } from '../../src/auth/password.js';

describe('escapeRegExp', () => {
  it('membuat karakter spesial regex jadi teks biasa', () => {
    const input = '.*+?^${}()|[]\\';
    assert.ok(new RegExp(escapeRegExp(input)).test(`abc${input}def`));
    assert.equal(new RegExp(escapeRegExp('a.c')).test('abc'), false);
  });

  it('pola ReDoS klasik tidak lagi berbahaya setelah di-escape', () => {
    const evil = '(a+)+$';
    const started = performance.now();
    new RegExp(escapeRegExp(evil), 'i').test('a'.repeat(5000) + '!');
    assert.ok(performance.now() - started < 50);
  });
});

describe('token acak & hash', () => {
  it('randomToken 256-bit base64url dan selalu berbeda', () => {
    const a = randomToken();
    const b = randomToken();
    assert.match(a, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(a, b);
  });

  it('sha256 deterministik, 64 hex', () => {
    assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('isCommonPassword', () => {
  it('menangkap password populer dan polanya', () => {
    for (const p of ['password1', 'PASSWORD123', 'Qwerty123!', '11111111', '12345678', 'aaaaaaaa', 'indonesia123']) {
      assert.equal(isCommonPassword(p), true, p);
    }
  });

  it('meloloskan password yang wajar', () => {
    for (const p of ['Rahasia99x', 'kopi-susu-gula-aren-7', 'Belajar123']) assert.equal(isCommonPassword(p), false, p);
  });
});

describe('argon2id', () => {
  it('hash memakai argon2id dengan parameter OWASP', async () => {
    const hash = await hashPassword('Rahasia99x');
    assert.match(hash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it('verifikasi benar/salah, dan hash rusak tidak membuat crash', async () => {
    const hash = await hashPassword('Rahasia99x');
    assert.equal(await verifyPassword(hash, 'Rahasia99x'), true);
    assert.equal(await verifyPassword(hash, 'rahasia99x'), false);
    assert.equal(await verifyPassword('bukan-hash', 'apa'), false);
  });

  it('burnTime selalu false dan memakan waktu setara verifikasi asli', async () => {
    const hash = await hashPassword('Rahasia99x');
    let t = performance.now();
    await verifyPassword(hash, 'salah');
    const real = performance.now() - t;
    t = performance.now();
    assert.equal(await burnTime('salah'), false);
    const dummy = performance.now() - t;
    // Toleransi longgar: yang penting bukan "langsung balas" (beda orde besaran).
    assert.ok(dummy > real / 4, `dummy ${dummy.toFixed(1)}ms vs asli ${real.toFixed(1)}ms`);
  });
});
