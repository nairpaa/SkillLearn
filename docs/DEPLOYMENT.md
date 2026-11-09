# Panduan deploy SkillLearn (semua gratis)

Urutan: **GitHub → MongoDB Atlas → rahasia → seed → API → Web → hubungkan → Mobile → cek akhir.**
Semua perintah dijalankan dari laptop/VM di folder proyek `skilllearn/`.

| Bagian | Layanan | Hasil |
| --- | --- | --- |
| Kode | GitHub | repo privat/publik, CI jalan otomatis |
| Database | MongoDB Atlas M0 | `MONGODB_URI` |
| API | Render Free (opsi A) atau Vercel (opsi B) | `https://<api>/api` |
| Web | Vercel | `https://<web>.vercel.app` |
| Mobile | Expo Go (QR) + EAS Build (APK) | QR & file APK |
| Email | Gmail App Password (SMTP) atau Resend | email verifikasi & reset |

## 1. Push ke GitHub

```bash
cd skilllearn
git init
git add .
git status            # pastikan TIDAK ada file .env di daftar (sudah di-.gitignore)
git commit -m "SkillLearn: server, web, mobile"
git branch -M main
git remote add origin https://github.com/<username>/skilllearn.git
git push -u origin main
```

Setelah push, tab **Actions** di GitHub menjalankan CI (test server/web/mobile, build, npm audit). Tunggu hijau.

## 2. MongoDB Atlas

1. Buat cluster **M0 (Free)**, region Singapore/Jakarta.
2. **Database Access** → Add user, mis. `skilllearn-app`, password acak, role **readWrite** pada database `skilllearn`.
3. **Network Access** → Add IP `0.0.0.0/0` (Render/Vercel gratis tidak punya IP tetap; diimbangi password kuat + TLS).
4. **Connect → Drivers** → salin connection string, tambahkan nama database:
   `mongodb+srv://skilllearn-app:<password>@<cluster>.mongodb.net/skilllearn?retryWrites=true&w=majority`

## 3. Siapkan rahasia (sekali saja)

```bash
cd server
npm run keys                                                          # PASETO_SECRET_KEY, PASETO_PUBLIC_KEY, PASETO_KID
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # PROXY_SHARED_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # REFRESH_TOKEN_SECRET
```

Tentukan juga dua password pribadi (minimal 8 karakter + angka, jangan `Belajar123`):

- `ADMIN_PASSWORD`: akun admin `admin@skilllearn.id`
- `DEMO_PASSWORD`: akun demo `alya@student.ac.id` & `baru@student.ac.id`. Bagikan ke penguji lewat dokumen tugas saja.

Simpan semuanya di password manager. **Jangan** di-commit.

## 4. Isi database production (seed)

Dijalankan dari komputer sendiri, langsung ke Atlas:

```bash
cd server
NODE_ENV=production \
MONGODB_URI="mongodb+srv://...(dari langkah 2)" \
ADMIN_PASSWORD="..." DEMO_PASSWORD="..." \
npm run seed
```

Hasilnya 8 course (63 lesson), 2 akun demo, dan 1 admin.

## 5. Deploy API

### Opsi A: Render (sesuai dokumen arsitektur)

1. Render → **New → Blueprint** → pilih repo. Render membaca `render.yaml` (root folder `server`).
2. Isi environment variable yang diminta:

| Variable | Isi |
| --- | --- |
| `MONGODB_URI` | connection string Atlas |
| `PASETO_SECRET_KEY`, `PASETO_PUBLIC_KEY` | dari `npm run keys` |
| `REFRESH_TOKEN_SECRET` | dari langkah 3 |
| `APP_ORIGIN` | sementara `https://example.com`, diganti di langkah 7 |
| `PROXY_SHARED_SECRET` | dari langkah 3 |
| `SMTP_URL` atau `RESEND_API_KEY` | lihat bagian Email |
| `MAIL_FROM` | mis. `SkillLearn <alamatmu@gmail.com>` |
| `ADMIN_PASSWORD`, `DEMO_PASSWORD` | dari langkah 3 |

`NODE_ENV=production`, `TRUST_PROXY=1`, dan `PASETO_KID=k1` sudah diatur di `render.yaml`.

3. Tunggu status **Live**, lalu buka `https://<nama>.onrender.com/api/health`.
   Harus `{"status":"ok","database":"connected","clientIp":"<IP publikmu>"}`. Cocokkan `clientIp` dengan https://ifconfig.me.

### Opsi B: Vercel (kalau Render minta kartu kredit)

1. Vercel → **Add New → Project** → import repo → **Root Directory: `server`**, Framework: **Other**.
2. Environment variables sama seperti tabel di atas, ditambah `NODE_ENV=production`, `TRUST_PROXY=1`, `PASETO_KID=k1`.
3. Deploy, lalu cek `https://<api>.vercel.app/api/health` seperti di atas. Entry function-nya `server/api/index.js` (lihat `server/vercel.json`).

## 6. Deploy web (Vercel)

1. Vercel → **Add New → Project** → import repo yang sama → **Root Directory: `web`**, Framework: **Vite**.
2. Environment variables:

