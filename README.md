# SkillLearn

Mini specialized platform untuk siswa dan mahasiswa mempelajari keterampilan praktis di luar pembelajaran formal:
**Programming, Graphic Design, Digital Marketing, Technology**. Materi berupa video tutorial, artikel, kuis, dan
latihan praktik. Pengguna wajib registrasi dan login untuk mengakses materi, bisa menyimpan favorit, dan melihat
riwayat belajar.

| Bagian | Teknologi | Folder |
| --- | --- | --- |
| Aplikasi web (admin/pengguna) | React 19 + Vite, React Router, TanStack Query | `web/` |
| Aplikasi mobile | React Native (Expo), React Navigation | `mobile/` |
| Server API | Node.js + Express 5 | `server/` |
| Database | MongoDB (Mongoose) | `server/src/models/` |
| Desain UI/UX & dokumen arsitektur | Handoff dari desain (HTML prototype, token, screenshot, plugin Figma) | `design_handoff/` |

Dokumen pendukung:

- [docs/API.md](docs/API.md): kontrak REST API yang diimplementasikan
- [docs/KEAMANAN.md](docs/KEAMANAN.md): peta kontrol keamanan ke kode, hasil review keamanan, cara menjalankan test
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): panduan deploy langkah demi langkah (Atlas, Render/Vercel, Vercel, Expo)
- `design_handoff/design/SkillLearn Architecture and Security.dc.html`: dokumen arsitektur (buka di browser, cetak ke PDF)

## Menjalankan secara lokal

Butuh Node.js 20.19+ dan MongoDB. Belum punya MongoDB? `docker compose up -d` di folder ini.

### 1. Server API (port 8080)

```bash
cd server
cp .env.example .env
npm install
npm run keys        # salin 3 baris hasilnya (PASETO_*) ke .env
npm run seed        # 8 course, kuis, 2 akun demo, 1 admin
npm run dev         # http://localhost:8080/api/health
```

Tanpa layanan email, link verifikasi dan reset password dicetak di terminal server (`[mail] …`).

Akun demo:

| Akun | Email | Password |
| --- | --- | --- |
| Pengguna lama (ada progres, favorit, riwayat) | `alya@student.ac.id` | `Belajar123` |
| Pengguna baru (kosong) | `baru@student.ac.id` | `Belajar123` |
| Admin (API `/api/admin`) | `admin@skilllearn.id` | isi `ADMIN_PASSWORD` di `.env` |

Password `Belajar123` hanya untuk lokal. Di production, akun demo memakai `DEMO_PASSWORD` pribadi (lihat docs/DEPLOYMENT.md).
Akun demo bisa mencoba semua fitur, tapi tidak bisa ganti password atau dihapus.

### 2. Web (port 5173)

```bash
cd web
npm install
npm run dev         # http://localhost:5173 (request /api diteruskan Vite ke server :8080)
```

Dari laptop host (Kali di VM), buka `http://<IP-VM>:5173`. Cek IP VM dengan `ip -4 addr show eth0`.

Perintah lain:

```bash
npm run build         # build produksi ke dist/
npm run preview:csp   # menyajikan dist/ dengan header keamanan yang sama persis dengan vercel.json
npm run shots         # screenshot semua layar & state ke web/screenshots/ (dev server harus jalan)
```

### 3. Mobile (Expo SDK 58)

```bash
cd mobile
npm install
cp .env.example .env    # isi EXPO_PUBLIC_API_URL (harus diakhiri /api)
```

Pratinjau di browser laptop (react-native-web), cukup untuk melihat semua layar:

```bash
EXPO_PUBLIC_API_URL=http://<IP-VM>:8080/api EXPO_PUBLIC_WEB_FAKE_INSETS=1 npx expo start --web --port 8081
# buka http://<IP-VM>:8081, lalu aktifkan mode perangkat di DevTools (Ctrl+Shift+M) supaya lebarnya seperti HP
```

Origin `http://<IP-VM>:8081` harus ada di `APP_ORIGIN` server supaya lolos CORS.

Di HP lewat Expo Go: HP tidak bisa menjangkau VM VMware yang memakai NAT, jadi `EXPO_PUBLIC_API_URL`
harus berisi URL API yang sudah di-deploy (misalnya `https://skilllearn-api.onrender.com/api`).

```bash
npx expo start --tunnel     # scan QR dengan Expo Go (versi SDK 58)
```

APK lewat EAS Build:

```bash
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://<api>/api --visibility plaintext
EAS_NO_VCS=1 npx eas-cli@latest build -p android --profile preview
```

## Testing

```bash
cd server && npm test              # 136 test unit + integrasi (MongoDB in-memory, tanpa Docker)
cd server && npm run test:security # 9 uji keamanan bagian 6 dokumen arsitektur (server harus jalan)
cd web && npm test                 # 30 test
cd mobile && npm test              # 18 test
```

GitHub Actions (`.github/workflows/ci.yml`) menjalankan test, build, export bundle Android, dan `npm audit` di setiap push.

## Kesesuaian dengan ketentuan tugas (LO 3)

| Ketentuan | Di mana |
| --- | --- |
| Desain UI/UX (Figma) | `design_handoff/` → di-import ke Figma sebagai layer yang bisa diedit lewat `SkillLearn-Figma-v2.zip` (alat pembuatnya di `figma-export/`, panduan di `PANDUAN.txt`) |
| Aplikasi web min. 4 halaman (React JS) | `web/`: Login, Register, Forgot/Reset password, Home, Search, Category, Course Detail, Article, Quiz, Practice, Profile, Edit Profile |
| Aplikasi mobile min. 4 halaman (React Native) | `mobile/`: Splash, Login, Register, Forgot, Home, Search, Category, Course Detail, Article, Quiz, Practice, Profile, Edit Profile |
| Aplikasi server (Node.js/Express) | `server/src/app.js`, `server/src/routes/` |
| Database MongoDB | `server/src/models/` (users, sessions, authTokens, courses, quizzes, favorites, histories, progresses, quizAttempts, ratelimits) |
| Wajib registrasi & login sebelum akses materi | `server/src/middleware/auth.js` (`requireAuth` di semua route materi) |
| Artikel, video tutorial, kuis, latihan praktik | `lessons[].type` di `server/src/models/Course.js`, konten di `server/src/seed/courses/` |
| Simpan materi favorit | `PUT/DELETE /api/me/favorites/:courseId` |
| Riwayat pembelajaran | `GET/POST /api/me/history` |
| Pengujian & keamanan | `server/test/`, `web/src/__tests__/`, `mobile/src/__tests__/`, [docs/KEAMANAN.md](docs/KEAMANAN.md) |

## Deployment gratis

Langkah lengkap ada di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

| Bagian | Layanan | Konfigurasi |
| --- | --- | --- |
| Database | MongoDB Atlas M0 | connection string → `MONGODB_URI` |
| API | Render Free (atau Vercel) | `render.yaml` / `server/vercel.json` |
| Web | Vercel | `web/vercel.json` + function proxy `web/api/proxy.js` (`API_ORIGIN`, `PROXY_SHARED_SECRET`) |
| Mobile | Expo Go (QR) / EAS Build APK | `mobile/app.json`, `mobile/app.config.js`, `mobile/eas.json` |
| Email | Gmail SMTP atau Resend | `SMTP_URL` / `RESEND_API_KEY` |
