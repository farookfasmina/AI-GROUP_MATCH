import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Automatically verify token and fetch user on application mount
    const checkUser = async () => {
      const token = localStorage.getItem('study_token');
      if (token) {
        try {
          const res = await api.get('/users/me');
          setCurrentUser(res.data);
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem('study_token');
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    // Backend OAuth2 expects form-data for username and password
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const res = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    localStorage.setItem('study_token', res.data.access_token);
    
    // Fetch profile immediately after caching token
    const profileRes = await api.get('/users/me');
    setCurrentUser(profileRes.data);
  };

  const logout = () => {
    localStorage.removeItem('study_token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, user: currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
