import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { Calendar, Clock, BookOpen, MapPin, Play, Loader2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

export default function TeacherClasses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [startingClassId, setStartingClassId] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const currentDayOfWeek = new Date().getDay() === 0 ? 1 : new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(currentDayOfWeek);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        const res = await api.get('/timetable/all').catch(() => ({ data: { data: [] } }));
        const list = res?.data?.data || [];

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

        setAllClasses(list.map(formatItem));
      } catch (err) {
        console.warn('Failed to load classes:', err);
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

  const dayClasses = allClasses
    .filter((c) => c.dayOfWeek === selectedDay)
    .sort((a, b) => a.hour - b.hour);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Class Schedule & Timetable
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View daily period allocations and start live attendance sessions for each teaching period.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5 font-semibold text-xs">
            {DAYS.find((d) => d.id === selectedDay)?.name} Schedule
          </Badge>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DAYS.map((day) => {
          const isToday = day.id === currentDayOfWeek;
          const isSelected = day.id === selectedDay;
          return (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{day.name}</span>
              {isToday && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'
                }`}>
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Classes List */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Scheduled Periods ({dayClasses.length} Periods)
          </div>
          <span className="text-xs text-slate-500">
            Click "Put Attendance" to generate real-time dynamic QR with OpenCV face verification
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 mt-2">Loading timetable schedule...</p>
          </div>
        ) : dayClasses.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No scheduled periods for {DAYS.find((d) => d.id === selectedDay)?.name}</p>
            <p className="text-xs text-slate-400 mt-1">Check other days or view the complete weekly timetable.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {dayClasses.map((cls) => (
              <div
                key={cls.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 shrink-0">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-tight">Hour</span>
                    <span className="text-xl font-extrabold text-blue-700 leading-none mt-0.5">{cls.hour}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                        {cls.subject}
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-bold bg-slate-100 text-slate-600 border-slate-200">
                        {cls.code}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200">
                        {cls.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {cls.time}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {cls.className}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        Faculty: <strong className="text-slate-800">{cls.teacherName}</strong> ({cls.room})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    onClick={() => handleStartAttendance(cls)}
                    disabled={startingClassId === cls.id}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
                  >
                    {startingClassId === cls.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Launching...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        <span>Put Attendance</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
