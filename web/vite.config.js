import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Semua request /api diteruskan ke Express (port 8080), jadi dari sisi browser tetap same-origin
// dan cookie refresh token (sl_rt) tetap first-party. Sengaja tanpa changeOrigin supaya
// header Origin asli tetap sampai ke server (dipakai buat cek CSRF di /auth/refresh).
const apiProxy = {
  '/api': { target: 'http://localhost:8080', xfwd: true },
};

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, proxy: apiProxy },
  preview: { host: true, port: 4173, proxy: apiProxy },
  build: { sourcemap: false },
  // Unit test (npm test): jsdom meniru browser untuk komponen React.
  test: { environment: 'jsdom', include: ['src/**/*.test.{js,jsx}'], restoreMocks: true },
});
