import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ApiError, onSessionExpired, post, refreshAccessToken, setAccessToken } from '../api/client';
import { fetchMe, qk } from '../api/queries';

const AuthContext = createContext(null);

// Boot dibuat sekali per page load. StrictMode menjalankan effect dua kali di dev,
// dan kita nggak mau ada dua POST /auth/refresh (refresh token-nya sekali pakai).
// Hasil: { me } kalau sesi masih ada, { guest: true } kalau memang belum/tidak login,
// { offline: true } kalau server tidak bisa dihubungi (jaringan putus, server bangun dari tidur, 5xx).
let bootPromise = null;
const isOutage = (err) => !(err instanceof ApiError) || err.isNetwork || err.status >= 500;
function bootSession() {
  if (!bootPromise) {
    bootPromise = refreshAccessToken()
      .then(() => fetchMe())
      .then((me) => ({ me }))
      .catch((err) => (isOutage(err) ? { offline: true } : { guest: true }));
  }
  return bootPromise;
}

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState('unknown');
  // alasan jadi guest: 'expired' → RequireAuth mengarahkan ke /login?expired=1 (banner sesi habis)
  const [reason, setReason] = useState(null);

  const clearSession = useCallback(
    (why = null) => {
      setAccessToken(null);
      setReason(why);
      setStatus('guest');
      // cache dibuang setelah halaman privat sempat unmount, biar query-nya nggak refetch tanpa token
      setTimeout(() => qc.clear(), 0);
    },
    [qc]
  );

  const applyBoot = useCallback(
    (res) => {
      if (res.me) {
        qc.setQueryData(qk.me, res.me);
        setStatus('authed');
      } else {
        setStatus(res.offline ? 'offline' : 'guest');
      }
    },
    [qc]
  );

  useEffect(() => {
    let alive = true;
    bootSession().then((res) => alive && applyBoot(res));
    return () => {
      alive = false;
    };
  }, [applyBoot]);

  const retryBoot = useCallback(() => {
    bootPromise = null;
    setStatus('unknown');
    bootSession().then(applyBoot);
  }, [applyBoot]);

  useEffect(() => {
    // redirect-nya diurus RequireAuth (satu pintu), di sini cukup tandai sesinya habis
    onSessionExpired(() => clearSession('expired'));
    return () => onSessionExpired(null);
  }, [clearSession]);

  const login = useCallback(
    async (email, password) => {
      const data = await post('/auth/login', { email, password }, { auth: false });
      setAccessToken(data.accessToken);
      const me = await fetchMe();
      qc.setQueryData(qk.me, me);
      setReason(null);
      setStatus('authed');
      return me;
    },
    [qc]
  );

  const logout = useCallback(
    async ({ allDevices = false } = {}) => {
      try {
        await post('/auth/logout', allDevices ? { allDevices: true } : {});
      } catch (err) {
        // Sesi sudah tidak berlaku di server (401) → cukup bersihkan lokal.
        // Gagal karena jaringan/server: JANGAN pura-pura sudah logout, karena cookie login di browser
        // masih berlaku dan orang berikutnya di komputer yang sama bisa masuk sebagai kamu.
        if (!(err instanceof ApiError && err.status === 401)) throw err;
      }
      clearSession();
      navigate('/login', { replace: true });
    },
    [clearSession, navigate]
  );

  const value = useMemo(
    () => ({ status, expired: reason === 'expired', login, logout, clearSession, retryBoot }),
    [status, reason, login, logout, clearSession, retryBoot]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
