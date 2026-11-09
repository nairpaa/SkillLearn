# Kontrak REST API SkillLearn

Sumber utama: `design_handoff/api/openapi.yaml` dan `design_handoff/design/SkillLearn Architecture and Security.dc.html`.
Dokumen ini adalah versi yang **benar-benar diimplementasikan** di `server/`, termasuk beberapa endpoint tambahan
(ditandai **[ext]**) yang dibutuhkan layar desain tapi belum ada di openapi.yaml.

- Base URL lokal: `http://localhost:8080/api`
- Web memanggil `/api` di domain sendiri (proxy Vite saat dev, rewrite Vercel saat production), jadi cookie refresh token tetap first-party.
- Mobile memanggil URL penuh dari `EXPO_PUBLIC_API_URL`.
- Semua body JSON, maksimal 100 KB. Semua response JSON kecuali 204.

## Format error

```json
{ "error": "VALIDATION_ERROR", "message": "Check the highlighted fields.", "fields": { "email": "Enter a valid email, e.g. name@student.ac.id." } }
```

`error` adalah kode stabil untuk logika klien. `message` (bahasa Inggris) boleh ditampilkan langsung. `fields` hanya ada pada `VALIDATION_ERROR`.

| HTTP | `error` | Kapan |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Body/query/params tidak lolos zod `.strict()` (termasuk field tambahan, objek `{ "$ne": null }`, ObjectId tidak valid) |
| 400 | `TOKEN_INVALID` | Token verifikasi email / reset password salah, kedaluwarsa, atau sudah dipakai |
| 400 | `WRONG_PASSWORD` | Password salah di change-password, verify-email, atau DELETE /me |
| 401 | `INVALID_CREDENTIALS` | Login gagal (email tidak ada ATAU password salah, pesan sama) |
| 401 | `TOKEN_INVALID_OR_EXPIRED` | Access token tidak ada / rusak / kedaluwarsa / sesinya sudah dicabut. Klien: refresh sekali lalu ulangi request |
| 401 | `SESSION_INVALID` | Refresh token tidak dikenal (atau reuse terdeteksi → seluruh family dicabut) |
| 401 | `SESSION_EXPIRED` | Refresh token sudah dicabut / lewat 7 hari tidak aktif / lewat 30 hari sejak login |
| 403 | `EMAIL_NOT_VERIFIED` | Login dengan password benar tapi email belum diverifikasi. Server otomatis mengirim ulang link verifikasi (maks 1× per 5 menit) |
| 403 | `FORBIDDEN` | Bukan admin di endpoint `/admin/*` |
| 403 | `DEMO_ACCOUNT` | Akun demo hasil seed tidak boleh ganti password atau dihapus |
| 403 | `INVALID_ORIGIN` | Refresh via cookie tanpa Origin yang diizinkan / tanpa header `X-Requested-With` |
| 404 | `NOT_FOUND` | Resource tidak ada (atau milik orang lain) |
| 429 | `TOO_MANY_ATTEMPTS` | Kena rate limit. Ada header `Retry-After` (detik) |
| 500 | `SERVER_ERROR` | Error tak terduga (tanpa stack trace) |
| 503 | `DB_UNAVAILABLE` | MongoDB tidak bisa dihubungi |
| 502 | `BAD_GATEWAY` | (Hanya web production) function proxy Vercel tidak mendapat jawaban dari API, biasanya API sedang bangun dari tidur |

## Autentikasi

### Token

- **Access token**: PASETO `v4.public…`, berlaku 15 menit (`expiresIn: 900`). Kirim di header `Authorization: Bearer <token>`.
  Disimpan **di memori saja** (web & mobile). Claim: `sub`, `sid`, `role`, `iss=skilllearn-api`, `aud=skilllearn-app`, `iat`, `exp`, `jti`; footer `{ "kid": "k1" }`.
