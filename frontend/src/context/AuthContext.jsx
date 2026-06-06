import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const GOOGLE_CLIENT_ID = '1095519591607-og3tnpijondavjq3u18n93ng2h9hao5p.apps.googleusercontent.com';

// Detect frontend origin
const FRONTEND_URL = window.location.origin; // e.g. https://ourtradejournal.vercel.app

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then(r => setUser(r.data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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

  // ── Google OAuth — redirect flow (no popup) ───────────────────────────────
  // Navigates the browser directly to Google, which redirects to the backend,
  // which sets the session and redirects to /dashboard on the frontend.
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
      // Pass frontend URL so backend knows where to redirect after success
      state: FRONTEND_URL,
    });

    // Full browser redirect — no popup needed
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
