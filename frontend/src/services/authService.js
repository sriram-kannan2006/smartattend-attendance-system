import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const studentLogin = async (email, password) => {
  const response = await api.post('/auth/student-login', { email, password });
  return response.data;
};

export const googleStudentLogin = async (email, googleToken = null, portalRole = null) => {
  const response = await api.post('/auth/google', { email, googleToken, portalRole });
  return response.data;
};

export const getGoogleAuthUrl = async (role = 'STUDENT') => {
  const response = await api.get('/auth/google/url', { params: { role } });
  return response.data;
};

export const changePassword = async (newPassword, confirmPassword) => {
  const response = await api.post('/auth/change-password', { newPassword, confirmPassword });
  return response.data;
};

export const forgotPassword = async (email, newPassword, confirmPassword) => {
  const response = await api.post('/auth/forgot-password', { email, newPassword, confirmPassword });
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error', error);
  } finally {
    localStorage.removeItem('token');
  }
};
