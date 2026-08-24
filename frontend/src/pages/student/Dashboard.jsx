import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import api from '@/services/api';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Camera, Calendar, Clock, BookOpen, AlertCircle, FileText, CheckCircle2, ArrowRight, ShieldCheck, Loader2, UserCheck, Sparkles, MapPin } from 'lucide-react';

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    overall: { percentage: 92, present: 36, absent: 3, od: 1, totalClasses: 40 },
    subjectStats: [],
    records: [],
  });

  const studentProfile = user?.profile || user?.student || {};
  const rollNumber = studentProfile?.registerNumber || user?.registerNumber || '';
  const className = studentProfile?.classId?.name || 'ECE III Year - Section D';
  const isFaceRegistered = user?.faceRegistered === true || studentProfile?.faceRegistered === true;

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await attendanceService.getStudentAttendance();
        const data = res?.data?.data || res?.data || res;
        if (data && data.overall) {
          setAttendanceData(data);
        }
      } catch (err) {
        console.warn('Student dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSchedule = async () => {
      try {
        setScheduleLoading(true);
        const res = await api.get('/timetable/today');
        const list = res?.data?.data || [];
        if (list.length > 0) {
          setTodaySchedule(list.map((item, idx) => ({
            hour: item.hour || idx + 1,
            subject: item.subjectId?.name || 'Subject',
            code: item.subjectId?.code || '24ECT51',
            type: item.subjectId?.type || 'THEORY',
            time: item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : '08:45 AM - 09:35 AM',
            teacher: item.teacherId?.name || 'Faculty Member',
            room: item.teacherId?.cabinNumber || 'ECE 004',
          })));
        } else {
          // Fallback official schedule for ECE-D
          setTodaySchedule([
            { hour: 1, subject: 'Digital Signal Processing', code: '24ECT51', time: '08:45 - 09:35 AM', teacher: 'Ms. N. Indhumathi', room: 'ECE 004' },
            { hour: 2, subject: 'Analog and Digital Communication', code: '24ECT52', time: '09:35 - 10:25 AM', teacher: 'Ms. M. Ponkarthika', room: 'ECE 004' },
            { hour: 3, subject: 'Control Engineering', code: '24ECT53', time: '10:45 - 11:35 AM', teacher: 'Ms. P. Pavithara', room: 'ECE 004' },
            { hour: 4, subject: 'Computer Organization and Architecture', code: '24ECT54', time: '11:35 - 12:25 PM', teacher: 'Dr. S. Maheswaran', room: 'ECE 004' },
          ]);
        }
      } catch (err) {
        console.warn('Student schedule load error:', err);
      } finally {
        setScheduleLoading(false);
      }
    };

    fetchDashboard();
    fetchSchedule();
  }, []);

  const overall = attendanceData.overall || { percentage: 92, present: 36, absent: 3, od: 1, totalClasses: 40 };
  const chartData = [
    { name: 'Present', value: overall.percentage, color: '#2563EB' },
    { name: 'Absent', value: Math.max(0, 100 - overall.percentage), color: '#E2E8F0' },
  ];

  if (authLoading && !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Student Records...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Quick Check-in CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
              KEC Student Portal
            </span>
            <span className="text-xs text-blue-200 font-medium">
              Kongu Engineering College (Autonomous)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Student'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-blue-100 font-medium">
            <span className="bg-white/25 px-2.5 py-1 rounded-lg font-mono font-bold text-white">
              Roll No: {rollNumber}
            </span>
            <span>•</span>
            <span className="font-semibold">{className}</span>
            <span>•</span>
            <span>Section D</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {!isFaceRegistered && (
            <Button
              size="lg"
              onClick={() => navigate('/student/face-registration')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-3.5 rounded-2xl shadow-md flex items-center gap-2 transition"
            >
              <UserCheck className="w-5 h-5" />
              <span>Enroll Face Biometric</span>
            </Button>
          )}

          <Button
            size="lg"
            onClick={() => navigate('/student/mark-attendance')}
            className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3.5 rounded-2xl shadow-md flex items-center gap-2.5 transition transform hover:scale-105"
          >
            <Camera className="w-5 h-5 text-blue-600" />
            <span>Mark Attendance</span>
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </Button>
        </div>
      </div>

      {/* Face Status Notice */}
      {!isFaceRegistered && (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="block font-bold">One-Time Face Registration Pending</strong>
              Please register your face once to enable attendance scanning.
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/student/face-registration')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0"
          >
            Register Now
          </Button>
        </div>
      )}

      {/* KPI Cards & Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Circular Gauge */}
        <Card className="md:col-span-4 p-6 rounded-3xl border border-slate-200 flex flex-col items-center justify-center bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Attendance</span>
          <div className="h-44 w-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={62}
                  outerRadius={78}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-slate-900">{overall.percentage}%</span>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                overall.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {overall.percentage >= 75 ? 'Good Standing' : 'Low Attendance'}
              </span>
            </div>
          </div>
          <div className="flex justify-between w-full max-w-[200px] text-xs text-slate-500 mt-2 font-medium">
            <span>Present: <strong>{overall.present}</strong></span>
            <span>Absent: <strong className="text-red-600">{overall.absent}</strong></span>
            <span>OD: <strong className="text-amber-600">{overall.od || 0}</strong></span>
          </div>
        </Card>

        {/* Schedule & Quick Stats */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Today's Teaching Periods (ECE-D)
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {scheduleLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {todaySchedule.map((item) => (
                <div
                  key={item.hour}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-xs transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                      Hour {item.hour}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" /> {item.time}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{item.subject}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 rounded font-bold">
                        {item.code}
                      </span>
                      <span>•</span>
                      <span>{item.teacher}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {item.room}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
