// URL API diambil dari EXPO_PUBLIC_API_URL (lihat .env.example). Expo menanam nilainya saat bundling.
// Alamat lokal (http, IP VM) HANYA dipakai saat development. Build rilis tanpa URL https tidak punya
// fallback (request gagal dengan pesan jaringan), dan build EAS sudah dicegah di app.config.js.
const fallback = typeof __DEV__ !== 'undefined' && __DEV__ ? 'http://192.168.159.128:8080/api' : '';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || fallback).replace(/\/+$/, '');

// Hosting gratis (Render) bisa cold start sampai ~50 detik, jadi batas tunggunya dibuat longgar
export const REQUEST_TIMEOUT_MS = 60000;

// Khusus screenshot di browser: pura-pura punya notch/home indicator seperti iPhone
export const WEB_FAKE_INSETS = process.env.EXPO_PUBLIC_WEB_FAKE_INSETS === '1';