- **Refresh token**: string acak 256-bit, sekali pakai, dirotasi setiap refresh. Sliding 7 hari, absolut 30 hari.
  - **Web**: cookie `sl_rt` (httpOnly, SameSite=Strict, Path=/api/auth, Secure di production). Tidak pernah terlihat oleh JavaScript.
  - **Mobile**: kirim header `X-Client: mobile` saat login → `refreshToken` ikut di body response. Simpan di `expo-secure-store`.
  - Saat refresh, mode ditentukan dari **asal token**: token dari body dibalas di body, token dari cookie dibalas lewat
    `Set-Cookie` saja (walau ada `X-Client: mobile`), supaya cookie httpOnly tidak bisa ditukar jadi token yang terbaca JavaScript.
  - **Rotasi idempoten + masa tenggang 2 menit**: refresh dengan token yang baru saja dirotasi (dua tab bersamaan, respons
    hilang saat server bangun) dibalas 200 dengan refresh token baru yang **sama persis** dengan milik request pemenang.
    Syaratnya: token tepat sebelumnya, user-agent sama dengan yang merotasi, maksimal 3 kali per rotasi (tercatat di log).
    Di luar syarat itu (lewat 2 menit, perangkat lain, jatah habis), token lama dianggap dicuri: **semua sesi pengguna dicabut**.

### Alur web

1. Saat aplikasi dibuka: `POST /api/auth/refresh` dengan header `X-Requested-With: XMLHttpRequest` (cookie terkirim otomatis karena same-origin).
   200 → simpan `accessToken` di memori → `GET /api/me` → status `authed`. 401 → status `guest`.
2. Login: `POST /api/auth/login` → 200 `{ accessToken, expiresIn }` + Set-Cookie `sl_rt` → `GET /api/me`.
3. Request terproteksi dapat 401 `TOKEN_INVALID_OR_EXPIRED` → panggil refresh **sekali** (jangan paralel, gabungkan jadi satu promise) → ulangi request.
   Refresh gagal (401) → hapus state → arahkan ke `/login?expired=1` (banner "Your session expired…").
4. Logout: `POST /api/auth/logout` (Bearer) → 204, cookie dihapus server.

### Alur mobile

1. Saat app dibuka: baca refresh token dari SecureStore. Ada → `POST /auth/refresh` body `{ "refreshToken": "…" }` + header `X-Client: mobile` →
   simpan `refreshToken` baru ke SecureStore, `accessToken` di memori → Home. Tidak ada / gagal → Splash.
2. Login: `POST /auth/login` + header `X-Client: mobile` → `{ accessToken, expiresIn, refreshToken }`.
3. 401 `TOKEN_INVALID_OR_EXPIRED` → refresh sekali → ulangi. Gagal → hapus SecureStore → Login dengan banner session expired.
4. Logout: `POST /auth/logout` (Bearer) → hapus SecureStore → Splash.

## Endpoint

Kolom **Auth**: 🔓 publik, 🔒 butuh access token, 👑 butuh role admin.

### Auth

| Method | Path | Auth | Body | Sukses |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | 🔓 | `{ name, email, password }` | **202** `{ message: "Check your inbox" }`. Selalu 202, termasuk email yang sudah terdaftar |
| POST | `/auth/verify-email` | 🔓 | `{ token, password }` | **204**. `password` = password yang dipilih saat mendaftar (lihat catatan di bawah) |
| POST | `/auth/login` | 🔓 | `{ email, password }` | **200** `{ accessToken, expiresIn, refreshToken? }` |
| POST | `/auth/refresh` | 🔓 | web: kosong + cookie; mobile: `{ refreshToken }` | **200** `{ accessToken, expiresIn, refreshToken? }` |
| POST | `/auth/logout` | 🔒 | `{ allDevices?: boolean }` | **204** |
| POST | `/auth/forgot-password` | 🔓 | `{ email }` | **202** `{ message }`. Selalu 202 |
| POST | `/auth/reset-password` | 🔓 | `{ token, password }` | **204**. Semua sesi user dicabut |
| POST | `/auth/change-password` **[ext]** | 🔒 | `{ currentPassword, newPassword }` | **204**. Sesi lain dicabut, sesi ini tetap. Maks 5 percobaan salah / 15 menit per akun |

Aturan validasi (pesan `fields` persis seperti desain):

| Field | Aturan | Pesan |
| --- | --- | --- |
| `name` | 2–80 karakter setelah trim | `Enter your full name (at least 2 characters).` |
| `email` | format email, ≤ 254 | `Enter a valid email, e.g. name@student.ac.id.` |
| `password` (register/reset/change) | 8–128, minimal 1 angka, bukan password umum | `Password must be at least 8 characters.` / `Include at least one number.` / `This password is too common. Choose another one.` |
| `password` (login) | 1–128 | `Enter your password.` |

