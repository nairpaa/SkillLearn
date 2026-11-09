// Access token: PASETO v4.public (Ed25519), berlaku 15 menit.
// Bedanya dengan JWT: tidak ada header "alg" yang bisa diakali, algoritmanya sudah pasti dari versi token.
import crypto from 'node:crypto';
import { InspectFooter, PublicProtocol } from 'paseto';
import {
  ImportPublicKeyFactory,
  ImportSecretKeyFactory,
  SignFactory,
  VerifyFactory,
} from 'paseto/v4/public';
import { env } from '../config/env.js';
import { ACCESS_TOKEN_TTL } from '../config/constants.js';

const v4 = new PublicProtocol(SignFactory, VerifyFactory, ImportPublicKeyFactory, ImportSecretKeyFactory);

const ISSUER = 'skilllearn-api';
const AUDIENCE = 'skilllearn-app';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Kunci di-import sekali lalu disimpan. Kunci publik lama (PASETO_PREVIOUS_PUBLIC_KEYS) tetap
// diterima, jadi token yang terbit sebelum rotasi kunci masih valid sampai kedaluwarsa.
let keysPromise = null;
function loadKeys() {
  keysPromise ??= (async () => {
    const publicKeys = new Map([[env.pasetoKid, await v4.ImportPublicKey(env.pasetoPublicKey)]]);
    for (const { kid, key } of env.pasetoPreviousKeys) {
      if (kid && key) publicKeys.set(kid, await v4.ImportPublicKey(key));
    }
    return { secretKey: await v4.ImportSecretKey(env.pasetoSecretKey), publicKeys };
  })();
  return keysPromise;
}

export async function issueAccessToken(user, sessionId) {
  const { secretKey } = await loadKeys();
  const claims = {
    sub: String(user._id),
    sid: String(sessionId),
    role: user.role,
    iss: ISSUER,
    aud: AUDIENCE,
    jti: crypto.randomUUID(),
  };
  return v4.Sign(secretKey, claims, {
    expiresIn: ACCESS_TOKEN_TTL,
    footer: encoder.encode(JSON.stringify({ kid: env.pasetoKid })),
  });
}

// Lempar error kalau token tidak valid. Pemanggil yang memutuskan balasannya (401).
export async function verifyAccessToken(token) {
  const { publicKeys } = await loadKeys();

  // Footer dibaca dulu (belum terverifikasi) cuma untuk memilih kunci. Setelah itu
  // Verify memeriksa tanda tangan yang juga mencakup footer, jadi footer palsu tetap gagal.
  let kid;
  try {
    kid = JSON.parse(decoder.decode(InspectFooter(token))).kid;
  } catch {
    throw new Error('Footer token tidak valid');
  }
  const publicKey = publicKeys.get(kid);
  if (!publicKey) throw new Error('kid tidak dikenal');

  const { claims } = await v4.Verify(publicKey, token, { issuer: ISSUER, audience: AUDIENCE, clockTolerance: 30 });
  return claims;
}
