export const initials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

export const firstName = (name) => (name || '').trim().split(/\s+/)[0] || 'there';

// "React Fundamentals: Build Your First App" → "React Fundamentals" (dipakai di kartu Continue & artikel)
export const shortTitle = (title) => (title || '').split(':')[0].trim();

// "Quiz: Components & props" → "Components & props"
export const stripPrefix = (title, prefix) => (title || '').replace(new RegExp(`^${prefix}:\\s*`, 'i'), '');

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export const pluralize = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

// Format waktu riwayat seperti desain: "Today, 09:40" · "Yesterday" · "6 Nov"
export function relativeTime(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (days <= 0) return `Today, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (days === 1) return 'Yesterday';
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

export const ratingText = (r) => (typeof r === 'number' ? r.toFixed(1) : r || '–');

export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

export function tooManyAttemptsMessage(err) {
  const sec = err?.retryAfter;
  if (!sec) return 'Too many attempts. Try again in 15 minutes.';
  const min = Math.max(1, Math.ceil(sec / 60));
  if (min >= 60 && min % 60 === 0) {
    const h = min / 60;
    return `Too many attempts. Try again in ${h} hour${h === 1 ? '' : 's'}.`;
  }
  return `Too many attempts. Try again in ${min} minute${min === 1 ? '' : 's'}.`;
}

export const NETWORK_MESSAGE = "Couldn't reach SkillLearn. Check your internet connection and try again.";