**Kenapa verifikasi email meminta password?** Setiap pendaftaran membawa link sendiri yang terikat ke password
pendaftaran itu. Akun baru aktif dengan password tersebut setelah link dibuka DAN password-nya dimasukkan ulang.
Jadi orang yang mendaftar duluan memakai email orang lain tidak bisa mengambil alih akunnya, karena ia tidak punya
akses ke inbox, sedangkan pemilik inbox tidak tahu password si penyerang. Password salah → 400 `WRONG_PASSWORD` dan link tetap bisa dicoba lagi.

Link di email:

- Verifikasi: `{APP_ORIGIN}/verify-email?token=…` (24 jam, sekali pakai)
- Reset: `{APP_ORIGIN}/reset-password?token=…` (30 menit, sekali pakai)

Kedua halaman ini ada di **web**. Pengguna mobile membuka link email di browser HP, lalu kembali ke app untuk login.
Saat dev tanpa layanan email, link dicetak di log server (`[mail] …`).

### Kategori

| Method | Path | Auth | Sukses |
| --- | --- | --- | --- |
| GET | `/categories` **[ext]** | 🔒 | `Category[]` |

```json
{ "id": "programming", "name": "Programming", "description": "Web development, JavaScript and React…", "tint": "#DCE8F7", "ink": "#1F4E8C", "courseCount": 2 }
```

ID kategori: `programming`, `design`, `marketing`, `technology`.

### Course

| Method | Path | Auth | Sukses |
| --- | --- | --- | --- |
| GET | `/courses?q=&category=&type=&limit=` | 🔒 | `CourseSummary[]` (urutan sesuai desain) |
| GET | `/courses/:slug` | 🔒 | `CourseDetail` atau 404 |

Query: `q` ≤ 60 karakter (cocok ke judul, nama kategori, deskripsi, author), `category` salah satu ID kategori,
`type` = `Video | Article | Quiz | Practice` (tipe utama course), `limit` 1–50 (default 20).

**CourseSummary**

```json
{
  "id": "6730…", "slug": "react", "title": "React Fundamentals: Build Your First App",
  "category": "programming", "type": "Video", "level": "Beginner", "rating": 4.8,
  "author": "Rizky Pratama", "description": "Learn components, props and state…",
  "lessonCount": 8, "duration": "1h 52m", "questionCount": 0,
  "thumbnailUrl": "https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg",
  "isFavorite": true, "progress": 38
}
```

- `duration`: total menit lesson (`"3h 20m"`, `"50m"`). Untuk course bertipe Quiz isinya jumlah soal (`"20 questions"`).
- `questionCount`: total soal kuis di course (dipakai meta "Quiz · 5 sets · 50 questions").
- `thumbnailUrl` bisa `null` → klien menampilkan placeholder bergaris warna kategori (seperti desain).
- `progress`: 0–100, persentase lesson selesai milik user ini.

**CourseDetail** = CourseSummary + :

```json
{
  "currentLessonIndex": 2,
  "lessons": [
    { "id": "…", "index": 0, "title": "Welcome & setup", "type": "Video", "duration": "8 min", "minutes": 8, "status": "done",
      "videoId": "SqcY0GlETPk", "videoStart": 0, "contentMd": "Short notes under the video (optional)" },
    { "id": "…", "index": 1, "title": "JSX explained", "type": "Article", "duration": "6 min read", "minutes": 6, "status": "done",
      "contentMd": "## Markdown…" },
    { "id": "…", "index": 4, "title": "Quiz: Components", "type": "Quiz", "duration": "3 questions", "minutes": 5, "status": "todo",
      "quizId": "6730…" },
    { "id": "…", "index": 5, "title": "Practice: Build a to-do list", "type": "Practice", "duration": "30 min", "minutes": 30, "status": "todo",
      "contentMd": "Use `useState` to build…",
      "practice": {
        "fileName": "App.jsx", "language": "jsx", "starterCode": "import { useState } …",
        "tasks": ["Create state for the todo list and the input text", "…"],
        "hint": "Spread the old array…",
        "checks": [{ "label": "Uses useState", "pattern": "useState\\(", "flags": "" }]
      } }
  ]
}
```

- `status`: `done` (sudah selesai), `current` (lesson pertama yang belum selesai), `todo`.
- `currentLessonIndex`: index lesson `current`. Kalau semua selesai, index lesson terakhir.
- `contentMd` adalah Markdown. Web merender dengan `react-markdown` + `rehype-sanitize`; HTML mentah tidak pernah dirender.
- `videoId` adalah ID YouTube. Embed lewat `https://www.youtube-nocookie.com/embed/{videoId}?start={videoStart}&rel=0`.
- `practice.checks[].pattern` adalah regex JavaScript (string) yang dijalankan klien saat "Run code" terhadap isi editor.

