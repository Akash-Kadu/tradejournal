import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const GOOGLE_CLIENT_ID = '1095519591607-og3tnpijondavjq3u18n93ng2h9hao5p.apps.googleusercontent.com';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if Google redirected back with a one-time token
        const params      = new URLSearchParams(window.location.search);
        const googleToken = params.get('google_token');

        if (googleToken) {
          // Exchange one-time token for a real session (sets cookie properly)
          const r = await api.get(`/auth/google/verify?token=${googleToken}`);
          setUser(r.data.data);
          // Clean the token from the URL, then go to dashboard
          window.history.replaceState({}, '', '/dashboard');
          window.location.href = '/dashboard';
          return;
        }

        // Normal session check
        const r = await api.get('/auth/me');
        setUser(r.data.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    setUser(r.data.data);
    return r.data.data;
  };

  const register = async (fullName, email, password, confirmPassword) => {
    const r = await api.post('/auth/register', { fullName, email, password, confirmPassword });
    return r.data.data;
  };

  // Redirect browser to Google — no popup needed
  const googleLogin = () => {
    const redirectUri = window.location.hostname === 'localhost'
      ? 'http://localhost:8080/api/auth/google/callback'
      : 'https://tradejournal-production-fb89.up.railway.app/api/auth/google/callback';

    const params = new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      redirect_uri:  redirectUri,
      response_type: 'code',
      scope:         'openid email profile',
      access_type:   'offline',
      prompt:        'select_account',
      state:         window.location.origin, // frontend URL passed to backend
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
