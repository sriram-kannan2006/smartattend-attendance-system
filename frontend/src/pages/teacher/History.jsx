import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import { reportService } from '@/services/reportService';
import { useToast } from '@/context/ToastContext';
import {
  ClipboardList,
  Calendar,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Loader2,
  Filter,
  Users
} from 'lucide-react';

export default function TeacherHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getTeacherSessions({ date: dateFilter || undefined });
      const data = res?.data?.data || res?.data || [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [dateFilter]);

  const handleDownloadExcel = async (session) => {
    try {
      setDownloadingId(session._id);
      showSuccess(`Generating Excel report for ${session.subjectId?.name || 'Session'}...`);
      const repRes = await reportService.generateReport(session._id);
      const reportId = repRes?.data?.data?.report?._id || repRes?.data?.report?._id;

      if (reportId) {
        const blobRes = await reportService.downloadReport(reportId);
        const url = window.URL.createObjectURL(new Blob([blobRes.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${session.classId?.name || 'Attendance'}_Hour_${session.hour}_Report.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showSuccess('Excel attendance report downloaded successfully!');
      } else {
        throw new Error('Report generation failed');
      }
    } catch (err) {
      showError(err.message || 'Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = sessions.filter((s) => {
    const query = searchQuery.toLowerCase();
    const subName = s.subjectId?.name?.toLowerCase() || '';
    const clsName = s.classId?.name?.toLowerCase() || '';
    const faculty = s.teacherId?.name?.toLowerCase() || '';
    return subName.includes(query) || clsName.includes(query) || faculty.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Attendance History & Archive
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical logs of all finalized attendance sessions, absentee lists, and Excel audit archives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchHistory}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by subject, faculty or class..."
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Filter Date:</span>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs h-9 w-[160px]"
              />
            </div>
            {dateFilter && (
              <Button
                variant="ghost"
                onClick={() => setDateFilter('')}
                className="text-xs text-blue-600 h-9 px-2"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* History Table */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Archived Sessions ({filtered.length})
          </span>
          <span className="text-xs text-slate-500">Sorted by most recent</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 mt-2">Loading attendance history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No attendance records found</p>
            <p className="text-xs text-slate-400 mt-1">Attendance records will appear here once sessions are finalized.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((s) => {
              const total = s.totalStudents || 61;
              const present = s.presentCount || 0;
              const absent = s.absentCount || 0;
              const od = s.odCount || 0;
              const pct = total > 0 ? Math.round((present / total) * 100) : 0;

              return (
                <div
                  key={s._id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 shrink-0 font-extrabold text-sm">
                      H{s.hour || 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{s.subjectId?.name || 'Subject'}</h4>
                        <Badge variant="outline" className="text-[10px] font-bold bg-slate-100 text-slate-600">
                          {s.subjectId?.code || 'EC200'}
                        </Badge>
                        <Badge className={`text-[10px] font-bold ${
                          pct >= 75 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {pct}% Turnout
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          {s.classId?.name || 'ECE III Year - Section D'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(s.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          Faculty: <strong>{s.teacherId?.name || 'Faculty'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <span className="text-emerald-700 font-bold">Present: {present}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-red-600 font-bold">Absent: {absent}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-600 font-bold">OD: {od}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">Total Enrolled: {total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/teacher/session/${s._id}`)}
                      className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      View Session
                    </Button>
                    <Button
                      onClick={() => handleDownloadExcel(s)}
                      disabled={downloadingId === s._id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      {downloadingId === s._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                      )}
                      <span>Export Excel</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
