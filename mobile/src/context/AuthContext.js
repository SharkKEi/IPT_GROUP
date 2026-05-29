import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getStoredTokens, login as apiLogin, logout as apiLogout } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const tokens = await getStoredTokens();
        if (tokens?.access) {
          try {
            const me = await apiRequest('/accounts/api/me/');
            setUser(me);
          } catch (err) {
            console.warn('Failed to verify user token:', err.message);
            await apiLogout();
          }
        }
      } catch (err) {
        console.warn('Failed to load stored tokens:', err);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  const login = async (username, password) => {
    const me = await apiLogin(username, password);
    setUser(me);
    return me;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isLoggedIn: Boolean(user), booting, login, logout, setUser }),
    [user, booting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}
