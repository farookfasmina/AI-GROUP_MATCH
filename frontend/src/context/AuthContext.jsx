import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function hasToken() {
  try {
    return !!localStorage.getItem('study_token');
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(hasToken());

  const refresh = useCallback(async () => {
    if (!hasToken()) {
      setCurrentUser(null);
      setLoading(false);
      return null;
    }
    try {
      const res = await api.get('/users/me');
      setCurrentUser(res.data);
      return res.data;
    } catch {
      setCurrentUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onOut = () => setCurrentUser(null);
    window.addEventListener('sm:signed-out', onOut);
    return () => window.removeEventListener('sm:signed-out', onOut);
  }, [refresh]);

  const login = async (email, password) => {
    // The backend uses the OAuth2 password form: 'username' holds the email.
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    const res = await api.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    try { localStorage.setItem('study_token', res.data.access_token); } catch { /* ignore */ }
    const me = await api.get('/users/me');
    setCurrentUser(me.data);
    return me.data;
  };

  const logout = () => {
    try { localStorage.removeItem('study_token'); } catch { /* ignore */ }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, user: currentUser, login, logout, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function homeFor(user) {
  if (!user) return '/login';
  if (user.is_platform_admin) return '/admin';
  return user.profile_complete ? '/dashboard' : '/onboarding';
}
