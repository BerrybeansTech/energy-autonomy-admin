import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getAuthToken, getStoredUser, clearAuth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getAuthToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAuthenticated = Boolean(token);

  // Synchronize on 401 unauthorized events from API calls
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setError('Session expired. Please log in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setToken(data.token);
      setUser(data.user || { email, role: 'admin' });
      setLoading(false);
      return true;
    } catch (err) {
      const msg = err.data?.error || err.message || 'Login failed. Please verify credentials.';
      setError(msg);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
    setError('');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        logout,
        error,
        setError,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
