import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Global response interceptor — redirect to /login on 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname === '/login';
      if (!isLoginPage) window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
