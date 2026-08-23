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
  Camera,
  Play,
  CheckCircle2,
  Clock,
  Users,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Filter,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function TeacherAttendanceSessions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getTeacherSessions({ status: filterStatus });
      const data = res?.data?.data || res?.data || [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filterStatus]);

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

  const filteredSessions = sessions.filter((s) => {
    const query = searchQuery.toLowerCase();
    const subName = s.subjectId?.name?.toLowerCase() || '';
    const subCode = s.subjectId?.code?.toLowerCase() || '';
    const clsName = s.classId?.name?.toLowerCase() || '';
    const sId = s.sessionId?.toLowerCase() || '';
    return subName.includes(query) || subCode.includes(query) || clsName.includes(query) || sId.includes(query);
  });

  const activeCount = sessions.filter((s) => s.status === 'ACTIVE' || s.status === 'CREATED').length;
  const closedCount = sessions.filter((s) => s.status === 'CLOSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Camera className="h-6 w-6 text-blue-600" />
            Attendance Sessions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor active attendance sessions in real-time, view attendees, and download official session Excel workbooks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchSessions}
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => navigate('/teacher/classes')}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 text-xs font-semibold"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            Launch New Session
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sessions</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{sessions.length}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Active Live Sessions</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Play className="h-5 w-5 fill-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closed / Finalized</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{closedCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'ACTIVE', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === st
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Sessions' : st}
              </button>
            ))}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by subject, code, or class..."
              className="pl-9 text-xs h-9"
            />
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 mt-2">Loading attendance sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center">
            <Camera className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No attendance sessions found</p>
            <p className="text-xs text-slate-400 mt-1">Start a new attendance session from your schedule or today's classes.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSessions.map((session) => {
              const isActive = session.status === 'ACTIVE' || session.status === 'CREATED';
              const total = session.totalStudents || 61;
              const present = session.presentCount || 0;
              const absent = session.absentCount || 0;
              const od = session.odCount || 0;
              const pct = total > 0 ? Math.round((present / total) * 100) : 0;

              return (
                <div
                  key={session._id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border shrink-0 ${
                      isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}>
                      <span className="text-[10px] font-bold uppercase">Hour</span>
                      <span className="text-xl font-extrabold leading-none mt-0.5">{session.hour || 1}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-base">
                          {session.subjectId?.name || 'Subject'}
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-bold bg-slate-100 text-slate-600">
                          {session.subjectId?.code || 'EC200'}
                        </Badge>
                        <Badge className={`text-[10px] font-bold ${
                          isActive ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-white'
                        }`}>
                          {session.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          {session.classId?.name || 'ECE III Year - Section D'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(session.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          Faculty: <strong>{session.teacherId?.name || 'Faculty Member'}</strong>
                        </span>
                      </div>

                      {/* Attendance Stats Bar */}
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <span className="text-emerald-600 font-bold">Present: {present}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-red-600 font-bold">Absent: {absent}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-600 font-bold">OD: {od}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-700">Turnout: {pct}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <Button
                        onClick={() => navigate(`/teacher/session/${session._id}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" />
                        Live QR & Roster
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/teacher/session/${session._id}`)}
                          className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          View Roster
                        </Button>
                        <Button
                          onClick={() => handleDownloadExcel(session)}
                          disabled={downloadingId === session._id}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5"
                        >
                          {downloadingId === session._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          )}
                          <span>Excel</span>
                        </Button>
                      </>
                    )}
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
