import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
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
