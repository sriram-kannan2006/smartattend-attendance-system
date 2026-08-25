import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import QRDisplay from '@/components/QRDisplay/QRDisplay';
import { attendanceService } from '@/services/attendanceService';
import { reportService } from '@/services/reportService';
import api from '@/services/api';
import { useSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  FileSpreadsheet, 
  PowerOff, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Clock,
  ShieldCheck,
  Search,
  Check,
  X,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Info
} from 'lucide-react';

const EXCEPTION_REASONS = [
  'Restroom / Permission',
  'Met Staff / Professor',
  'On Duty (OD) / College Event',
  'Late Permission',
  'Mobile Camera / Network Issue',
  'Special Faculty Approval',
];

export default function AttendanceSession() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { socket } = useSocket();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [students, setStudents] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeResult, setCloseResult] = useState(null);

  // Manual marking state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNMARKED' | 'PRESENT' | 'OD'
  const [markingStudentId, setMarkingStudentId] = useState(null);
  const [selectedExceptionStudent, setSelectedExceptionStudent] = useState(null);
  const [selectedReason, setSelectedReason] = useState(EXCEPTION_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getSession(sessionId);
      const data = res?.data?.data || res?.data || res;
      
      if (data?.session) {
        setSession(data.session);
        setAttendees(data.records || data.attendance || []);
        if (data.students && data.students.length > 0) {
          setStudents(data.students);
        }
        if (data.session.status === 'CLOSED') {
          setIsClosed(true);
        }
      }
    } catch (err) {
      console.warn('Session load fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  // Real-time student check-in updates via Socket.IO
  useEffect(() => {
    if (socket && sessionId) {
      socket.emit('session:join', sessionId);
      if (session?._id && session._id !== sessionId) {
        socket.emit('session:join', session._id);
      }
      if (session?.sessionId && session.sessionId !== sessionId) {
        socket.emit('session:join', session.sessionId);
      }

      const handleAttendanceMarked = (data) => {
        if (!data?.studentName && !data?.registerNumber) return;
        setAttendees((prev) => [
          {
            _id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            studentId: {
              _id: data.studentId || data._id,
              name: data.studentName,
              registerNumber: data.registerNumber,
            },
            status: data.status || 'PRESENT',
            correctionReason: data.reason,
            scannedAt: data.timestamp || new Date(),
          },
          ...prev.filter(a => a.studentId?.registerNumber !== data.registerNumber),
        ]);
        showSuccess(`${data.studentName} (${data.registerNumber}) marked ${data.status}!`);
      };

      socket.on('attendance:marked', handleAttendanceMarked);
      socket.on('attendance:update', handleAttendanceMarked);

      return () => {
        socket.off('attendance:marked', handleAttendanceMarked);
        socket.off('attendance:update', handleAttendanceMarked);
        socket.emit('session:leave', sessionId);
      };
    }
  }, [socket, sessionId, session?._id, session?.sessionId, showSuccess]);

  // Seamless Background Live Poll (Every 2.5s while session is active)
  useEffect(() => {
    if (!sessionId || isClosed) return;

    const interval = setInterval(async () => {
      try {
        const res = await attendanceService.getSession(sessionId);
        const data = res?.data?.data || res?.data || res;
        if (data?.session) {
          setSession((prev) => ({ ...prev, ...data.session }));
          if (data.records || data.attendance) {
            setAttendees(data.records || data.attendance);
          }
          if (data.session.status === 'CLOSED') {
            setIsClosed(true);
          }
        }
      } catch (e) {
        // silent background sync
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [sessionId, isClosed]);

  // Map of studentId -> attendance record
  const attendanceMap = useMemo(() => {
    const map = new Map();
    attendees.forEach((att) => {
      const sId = att.studentId?._id || att.studentId;
      const reg = att.studentId?.registerNumber;
      if (sId) map.set(String(sId), att);
      if (reg) map.set(String(reg), att);
    });
    return map;
  }, [attendees]);

  // Handle staff manual attendance marking (Single Click)
  const handleQuickMark = async (student, targetStatus, reason = '') => {
    try {
      setMarkingStudentId(student._id);
      const res = await attendanceService.manualMark(sessionId, {
        studentId: student._id,
        status: targetStatus,
        reason: reason || (targetStatus === 'PRESENT' ? 'Staff Manual Check' : targetStatus),
      });

      const updatedData = res?.data?.data || res?.data || res;
      
      // Update local state immediately
      setAttendees((prev) => [
        {
          _id: updatedData.record?._id || `manual_${Date.now()}`,
          studentId: {
            _id: student._id,
            name: student.name,
            registerNumber: student.registerNumber,
          },
          status: targetStatus,
          correctionReason: reason || 'Staff Manual Check',
          scannedAt: new Date(),
        },
        ...prev.filter(a => (a.studentId?._id || a.studentId) !== student._id && a.studentId?.registerNumber !== student.registerNumber),
      ]);

      showSuccess(`Marked ${student.name} as ${targetStatus}${reason ? ` (${reason})` : ''}`);
    } catch (err) {
      console.error('Manual mark error:', err);
      showError(err.response?.data?.message || 'Failed to update attendance');
    } finally {
      setMarkingStudentId(null);
    }
  };

  // Submit modal exception marking
  const handleSaveException = async () => {
    if (!selectedExceptionStudent) return;
    const finalReason = customReason.trim() || selectedReason;
    await handleQuickMark(selectedExceptionStudent, 'PRESENT', finalReason);
    setSelectedExceptionStudent(null);
    setCustomReason('');
  };

  const handleCloseSession = async () => {
    try {
      setIsClosing(true);
      setShowCloseModal(false);
      setIsClosed(true);
      showSuccess('Finalizing attendance session & emailing Excel report...');

      const res = await attendanceService.closeSession(sessionId);
      const data = res?.data?.data || res?.data || res;
      setCloseResult(data);
      showSuccess('Attendance session finalized & official Excel report emailed successfully!');
    } catch (err) {
      console.error('Failed to close session:', err);
      showError(err.response?.data?.message || 'Error finalizing session. Please try again.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);
      const token = localStorage.getItem('token');
      
      // Request Excel workbook from backend
      const response = await api.get(`/reports/generate/${sessionId}`, { responseType: 'blob' });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const classText = (session?.classId?.name || 'ECE-III-D').replace(/\s+/g, '_');
      const subjectText = (session?.subjectId?.name || 'Subject').replace(/\s+/g, '_');
      a.download = `KEC_Attendance_${classText}_${subjectText}_Hour${session?.hour || 1}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Official KEC 4-Sheet Attendance Workbook downloaded successfully!');
    } catch (err) {
      console.warn('Direct blob download fallback:', err);
      const token = localStorage.getItem('token');
      window.open(`/api/reports/generate/${sessionId}?token=${token}`, '_blank');
      showSuccess('Attendance workbook export started!');
    } finally {
      setIsDownloading(false);
    }
  };

  // Filtered roster of students for manual marking
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchQuery = 
        st.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.registerNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchQuery) return false;

      const record = attendanceMap.get(String(st._id)) || attendanceMap.get(String(st.registerNumber));
      const status = record ? record.status : 'UNMARKED';

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'UNMARKED') return status === 'UNMARKED' || status === 'ABSENT';
      if (statusFilter === 'PRESENT') return status === 'PRESENT';
      if (statusFilter === 'OD') return status === 'OD';
      return true;
    });
  }, [students, searchQuery, statusFilter, attendanceMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading attendance session & class roster...</p>
        </div>
      </div>
    );
  }

  const presentCount = attendees.filter(a => a.status === 'PRESENT').length;
  const odCount = attendees.filter(a => a.status === 'OD').length;
  const totalStudents = students.length > 0 ? students.length : (session?.totalStudents || 61);
  const pendingCount = Math.max(0, totalStudents - presentCount - odCount);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/teacher')}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Timetable
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                ECE III Year - Section D
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Session ID: {session?.sessionId || sessionId}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {session?.subjectId?.name || 'Digital Signal Processing'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Period: Hour {session?.hour || 1} • {session?.subjectId?.code || '24ECT51'} • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isClosed ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCloseModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
            >
              <PowerOff className="w-4 h-4 mr-1.5" /> Close & Finalize Session
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadExcel}
              isLoading={isDownloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Download Excel Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Projector QR + Live Scanned List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Projector Mode Dynamic QR Display */}
        <div className="lg:col-span-7">
          <QRDisplay sessionId={sessionId} sessionDetails={session} />
        </div>

        {/* Right Column: Real-Time Attendance Statistics */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 rounded-3xl border border-slate-200 shadow-xs bg-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Attendance Overview
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                {presentCount} / {totalStudents} ({Math.round((presentCount / totalStudents) * 100)}%)
              </span>
            </div>

            {/* Attendance breakdown pills */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-600 font-bold block uppercase">Present</span>
                <span className="text-xl font-extrabold text-emerald-800">{presentCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                <span className="text-[10px] text-blue-600 font-bold block uppercase">On-Duty (OD)</span>
                <span className="text-xl font-extrabold text-blue-800">{odCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-bold block uppercase">{isClosed ? 'Absent' : 'Pending'}</span>
                <span className="text-xl font-extrabold text-slate-700">{pendingCount}</span>
              </div>
            </div>

            {/* Live Scanned Feed */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">Live Scanned Feed (Latest)</span>
              <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1 divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                {attendees.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 space-y-1">
                    <Clock className="w-6 h-6 mx-auto text-slate-300 animate-pulse" />
                    <p className="text-xs">Waiting for student check-ins...</p>
                  </div>
                ) : (
                  attendees.slice(0, 15).map((att, idx) => (
                    <div
                      key={att._id || idx}
                      className="pt-2 pb-1 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                          {att.studentId?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-[11px]">{att.studentId?.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{att.studentId?.registerNumber}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                          {att.status}
                        </span>
                        {att.correctionReason && (
                          <span className="text-[8px] text-amber-600 block mt-0.5 italic">
                            {att.correctionReason}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: STAFF MANUAL ATTENDANCE & SPECIAL EXCEPTIONS (BELOW QR)          */}
      {/* ========================================================================= */}
      <Card className="p-6 rounded-3xl border border-slate-200 shadow-sm bg-white space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Staff Attendance Controls & Exceptions
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              ECE-D Class Student Roster (All {totalStudents} Students)
            </h2>
            <p className="text-xs text-slate-500">
              Staff can manually tick students for exceptions: <strong>Restroom, Met Staff/Professor, On-Duty (OD), or Camera/Network Issues</strong>
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('UNMARKED')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'UNMARKED' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Not Scanned ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PRESENT')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'PRESENT' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Present ({presentCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OD')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                statusFilter === 'OD' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              On-Duty ({odCount})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by name or register number (e.g. 177, Saran, Vishnu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>
          {searchQuery && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="text-xs rounded-xl"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Interactive Student Roster Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Reg No</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Verification Mode / Note</th>
                <th className="py-3 px-4 text-right">Staff Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No students match the search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const record = attendanceMap.get(String(st._id)) || attendanceMap.get(String(st.registerNumber));
                  const isPresent = record?.status === 'PRESENT';
                  const isOD = record?.status === 'OD';
                  const isMarking = markingStudentId === st._id;

                  return (
                    <tr
                      key={st._id || st.registerNumber}
                      className={`transition ${
                        isPresent
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                          : isOD
                          ? 'bg-blue-50/30 hover:bg-blue-50/60'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Register Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {st.registerNumber}
                      </td>

                      {/* Student Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isPresent 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : isOD 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {st.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{st.name}</span>
                            <span className="text-[10px] text-slate-400">{st.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-700" /> PRESENT
                          </span>
                        ) : isOD ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            ON-DUTY (OD)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            NOT SCANNED
                          </span>
                        )}
                      </td>

                      {/* Verification / Exception Note */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {record ? (
                          <div>
                            <span className="font-medium text-slate-700 block">
                              {record.correctionReason ? record.correctionReason : 'Face & Dynamic QR Scanned'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {new Date(record.scannedAt || record.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Awaiting face & QR scan</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Quick Mark Present Button */}
                          <button
                            type="button"
                            disabled={isMarking || isClosed}
                            onClick={() => handleQuickMark(st, 'PRESENT', 'Staff Verified In-Person')}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                              isPresent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                            title="Directly mark present"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isPresent ? 'Present' : 'Mark Present'}</span>
                          </button>

                          {/* 2. Mark with Exception / Reason Modal Button */}
                          <button
                            type="button"
                            disabled={isMarking || isClosed}
                            onClick={() => {
                              setSelectedExceptionStudent(st);
                              setSelectedReason(EXCEPTION_REASONS[0]);
                              setCustomReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition flex items-center gap-1 cursor-pointer"
                            title="Mark with Exception (Restroom, Met Staff, etc.)"
                          >
                            <span>Exception</span>
                            <ChevronDown className="w-3 h-3 text-amber-600" />
                          </button>

                          {/* 3. Mark On-Duty (OD) */}
                          <button
                            type="button"
                            disabled={isMarking || isClosed}
                            onClick={() => handleQuickMark(st, 'OD', 'Staff Approved OD')}
                            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                              isOD
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            }`}
                            title="Mark On-Duty"
                          >
                            OD
                          </button>

                          {/* 4. Reset / Mark Absent */}
                          {record && (
                            <button
                              type="button"
                              disabled={isMarking || isClosed}
                              onClick={() => handleQuickMark(st, 'ABSENT', 'Staff marked Absent')}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Reset / Mark Absent"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Staff Exception Dialog */}
      <Modal
        open={!!selectedExceptionStudent}
        onClose={() => setSelectedExceptionStudent(null)}
        title="Staff Exception & Permission Marking"
        size="md"
      >
        {selectedExceptionStudent && (
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 text-blue-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">
                  Mark Attendance for {selectedExceptionStudent.name} ({selectedExceptionStudent.registerNumber})
                </strong>
                Select the reason for exception so it is permanently recorded in the attendance audit log.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Select Exception Reason:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXCEPTION_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedReason(r);
                      setCustomReason('');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition cursor-pointer ${
                      selectedReason === r && !customReason
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 block">Or Custom Note (Optional):</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Sent for department lab setup..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedExceptionStudent(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveException}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Mark Present with Exception
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Close Session Confirmation Modal */}
      <Modal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Finalize Attendance Session"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Automatic Absence Calculation</strong>
              Closing this session will mark all remaining unverified students ({pendingCount}) as <strong>ABSENT</strong> in the database and generate the official Kongu Engineering College Excel report.
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 font-bold block">Present</span>
              <span className="text-xl font-extrabold text-emerald-900">{presentCount}</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-blue-700 font-bold block">On-Duty</span>
              <span className="text-xl font-extrabold text-blue-900">{odCount}</span>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <span className="text-red-700 font-bold block">Will be Marked Absent</span>
              <span className="text-xl font-extrabold text-red-900">
                {pendingCount}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloseModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCloseSession}
              isLoading={isClosing}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Confirm & Finalize
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
