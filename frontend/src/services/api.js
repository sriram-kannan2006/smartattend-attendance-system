import axios from 'axios';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In production outside localhost, use live Render cloud API
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://smartattend-api-q4gr.onrender.com/api';
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAuthRoute = url.includes('/auth/login') ||
                          url.includes('/auth/student-login') ||
                          url.includes('/auth/google') ||
                          url.includes('/auth/register') ||
                          url.includes('/auth/forgot-password') ||
                          url.includes('/auth/change-password');
      
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        const isAuthPage = window.location.pathname.includes('/login') || window.location.pathname.includes('/register');
        if (!isAuthPage) {
          window.location.href = '/student/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
