import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { attendanceService } from '@/services/attendanceService';
import { useToast } from '@/context/ToastContext';
import { BookOpen, AlertCircle, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react';

export default function SubjectAttendance() {
  const [subjectStats, setSubjectStats] = useState([]);
  const [overall, setOverall] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getStudentAttendance();
      const data = res?.data?.data || res?.data || res;
      setSubjectStats(data.subjectStats || []);
      setOverall(data.overall || null);
    } catch (err) {
      console.error('Failed to load subject stats:', err);
      showError('Failed to load subject attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subject Attendance</h1>
          <p className="text-sm text-slate-500">Monitor course-specific attendance thresholds and percentages</p>
        </div>

        {overall && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Cumulative Rate:</span>
            <span
              className={`text-lg font-extrabold ${
                overall.percentage >= 75
                  ? 'text-emerald-600'
                  : overall.percentage >= 60
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}
            >
              {overall.percentage}%
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : subjectStats.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Subject Data</h3>
          <p className="text-xs text-slate-400 mt-1">Attendance statistics will appear once sessions are marked.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjectStats.map((sub) => {
            const isLow = sub.percentage < 75;
            return (
              <Card
                key={sub.subjectId || sub.subjectName}
                className="p-6 rounded-3xl border border-slate-200 flex flex-col justify-between space-y-5 hover:shadow-md transition"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {sub.subjectCode || 'SUB'}
                    </span>
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        sub.percentage >= 75
                          ? 'bg-emerald-100 text-emerald-700'
                          : sub.percentage >= 60
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {sub.percentage}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                    {sub.subjectName}
                  </h3>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sub.percentage >= 75
                          ? 'bg-emerald-500'
                          : sub.percentage >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                      <span className="text-xs font-bold text-slate-700">{sub.total}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Present</span>
                      <span className="text-xs font-bold text-emerald-600">{sub.present}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-red-600 uppercase font-semibold block">Absent</span>
                      <span className="text-xs font-bold text-red-600">{sub.absent}</span>
                    </div>
                  </div>
                </div>

                {isLow && (
                  <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Below 75% institutional requirement</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
