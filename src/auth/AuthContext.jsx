import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem('pv_token')) {
      setLoading(false);
      return () => { active = false; };
    }

    api.get('/api/auth/me')
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch((error) => {
        if (active && error.response?.status !== 401) setInitError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  async function login(username, password) {
    const { data } = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('pv_token', data.access_token);
    setUser({ user_id: data.user_id, full_name: data.full_name, role: data.role });
    setInitError('');
    return data;
  }

  function logout() {
    localStorage.removeItem('pv_token');
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, initError, login, logout }),
    [user, loading, initError],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