| Variable | Isi |
| --- | --- |
| `API_ORIGIN` | alamat API **tanpa** `/api`, mis. `https://skilllearn-api.onrender.com` |
| `PROXY_SHARED_SECRET` | **sama persis** dengan di API |

3. Deploy. Semua request `/api/*` dari web diteruskan oleh function `web/api/proxy.js` ke API, sambil membawa IP asli pengunjung.
   Domain tetap sama dengan web, jadi cookie login tetap first-party.

## 7. Hubungkan web ↔ API

1. Di service API (Render/Vercel), ganti `APP_ORIGIN` menjadi alamat web, mis. `https://skilllearn.vercel.app`
   (tanpa garis miring di akhir; beberapa alamat dipisah koma). Redeploy API.
   Nilai ini juga dipakai sebagai alamat link di email verifikasi/reset.
2. Buka `https://<web>.vercel.app/api/health`. `clientIp` harus sama dengan IP publikmu.
   Kalau yang muncul IP lain, `PROXY_SHARED_SECRET` web dan API belum sama (log API juga menampilkan `[PERINGATAN]` saat start).
   Pastikan IP tidak bisa dipalsukan:

   ```bash
   curl -H 'X-Real-IP: 1.2.3.4' -H 'X-Forwarded-For: 1.2.3.4' https://<web>.vercel.app/api/health
   ```

   `clientIp` harus tetap IP publikmu, bukan `1.2.3.4`.
3. Login di web dengan akun demo.

## 8. Email

Pilih salah satu:

- **Gmail (paling mudah, bisa kirim ke alamat siapa saja)**: aktifkan 2-Step Verification, buat **App Password** di
  https://myaccount.google.com/apppasswords, lalu isi
  `SMTP_URL=smtps://alamatmu%40gmail.com:APP_PASSWORD_TANPA_SPASI@smtp.gmail.com:465` dan
  `MAIL_FROM=SkillLearn <alamatmu@gmail.com>`.
- **Resend** (`RESEND_API_KEY`): tanpa domain sendiri, Resend hanya bisa mengirim ke email pemilik akun Resend.
  Untuk penguji dengan email lain, verifikasi domain dulu.

Coba daftar dengan email asli. Link verifikasi akan meminta password yang dipakai saat mendaftar.

## 9. Mobile (Expo)

```bash
cd mobile
npx eas-cli@latest login
npx eas-cli@latest init                                          # sekali, menautkan project ke akun Expo
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL \
  --value https://<api>/api --visibility plaintext
```

**Expo Go (QR untuk penguji):**

```bash
EXPO_PUBLIC_API_URL=https://<api>/api npx expo start --tunnel
```

Scan QR dengan aplikasi Expo Go versi yang mendukung **SDK 58**. Mobile memanggil API langsung (bukan lewat proxy web).

**APK:**

```bash
EAS_NO_VCS=1 npx eas-cli@latest build -p android --profile preview
```

Build otomatis gagal kalau `EXPO_PUBLIC_API_URL` bukan `https://…/api` (pengaman di `app.config.js`).
Link unduhan APK muncul di terminal dan dashboard Expo.

## 10. Cek akhir sebelum dikumpulkan

- [ ] `https://<api>/api/health` dan `https://<web>/api/health` → `ok`, `clientIp` = IP publikmu
- [ ] Login web & mobile dengan akun demo; buka video, artikel, kuis, latihan; simpan favorit; cek riwayat
- [ ] Daftar akun baru dengan email asli → email verifikasi masuk → verifikasi → login
- [ ] `cd server && DEMO_PASSWORD=... npm run test:security https://<api>/api` → 9/9 lulus (screenshot untuk laporan)
- [ ] https://securityheaders.com untuk alamat web → nilai A
- [ ] QR Expo Go bisa dibuka di HP, APK bisa diinstal
- [ ] Buka `/api/health` beberapa menit sebelum presentasi (Render gratis tidur setelah ±15 menit tanpa trafik)

## Kalau ada masalah

| Gejala | Penyebab & solusi |
| --- | --- |
| Web: "The server is waking up" / 502 | API Render sedang bangun (±50 detik). Tunggu, klik Try again |
| Web: `PROXY_NOT_CONFIGURED` | `API_ORIGIN` / `PROXY_SHARED_SECRET` belum diisi di project Vercel web; redeploy setelah mengisi |
| Selalu ter-logout setelah refresh halaman | `APP_ORIGIN` di API tidak sama persis dengan alamat web (cek `https`, tanpa `/` di akhir) |
| `clientIp` di health = IP Vercel/Render | Web: secret proxy beda. API langsung: sesuaikan `TRUST_PROXY` |
| Email tidak datang | Cek folder spam; Resend tanpa domain hanya mengirim ke pemilik akun → pakai Gmail SMTP |
| Seed menolak jalan | `DEMO_PASSWORD` wajib diisi saat `NODE_ENV=production` |
| Expo Go: "incompatible SDK" | Perbarui Expo Go dari Play Store/App Store |
| Build EAS gagal di awal | `EXPO_PUBLIC_API_URL` belum diisi di EAS atau bukan https |