### Kuis

| Method | Path | Auth | Body | Sukses |
| --- | --- | --- | --- | --- |
| GET | `/quizzes/:id` | 🔒 | | `QuizPublic` |
| POST | `/quizzes/:id/attempts` | 🔒 | `{ answers: [0, 2, 1] }` | **201** `QuizResult` |

```json
// QuizPublic (tanpa correctIndex / explanation)
{ "id": "…", "title": "Quiz: Components", "courseId": "…", "courseSlug": "react", "courseTitle": "React Fundamentals: …",
  "lessonId": "…", "lessonIndex": 4, "lessonCount": 8,
  "questions": [{ "text": "How do you pass…", "options": ["<Card title=\"Hello\" />", "…"], "mono": true }] }

// QuizResult
{ "score": 2, "total": 3, "percent": 67, "bestPercent": 67,
  "review": [{ "correct": true, "chosenIndex": 0, "correctIndex": 0, "explanation": "Props are passed like…" }] }
```

- `answers` harus sepanjang jumlah soal, isi integer 0–9 (`-1` boleh untuk "tidak dijawab").
- Kunci jawaban (`correctIndex`) dan pembahasan hanya dikirim **setelah** kuis dikumpulkan, sebagai umpan balik belajar
  sesuai desain (jawaban benar disorot di layar hasil). Nilai selalu dihitung server.
- Submit otomatis menandai lesson kuis sebagai selesai dan mencatat history.
- Desain menampilkan feedback per soal saat dipilih. Karena kunci tidak dikirim lebih dulu, klien mengumpulkan semua jawaban,
  submit sekali di akhir, lalu menampilkan feedback per soal dan halaman hasil dari `review`.

### Data milik user (`/me`)

Semua query di-scope `userId` dari token. Tidak ada endpoint yang menerima `userId` dari klien.

| Method | Path | Auth | Body | Sukses |
| --- | --- | --- | --- | --- |
| GET | `/me` | 🔒 | | `User` |
| PATCH | `/me` | 🔒 | `{ name?, bio?, interests?, avatar? }` | `User`. Field lain → 400 |
| DELETE | `/me` | 🔒 | `{ password }` | **204**. Hapus akun + semua data pribadi (UU PDP). Password salah → 400 `WRONG_PASSWORD` |
| GET | `/me/favorites` | 🔒 | | `CourseSummary[]`, terbaru di atas |
| PUT | `/me/favorites/:courseId` | 🔒 | | **204** (idempotent) |
| DELETE | `/me/favorites/:courseId` | 🔒 | | **204** (idempotent) |
| GET | `/me/history?limit=` | 🔒 | | `HistoryItem[]`, terbaru di atas (default 20, maks 50) |
| POST | `/me/history` | 🔒 | `{ courseId, lessonId }` | **204**. Panggil setiap kali lesson dibuka |
| PUT | `/me/progress/:courseId/lessons/:lessonId` **[ext]** | 🔒 | | **200** `{ progress, currentLessonIndex, completedLessonIds }` |

**User**

```json
{
  "id": "…", "name": "Alya Rahma", "email": "alya@student.ac.id",
  "bio": "Informatics student. Learning React and UI design.", "interests": ["programming", "design"],
  "avatar": null, "role": "student", "createdAt": "2026-03-02T…",
  "stats": { "inProgress": 2, "completed": 1, "quizAverage": 83 },
  "continueLearning": {
    "course": { /* CourseSummary */ },
    "progress": 38,
    "nextLesson": { "id": "…", "index": 2, "title": "Components & props", "type": "Video", "duration": "14 min" }
  }
}
```

- `stats.quizAverage`: rata-rata persentase nilai terbaik tiap kuis, `null` kalau belum pernah kuis (tampilkan "–").
- `continueLearning`: course yang terakhir dibuka dan belum 100%. `null` untuk pengguna baru → tampilkan kartu "Get started".
- `avatar`: `null` atau data URL gambar (`data:image/jpeg;base64,…`, PNG/JPEG/WebP, maks 60 KB). Klien wajib mengecilkan foto
  (misalnya 256×256) sebelum upload. Kirim `avatar: null` untuk menghapus.
