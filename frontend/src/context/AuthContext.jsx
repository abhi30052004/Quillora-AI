import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, DEMO_CREDENTIALS } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = authService.getStoredSession();
    if (session && session.user) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const res = authService.login(username, password);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  const register = (userData) => {
    const res = authService.register(userData);
    if (res.success) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        demoCredentials: DEMO_CREDENTIALS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
