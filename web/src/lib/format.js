// Helper kecil buat format teks yang dipakai di banyak layar

export const CATEGORY_FALLBACK = {
  programming: { id: 'programming', name: 'Programming', tint: '#DCE8F7', ink: '#1F4E8C' },
  design: { id: 'design', name: 'Graphic Design', tint: '#F8E3DA', ink: '#A4472A' },
  marketing: { id: 'marketing', name: 'Digital Marketing', tint: '#F6ECCF', ink: '#7A5510' },
  technology: { id: 'technology', name: 'Technology', tint: '#DCEEE3', ink: '#2D6B4A' },
};

export const CATEGORY_IDS = Object.keys(CATEGORY_FALLBACK);

export function initials(name) {
  return (
    (name || '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}

export function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || 'there';
}

// "React Fundamentals: Build Your First App" -> "React Fundamentals" (desain pakai versi pendek)
export function shortTitle(title) {
  return (title || '').split(':')[0].trim();
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function plural(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function formatRating(r) {
  const n = Number(r);
  return Number.isFinite(n) ? n.toFixed(1) : '–';
}

// "Video · 12 lessons · 3h 20m" / "Quiz · 5 sets · 50 questions"
export function courseMeta(c) {
  const unit = c.type === 'Quiz' ? 'sets' : 'lessons';
  return [c.type, `${c.lessonCount} ${unit}`, c.duration].filter(Boolean).join(' · ');
}

// Jadi URL tujuan untuk satu lesson. Video diputar di halaman detail (?lesson=i),
// tipe lain punya layar sendiri.
export function lessonHref(slug, lesson) {
  if (!lesson) return `/courses/${slug}`;
  if (lesson.type === 'Video') return `/courses/${slug}?lesson=${lesson.index}`;
  return `/courses/${slug}/lessons/${lesson.index}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "Today, 09:40" / "Yesterday" / "6 Nov" (tahun ditambah kalau beda tahun)
export function relativeTime(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  if (sameDay(d, now)) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `Today, ${hh}:${mm}`;
  }
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Yesterday';
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

export function monthYear(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export function dayMonthYear(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Kekuatan password 0–3, sama dengan logika prototipe
export function passwordStrength(pw) {
  if (!pw) return 0;
  return (pw.length >= 8 ? 1 : 0) + (/\d/.test(pw) ? 1 : 0) + (/[A-Z]|[^A-Za-z0-9]/.test(pw) && pw.length >= 10 ? 1 : 0);
}

export function validateNewPassword(pw) {
  if (!pw) return 'Password must be at least 8 characters.';
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (pw.length > 128) return 'Use 128 characters or fewer.';
  if (!/\d/.test(pw)) return 'Include at least one number.';
  return '';
}
