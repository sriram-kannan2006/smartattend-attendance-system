import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { attendanceService } from '@/services/attendanceService';
import { reportService } from '@/services/reportService';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  Calendar,
  BookOpen,
  Users,
  CheckCircle2,
  TrendingUp,
  Loader2,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function TeacherReports() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const loadReportsData = async () => {
      try {
        setLoading(true);
        const res = await attendanceService.getTeacherSessions();
        const list = res?.data?.data || res?.data || [];
        setSessions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReportsData();
  }, []);

  const handleDownloadSession = async (session) => {
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

  const totalClasses = sessions.length;
  const totalPresent = sessions.reduce((acc, s) => acc + (s.presentCount || 0), 0);
  const totalEnrolled = sessions.reduce((acc, s) => acc + (s.totalStudents || 61), 0);
  const avgAttendance = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Attendance Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Download official attendance spreadsheets (.xlsx), view subject-wise attendance analytics, and export student reports.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classes Conducted</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalClasses}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Recorded teaching sessions</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Attendance</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{avgAttendance}%</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Class Average Turnout</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Scans Verified</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalPresent}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">OpenCV Face + QR verified</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Available Session Reports */}
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Generated Session Workbooks (.xlsx)
          </div>
          <span className="text-xs text-slate-500">Official Kongu Engineering College Format</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 mt-2">Loading session reports...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No session reports generated yet</p>
            <p className="text-xs text-slate-400 mt-1">Complete attendance sessions to automatically generate Excel reports.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => {
              const present = s.presentCount || 0;
              const total = s.totalStudents || 61;
              const pct = total > 0 ? Math.round((present / total) * 100) : 0;

              return (
                <div
                  key={s._id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{s.subjectId?.name || 'Subject'} (Hour {s.hour})</h4>
                      <p className="text-xs text-slate-500">
                        {s.classId?.name || 'ECE III Year - Section D'} • {new Date(s.date).toLocaleDateString('en-IN')} • {present}/{total} Present ({pct}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleDownloadSession(s)}
                      disabled={downloadingId === s._id}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center gap-2"
                    >
                      {downloadingId === s._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>Download Spreadsheet</span>
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
