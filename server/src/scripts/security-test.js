// npm run test:security [URL_API]
// Menjalankan uji keamanan dari dokumen arsitektur (bagian 6) terhadap server yang sedang jalan,
// lalu mencetak hasilnya. Cocok di-screenshot sebagai bukti di laporan tugas.
//
// Butuh data hasil `npm run seed` (akun alya@student.ac.id & baru@student.ac.id).
// Uji rate limit memakai email yang tidak terdaftar, jadi akun demo tidak ikut terkunci.
const BASE = (process.argv[2] || process.env.API_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const PASSWORD = process.env.DEMO_PASSWORD || 'Belajar123';
const results = [];

const c = { green: '\x1b[32m', red: '\x1b[31m', dim: '\x1b[2m', bold: '\x1b[1m', reset: '\x1b[0m' };

async function call(path, { method = 'GET', body, token, headers = {} } = {}) {
  const h = { 'X-Client': 'mobile', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  const started = performance.now();
  const res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const ms = Math.round(performance.now() - started);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, ms, headers: res.headers };
}

function record(name, passed, detail) {
  results.push({ name, passed });
  console.log(`${passed ? `${c.green}✔ LULUS` : `${c.red}✘ GAGAL`}${c.reset}  ${c.bold}${name}${c.reset}`);
  console.log(`${c.dim}         ${detail}${c.reset}`);
}

async function login(email) {
  const r = await call('/auth/login', { method: 'POST', body: { email, password: PASSWORD } });
  if (r.status !== 200) throw new Error(`Login ${email} gagal (${r.status}). Sudah menjalankan npm run seed?`);
  return r.json;
}

console.log(`\n${c.bold}Uji keamanan SkillLearn API${c.reset}  ${c.dim}${BASE}${c.reset}\n`);

// 1. User enumeration
{
  const a = await call('/auth/login', { method: 'POST', body: { email: 'alya@student.ac.id', password: 'SalahBanget1' } });
  const b = await call('/auth/login', { method: 'POST', body: { email: `tidak.ada.${Date.now()}@student.ac.id`, password: 'SalahBanget1' } });
  const r1 = await call('/auth/register', { method: 'POST', body: { name: 'Alya Rahma', email: 'alya@student.ac.id', password: 'CobaLagi99x' } });
  const f1 = await call('/auth/forgot-password', { method: 'POST', body: { email: 'alya@student.ac.id' } });
  const f2 = await call('/auth/forgot-password', { method: 'POST', body: { email: `tidak.ada.${Date.now()}@student.ac.id` } });
  const same = a.status === b.status && a.json.message === b.json.message && r1.status === 202 && f1.status === f2.status && f1.json.message === f2.json.message;
  record('User enumeration', same, `login: ${a.status} (${a.ms} ms) vs ${b.status} (${b.ms} ms) · register email terdaftar: ${r1.status} · forgot: ${f1.status} vs ${f2.status}, pesan sama`);
}

// 2. Rate limit login
{
  const email = `rate.limit.${Date.now()}@student.ac.id`;
  const codes = [];
  let retry = null;
  for (let i = 0; i < 6; i++) {
    const r = await call('/auth/login', { method: 'POST', body: { email, password: 'SalahBanget1' } });
    codes.push(r.status);
    retry = r.headers.get('retry-after');
  }
  record('Rate limit login', codes[5] === 429 && Boolean(retry), `status 6 percobaan: ${codes.join(', ')} · Retry-After: ${retry} detik`);
}

const alya = await login('alya@student.ac.id');
let baru = await login('baru@student.ac.id');

// 3. Token kedaluwarsa / diubah
{
  const tampered = alya.accessToken.slice(0, -6) + 'AAAAAA';
  const r = await call('/me', { token: tampered });
  const jwtNone = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.';
  const r2 = await call('/me', { token: jwtNone });
  record('Token diubah / palsu', r.status === 401 && r2.status === 401, `1 karakter token diubah → ${r.status} ${r.json.error} · token JWT alg:none → ${r2.status}`);
}

// 4. Reuse refresh token
{
  const s = await login('baru@student.ac.id');
  const first = await call('/auth/refresh', { method: 'POST', body: { refreshToken: s.refreshToken } });
  // Token lama dipakai dari perangkat lain (user-agent berbeda), seperti penyerang yang mencuri token.
  // (Pengulangan dari perangkat yang sama dalam 2 menit dianggap respons yang hilang, bukan pencurian.)
  const reuse = await call('/auth/refresh', { method: 'POST', body: { refreshToken: s.refreshToken }, headers: { 'User-Agent': 'perangkat-penyerang/1.0' } });
  const newest = await call('/auth/refresh', { method: 'POST', body: { refreshToken: first.json.refreshToken } });
  record(
    'Reuse refresh token',
    first.status === 200 && reuse.status === 401 && newest.status === 401,
    `refresh pertama: ${first.status} · token lama dipakai lagi: ${reuse.status} ${reuse.json.error} · token terbaru ikut dicabut: ${newest.status} ${newest.json.error} · semua sesi pengguna dicabut`
  );
}

// Uji reuse di atas mencabut SEMUA sesi akun baru (sesuai desain), jadi login ulang untuk uji berikutnya.
baru = await login('baru@student.ac.id');

// 5. IDOR
{
  const favsBefore = await call('/me/favorites', { token: alya.accessToken });
  const target = favsBefore.json[0];
  const del = await call(`/me/favorites/${target.id}`, { method: 'DELETE', token: baru.accessToken });
  const favsAfter = await call('/me/favorites', { token: alya.accessToken });
  const peek = await call(`/me/history?userId=${favsBefore.json[0].id}`, { token: baru.accessToken });
  const still = favsAfter.json.some((f) => f.id === target.id);
  record(
    'IDOR',
    still && peek.status === 400,
    `user B menghapus favorit "${target.title.slice(0, 28)}…" milik A → ${del.status}, favorit A tetap ada: ${still} · /me/history?userId=… → ${peek.status} ${peek.json.error}`
  );
}

// 6. Mass assignment
{
  const r = await call('/me', { method: 'PATCH', token: baru.accessToken, body: { role: 'admin' } });
  const me = await call('/me', { token: baru.accessToken });
  record('Mass assignment', r.status === 400 && me.json.role === 'student', `PATCH /me {"role":"admin"} → ${r.status} ${r.json.error} · role sekarang: ${me.json.role}`);
}

// 7. NoSQL injection
{
  const r = await call('/auth/login', { method: 'POST', body: { email: { $ne: null }, password: 'x' } });
  const q = await call('/courses?q[$ne]=x', { token: alya.accessToken });
  record('NoSQL injection', r.status === 400 && q.status === 400, `login {"email":{"$ne":null}} → ${r.status} ${r.json.error} · /courses?q[$ne]=x → ${q.status}`);
}

// 8. XSS
{
  const payload = '<img src=x onerror=alert(1)>';
  const r = await call('/me', { method: 'PATCH', token: baru.accessToken, body: { bio: payload } });
  await call('/me', { method: 'PATCH', token: baru.accessToken, body: { bio: '' } });
  record('XSS', r.status === 200 && r.json.bio === payload, `bio disimpan apa adanya sebagai teks; klien merender sebagai teks (React escape), artikel Markdown lewat rehype-sanitize`);
}

// 9. Header keamanan API
{
  const r = await call('/health');
  const h = (k) => r.headers.get(k);
  const okHeaders = h('strict-transport-security') && h('x-content-type-options') === 'nosniff' && h('x-frame-options') && !h('x-powered-by') && h('content-security-policy')?.includes("default-src 'none'");
  record('Header keamanan (API)', Boolean(okHeaders), `HSTS: ${h('strict-transport-security')} · X-Frame-Options: ${h('x-frame-options')} · CSP: ${h('content-security-policy')?.slice(0, 40)}… · X-Powered-By: ${h('x-powered-by') ?? '(tidak ada)'}`);
}

await call('/auth/logout', { method: 'POST', token: alya.accessToken, body: {} });
await call('/auth/logout', { method: 'POST', token: baru.accessToken, body: {} });

const passed = results.filter((r) => r.passed).length;
console.log(`\n${c.bold}${passed}/${results.length} uji lulus${c.reset}\n`);
process.exitCode = passed === results.length ? 0 : 1;
