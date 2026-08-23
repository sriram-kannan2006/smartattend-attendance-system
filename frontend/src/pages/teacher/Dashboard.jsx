import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { Users, Clock, CheckCircle2, Play, Calendar, Eye, FileSpreadsheet, Loader2, Sparkles, BookOpen, Layers, MapPin, ChevronRight, GraduationCap } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [startingClassId, setStartingClassId] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [selectedDayTab, setSelectedDayTab] = useState(new Date().getDay() === 0 ? 1 : new Date().getDay());
  const [activeView, setActiveView] = useState('today'); // 'today' | 'weekly'

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const [todayRes, allRes] = await Promise.all([
          api.get('/timetable/today').catch(() => ({ data: { data: [] } })),
          api.get('/timetable/all').catch(() => ({ data: { data: [] } })),
        ]);

        const todayList = todayRes?.data?.data || [];
        const allList = allRes?.data?.data || [];

        const formatItem = (item, idx) => ({
          id: item._id || String(idx + 1),
          subject: item.subjectId?.name || 'Subject',
          code: item.subjectId?.code || 'EC200',
          type: item.subjectId?.type || 'THEORY',
          classId: item.classId?._id || item.classId,
          className: item.classId?.name || 'ECE III Year - Section D',
          hour: item.hour || idx + 1,
          dayOfWeek: item.dayOfWeek || 1,
          time: item.startTime && item.endTime ? `${item.startTime} - ${item.endTime}` : '08:45 AM - 09:35 AM',
          teacherName: item.teacherId?.name || user?.name || 'Faculty',
          room: item.teacherId?.cabinNumber || 'ECE 004',
          totalStudents: 61,
          subjectId: item.subjectId?._id || item.subjectId,
        });

        setTodayClasses(todayList.map(formatItem));
        setAllClasses(allList.map(formatItem));
      } catch (err) {
        console.warn('Failed to load teacher timetable:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [user]);

  const handleStartAttendance = async (cls) => {
    try {
      setStartingClassId(cls.id);
      
      const payload = {
        classId: cls.classId,
        subjectId: cls.subjectId,
        hour: cls.hour,
        date: new Date().toISOString(),
      };

      const res = await attendanceService.createSession(payload);
      const data = res?.data?.data || res?.data || res;
      const sessionMongoId = data?.session?._id || data?.session?.id || data?.session?.sessionId;

      if (sessionMongoId) {
        showSuccess(`Dynamic QR session launched for ${cls.subject} (Hour ${cls.hour})!`);
        navigate(`/teacher/session/${sessionMongoId}`);
      } else {
        throw new Error('Session ID not returned');
      }
    } catch (err) {
      console.warn('Session start fallback:', err);
      try {
        const fallbackRes = await attendanceService.createSession({ hour: cls.hour });
        const fallbackData = fallbackRes?.data?.data || fallbackRes?.data || fallbackRes;
        const sId = fallbackData?.session?._id || cls.id;
        navigate(`/teacher/session/${sId}`);
      } catch (e2) {
        navigate(`/teacher/session/${cls.id}`);
      }
    } finally {
      setStartingClassId(null);
    }
  };

  const currentDisplayList = activeView === 'today' 
    ? todayClasses 
    : allClasses.filter(c => c.dayOfWeek === selectedDayTab);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
              ECE Faculty Portal
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Kongu Engineering College (Autonomous)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Welcome, {user?.name || 'Faculty Member'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            ECE III Year (Section D) • Timetable & Dynamic Attendance Management
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveView('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'today'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveView('weekly')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'weekly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly Timetable (Mon–Sat)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Target Class</span>
            <span className="text-xl font-extrabold text-slate-900">ECE III Year - Sec D</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-1">Enrolled Students</span>
            <span className="text-2xl font-extrabold text-emerald-600">61 Students</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Schedule Card */}
      <Card className="p-6 rounded-3xl border border-slate-200 shadow-xs bg-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {activeView === 'today' ? "Today's Teaching Periods" : "ECE-D Weekly Period Timetable"}
            </h2>
            <p className="text-xs text-slate-500">
              Select any scheduled period to launch a live QR attendance session with OpenCV face authentication
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Day Selector Tabs (for Weekly View) */}
        {activeView === 'weekly' && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            {[
              { day: 1, label: 'Monday (MON)' },
              { day: 2, label: 'Tuesday (TUE)' },
              { day: 3, label: 'Wednesday (WED)' },
              { day: 4, label: 'Thursday (THU)' },
              { day: 5, label: 'Friday (FRI)' },
              { day: 6, label: 'Saturday (SAT)' },
            ].map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDayTab(d.day)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedDayTab === d.day
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3">Period</th>
                  <th className="pb-3">Timing</th>
                  <th className="pb-3">Subject & Code</th>
                  <th className="pb-3">Class</th>
                  <th className="pb-3">Faculty / Location</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDisplayList.map((cls) => (
                  <tr key={cls.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-4 font-extrabold text-blue-600">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs">
                        Hour {cls.hour}
                      </span>
                    </td>
                    <td className="py-4 font-medium text-slate-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cls.time}</span>
                    </td>
                    <td className="py-4">
                      <span className="font-bold text-slate-900 block text-xs">{cls.subject}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                          {cls.code}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          • {cls.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-slate-700">{cls.className}</td>
                    <td className="py-4">
                      <span className="font-medium text-slate-800 block text-[11px]">{cls.teacherName}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {cls.room}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ready to Start
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStartAttendance(cls)}
                        isLoading={startingClassId === cls.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs text-xs px-3 py-1.5 cursor-pointer"
                      >
                        <Play className="w-3 h-3 mr-1" /> Put Attendance
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
