import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, GraduationCap, ShieldCheck, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const QUICK_GOOGLE_STAFF = [
  { name: 'Dr. D. Murugesan', email: 'gmece@kongu.ac.in', title: 'Senior Professor & Dean' },
  { name: 'Dr. T. Meeradevi', email: 'meeradevi@kongu.ac.in', title: 'Senior Professor & Head' },
  { name: 'Dr. P. Nirmala devi', email: 'nirmaladevi@kongu.ac.in', title: 'Professor' },
  { name: 'Dr. D. Malathi', email: 'malathy@kongu.ac.in', title: 'Professor' },
  { name: 'Dr. K. Manoj Senthil', email: 'kmanojsenthil@kongu.ac.in', title: 'Associate Professor' },
];

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const { login, googleStudentLogin, getGoogleAuthUrl, forgotPassword } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMsg) setErrorMsg('');
  };

  const handlePostLogin = (user) => {
    const role = (user?.role || 'TEACHER').toLowerCase();
    showSuccess(`Welcome, ${user?.name || 'Faculty'}!`);
    navigate(`/${role}`);
  };

  const handleGoogleClick = async () => {
    setGoogleLoading(true);
    try {
      const res = await getGoogleAuthUrl('TEACHER');
      if (res?.configured && res?.url) {
        window.location.href = res.url;
      } else {
        if (res?.message) showError(res.message);
        setGoogleModalOpen(true);
      }
    } catch (err) {
      console.warn('Google staff OAuth URL error:', err);
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
      const res = await login(formData.email, formData.password);
      const user = res?.user || res?.data?.user;
      handlePostLogin(user);
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('Invalid credentials.');
      showError('Invalid credentials. (Note: Staff default password is your email ID)');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmitWithEmail = async (targetEmail) => {
    if (!targetEmail || !targetEmail.trim()) return;
    setGoogleLoading(true);

    try {
      const res = await googleStudentLogin(targetEmail.trim());
      const user = res?.user || res?.data?.user;
      setGoogleModalOpen(false);
      handlePostLogin(user);
    } catch (error) {
      console.warn('Google staff login error:', error);
      showError('Invalid credentials. Institutional Google account not found in database.');
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
    <AuthLayout 
      title="Faculty & Staff Portal" 
      subtitle="Kongu Engineering College (Autonomous), Perundurai"
    >
      <div className="space-y-4">
        {/* Dedicated Student Login Banner */}
        <Link
          to="/student/login"
          className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:scale-[0.99] group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                KEC Students
              </span>
              <strong className="text-sm font-bold block">LOGIN AS STUDENT</strong>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition" />
        </Link>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">
            Faculty / Staff Login
          </span>
          <div className="border-t border-slate-200 w-full" />
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Option A: Google Login for Staff */}
        <div>
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition font-semibold text-slate-700 text-sm shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-60"
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

        {/* Staff/Admin Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Institutional Staff Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            leftIcon={<Mail className="h-4 w-4" />}
            placeholder="staff@kongu.ac.in"
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
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md mt-2 text-sm" 
            isLoading={loading}
          >
            <LogIn className="mr-2 h-4 w-4" /> Sign In to Staff Portal
          </Button>

          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-400">Default password is your email address.</span>
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
      </div>

      {/* Google Authentication Modal for Staff */}
      <Modal
        open={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        title="Faculty Sign In with Google"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">KEC Single Sign-On</strong>
              Select your registered Google account or enter your official <code>@kongu.ac.in</code> email.
            </div>
          </div>

          {/* Quick Select Staff Accounts */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select KEC Faculty Account
            </p>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {QUICK_GOOGLE_STAFF.map((fac) => (
                <button
                  key={fac.email}
                  type="button"
                  onClick={() => handleGoogleSubmitWithEmail(fac.email)}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-50/60 transition group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center uppercase">
                      {fac.name.charAt(3) || fac.name.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-800 block group-hover:text-blue-700">
                        {fac.name}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono">{fac.email} • {fac.title}</span>
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
              Or Use Another @kongu.ac.in Account
            </p>
            <Input
              label="Institutional Google Email"
              type="email"
              required
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              placeholder="staff@kongu.ac.in"
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
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                Authenticate Google Account
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Forgot / Reset Password Modal for Staff */}
      <Modal
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Staff Password"
        size="sm"
      >
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-900 text-xs flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Staff Password Reset</strong>
              Enter your official staff email and create a new permanent password.
            </div>
          </div>

          <Input
            label="Institutional Staff Email"
            type="email"
            required
            value={forgotData.email}
            onChange={(e) => setForgotData(prev => ({ ...prev, email: e.target.value }))}
            leftIcon={<Mail className="h-4 w-4" />}
            placeholder="staff@kongu.ac.in"
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
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold"
            >
              Save New Password
            </Button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  );
};

export default Login;
