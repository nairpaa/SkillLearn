// npm run keys → membuat pasangan kunci Ed25519 untuk PASETO v4.public dalam format PASERK.
// Salin hasilnya ke .env (lokal) atau Environment Variables di hosting. Jalankan sekali saja;
// kalau kunci diganti, semua access token lama otomatis tidak berlaku.
import { PublicProtocol } from 'paseto';
import { ExportPublicKeyFactory, ExportSecretKeyFactory, GenerateKeyPairFactory } from 'paseto/v4/public';

const v4 = new PublicProtocol(GenerateKeyPairFactory, ExportPublicKeyFactory, ExportSecretKeyFactory);
const { publicKey, secretKey } = await v4.GenerateKeyPair({ extractable: true });

console.log(`PASETO_SECRET_KEY=${await v4.ExportSecretKey(secretKey)}`);
console.log(`PASETO_PUBLIC_KEY=${await v4.ExportPublicKey(publicKey)}`);
console.log('PASETO_KID=k1');
