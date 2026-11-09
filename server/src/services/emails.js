import { env } from '../config/env.js';
import { sendMail } from './mailer.js';

// Template email sederhana dengan warna SkillLearn. Email client tidak mendukung CSS eksternal,
// jadi style-nya inline.
function layout({ heading, body, cta, url, footnote }) {
  return `<!doctype html><html><body style="margin:0;background:#F6F8F7;font-family:Arial,Helvetica,sans-serif;color:#16211F">
<div style="max-width:480px;margin:0 auto;padding:32px 20px">
  <div style="font-size:20px;font-weight:800;color:#0E5E52;margin-bottom:24px">SkillLearn</div>
  <div style="background:#fff;border:1px solid #E3E8E6;border-radius:14px;padding:28px">
    <h1 style="font-size:22px;margin:0 0 12px">${heading}</h1>
    <p style="font-size:15px;line-height:1.6;color:#2E3A38;margin:0 0 20px">${body}</p>
    ${cta ? `<a href="${url}" style="display:inline-block;background:#0E5E52;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">${cta}</a>
    <p style="font-size:12px;color:#4A5856;margin:20px 0 0;word-break:break-all">Or open this link: ${url}</p>` : ''}
  </div>
  <p style="font-size:12px;color:#4A5856;margin-top:16px">${footnote}</p>
</div></body></html>`;
}

// Sengaja TANPA nama pendaftar: nama diisi bebas oleh siapa saja, jadi kalau ikut ditampilkan,
// email ini bisa dipakai menitipkan teks/link penipuan ke alamat orang lain.
export function sendVerificationEmail(user, token) {
  const url = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: user.email,
    subject: 'Verify your SkillLearn email',
    text: `Hi,\n\nOpen this link to activate your SkillLearn account (valid for 24 hours). You'll be asked for the password you chose when signing up:\n${url}\n\nIf you didn't sign up, you can ignore this email. Nobody can use this link without that password.`,
    html: layout({
      heading: 'Welcome to SkillLearn',
      body: 'Confirm your email to activate your account. You’ll be asked for the password you chose when signing up. The link is valid for 24 hours.',
      cta: 'Verify email',
      url,
      footnote: "If you didn't sign up for SkillLearn, you can ignore this email. Nobody can use this link without the password chosen at sign-up.",
    }),
  });
}

// Dikirim kalau ada yang mendaftar memakai email yang sudah terdaftar.
// Respons API tetap sama (202), pemilik email yang diberi tahu lewat email ini.
export function sendAccountExistsEmail(user) {
  const url = `${env.appUrl}/forgot-password`;
  return sendMail({
    to: user.email,
    subject: 'You already have a SkillLearn account',
    text: `Someone (maybe you) tried to create a SkillLearn account with this email.\nYou already have an account. Log in, or reset your password here:\n${url}\n\nIf this wasn't you, no action is needed.`,
    html: layout({
      heading: 'You already have an account',
      body: 'Someone (maybe you) tried to sign up with this email. Log in with your existing account, or reset your password if you forgot it.',
      cta: 'Reset password',
      url,
      footnote: "If this wasn't you, no action is needed. Your account is safe.",
    }),
  });
}

export function sendResetEmail(user, token) {
  const url = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: user.email,
    subject: 'Reset your SkillLearn password',
    text: `Open this link to set a new password (valid for 30 minutes, single use):\n${url}\n\nIf you didn't ask for this, ignore this email. Your password stays the same.`,
    html: layout({
      heading: 'Reset your password',
      body: 'Use the button below to set a new password. The link expires in 30 minutes and works once.',
      cta: 'Set new password',
      url,
      footnote: "If you didn't ask for a reset, ignore this email. Your password stays the same.",
    }),
  });
}
