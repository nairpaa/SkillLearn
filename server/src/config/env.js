// Semua konfigurasi dibaca dari environment variable di satu tempat,
// jadi file lain tidak perlu membaca process.env langsung (dan typo nama variabel cepat ketahuan).
import 'dotenv/config';

const list = (value) =>
  (value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

function parseTrustProxy(value = 'loopback') {
  if (/^\d+$/.test(value)) return Number(value);
  if (value === 'false') return false;
  if (value === 'true') return true;
  return value;
}

const isProd = process.env.NODE_ENV === 'production';
const appOrigins = list(process.env.APP_ORIGIN || 'http://localhost:5173');

export const env = {
  isProd,
  port: Number(process.env.PORT) || 8080,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skilllearn',

  // Kunci PASETO dalam format PASERK. Buat sekali dengan `npm run keys`.
  pasetoSecretKey: process.env.PASETO_SECRET_KEY,
  pasetoPublicKey: process.env.PASETO_PUBLIC_KEY,
  pasetoKid: process.env.PASETO_KID || 'k1',
  // Kunci publik lama yang masih diterima selama rotasi, format: "k0=k4.public.xxx,k-1=k4.public.yyy"
  pasetoPreviousKeys: list(process.env.PASETO_PREVIOUS_PUBLIC_KEYS).map((pair) => {
    const [kid, key] = pair.split('=');
    return { kid, key };
  }),

  // Origin web yang boleh memakai cookie refresh + CORS. Bisa lebih dari satu, pisahkan koma.
  appOrigins,
  // Alamat web untuk link di email (verifikasi & reset password).
  appUrl: (process.env.APP_URL || appOrigins[0] || 'http://localhost:5173').replace(/\/$/, ''),

  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  // Rahasia bersama dengan function proxy di web (Vercel). Hanya request yang membawa rahasia ini
  // yang boleh menentukan IP klien lewat header X-SkillLearn-Client-IP.
  proxySecret: process.env.PROXY_SHARED_SECRET || '',

  mail: {
    resendApiKey: process.env.RESEND_API_KEY,
    smtpUrl: process.env.SMTP_URL,
    from: process.env.MAIL_FROM || 'SkillLearn <onboarding@resend.dev>',
  },

  seed: {
    adminEmail: (process.env.ADMIN_EMAIL || 'admin@skilllearn.id').toLowerCase(),
    adminPassword: process.env.ADMIN_PASSWORD,
    // Di production password demo WAJIB diisi sendiri (bukan default yang tertulis di README).
    demoPassword: process.env.DEMO_PASSWORD || (isProd ? '' : 'Belajar123'),
  },
};

export function assertSecrets() {
  if (!env.pasetoSecretKey || !env.pasetoPublicKey) {
    throw new Error('PASETO_SECRET_KEY / PASETO_PUBLIC_KEY belum diisi. Jalankan `npm run keys` lalu salin hasilnya ke .env');
  }
  // Tanpa rahasia proxy yang kuat, semua pengguna web terbaca satu IP (IP Vercel) dan berbagi kuota rate limit.
  if (env.isProd && env.proxySecret.length < 32) {
    console.warn(
      '[PERINGATAN] PROXY_SHARED_SECRET kosong/terlalu pendek (min. 32 karakter). Rate limit pengguna web akan memakai IP Vercel bersama. ' +
        'Isi nilai acak yang sama di API dan project Vercel web (lihat docs/DEPLOYMENT.md).'
    );
  }
}
