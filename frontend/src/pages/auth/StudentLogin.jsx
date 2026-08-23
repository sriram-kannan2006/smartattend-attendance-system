import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, ArrowLeft, ShieldCheck, CheckCircle2, KeyRound, UserCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const QUICK_GOOGLE_STUDENTS = [
  { name: 'SARAN K N', email: 'sarankn.24ece@kongu.edu', regNo: '24ECR177' },
  { name: 'SRIRAM KANNAN S', email: 'sriramkannans.24ece@kongu.edu', regNo: '24ECR198' },
  { name: 'SHWETHA T', email: 'shwethat.24ece@kongu.edu', regNo: '24ECR191' },
  { name: 'SARVIKA S', email: 'sarvikas.24ece@kongu.edu', regNo: '24ECR181' },
  { name: 'SELVAKUMARI M', email: 'selvakumarim.24ece@kongu.edu', regNo: '24ECR182' },
  { name: 'VIGNESH M', email: 'vigneshm.24ece@kongu.edu', regNo: '24ECR229' },
];

export default function StudentLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  
  // Google Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotData, setForgotData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [forgotLoading, setForgotLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');

  const { studentLogin, googleStudentLogin, getGoogleAuthUrl, forgotPassword } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handlePostLoginRedirect = (res) => {
    const data = res?.data || res;
    const isPasswordChangeRequired = data?.passwordChangeRequired === true;
    const isFaceRegistered = data?.faceRegistered === true || data?.user?.faceRegistered === true;

    if (isPasswordChangeRequired) {
      showSuccess('Account verified. Please set your permanent personal password.');
      navigate('/student/secure-account');
    } else if (!isFaceRegistered) {
      showSuccess('Welcome! Please complete one-time face registration.');
      navigate('/student/face-registration');
    } else {
      showSuccess('Welcome to your Student Dashboard!');
      navigate('/student/dashboard');
    }
  };

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    try {
      const res = await getGoogleAuthUrl('STUDENT');
      if (res?.configured && res?.url) {
        window.location.href = res.url;
      } else {
        if (res?.message) showError(res.message);
        setGoogleModalOpen(true);
      }
    } catch (err) {
      console.warn('Google OAuth URL fetch error:', err);
      setGoogleModalOpen(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await studentLogin(formData.email, formData.password);
      handlePostLoginRedirect(res);
    } catch (error) {
      console.warn('Student login error:', error);
      setErrorMsg('Invalid credentials.');
      showError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmitWithEmail = async (targetEmail) => {
    if (!targetEmail || !targetEmail.trim()) return;
    setGoogleLoading(true);

    try {
      const res = await googleStudentLogin(targetEmail.trim(), null, 'STUDENT');
      setGoogleModalOpen(false);
      handlePostLoginRedirect(res);
    } catch (error) {
      console.warn('Google student login error:', error);
      showError('Invalid credentials. Institutional Google account not found in student database.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    handleGoogleSubmitWithEmail(googleEmail);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (forgotData.newPassword !== forgotData.confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    if (forgotData.newPassword.length < 6) {
      showError('Password must be at least 6 characters.');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await forgotPassword(forgotData.email, forgotData.newPassword, forgotData.confirmPassword);
      showSuccess(res?.message || 'Password reset successfully! You can now log in.');
      setForgotModalOpen(false);
      setFormData(prev => ({ ...prev, email: forgotData.email, password: forgotData.newPassword }));
    } catch (err) {
      console.error('Forgot password error:', err);
      showError(err.response?.data?.message || 'Failed to reset password. Please check your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="h-16 w-36 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
            <img src="/kec-logo.png" alt="Kongu Engineering College" className="h-full w-full object-contain" />
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200/60 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Student Portal</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Kongu Engineering College
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          SmartAttend • Autonomous Institution, Perundurai
        </p>
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-100 space-y-6">
          <div className="text-center pb-2 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900">Welcome Back</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sign in using your institutional account</p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Option A: Google Login Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-slate-300 transition font-semibold text-slate-700 text-sm shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs font-bold text-slate-400 uppercase">OR</span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Option B: Email + Password Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Institutional Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="Enter your @kongu.edu email"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-600/20 mt-2 text-sm"
              isLoading={loading}
            >
              <LogIn className="mr-2 h-4 w-4" /> LOGIN
            </Button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-400">Need help with password?</span>
              <button
                type="button"
                onClick={() => {
                  setForgotData(prev => ({ ...prev, email: formData.email || '' }));
                  setForgotModalOpen(true);
                }}
                className="text-blue-600 font-semibold hover:underline shrink-0 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Back to Faculty/Staff Portal Link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 font-medium transition"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Faculty & Staff Login Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Google Authentication Modal for @kongu.edu */}
      <Modal
        open={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        title="Sign In with Google"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">KEC Single Sign-On</strong>
              Select your registered Google account or enter your official <code>@kongu.edu</code> email.
            </div>
          </div>

          {/* Quick Select Student Accounts */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select KEC Student Account
            </p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {QUICK_GOOGLE_STUDENTS.map((st) => (
                <button
                  key={st.email}
                  type="button"
                  onClick={() => handleGoogleSubmitWithEmail(st.email)}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-50/60 transition group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center uppercase">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-800 block group-hover:text-blue-700">
                        {st.name} ({st.regNo})
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono">{st.email}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Or Manual Email Form */}
          <form onSubmit={handleGoogleSubmit} className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Or Use Another @kongu.edu Account
            </p>
            <Input
              label="Google Workspace Email"
              type="email"
              required
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="name.24ece@kongu.edu"
            />

            <div className="flex gap-2 justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGoogleModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={googleLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Sign In with Google
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Forgot / Reset Password Modal */}
      <Modal
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Student Password"
        size="sm"
      >
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 text-xs flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Password Reset</strong>
              Enter your official institutional email and set your new password.
            </div>
          </div>

          <Input
            label="Institutional Email"
            type="email"
            required
            value={forgotData.email}
            onChange={(e) => setForgotData(prev => ({ ...prev, email: e.target.value }))}
            leftIcon={<Mail className="h-4 w-4" />}
            placeholder="yourname.24ece@kongu.edu"
          />

          <Input
            label="New Password"
            type="password"
            required
            value={forgotData.newPassword}
            onChange={(e) => setForgotData(prev => ({ ...prev, newPassword: e.target.value }))}
            leftIcon={<Lock className="h-4 w-4" />}
            placeholder="Enter new password (min 6 chars)"
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            value={forgotData.confirmPassword}
            onChange={(e) => setForgotData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            leftIcon={<Lock className="h-4 w-4" />}
            placeholder="Confirm new password"
          />

          <div className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForgotModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={forgotLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Save New Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
