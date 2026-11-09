# Implementasi keamanan SkillLearn

Dokumen ini memetakan setiap kontrol di **SkillLearn Architecture and Security** (`design_handoff/design/`)
ke kode yang benar-benar dipakai, mencatat hasil review keamanan beserta perbaikannya, dan cara mengujinya.

## Peta kontrol ke kode

| Kontrol | Implementasi | File |
| --- | --- | --- |
| Hash password argon2id (19 MiB, 2 iterasi, parallelism 1) | `argon2.hash` dengan parameter OWASP | `server/src/auth/password.js` |
| Password 8–128, minimal 1 angka, tolak password umum | Skema zod `NewPassword` + daftar password umum | `server/src/middleware/validate.js`, `server/src/auth/commonPasswords.js` |
| Access token PASETO v4.public 15 menit, claim sub/sid/role/iss/aud/iat/exp/jti, footer kid | `issueAccessToken`, `verifyAccessToken` | `server/src/auth/tokens.js` |
| Refresh token acak 256-bit, disimpan hash SHA-256, sliding 7 hari, absolut 30 hari | `createSession`, `rotateSession` | `server/src/auth/sessions.js` |
| Rotasi refresh token atomik & idempoten (token berikutnya = HMAC dari token lama) + masa tenggang 2 menit (perangkat sama, maks 3×, tercatat) | `findOneAndUpdate` bersyarat `tokenHash`, `nextTokenFor` | `server/src/auth/sessions.js` |
| Deteksi reuse refresh token → **semua** sesi pengguna dicabut | cek `prevHashes` di `rotateSession` | `server/src/auth/sessions.js` |
| Web: refresh token di cookie httpOnly + Secure + SameSite Strict + Path=/api/auth; tidak pernah dibalas di body | `setRefreshCookie`, mode refresh ditentukan asal token | `server/src/auth/sessions.js`, `server/src/routes/auth.js` |
| Mobile: refresh token di expo-secure-store | `X-Client: mobile` saat login → token di body | `server/src/routes/auth.js`, `mobile/src/api/tokenStore.js` |
| Maksimal 10 sesi tersimpan per pengguna | sesi terlama dihapus saat login | `server/src/auth/sessions.js` |
| Anti user enumeration (pesan, status, **dan waktu** respons sama) | Login: pesan generik + hash dummy. Register & forgot: selalu 202, kerja DB/email dijalankan setelah respons | `server/src/routes/auth.js`, `server/src/services/defer.js` |
| Verifikasi email terikat password pendaftaran (anti pengambilalihan akun) | token verifikasi menyimpan hash password; `/verify-email` meminta password | `server/src/auth/oneTimeTokens.js`, `server/src/routes/auth.js`, `web/src/pages/VerifyEmail.jsx` |
| Token verifikasi 24 jam & reset 30 menit, sekali pakai, disimpan hash | `createOneTimeToken`, `markTokenUsed` (atomik) | `server/src/auth/oneTimeTokens.js` |
| Reset password mencabut semua sesi | `revokeAllSessions` | `server/src/routes/auth.js` |
| Logout mencabut sesi di server (+ opsi semua perangkat) | `POST /auth/logout { allDevices }` | `server/src/routes/auth.js` |
| Rate limit tersimpan di MongoDB | `MongoStore` untuk express-rate-limit (error store tidak menghentikan proses) | `server/src/middleware/rateLimit.js` |
| Lockout login bertahap 15 menit → 1 jam, aman dari request paralel | `reserveLoginAttempt` (slot dipesan atomik sebelum argon2) | `server/src/middleware/rateLimit.js` |
| Batas tebakan password saat ganti password & hapus akun | `reauthLimiter` 5 gagal / 15 menit per akun | `server/src/middleware/rateLimit.js` |
| IP asli klien di belakang proxy web | function proxy Vercel mengirim `X-SkillLearn-Client-IP` + rahasia bersama; server hanya percaya kalau rahasia cocok | `web/api/proxy.js`, `server/src/middleware/clientIp.js` |
| Anti IDOR: userId hanya dari token, semua data pribadi di `/me` | `requireAuth` + query `{ userId: req.user.id }` | `server/src/middleware/auth.js`, `server/src/routes/me.js` |
| Anti mass assignment | `ProfileUpdate` `.strict()` (name, bio, interests, avatar) | `server/src/middleware/validate.js` |
| Hapus akun wajib konfirmasi password; akun demo dilindungi | `DELETE /me { password }`, flag `isDemo` | `server/src/routes/me.js`, `server/src/models/User.js` |
| Kunci jawaban kuis tidak dikirim sebelum dikumpulkan; skor dihitung server | `GET /quizzes/:id` tanpa `correctIndex` | `server/src/routes/content.js` |
| NoSQL injection | zod `.strict()` + `mongoose.set('sanitizeFilter', true)` + `strictQuery` | `server/src/middleware/validate.js`, `server/src/config/db.js` |
| ReDoS pencarian | `q` maks 60 karakter + `escapeRegExp` | `server/src/routes/content.js`, `server/src/services/http.js` |
| Body maks 100 KB | `express.json({ limit: '100kb' })` | `server/src/app.js` |
| Header API: CSP `default-src 'none'; frame-ancestors 'none'`, HSTS, X-Frame-Options DENY, CORP, tanpa X-Powered-By | `helmet({ contentSecurityPolicy: { useDefaults: false, … } })` | `server/src/app.js` |
| Cache-Control no-store untuk auth & data pribadi | middleware `noStore` | `server/src/middleware/auth.js` |
| CORS allowlist + cek Origin & X-Requested-With di refresh (CSRF) | `cors({ origin: APP_ORIGIN })`, cek di `/auth/refresh` | `server/src/app.js`, `server/src/routes/auth.js` |
| Header web (CSP, X-Frame-Options, HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP) | `vercel.json` | `web/vercel.json` |
| XSS | React escape; Markdown web lewat `rehype-sanitize`; Markdown mobile tidak merender HTML; link konten hanya http(s) | `web/src/components/Markdown.jsx`, `mobile/src/utils/markdown.js` |
| Email tidak memuat teks bebas dari pendaftar | template verifikasi tanpa nama | `server/src/services/emails.js` |
| APK tidak bisa dibuat dengan URL API http/lokal | `app.config.js` menggagalkan build EAS | `mobile/app.config.js`, `mobile/src/config.js` |
| Log tanpa password/token | `securityLog` hanya mencatat event, userId, IP | `server/src/services/http.js` |
| Hak hapus data (UU PDP) | `DELETE /api/me` menghapus akun + semua datanya | `server/src/routes/me.js` |

