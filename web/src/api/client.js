// Wrapper fetch untuk semua request ke API SkillLearn.
// Access token cuma disimpan di variabel modul ini (memori), TIDAK di localStorage/sessionStorage,
// jadi kalau ada XSS pun token nggak gampang dicuri dari storage. Refresh token ada di cookie
// httpOnly yang diurus browser + server, kita nggak pernah nyentuh isinya.

export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/$/, '');

let accessToken = null;
let refreshPromise = null;
let sessionExpiredHandler = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function hasAccessToken() {
  return Boolean(accessToken);
}

// AuthProvider daftar di sini supaya client bisa "lapor" kalau sesi sudah benar-benar habis
export function onSessionExpired(fn) {
  sessionExpiredHandler = fn;
}

export class ApiError extends Error {
  constructor({ status = 0, code, message, fields, retryAfter, method, path }) {
    super(message || code || 'Request failed');
    this.name = 'ApiError';
    this.status = status;
    this.code = code || (status ? `HTTP_${status}` : 'ERR_NETWORK');
    this.fields = fields || null;
    this.retryAfter = retryAfter ?? null;
    this.method = method;
    this.path = path;
  }
  get isNetwork() {
    return this.status === 0;
  }
  get isNotFound() {
    return this.status === 404;
  }
}

async function rawRequest(path, { method = 'GET', body, headers = {}, auth = true, signal } = {}) {
  const url = API_BASE + path;
  const h = { Accept: 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (auth && accessToken) h.Authorization = `Bearer ${accessToken}`;

  const meta = { method, path: url.split('?')[0] };
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError({ status: 0, code: 'ERR_NETWORK', message: 'Network request failed', ...meta });
  }

  if (res.status === 204) return null;
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const ra = Number(res.headers.get('Retry-After'));
    throw new ApiError({
      status: res.status,
      code: data?.error,
      message: data?.message,
      fields: data?.fields,
      retryAfter: Number.isFinite(ra) && ra > 0 ? ra : null,
      ...meta,
    });
  }
  return data;
}

// Single-flight: kalau ada 5 request yang barengan kena 401, cuma ada SATU panggilan refresh.
// Penting banget karena refresh token sekali pakai; dua refresh paralel = dianggap token dicuri
// (reuse detection) dan seluruh sesi dicabut server.
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = rawRequest('/auth/refresh', {
      method: 'POST',
      auth: false,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((data) => {
        setAccessToken(data?.accessToken);
        return data?.accessToken;
      })
      .catch((err) => {
        setAccessToken(null);
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function api(path, opts = {}) {
  try {
    return await rawRequest(path, opts);
  } catch (err) {
    const canRetry = opts.auth !== false && !opts._retried;
    if (canRetry && err instanceof ApiError && err.status === 401 && err.code === 'TOKEN_INVALID_OR_EXPIRED') {
      try {
        await refreshAccessToken();
      } catch (refreshErr) {
        // Refresh gagal karena jaringan putus ≠ sesi habis, jadi jangan langsung tendang ke login
        if (refreshErr instanceof ApiError && !refreshErr.isNetwork) {
          sessionExpiredHandler?.();
        }
        throw err;
      }
      return api(path, { ...opts, _retried: true });
    }
    throw err;
  }
}

export const get = (path, opts) => api(path, { ...opts, method: 'GET' });
export const post = (path, body, opts) => api(path, { ...opts, method: 'POST', body });
export const put = (path, body, opts) => api(path, { ...opts, method: 'PUT', body });
export const patch = (path, body, opts) => api(path, { ...opts, method: 'PATCH', body });
export const del = (path, opts) => api(path, { ...opts, method: 'DELETE' });

// Pesan "coba lagi dalam X menit" dari header Retry-After (detik)
export function retryAfterText(err, fallbackMinutes = 15) {
  const sec = err?.retryAfter;
  const min = sec ? Math.max(1, Math.ceil(sec / 60)) : fallbackMinutes;
  if (min >= 60 && min % 60 === 0) {
    const h = min / 60;
    return `${h} ${h === 1 ? 'hour' : 'hours'}`;
  }
  return `${min} ${min === 1 ? 'minute' : 'minutes'}`;
}
