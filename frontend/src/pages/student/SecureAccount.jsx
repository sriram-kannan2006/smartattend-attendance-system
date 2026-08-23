import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function SecureAccount() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { user, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const validatePasswordStrength = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (pass === '12345678') return 'You cannot reuse the temporary initial password.';
    if (!/[A-Za-z]/.test(pass) || !/[0-9]/.test(pass)) {
      return 'Password should contain a mix of letters and numbers for safety.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validationError = validatePasswordStrength(newPassword);
    if (validationError) {
      setErrorMsg(validationError);
      showError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      const mismatch = 'New passwords do not match.';
      setErrorMsg(mismatch);
      showError(mismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await changePassword(newPassword, confirmPassword);
      const isFaceRegistered = res?.faceRegistered === true || res?.data?.faceRegistered === true;

      showSuccess('Account secured! Your permanent personal password is set.');

      if (!isFaceRegistered) {
        navigate('/student/face-registration');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('Password change error:', err);
      const msg = err.response?.data?.message || 'Failed to update password. Please try again.';
      setErrorMsg(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center ring-8 ring-blue-50/50 shadow-inner">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200/60 mb-2">
          <span>First-Time Account Activation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          SECURE YOUR ACCOUNT
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Welcome {user?.name || 'Student'}. Please create your permanent personal password.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-slate-100 space-y-6">
          <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Security Requirements</strong>
              Your temporary password will be permanently invalidated. Minimum 8 characters with letters & numbers required.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="Enter new password"
            />

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              placeholder="Confirm new password"
            />

            {/* Checklist */}
            <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
              <div className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>At least 8 characters long</span>
              </div>
              <div className={`flex items-center gap-1.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-600 font-semibold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Passwords match</span>
              </div>
              <div className={`flex items-center gap-1.5 ${newPassword && newPassword !== '12345678' ? 'text-emerald-600 font-semibold' : ''}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Not temporary default password</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md shadow-blue-600/20 mt-4 text-sm"
              isLoading={loading}
            >
              Set Permanent Password & Continue <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