## Hasil review keamanan (9 November 2026)

Review dilakukan oleh reviewer terpisah terhadap seluruh kode server, web, dan mobile. Hasilnya 1 High, 3 Medium,
8 Low, tanpa Critical, dan tanpa kerentanan dependensi high/critical. Semua sudah ditindaklanjuti dan diberi test regresi
(lihat `server/test/`, `web/src/__tests__/`).

| # | Tingkat | Temuan | Status |
| --- | --- | --- | --- |
| 1 | High | Di belakang rewrite Vercel semua pengguna web terbaca satu IP, sehingga rate limit & lockout berlaku untuk satu situs | **Diperbaiki**: function proxy `web/api/proxy.js` + header IP berahasia |
| 2 | Medium | Mendaftar duluan memakai email korban bisa mengambil alih akun setelah korban verifikasi | **Diperbaiki**: link verifikasi terikat password pendaftaran |
| 3 | Medium | Waktu respons forgot-password membocorkan email terdaftar | **Diperbaiki**: kerja DB/email setelah respons (`defer`) |
| 4 | Medium | Password demo publik + hapus akun tanpa password | **Diperbaiki**: `DEMO_PASSWORD` wajib di production, akun demo dilindungi, hapus akun wajib password |
| 5 | Low | Login paralel menembus lockout 5 percobaan | **Diperbaiki**: slot percobaan dipesan atomik |
| 6 | Low | Ganti password tanpa batas tebakan; sesi tak terbatas | **Diperbaiki**: limiter per akun + maks 10 sesi |
| 7 | Low | Refresh via cookie + `X-Client: mobile` membocorkan refresh token di body | **Diperbaiki**: mode refresh dari asal token |
| 8 | Low | Refresh bersamaan → error 500 dan logout palsu | **Diperbaiki**: rotasi atomik + masa tenggang 10 detik |
| 9 | Low | Kunci jawaban dikirim setelah kuis dikumpulkan | **Diterima (sesuai desain)**: layar hasil memang menyorot jawaban benar sebagai umpan balik belajar. Kunci tetap tidak dikirim sebelum dikumpulkan, dan skor dihitung server |
| 10 | Low | Reuse refresh token hanya mencabut satu sesi | **Diperbaiki**: semua sesi pengguna dicabut |
| 11 | Low | Nama bebas dari pendaftar ikut di email verifikasi (bisa jadi relay phishing) | **Diperbaiki**: nama dihapus dari email |
| 12 | Low | APK bisa terbuat dengan URL API http lokal | **Diperbaiki**: build EAS digagalkan kalau bukan `https://…/api` |
| – | Info | CSP API mewarisi direktif default helmet | **Diperbaiki**: `useDefaults: false` |
| – | Info (dev) | `docker-compose.yml` membuka MongoDB ke jaringan tanpa password | **Diperbaiki**: hanya `127.0.0.1` |

