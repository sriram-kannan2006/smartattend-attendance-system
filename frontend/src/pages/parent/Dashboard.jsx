import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import { Users, Calendar, AlertTriangle, Clock, CheckCircle2, XCircle, BookOpen, ShieldCheck, Loader2 } from 'lucide-react';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [attendance, setAttendance] = useState({ records: [], subjectStats: [], overall: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParentData = async () => {
      try {
        setLoading(true);
        // Load parent profile student data
        const profile = user?.profile;
        const linkedStudent = profile?.studentIds?.[0] || {
          name: 'Sriram Krishnan',
          registerNumber: '24ECR100',
          className: 'ECE II Year',
          department: 'ECE',
        };
        setStudentData(linkedStudent);

        // Fetch student attendance if studentId available
        if (linkedStudent._id) {
          const res = await attendanceService.getStudentAttendance(linkedStudent._id);
          const data = res?.data?.data || res?.data || res;
          setAttendance(data);
        } else {
          // Fallback sample data for preview
          setAttendance({
            overall: { totalClasses: 45, present: 41, absent: 3, od: 1, percentage: 91 },
            subjectStats: [
              { subjectName: 'Digital Electronics', total: 12, present: 11, absent: 1, percentage: 92 },
              { subjectName: 'Signals and Systems', total: 12, present: 10, absent: 2, percentage: 83 },
              { subjectName: 'Communication Theory', total: 11, present: 11, absent: 0, percentage: 100 },
              { subjectName: 'Mathematics III', total: 10, present: 9, absent: 1, percentage: 90 },
            ],
            records: [
              { date: new Date(), hour: 1, subjectId: { name: 'Mathematics III' }, status: 'PRESENT' },
              { date: new Date(), hour: 2, subjectId: { name: 'Digital Electronics' }, status: 'PRESENT' },
              { date: new Date(Date.now() - 86400000), hour: 3, subjectId: { name: 'Signals and Systems' }, status: 'ABSENT' },
            ],
          });
        }
      } catch (err) {
        console.error('Parent data error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParentData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const overall = attendance.overall || { percentage: 90, present: 36, absent: 4, od: 0, totalClasses: 40 };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Ward Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              KEC Parent Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Kongu Engineering College (Autonomous)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Ward Academic Presence</h1>
          <p className="text-xs text-slate-500">Live monitoring of student daily attendance and course credit eligibility</p>
        </div>

        {/* Linked Ward Info Pill */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-sm">
            {studentData?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">{studentData?.name || 'Student'}</span>
            <span className="text-[10px] text-slate-400 font-mono">Reg: {studentData?.registerNumber || '24ECR100'}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Overall Attendance</span>
            <span className="text-2xl font-extrabold text-slate-900">{overall.percentage}%</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Total Hours Attended</span>
            <span className="text-2xl font-extrabold text-emerald-600">{overall.present} hrs</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Absences Recorded</span>
            <span className="text-2xl font-extrabold text-red-600">{overall.absent} hrs</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Approved On-Duty</span>
            <span className="text-2xl font-extrabold text-amber-600">{overall.od || 0} hrs</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Subject Breakdown & Recent Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Subject Performance Cards */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Course-Wise Attendance Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attendance.subjectStats?.map((sub, i) => (
              <Card key={i} className="p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{sub.subjectName}</h3>
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    sub.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {sub.percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 font-medium pt-1">
                  <span>Present: {sub.present} / {sub.total}</span>
                  <span>Absent: {sub.absent || 0}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Recent Hourly Log */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Recent Attendance Logs</h2>
          <Card className="rounded-2xl border border-slate-200 p-0 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {attendance.records?.slice(0, 8).map((rec, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {rec.subjectId?.name || 'Class Subject'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Hour {rec.hour} • {new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    rec.status === 'PRESENT'
                      ? 'bg-emerald-100 text-emerald-700'
                      : rec.status === 'ABSENT'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
