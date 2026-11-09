import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { onSessionExpired, post, refreshAccessToken, setAccessToken } from '../api/client';
import { fetchMe, qk } from '../api/queries';

const AuthContext = createContext(null);

// Boot dibuat sekali per page load. StrictMode menjalankan effect dua kali di dev,
// dan kita nggak mau ada dua POST /auth/refresh (refresh token-nya sekali pakai).
let bootPromise = null;
function bootSession() {
  if (!bootPromise) {
    bootPromise = refreshAccessToken()
      .then(() => fetchMe())
      .catch(() => null);
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

  useEffect(() => {
    let alive = true;
    bootSession().then((me) => {
      if (!alive) return;
      if (me) {
        qc.setQueryData(qk.me, me);
        setStatus('authed');
      } else {
        setStatus('guest');
      }
    });
    return () => {
      alive = false;
    };
  }, [qc]);

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
      } catch {
        // kalau server gagal pun, sesi lokal tetap dibersihkan
      }
      clearSession();
      navigate('/login', { replace: true });
    },
    [clearSession, navigate]
  );

  const value = useMemo(
    () => ({ status, expired: reason === 'expired', login, logout, clearSession }),
    [status, reason, login, logout, clearSession]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
