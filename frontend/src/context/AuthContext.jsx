import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('salon_crm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [salon, setSalon] = useState(() => {
    const saved = localStorage.getItem('salon_crm_salon');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('salon_crm_token'));
  const [loading, setLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState(null);

  useEffect(() => {
    const handleExpired = (e) => {
      setSubscriptionError(e.detail);
    };
    window.addEventListener('subscription_expired', handleExpired);
    return () => window.removeEventListener('subscription_expired', handleExpired);
  }, []);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          setSalon(res.data.salon);
          localStorage.setItem('salon_crm_user', JSON.stringify(res.data.user));
          if (res.data.salon) {
            localStorage.setItem('salon_crm_salon', JSON.stringify(res.data.salon));
          }
        } catch (err) {
          console.error('Failed to verify user session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser, salon: newSalon } = res.data;

    setToken(newToken);
    setUser(newUser);
    setSalon(newSalon);
    setSubscriptionError(null);

    localStorage.setItem('salon_crm_token', newToken);
    localStorage.setItem('salon_crm_user', JSON.stringify(newUser));
    if (newSalon) {
      localStorage.setItem('salon_crm_salon', JSON.stringify(newSalon));
    }

    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSalon(null);
    setSubscriptionError(null);
    localStorage.removeItem('salon_crm_token');
    localStorage.removeItem('salon_crm_user');
    localStorage.removeItem('salon_crm_salon');
  };

  const refreshSalon = (updatedSalon) => {
    setSalon(updatedSalon);
    localStorage.setItem('salon_crm_salon', JSON.stringify(updatedSalon));
  };

  return (
    <AuthContext.Provider value={{
      user,
      salon,
      token,
      loading,
      subscriptionError,
      setSubscriptionError,
      login,
      logout,
      refreshSalon
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
