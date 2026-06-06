import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// ── Your Google Client ID ─────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '1095519591607-og3tnpijondavjq3u18n93ng2h9hao5p.apps.googleusercontent.com';

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

  // ── Google OAuth login ──────────────────────────────────────────────────────
  // Opens Google popup, gets auth code, sends to backend, sets session
  const googleLogin = () => {
    return new Promise((resolve, reject) => {

      // Detect redirect URI based on environment
      const redirectUri = window.location.hostname === 'localhost'
        ? 'http://localhost:8080/api/auth/google/callback'
        : 'https://tradejournal-production-fb89.up.railway.app/api/auth/google/callback';

      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&access_type=offline` +
        `&prompt=select_account`;

      // Open a popup window
      const width = 500, height = 600;
      const left  = window.screenX + (window.outerWidth  - width)  / 2;
      const top   = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        googleAuthUrl,
        'Google Sign-In',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      // Poll until the popup redirects to our backend callback URL
      // The backend callback will close the popup and postMessage the result
      const timer = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(timer);
            reject(new Error('Google sign-in was cancelled'));
            return;
          }

          let popupUrl = '';
          try { popupUrl = popup.location.href; } catch { return; } // cross-origin — keep waiting

          // Once popup reaches the backend callback URL, extract the code
          if (popupUrl.includes('/api/auth/google/callback') && popupUrl.includes('code=')) {
            clearInterval(timer);
            popup.close();

            const url    = new URL(popupUrl);
            const code   = url.searchParams.get('code');
            const errMsg = url.searchParams.get('error');

            if (errMsg) { reject(new Error('Google sign-in failed: ' + errMsg)); return; }

            // Send code to our backend
            const r = await api.post('/auth/google/callback', { code });
            setUser(r.data.data);
            resolve(r.data.data);
          }
        } catch { /* cross-origin frame, keep polling */ }
      }, 300);

      // Safety timeout after 3 minutes
      setTimeout(() => {
        clearInterval(timer);
        if (!popup.closed) popup.close();
        reject(new Error('Google sign-in timed out'));
      }, 3 * 60 * 1000);
    });
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