- `bio` maks 160 karakter, `interests` maks 4 dari ID kategori.

**HistoryItem**

```json
{ "courseId": "…", "courseSlug": "react", "courseTitle": "React Fundamentals: …", "category": "programming",
  "lessonId": "…", "lessonIndex": 2, "lessonTitle": "Components & props", "type": "Video", "viewedAt": "2026-11-08T02:40:00Z" }
```

Satu item per lesson (dibuka ulang → `viewedAt` diperbarui, tidak dobel).

**Kapan lesson dianggap selesai** (klien memanggil `PUT /me/progress/…`):

| Tipe | Selesai saat |
| --- | --- |
| Video | Pengguna menekan play pada player |
| Article | Pengguna menekan tombol "Next" di bawah artikel (atau "Finish" di lesson terakhir) |
| Quiz | Otomatis oleh server saat attempt dikirim |
| Practice | "Submit practice" dengan semua task tercentang |

### Admin

| Method | Path | Auth | Sukses |
| --- | --- | --- | --- |
| POST | `/admin/courses` | 👑 | **201** `CourseDetail` |
| PATCH | `/admin/courses/:id` | 👑 | **200** `CourseSummary` (metadata saja: title, description, level, rating, author, published, thumbnailUrl, type) |
| DELETE | `/admin/courses/:id` | 👑 | **204** (ikut hapus kuis, favorit, history, progress terkait) |

Body POST mengikuti format seed (`server/src/seed/courses/*.js`); lesson Quiz membawa `questions` inline.

### Lainnya

`GET /health` → `{ status: "ok", database: "connected", clientIp: "203.0.113.5" }`

`clientIp` = IP kamu menurut server. Dipakai mengecek `TRUST_PROXY` dan function proxy web setelah deploy.

## Rate limit

| Endpoint | Batas |
| --- | --- |
| `POST /auth/login` | 5 percobaan / 15 menit per IP + email, percobaan ke-6 → kunci 15 menit (kunci berikutnya dalam 24 jam: 1 jam). Slot dipesan atomik sebelum password dicek, jadi request paralel tidak bisa menembus batas. Plus 20 gagal / 15 menit per IP |
| `POST /auth/change-password`, `DELETE /me` | 5 password salah / 15 menit per akun (kuota bersama) |
| `POST /auth/register` | 5 / jam per IP |
| `POST /auth/forgot-password` | 3 / jam per email (tetap 202), 10 / jam per IP (429) |
| `POST /auth/refresh` | 30 / menit per refresh token |
| `POST /auth/verify-email` | 10 / jam per IP |
| `POST /auth/reset-password` | 10 / jam per IP (kuota terpisah dari verify-email) |
| Email verifikasi | maks 3 / jam per alamat, jeda 1 menit |
| Lainnya | 300 / menit per IP, 100 / menit per user |

Penyimpanan hitungan di MongoDB (collection `ratelimits`), jadi tetap konsisten walau server restart atau berjalan di beberapa instance.

"IP" di atas adalah IP asli pengunjung. Untuk web production, request lewat function proxy Vercel (`web/api/proxy.js`)
yang mengirim IP pengunjung di header `X-SkillLearn-Client-IP`. Header itu hanya dipercaya kalau `X-SkillLearn-Proxy-Secret`
sama dengan `PROXY_SHARED_SECRET` di server. Satu pengguna maksimal punya 10 sesi login tersimpan (yang terlama dihapus).

## Akun hasil seed

| Akun | Email | Password | Keterangan |
| --- | --- | --- | --- |
| Demo (pengguna lama) | `alya@student.ac.id` | `Belajar123` (lokal) / `DEMO_PASSWORD` (production) | Terverifikasi, ada progres, favorit, riwayat |
| Demo (pengguna baru) | `baru@student.ac.id` | `Belajar123` (lokal) / `DEMO_PASSWORD` (production) | Terverifikasi, tanpa aktivitas (tampilan new-user) |
| Admin | `admin@skilllearn.id` | lihat `ADMIN_PASSWORD` di `.env` | Role admin |

Akun demo ditandai `isDemo`: bisa dipakai mencoba semua fitur, tapi tidak bisa ganti password, reset password, atau dihapus
(403 `DEMO_ACCOUNT`). Di production `npm run seed` menolak jalan kalau `DEMO_PASSWORD` kosong.

