// Unit test client API: refresh token otomatis, single-flight, dan penanganan sesi habis.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, hasAccessToken, onSessionExpired, refreshAccessToken, retryAfterText, setAccessToken } from '../api/client';

const json = (status, body, headers = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

const expired = () => json(401, { error: 'TOKEN_INVALID_OR_EXPIRED' });

beforeEach(() => {
  setAccessToken(null);
  onSessionExpired(null);
  localStorage.clear();
  sessionStorage.clear();
});

describe('api()', () => {
  it('menempel Bearer token dan memakai credentials same-origin', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { ok: true }));
    setAccessToken('v4.public.AAA');
    await api('/me');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/me');
    expect(init.headers.Authorization).toBe('Bearer v4.public.AAA');
    expect(init.credentials).toBe('same-origin');
  });

  it('401 TOKEN_INVALID_OR_EXPIRED → refresh sekali lalu ulangi request dengan token baru', async () => {
    setAccessToken('lama');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(expired())
      .mockResolvedValueOnce(json(200, { accessToken: 'baru', expiresIn: 900 }))
      .mockResolvedValueOnce(json(200, { name: 'Alya' }));
    await expect(api('/me')).resolves.toEqual({ name: 'Alya' });
    const refreshCall = fetchMock.mock.calls[1];
    expect(refreshCall[0]).toBe('/api/auth/refresh');
    expect(refreshCall[1].headers['X-Requested-With']).toBe('XMLHttpRequest');
    expect(refreshCall[1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer baru');
  });

  it('banyak request gagal bersamaan → hanya SATU panggilan refresh (refresh token sekali pakai)', async () => {
    setAccessToken('lama');
    let refreshCalls = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (url === '/api/auth/refresh') {
        refreshCalls++;
        await new Promise((r) => setTimeout(r, 20));
        return json(200, { accessToken: 'baru' });
      }
      return init.headers.Authorization === 'Bearer baru' ? json(200, { url }) : expired();
    });
    const results = await Promise.all(['/me', '/me/favorites', '/me/history', '/courses'].map((p) => api(p)));
    expect(results).toHaveLength(4);
    expect(refreshCalls).toBe(1);
  });

  it('refresh ditolak (401) → handler sesi habis dipanggil, token dibuang', async () => {
    setAccessToken('lama');
    const handler = vi.fn();
    onSessionExpired(handler);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(expired()).mockResolvedValueOnce(json(401, { error: 'SESSION_EXPIRED' }));
    await expect(api('/me')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledOnce();
    expect(hasAccessToken()).toBe(false);
  });

  it('refresh gagal karena jaringan → BUKAN dianggap sesi habis', async () => {
    setAccessToken('lama');
    const handler = vi.fn();
    onSessionExpired(handler);
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(expired()).mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(api('/me')).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('tidak mengulang tanpa batas: request ulang yang tetap 401 langsung dilempar', async () => {
    setAccessToken('lama');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(expired())
      .mockResolvedValueOnce(json(200, { accessToken: 'baru' }))
      .mockResolvedValueOnce(expired());
    await expect(api('/me')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('401 lain (mis. INVALID_CREDENTIALS saat login) tidak memicu refresh', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(401, { error: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' }));
    await expect(api('/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('error membawa kode, field, dan Retry-After; jaringan putus jadi ERR_NETWORK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(429, { error: 'TOO_MANY_ATTEMPTS' }, { 'Retry-After': '900' }));
    const err = await api('/auth/login', { method: 'POST', body: {}, auth: false }).catch((e) => e);
    expect(err.code).toBe('TOO_MANY_ATTEMPTS');
    expect(err.retryAfter).toBe(900);
    expect(retryAfterText(err)).toBe('15 minutes');
    expect(retryAfterText({ retryAfter: 3600 })).toBe('1 hour');

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const net = await api('/courses').catch((e) => e);
    expect(net.isNetwork).toBe(true);
    expect(net.code).toBe('ERR_NETWORK');
  });
});

describe('penyimpanan token', () => {
  it('access token tidak pernah masuk localStorage/sessionStorage/cookie', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { accessToken: 'v4.public.RAHASIA' }));
    await refreshAccessToken();
    expect(hasAccessToken()).toBe(true);
    const dump = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie;
    expect(dump).not.toContain('RAHASIA');
  });
});
