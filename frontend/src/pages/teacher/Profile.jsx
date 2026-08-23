import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import api from '@/services/api';
import {
  User,
  Mail,
  Phone,
  Building2,
  BookOpen,
  GraduationCap,
  Shield,
  KeyRound,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Loader2
} from 'lucide-react';

export default function TeacherProfile() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/profile').catch(() => ({ data: { data: user } }));
        setProfile(res?.data?.data || res?.data?.user || user);
      } catch (err) {
        console.warn('Profile load err:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showError('Please enter your current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      showError('New password must be at least 8 characters long');
      return;
    }

    try {
      setUpdatingPassword(true);
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      showSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          Faculty Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your academic faculty details, assigned subjects, and security preferences.
        </p>
      </div>

      {/* Main Profile Card */}
      <Card className="p-6 border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'F'}
          </div>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{profile?.name || user?.name}</h2>
              <Badge className="bg-blue-600 text-white text-xs font-bold">FACULTY / TEACHER</Badge>
              <Badge variant="outline" className="text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                ACTIVE
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Department of Electronics and Communication Engineering • Kongu Engineering College
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {profile?.email || user?.email}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {profile?.phone ? `+91 ${profile.phone}` : '+91 98765 43211'}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Cabin: ECE 004
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Academic Details */}
        <Card className="p-6 border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Assigned Teaching Portfolio</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="text-slate-500 font-semibold mb-1.5">Assigned Classes & Sections:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2.5 py-1">
                  ECE III Year - Section D
                </Badge>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2.5 py-1">
                  ECE II Year
                </Badge>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-slate-500 font-semibold mb-1.5">Assigned Subjects:</p>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Digital Signal Processing</span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-600">24ECT51</Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Analog & Digital Communication</span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-600">24ECT52</Badge>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Signals & Systems</span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-600">EC202</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Password */}
        <Card className="p-6 border-slate-200 bg-white space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Security & Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 chars)"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="h-9 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={updatingPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-2 mt-2"
            >
              {updatingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Update Password</span>
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
