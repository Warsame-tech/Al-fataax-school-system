import { createContext, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import authApi from '../api/authApi';
import useIdleTimer from '../hooks/useIdleTimer';

export const AuthContext = createContext(null);

// Matches the backend's sliding-session window (server/.env JWT_EXPIRES_IN)
// so the user is signed out here at roughly the same time their session
// would expire server-side anyway.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

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

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const handleIdle = useCallback(() => {
    logout();
    toast('You have been logged out due to inactivity.');
  }, [logout]);

  useIdleTimer(handleIdle, IDLE_TIMEOUT_MS, !!user);

  const value = { user, loading, login, logout, refetchMe };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
