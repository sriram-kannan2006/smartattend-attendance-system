import React, { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { Maximize, Minimize, Users, Clock, Loader2, Sparkles, RefreshCw, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { attendanceService } from '@/services/attendanceService';
import { Card } from '@/components/ui/Card';

const QRDisplay = ({ sessionId, sessionDetails, isClosed = false }) => {
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stats, setStats] = useState({ present: 0, total: 61, od: 0, absent: 0 });
  const [currentSession, setCurrentSession] = useState(sessionDetails || null);
  const [sessionClosedState, setSessionClosedState] = useState(isClosed);
  
  const isMountedRef = useRef(true);
  const timerRef = useRef(null);
  
  const { socket } = useSocket();

  const isActuallyClosed = sessionClosedState || isClosed || currentSession?.status === 'CLOSED' || sessionDetails?.status === 'CLOSED';

  // Sync prop changes
  useEffect(() => {
    if (isClosed) {
      setSessionClosedState(true);
    }
  }, [isClosed]);

  useEffect(() => {
    if (sessionDetails?.status === 'CLOSED') {
      setSessionClosedState(true);
    }
    if (sessionDetails) {
      setCurrentSession(sessionDetails);
    }
  }, [sessionDetails]);

  const fetchQR = useCallback(async () => {
    if (!sessionId || isActuallyClosed) return;
    try {
      setLoading(true);
      const res = await attendanceService.getSessionQR(sessionId);
      const data = res?.data?.data || res?.data || res;
      
      if (data?.session?.status === 'CLOSED') {
        setSessionClosedState(true);
        setQrImageUrl(null);
        return;
      }

      if (data?.qrImage) {
        setQrImageUrl(data.qrImage);
      } else {
        const token = data?.token || `qr_token_${Date.now()}`;
        const qrPayload = JSON.stringify({
          sessionId: sessionId,
          token: token,
          sid: data?.session?.sessionId || sessionId,
        });
        const url = await QRCode.toDataURL(qrPayload, {
          width: 400,
          margin: 2,
          color: { dark: '#000000', light: '#FFFFFF' },
          errorCorrectionLevel: 'M',
        });
        setQrImageUrl(url);
      }

      if (data?.session) {
        setCurrentSession(data.session);
        setStats({
          present: data.session.presentCount || 0,
          total: data.session.totalStudents || 61,
          od: data.session.odCount || 0,
          absent: data.session.absentCount || 0,
        });
      }
      setTimeLeft(10);
    } catch (error) {
      if (isActuallyClosed) return;
      console.warn('QR fetch fallback to client-side generator:', error);
      const fallbackToken = `token_${Date.now()}`;
      const qrPayload = JSON.stringify({
        sessionId: sessionId,
        token: fallbackToken,
        sid: sessionId,
      });
      QRCode.toDataURL(qrPayload, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      }).then((url) => {
        if (isMountedRef.current && !isActuallyClosed) setQrImageUrl(url);
      });
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [sessionId, isActuallyClosed]);

  const rotateQR = useCallback(async () => {
    if (!sessionId || isActuallyClosed) return;
    try {
      const res = await attendanceService.rotateQR(sessionId);
      const data = res?.data?.data || res?.data || res;
      
      if (data?.session?.status === 'CLOSED') {
        setSessionClosedState(true);
        setQrImageUrl(null);
        return;
      }

      const token = data?.token || `qr_${Date.now()}`;
      const qrPayload = JSON.stringify({
        sessionId: sessionId,
        token: token,
        sid: data?.sessionId || sessionId,
      });
      const url = await QRCode.toDataURL(qrPayload, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
      if (isMountedRef.current && !isActuallyClosed) setQrImageUrl(url);
      setTimeLeft(10);
    } catch (error) {
      if (isActuallyClosed) return;
      console.warn('QR rotation fallback:', error);
      const fallbackToken = `rot_${Date.now()}`;
      const qrPayload = JSON.stringify({ sessionId, token: fallbackToken, sid: sessionId });
      QRCode.toDataURL(qrPayload, { width: 400, margin: 2 }).then((url) => {
        if (isMountedRef.current && !isActuallyClosed) setQrImageUrl(url);
      });
      setTimeLeft(10);
    }
  }, [sessionId, isActuallyClosed]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!isActuallyClosed) {
      fetchQR();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchQR, isActuallyClosed]);

  // 10s countdown timer and auto-rotation — STOPS COMPLETELY WHEN CLOSED
  useEffect(() => {
    if (isActuallyClosed) {
      if (timerRef.current) clearInterval(timerRef.current);
      setQrImageUrl(null);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          rotateQR();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rotateQR, isActuallyClosed]);

  // Real-time Socket.IO listener for live student scans and session closure
  useEffect(() => {
    if (!socket || !sessionId) return;

    socket.emit('session:join', sessionId);

    const handleAttendanceMarked = (data) => {
      setStats((prev) => ({
        ...prev,
        present: data.presentCount !== undefined ? data.presentCount : prev.present + 1,
      }));
    };

    const handleSessionClosed = (data) => {
      setSessionClosedState(true);
      setQrImageUrl(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (data?.stats) {
        setStats(data.stats);
      }
    };

    socket.on('attendance:marked', handleAttendanceMarked);
    socket.on('session:closed', handleSessionClosed);

    return () => {
      socket.emit('session:leave', sessionId);
      socket.off('attendance:marked', handleAttendanceMarked);
      socket.off('session:closed', handleSessionClosed);
    };
  }, [socket, sessionId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const subjectName = currentSession?.subjectName || sessionDetails?.subjectId?.name || sessionDetails?.subjectName || 'Digital Electronics';
  const className = currentSession?.className || sessionDetails?.classId?.name || sessionDetails?.className || 'ECE II Year';
  const hour = currentSession?.hour || sessionDetails?.hour || 1;

  return (
    <div
      className={`flex flex-col items-center justify-between p-6 sm:p-8 bg-slate-950 text-white shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : 'w-full h-full rounded-3xl border border-slate-800 min-h-[560px]'
      }`}
    >
      {/* Top Header */}
      <div className="flex w-full justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="h-14 w-28 bg-white p-1.5 rounded-2xl flex items-center justify-center shadow-md">
            <img src="/kec-logo.png" alt="KEC Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                KONGU ENGINEERING COLLEGE (AUTONOMOUS)
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                isActuallyClosed ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {isActuallyClosed ? 'Session Finalized' : 'SmartAttend Live'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {subjectName}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {className} • Hour {hour} • {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-slate-800/80 rounded-2xl hover:bg-slate-700 transition border border-slate-700 text-slate-200 shrink-0"
          title={isFullscreen ? 'Exit Fullscreen' : 'Projector Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

      {/* QR Centerpiece or Locked Status */}
      <div className="relative my-auto flex flex-col items-center w-full max-w-md py-4">
        {isActuallyClosed ? (
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-4 w-full animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Attendance Finalized</h2>
              <p className="text-xs text-slate-400 mt-1">
                This attendance session is locked and finalized in the database.
              </p>
            </div>
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> QR Code Disabled & Closed
              </div>
              <p className="text-[11px] text-slate-400">
                Official Excel report has been generated and dispatched via email.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-3xl shadow-2xl relative border-4 border-slate-800">
            {qrImageUrl ? (
              <img
                src={qrImageUrl}
                alt="Dynamic Attendance QR"
                className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-xl"
              />
            ) : (
              <div className="w-64 h-64 sm:w-80 sm:h-80 bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
            )}

            {/* Refresh Countdown Badge */}
            <div className="absolute -top-4 -right-4 bg-blue-600 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold shadow-lg border-4 border-slate-950">
              <span className="text-lg leading-none">{timeLeft}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-90">sec</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Stats Bar */}
      <div className="w-full max-w-2xl grid grid-cols-3 gap-4 mt-6">
        <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-center">
          <span className="text-xs text-slate-400 block mb-1">Total Enrolled</span>
          <span className="text-2xl font-extrabold text-white">{stats.total || 61}</span>
        </div>
        <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-800/40 text-center">
          <span className="text-xs text-emerald-400 block mb-1">Present</span>
          <span className="text-2xl font-extrabold text-emerald-400">{stats.present}</span>
        </div>
        <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-800/40 text-center">
          <span className="text-xs text-blue-400 block mb-1">Approved OD</span>
          <span className="text-2xl font-extrabold text-blue-400">{stats.od}</span>
        </div>
      </div>
    </div>
  );
};

export default QRDisplay;
