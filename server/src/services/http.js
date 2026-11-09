import crypto from 'node:crypto';

// Error yang sudah "disengaja": punya status HTTP dan kode stabil untuk klien.
export class HttpError extends Error {
  constructor(status, error, message, extra = {}) {
    super(message || error);
    this.status = status;
    this.error = error;
    this.extra = extra;
  }
}

export const notFound = (message = 'Not found.') => new HttpError(404, 'NOT_FOUND', message);

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

export const randomToken = () => crypto.randomBytes(32).toString('base64url'); // 256-bit

export const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
export const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

// Escape karakter spesial regex supaya kata kunci pencarian tidak bisa membuat regex berat (ReDoS).
export const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Catatan event keamanan. Sengaja tidak pernah memuat password, token, atau header Authorization.
export function securityLog(event, data = {}) {
  console.warn(JSON.stringify({ level: 'security', event, at: new Date().toISOString(), ...data }));
}
