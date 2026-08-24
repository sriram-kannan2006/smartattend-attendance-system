import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '@/services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token');
    return t && t !== 'null' && t !== 'undefined' ? t : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken || storedToken === 'null' || storedToken === 'undefined') {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      const userData = res?.data?.user || res?.user || res?.data || res;
      if (userData && userData._id) {
        setUser(userData);
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (error) {
      console.warn('Session verification failed:', error?.message);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const data = res?.data || res;
    const authToken = data.token;
    const profileInfo = data.profile || data.user?.profile || data.student || data.teacher;
    const isFaceReg = data.faceRegistered ?? data.user?.faceRegistered ?? profileInfo?.faceRegistered ?? false;

    const mergedUser = {
      ...(data.user || {}),
      profile: profileInfo,
      student: data.student || (data.user?.role === 'STUDENT' ? profileInfo : undefined),
      teacher: data.teacher || (data.user?.role === 'TEACHER' ? profileInfo : undefined),
      faceRegistered: isFaceReg,
      registerNumber: profileInfo?.registerNumber || data.user?.registerNumber || '',
    };

    if (authToken) {
      setToken(authToken);
      localStorage.setItem('token', authToken);
    }
    if (data.user) {
      setUser(mergedUser);
    }
    fetchUser();
    return data;
  };

  const studentLogin = async (email, password) => {
    const res = await authService.studentLogin(email, password);
    const data = res?.data || res;
    const authToken = data.token;
    const studentInfo = data.student || data.user?.student || data.user?.profile;
    const isFaceReg = data.faceRegistered ?? data.user?.faceRegistered ?? studentInfo?.faceRegistered ?? false;

    const mergedUser = {
      ...(data.user || {}),
      profile: studentInfo,
      student: studentInfo,
      faceRegistered: isFaceReg,
      registerNumber: studentInfo?.registerNumber || data.user?.registerNumber || '',
    };

    if (authToken) {
      setToken(authToken);
      localStorage.setItem('token', authToken);
    }
    if (data.user) {
      setUser(mergedUser);
    }
    fetchUser();
    return data;
  };

  const googleStudentLogin = async (email, googleToken = null, portalRole = null) => {
    const res = await authService.googleStudentLogin(email, googleToken, portalRole);
    const data = res?.data || res;
    const authToken = data.token;
    const studentInfo = data.student || data.user?.student || data.user?.profile;
    const isFaceReg = data.faceRegistered ?? data.user?.faceRegistered ?? studentInfo?.faceRegistered ?? false;

    const mergedUser = {
      ...(data.user || {}),
      profile: studentInfo || data.user?.profile,
      student: studentInfo,
      teacher: data.teacher || data.user?.teacher,
      faceRegistered: isFaceReg,
      registerNumber: studentInfo?.registerNumber || data.user?.registerNumber || '',
    };

    if (authToken) {
      setToken(authToken);
      localStorage.setItem('token', authToken);
    }
    if (data.user) {
      setUser(mergedUser);
    }
    fetchUser();
    return data;
  };

  const updateUser = useCallback((updater) => {
    setUser((prev) => {
      if (typeof updater === 'function') {
        return updater(prev);
      }
      return { ...prev, ...updater };
    });
  }, []);

  const changePassword = async (newPassword, confirmPassword) => {
    const res = await authService.changePassword(newPassword, confirmPassword);
    const data = res?.data || res;
    if (data.user) {
      setUser((prev) => ({ ...(prev || {}), ...(data.user || {}), passwordChangeRequired: false }));
    }
    return data;
  };

  const forgotPassword = async (email, newPassword, confirmPassword) => {
    const res = await authService.forgotPassword(email, newPassword, confirmPassword);
    return res;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const data = res?.data || res;
    const authToken = data.token;
    const authUser = data.user;

    if (authToken) {
      setToken(authToken);
      localStorage.setItem('token', authToken);
    }
    if (authUser) {
      setUser(authUser);
    }
    fetchUser();
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.warn('Logout error', e);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    studentLogin,
    googleStudentLogin,
    getGoogleAuthUrl: authService.getGoogleAuthUrl,
    changePassword,
    forgotPassword,
    register,
    logout,
    updateUser,
    refreshUser: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
