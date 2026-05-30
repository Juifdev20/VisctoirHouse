import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token = null;
    let userData = null;
    try {
      token = localStorage.getItem('token');
      userData = localStorage.getItem('user');
    } catch {}
    if (token && userData) {
      setUser(JSON.parse(userData));
      // Vérification token valide
      authAPI.me()
        .then(res => setUser(res.data.user))
        .catch(() => {
          try { localStorage.clear(); } catch {}
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, motDePasse) => {
    const res = await authAPI.login({ email, mot_de_passe: motDePasse });
    const { token, user: userData } = res.data;
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {}
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    setUser(null);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);

  const updateUser = (newUserData) => {
    const updated = { ...user, ...newUserData };
    setUser(updated);
    try {
      localStorage.setItem('user', JSON.stringify(updated));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être dans AuthProvider');
  return ctx;
};
