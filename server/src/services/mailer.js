import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Kirim email lewat salah satu dari:
// 1. Resend (RESEND_API_KEY)                → sesuai dokumen arsitektur
// 2. SMTP (SMTP_URL), misalnya Gmail + App Password → bisa kirim ke alamat siapa saja tanpa domain sendiri
// 3. Tidak ada keduanya → dicetak ke log server (khusus development)
//
// Gagal kirim email tidak membuat request gagal, supaya balasan register/forgot tetap seragam.
let transport = null;

// Saat test (NODE_ENV=test), email tidak dikirim/dicetak tapi disimpan di sini supaya bisa diperiksa.
export const testOutbox = [];

export async function sendMail({ to, subject, text, html }) {
  if (process.env.NODE_ENV === 'test') {
    testOutbox.push({ to, subject, text, html });
    return;
  }
  try {
    if (env.mail.resendApiKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.mail.resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: env.mail.from, to: [to], subject, text, html }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) console.error(`[mail] Resend menolak (${res.status}):`, (await res.text()).slice(0, 300));
      return;
    }

    if (env.mail.smtpUrl) {
      transport ??= nodemailer.createTransport(env.mail.smtpUrl);
      await transport.sendMail({ from: env.mail.from, to, subject, text, html });
      return;
    }

    if (env.isProd) {
      console.warn('[mail] RESEND_API_KEY / SMTP_URL belum diisi, email tidak terkirim:', subject);
    } else {
      // Development saja: link ikut dicetak supaya alur verifikasi/reset bisa dicoba tanpa layanan email.
      console.log(`\n[mail] Untuk: ${to}\n[mail] Subjek: ${subject}\n${text}\n`);
    }
  } catch (err) {
    console.error('[mail] Gagal mengirim email:', err.message);
  }
}