### Verifikasi ulang (putaran kedua)

Reviewer yang sama memverifikasi ulang semua perbaikan di atas. Semuanya dinyatakan bekerja. Ada 5 temuan Low baru
yang muncul dari perbaikan putaran pertama, dan semuanya sudah diperbaiki serta diberi test regresi:

| # | Temuan | Perbaikan |
| --- | --- | --- |
| A | Masa tenggang tidak memberi refresh token baru, jadi respons yang hilang tetap mengeluarkan semua perangkat | Rotasi idempoten (token berikutnya diturunkan HMAC), masa tenggang 2 menit mengembalikan token yang sama |
| B | Token yang baru dirotasi bisa mencetak access token tanpa batas selama masa tenggang | Maks 3× per rotasi, wajib user-agent sama, dicatat sebagai `refresh_grace` |
| C | `DELETE /me` bisa dipakai menebak password tanpa batas | `reauthLimiter` (kuota bersama dengan ganti password) |
| D | Email verifikasi bisa dipicu tiap menit ke alamat yang belum aktif | Maks 3 email verifikasi / jam per alamat |
| E | Event `login_locked` tercatat di setiap percobaan saat terkunci | Dicatat sekali, oleh request yang memasang kunci |
| Hardening | Path proxy dicek setelah normalisasi; `/api/health` di belakang rate limit; kuota verify & reset dipisah; peringatan saat start kalau `PROXY_SHARED_SECRET` < 32 karakter; akun demo tidak bisa "keluar dari semua perangkat" | Sudah diterapkan |

Hal yang diperiksa dan dinyatakan aman oleh reviewer: verifikasi PASETO (kid, footer, iss/aud/exp), `requireAuth` mengecek
sesi dicabut, flag cookie, CSRF pada refresh, CORS, anti enumeration login, token verifikasi/reset, IDOR, mass assignment,
NoSQL injection, ReDoS, avatar, XSS web, penyimpanan token di web & mobile, WebView YouTube, secrets & logging, batas ukuran input.

Dependensi (`npm audit --omit=dev`): server 0, web 0, mobile 5 moderate di tooling build Expo (`glob`/`minimatch` milik
`@expo/cli`), tidak ikut di aplikasi yang dijalankan HP. Perbaikan otomatisnya justru menurunkan Expo ke versi lama, jadi tidak dipakai.

## Menjalankan test

```bash
cd server && npm test             # 136 test unit + integrasi (MongoDB in-memory, tidak butuh Docker)
cd server && npm run test:coverage
cd web && npm test                # 30 test (client API, Markdown XSS, proxy Vercel, util)
cd mobile && npm test             # 18 test (parser Markdown, link aman, client API, util)
```

CI GitHub Actions (`.github/workflows/ci.yml`) menjalankan semuanya, plus build web, export bundle Android, dan `npm audit`, di setiap push.

## Uji keamanan bagian 6 dokumen (untuk screenshot laporan)

Server harus jalan dan sudah di-seed:

```bash
cd server
npm run test:security                       # lokal
npm run test:security https://API-ANDA/api  # server hasil deploy (DEMO_PASSWORD=… kalau bukan default)
```

Uji yang dijalankan: user enumeration, rate limit login, token diubah/palsu, reuse refresh token, IDOR, mass assignment,
NoSQL injection, XSS, dan header keamanan. Uji reuse memakai user-agent berbeda untuk mensimulasikan perangkat penyerang. Header web (CSP, clickjacking)
dicek di https://securityheaders.com setelah web di-deploy.
