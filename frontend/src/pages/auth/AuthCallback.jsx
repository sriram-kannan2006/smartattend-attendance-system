import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [status, setStatus] = useState('processing');
  const [statusText, setStatusText] = useState('Verifying Google credentials with Kongu SmartAttend...');

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const role = searchParams.get('role');
      const faceRegistered = searchParams.get('faceRegistered') === 'true';
      const error = searchParams.get('error');
      const msg = searchParams.get('msg');

      if (error) {
        setStatus('error');
        setStatusText(msg || error || 'Google authentication failed. Please try again.');
        showError(msg || error || 'Google authentication failed.');
        setTimeout(() => {
          navigate('/student/login');
        }, 2500);
        return;
      }

      if (!token) {
        setStatus('error');
        setStatusText('No authentication token received from Google callback.');
        showError('Authentication failed: Missing token.');
        setTimeout(() => {
          navigate('/student/login');
        }, 2500);
        return;
      }

      try {
        setStatusText('Securing session and loading your profile...');
        // Store JWT token
        localStorage.setItem('token', token);
        localStorage.setItem('user_role', role || 'STUDENT');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Fetch user profile
        const userRes = await api.get('/auth/me');
        const userData = userRes?.data?.data?.user || userRes?.data?.user;

        setStatus('success');
        setStatusText('Authentication successful! Redirecting to dashboard...');
        showSuccess(`Welcome, ${userData?.name || 'User'}!`);

        // Route to appropriate dashboard
        setTimeout(() => {
          const userRole = (userData?.role || role || 'STUDENT').toUpperCase();
          if (userRole === 'STUDENT') {
            if (!faceRegistered && !userData?.faceRegistered) {
              navigate('/student/face-registration');
            } else {
              navigate('/student/dashboard');
            }
          } else if (userRole === 'TEACHER') {
            navigate('/teacher/dashboard');
          } else if (userRole === 'ADMIN') {
            navigate('/admin/dashboard');
          } else {
            navigate(`/${userRole.toLowerCase()}/dashboard`);
          }
        }, 800);
      } catch (err) {
        console.error('Callback profile fetch error:', err);
        setStatus('error');
        setStatusText('Failed to initialize session. Please try logging in again.');
        showError('Session initialization error.');
        setTimeout(() => {
          navigate('/student/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, showSuccess, showError]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-36 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
            <img src="/kec-logo.png" alt="Kongu Engineering College" className="h-full w-full object-contain" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200/60">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Google Single Sign-On</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Authenticating with SmartAttend
          </h2>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center space-y-3">
          {status === 'processing' && (
            <>
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-600">{statusText}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-700">{statusText}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-10 h-10 text-red-600" />
              <p className="text-xs font-bold text-red-700">{statusText}</p>
              <p className="text-[11px] text-slate-400">Redirecting to login portal...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
