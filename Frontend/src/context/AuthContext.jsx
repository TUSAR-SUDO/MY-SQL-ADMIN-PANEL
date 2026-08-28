import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, getMe } from '../api';

const AuthContext = createContext(null);

/**
 * Session handling is deliberately *adaptive*, so one build works in both modes:
 *
 *   Backend AUTH_BYPASS=true   -> getMe() succeeds with no token, so the panel
 *                                 opens straight to the dashboard (local demo).
 *   Backend AUTH_BYPASS=false  -> getMe() returns 401, so we show the login
 *                                 screen and require real credentials.
 *
 * Nothing here hardcodes a fake admin: if the API is unreachable we say so
 * rather than showing a signed-in shell over empty data.
 */
export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [status, setStatus] = useState('checking'); // checking | authenticated | unauthenticated

  const applySession = useCallback((token, adminData) => {
    if (token) localStorage.setItem('token', token);
    if (adminData) localStorage.setItem('admin', JSON.stringify(adminData));
    if (adminData) setAdmin(adminData);
    setStatus('authenticated');
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setAdmin(null);
    setStatus('unauthenticated');
  }, []);

  // Ask the server who we are on boot.
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((res) => {
        if (!cancelled) applySession(null, res.data);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });
    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  // The axios layer raises this when any request comes back 401.
  useEffect(() => {
    const onExpired = () => clearSession();
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [clearSession]);

  // Errors propagate on purpose so the form can show the real reason.
  const login = async (email, password) => {
    const res = await loginApi({ email, password });
    applySession(res.data?.token, res.data?.admin);
    return res.data?.admin;
  };

  const setAuthFromToken = (token, adminData) => applySession(token, adminData);
  const refreshAdmin = (adminData) => applySession(null, adminData);
  const logout = () => clearSession();

  return (
    <AuthContext.Provider
      value={{
        admin,
        status,
        loading: status === 'checking',
        isAuthenticated: status === 'authenticated',
        login,
        logout,
        setAuthFromToken,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
