// Unit test client API mobile: refresh lewat SecureStore, single-flight, dan sesi habis.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({ token: null }));
vi.mock('../api/tokenStore', () => ({
  getRefreshToken: vi.fn(async () => store.token),
  setRefreshToken: vi.fn(async (t) => {
    store.token = t;
  }),
  clearRefreshToken: vi.fn(async () => {
    store.token = null;
  }),
}));
vi.mock('../config', () => ({ API_URL: 'https://api.test/api', REQUEST_TIMEOUT_MS: 1000 }));

const { api, hasAccessToken, onSessionExpired, refreshSession, setAccessToken } = await import('../api/client');
const tokenStore = await import('../api/tokenStore');

const json = (status, body, headers = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const expired = () => json(401, { error: 'TOKEN_INVALID_OR_EXPIRED' });

beforeEach(() => {
  store.token = 'rt-lama';
  setAccessToken('at-lama');
  onSessionExpired(null);
  vi.clearAllMocks();
});

describe('refreshSession', () => {
  it('mengirim refresh token di body + X-Client: mobile, lalu menyimpan token baru', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { accessToken: 'at-baru', refreshToken: 'rt-baru' }));
    expect(await refreshSession()).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/api/auth/refresh');
    expect(init.headers['X-Client']).toBe('mobile');
    expect(JSON.parse(init.body)).toEqual({ refreshToken: 'rt-lama' });
    expect(init.headers.Authorization).toBeUndefined();
    expect(store.token).toBe('rt-baru');
  });

  it('tanpa refresh token tersimpan → false tanpa request', async () => {
    store.token = null;
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    expect(await refreshSession()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ditolak server (401) → token di SecureStore dihapus', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(401, { error: 'SESSION_INVALID' }));
    expect(await refreshSession()).toBe(false);
    expect(tokenStore.clearRefreshToken).toHaveBeenCalled();
    expect(hasAccessToken()).toBe(false);
  });

  it('kena rate limit (429) → error dilempar, token TIDAK dihapus, tidak dianggap logout', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(429, { error: 'TOO_MANY_ATTEMPTS' }, { 'Retry-After': '60' }));
    await expect(refreshSession()).rejects.toMatchObject({ status: 429 });
    expect(tokenStore.clearRefreshToken).not.toHaveBeenCalled();
    expect(store.token).toBe('rt-lama');
  });

  it('server error (503) saat bangun → token tetap disimpan', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(503, { error: 'DB_UNAVAILABLE' }));
    await expect(refreshSession()).rejects.toMatchObject({ status: 503 });
    expect(store.token).toBe('rt-lama');
  });

  it('jaringan putus → error dilempar, token TIDAK dihapus', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network request failed'));
    await expect(refreshSession()).rejects.toMatchObject({ code: 'ERR_NETWORK' });
    expect(tokenStore.clearRefreshToken).not.toHaveBeenCalled();
    expect(store.token).toBe('rt-lama');
  });
});

describe('request()', () => {
  it('401 → refresh sekali → ulangi dengan token baru', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(expired())
      .mockResolvedValueOnce(json(200, { accessToken: 'at-baru', refreshToken: 'rt-baru' }))
      .mockResolvedValueOnce(json(200, { name: 'Alya' }));
    await expect(api.get('/me')).resolves.toEqual({ name: 'Alya' });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer at-baru');
  });

  it('banyak request 401 bersamaan → satu refresh saja', async () => {
    let refreshCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (url.endsWith('/auth/refresh')) {
        refreshCalls++;
        await new Promise((r) => setTimeout(r, 20));
        return json(200, { accessToken: 'at-baru', refreshToken: 'rt-baru' });
      }
      return init.headers.Authorization === 'Bearer at-baru' ? json(200, {}) : expired();
    });
    await Promise.all(['/me', '/me/favorites', '/me/history'].map((p) => api.get(p)));
    expect(refreshCalls).toBe(1);
  });

  it('refresh gagal → handler sesi habis dipanggil', async () => {
    const handler = vi.fn();
    onSessionExpired(handler);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(expired()).mockResolvedValueOnce(json(401, { error: 'SESSION_EXPIRED' }));
    await expect(api.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('error membawa Retry-After dan caption untuk StatusBlock', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(429, { error: 'TOO_MANY_ATTEMPTS' }, { 'Retry-After': '900' }));
    const err = await api.post('/auth/login', {}, { auth: false }).catch((e) => e);
    expect(err.retryAfter).toBe(900);
    expect(err.caption).toBe('TOO_MANY_ATTEMPTS · POST /api/auth/login');
  });

  it('body yang macet setelah header datang tetap dibatalkan oleh batas waktu', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const body = new ReadableStream({
        start(controller) {
          init.signal.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')));
        },
      });
      return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    await expect(api.get('/courses')).rejects.toMatchObject({ code: 'ERR_TIMEOUT' });
  }, 5000);
});
