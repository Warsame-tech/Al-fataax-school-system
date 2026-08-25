import { createContext, useCallback, useEffect, useState } from 'react';
import authApi from '../api/authApi';
import useSessionTimeout from '../hooks/useSessionTimeout';
import { notifyLogout, SESSION_EXPIRED_EVENT } from '../utils/sessionSync';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetchMe = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data);
      return data;
    } catch {
      // 401 (or any failure) simply means "not logged in" — not an error.
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refetchMe();
      setLoading(false);
    })();
  }, [refetchMe]);

  const login = useCallback(async (username, password) => {
    const data = await authApi.login(username, password);
    setUser(data);
    return data;
  }, []);

  // Explicit, user-initiated logout (e.g. the Topbar button). Also
  // broadcasts to other tabs, since one tab logging out should log out the
  // whole session everywhere, not just itself.
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      notifyLogout();
    }
  }, []);

  // 60 seconds of no real activity (this tab or any other open tab — see
  // useSessionTimeout) elapsed. Explicitly clears the server-side cookie
  // immediately rather than waiting for the token to passively expire, then
  // broadcasts so every other tab follows straight away. No warning,
  // countdown, or confirmation — this fires the logout directly.
  const handleIdleTimeout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The token may already be expired by the time this fires (a request
      // in flight can lose a close race with the 60s mark) — that still
      // means the session is dead either way, so there's nothing to do.
    } finally {
      setUser(null);
      notifyLogout();
    }
  }, []);

  // A 401 came back on THIS tab (see axiosClient.js) — the session is
  // already gone server-side (the actual enforcement), so just reflect that
  // locally and tell other tabs. Only acts if we currently think we're
  // logged in, so the normal pre-login 401s (initial /auth/me check, a
  // failed login attempt) are no-ops.
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser((current) => {
        if (!current) return current;
        notifyLogout();
        return null;
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  // Another tab logged out — follow immediately, no need to call the API
  // again (the cookie is already cleared) or broadcast further.
  const handleRemoteLogout = useCallback(() => {
    setUser(null);
  }, []);

  const heartbeat = useCallback(() => {
    authApi.heartbeat().catch(() => {
      // Best-effort: if this fails the session is likely already gone, and
      // the next idle-check / 401 will catch it.
    });
  }, []);

  useSessionTimeout({
    enabled: !!user,
    onIdleTimeout: handleIdleTimeout,
    onRemoteLogout: handleRemoteLogout,
    heartbeat,
  });

  const value = { user, loading, login, logout, refetchMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
