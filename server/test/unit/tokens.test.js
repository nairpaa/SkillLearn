// Unit test access token PASETO v4.public.
import { after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PublicProtocol } from 'paseto';
import { GenerateKeyPairFactory, ImportSecretKeyFactory, SignFactory } from 'paseto/v4/public';
import { close, tokens } from '../helpers.js';

after(close);

const user = { _id: '507f1f77bcf86cd799439011', role: 'student' };
const v4 = new PublicProtocol(SignFactory, ImportSecretKeyFactory, GenerateKeyPairFactory);
const footer = (kid) => new TextEncoder().encode(JSON.stringify({ kid }));

describe('issueAccessToken / verifyAccessToken', () => {
  it('menerbitkan v4.public dengan claim lengkap dan umur 15 menit', async () => {
    const token = await tokens.issueAccessToken(user, 'sess1');
    assert.match(token, /^v4\.public\./);
    const c = await tokens.verifyAccessToken(token);
    assert.equal(c.sub, user._id);
    assert.equal(c.sid, 'sess1');
    assert.equal(c.role, 'student');
    assert.equal(c.iss, 'skilllearn-api');
    assert.equal(c.aud, 'skilllearn-app');
    assert.ok(c.jti && c.iat);
    const ttl = (Date.parse(c.exp) - Date.parse(c.iat)) / 1000;
    assert.equal(ttl, 900);
  });

  it('setiap token punya jti berbeda', async () => {
    const a = await tokens.verifyAccessToken(await tokens.issueAccessToken(user, 's'));
    const b = await tokens.verifyAccessToken(await tokens.issueAccessToken(user, 's'));
    assert.notEqual(a.jti, b.jti);
  });

  it('menolak token yang satu karakternya diubah', async () => {
    const token = await tokens.issueAccessToken(user, 's');
    const i = token.indexOf('.', 10) - 5;
    const tampered = token.slice(0, i) + (token[i] === 'A' ? 'B' : 'A') + token.slice(i + 1);
    await assert.rejects(tokens.verifyAccessToken(tampered));
  });

  it('menolak token kedaluwarsa', async () => {
    const secret = await v4.ImportSecretKey(process.env.PASETO_SECRET_KEY);
    const old = await v4.Sign(secret, { sub: user._id, sid: 's', role: 'student', iss: 'skilllearn-api', aud: 'skilllearn-app' }, {
      footer: footer('test'),
      expiresIn: 900,
      now: new Date(Date.now() - 60 * 60 * 1000),
    });
    await assert.rejects(tokens.verifyAccessToken(old));
  });

  it('menolak token yang ditandatangani kunci lain', async () => {
    const { secretKey } = await v4.GenerateKeyPair();
    const forged = await v4.Sign(secretKey, { sub: user._id, sid: 's', role: 'admin', iss: 'skilllearn-api', aud: 'skilllearn-app' }, { footer: footer('test') });
    await assert.rejects(tokens.verifyAccessToken(forged));
  });

  it('menolak audience/issuer yang salah', async () => {
    const secret = await v4.ImportSecretKey(process.env.PASETO_SECRET_KEY);
    const wrongAud = await v4.Sign(secret, { sub: user._id, sid: 's', role: 'student', iss: 'skilllearn-api', aud: 'aplikasi-lain' }, { footer: footer('test') });
    const wrongIss = await v4.Sign(secret, { sub: user._id, sid: 's', role: 'student', iss: 'penipu', aud: 'skilllearn-app' }, { footer: footer('test') });
    await assert.rejects(tokens.verifyAccessToken(wrongAud));
    await assert.rejects(tokens.verifyAccessToken(wrongIss));
  });

  it('menolak kid tidak dikenal, footer rusak, dan token JWT alg:none', async () => {
    const secret = await v4.ImportSecretKey(process.env.PASETO_SECRET_KEY);
    const claims = { sub: user._id, sid: 's', role: 'student', iss: 'skilllearn-api', aud: 'skilllearn-app' };
    await assert.rejects(tokens.verifyAccessToken(await v4.Sign(secret, claims, { footer: footer('k-asing') })));
    await assert.rejects(tokens.verifyAccessToken(await v4.Sign(secret, claims)));
    await assert.rejects(tokens.verifyAccessToken('eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.'));
    await assert.rejects(tokens.verifyAccessToken(''));
  });
});
