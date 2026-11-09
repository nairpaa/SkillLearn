import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { onSessionExpired, refreshSession, setAccessToken } from '../api/client';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '../api/tokenStore';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  // status: 'unknown' (lagi cek token) | 'authed' | 'guest'
  const [state, setState] = useState({ status: 'unknown', expired: false });
  const loggingOut = useRef(false);
  const booted = useRef(false);

  const resetToGuest = useCallback(
    async (expired) => {
      setAccessToken(null);
      await clearRefreshToken();
      queryClient.clear();
      setState({ status: 'guest', expired });
    },
    [queryClient]
  );

  useEffect(() => {
    // Dipanggil client.js kalau refresh gagal → balik ke Login dengan banner "session expired"
    onSessionExpired(() => {
      if (loggingOut.current) return;
      resetToGuest(true);
    });
    return () => onSessionExpired(null);
  }, [resetToGuest]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    (async () => {
      const stored = await getRefreshToken();
      if (!stored) {
        setState({ status: 'guest', expired: false });
        return;
      }
      try {
        const ok = await refreshSession();
        setState({ status: ok ? 'authed' : 'guest', expired: false });
      } catch {
        // Server nggak kejangkau (offline / cold start gagal). Token masih disimpan, jadi anggap login dulu;
        // Home nanti menampilkan error + "Try again" yang akan mencoba refresh lagi.
        setState({ status: 'authed', expired: false });
      }
    })();
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await authApi.login(email, password);
      setAccessToken(data.accessToken);
      if (data.refreshToken) await setRefreshToken(data.refreshToken);
      queryClient.clear();
      setState({ status: 'authed', expired: false });
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    loggingOut.current = true;
    try {
      await authApi.logout();
    } catch {
      // tetap logout lokal walau request gagal
    }
    await resetToGuest(false);
    loggingOut.current = false;
  }, [resetToGuest]);

  const dismissExpired = useCallback(() => setState((s) => (s.expired ? { ...s, expired: false } : s)), []);

  const value = useMemo(
    () => ({ status: state.status, sessionExpired: state.expired, login, logout, dismissExpired }),
    [state, login, logout, dismissExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
