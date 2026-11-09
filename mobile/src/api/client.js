import { API_URL, REQUEST_TIMEOUT_MS } from '../config';
import { getRefreshToken, setRefreshToken, clearRefreshToken } from './tokenStore';

// Access token sengaja cuma di memori (variabel modul), hilang saat app ditutup.
let accessToken = null;
let refreshInFlight = null;
let sessionExpiredHandler = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function hasAccessToken() {
  return !!accessToken;
}

export function onSessionExpired(handler) {
  sessionExpiredHandler = handler;
}

export class ApiError extends Error {
  constructor({ status = 0, code = 'ERR_NETWORK', message, fields, method = 'GET', path = '', retryAfter = null }) {
    super(message || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields || null;
    this.method = method;
    this.path = path;
    this.retryAfter = retryAfter;
  }

  get isNetwork() {
    return this.status === 0;
  }

  get isNotFound() {
    return this.status === 404;
  }

  // Teks kecil di StatusBlock, contoh: "ERR_NETWORK · GET /api/courses"
  get caption() {
    const cleanPath = this.path.split('?')[0];
    return `${this.code} · ${this.method} /api${cleanPath}`;
  }
}

async function send(path, { method = 'GET', body, headers = {}, auth = true, timeout = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const finalHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth && accessToken) finalHeaders.Authorization = `Bearer ${accessToken}`;

  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const timedOut = e?.name === 'AbortError';
    throw new ApiError({
      status: 0,
      code: timedOut ? 'ERR_TIMEOUT' : 'ERR_NETWORK',
      message: timedOut ? 'The server took too long to respond.' : 'Network request failed',
      method,
      path,
    });
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const retry = Number(res.headers.get('Retry-After'));
    throw new ApiError({
      status: res.status,
      code: data?.error || `HTTP_${res.status}`,
      message: data?.message,
      fields: data?.fields,
      method,
      path,
      retryAfter: Number.isFinite(retry) && retry > 0 ? retry : null,
    });
  }
  return data;
}

// Refresh dibuat single-flight: kalau 3 request kena 401 barengan, refresh-nya tetap sekali.
// Ini penting karena refresh token dirotasi + ada reuse detection; refresh dobel = semua sesi dicabut.
export function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;
      try {
        const data = await send('/auth/refresh', {
          method: 'POST',
          auth: false,
          headers: { 'X-Client': 'mobile' },
          body: { refreshToken },
        });
        accessToken = data?.accessToken || null;
        if (data?.refreshToken) await setRefreshToken(data.refreshToken);
        return !!accessToken;
      } catch (e) {
        // Error jaringan jangan dianggap logout, token masih bisa dipakai nanti
        if (e instanceof ApiError && e.isNetwork) throw e;
        if (e instanceof ApiError && e.status >= 500) throw e;
        accessToken = null;
        await clearRefreshToken();
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export async function request(path, options = {}) {
  try {
    return await send(path, options);
  } catch (e) {
    const canRetry = options.auth !== false && e instanceof ApiError && e.status === 401 && e.code === 'TOKEN_INVALID_OR_EXPIRED';
    if (!canRetry) throw e;
    const ok = await refreshSession();
    if (!ok) {
      sessionExpiredHandler?.();
      throw e;
    }
    // Ulangi sekali saja. Kalau masih 401 berarti sesi memang sudah mati.
    try {
      return await send(path, options);
    } catch (e2) {
      if (e2 instanceof ApiError && e2.status === 401) sessionExpiredHandler?.();
      throw e2;
    }
  }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body: body ?? {} }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};
