import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QRScanner from '@/components/QRScanner/QRScanner';
import { Button } from '@/components/ui/Button';
import { attendanceService } from '@/services/attendanceService';
import FaceVerification from '@/components/FaceCamera/FaceVerification';
import { useToast } from '@/context/ToastContext';

const steps = {
  START: 'START',
  FACE_VERIFY: 'FACE_VERIFY',
  TRANSITION: 'TRANSITION',
  QR_SCAN: 'QR_SCAN',
  SUBMITTING: 'SUBMITTING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

const MarkAttendance = () => {
  const [currentStep, setCurrentStep] = useState(steps.START);
  const [authData, setAuthData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const handleStart = () => setCurrentStep(steps.FACE_VERIFY);

  const handleFaceVerified = (authId, expiresAt) => {
    const cleanId = typeof authId === 'object' && authId !== null ? authId.authenticationId || authId.id : authId;
    setAuthData({ authenticationId: cleanId, expiresAt });
    setCurrentStep(steps.TRANSITION);
    setTimeout(() => {
      setCurrentStep(steps.QR_SCAN);
    }, 1400);
  };

  const handleFaceError = (error) => {
    setErrorMsg(typeof error === 'string' ? error : error?.message || 'Face verification failed');
    setCurrentStep(steps.ERROR);
  };

  const handleQRScanned = async (rawQr) => {
    try {
      setCurrentStep(steps.SUBMITTING);

      let parsed = rawQr;
      if (typeof rawQr === 'string') {
        try {
          parsed = JSON.parse(rawQr);
        } catch (e) {
          parsed = { sessionId: rawQr, token: rawQr };
        }
      }

      const payload = {
        sessionId: parsed.sessionId || parsed.sid,
        qrToken: parsed.token || parsed.currentQrToken || rawQr,
        faceAuthId: authData?.authenticationId || authData,
      };

      const res = await attendanceService.scanAttendance(payload);
      const data = res?.data?.data || res?.data || res;
      setAttendanceData(data);
      setCurrentStep(steps.SUCCESS);
      showSuccess(`Attendance marked as ${data.status || 'PRESENT'}!`);
    } catch (error) {
      console.error('Scan attendance error:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to mark attendance. QR token or face authorization may be expired.');
      setCurrentStep(steps.ERROR);
      showError(error.response?.data?.message || 'Attendance validation failed');
    }
  };

  const handleQRError = (error) => {
    console.warn('QR scan error:', error);
  };

  const resetFlow = () => {
    setCurrentStep(steps.START);
    setAuthData(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden relative min-h-[540px] flex flex-col border border-slate-100">
        {/* Header with back button & KEC branding */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <button
            onClick={() => navigate('/student')}
            className="text-slate-400 hover:text-slate-700 transition p-1 -ml-1 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/kec-logo.png" alt="KEC Logo" className="h-6 w-auto object-contain" />
            <h1 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">
              SmartAttend • KEC Check-in
            </h1>
          </div>
          <div className="w-5" />
        </div>

        {/* Step indicator bar */}
        <div className="h-1 w-full bg-slate-100 flex">
          <div className={`h-full transition-all duration-500 bg-blue-600 ${
            currentStep === steps.START ? 'w-1/5' :
            currentStep === steps.FACE_VERIFY ? 'w-2/5' :
            currentStep === steps.TRANSITION ? 'w-3/5' :
            currentStep === steps.QR_SCAN ? 'w-4/5' : 'w-full'
          }`} />
        </div>

        <div className="flex-1 relative flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {/* SCREEN 1: START */}
            {currentStep === steps.START && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center text-center space-y-6 w-full"
              >
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center ring-8 ring-blue-50/50 shadow-inner">
                  <Camera className="w-12 h-12" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Dual-Factor Verification</h2>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto leading-relaxed">
                    Anti-Proxy Attendance requires <strong>Live Face Authentication</strong> followed by <strong>Dynamic QR Scan</strong>.
                  </p>
                </div>

                <div className="w-full bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                    <span>Front Camera: Face Verification & Liveness</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px]">2</span>
                    <span>Rear Camera: Scan Classroom Dynamic QR</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleStart}
                  className="w-full text-base h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-semibold"
                >
                  Start Check-in <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* SCREEN 2: FRONT CAMERA FACE VERIFICATION */}
            {currentStep === steps.FACE_VERIFY && (
              <motion.div
                key="face-verify"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full h-full flex flex-col items-center justify-center"
              >
                <FaceVerification
                  onVerified={handleFaceVerified}
                  onFailed={handleFaceError}
                  onCancel={() => setCurrentStep(steps.START)}
                />
              </motion.div>
            )}

            {/* SCREEN 3: TRANSITION - CAMERA SWITCH */}
            {currentStep === steps.TRANSITION && (
              <motion.div
                key="transition"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center ring-8 ring-emerald-50"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-900">Face Verified ✓</h2>
                <p className="text-xs text-slate-500 max-w-xs">
                  Switching to rear camera for attendance QR scan...
                </p>
              </motion.div>
            )}

            {/* SCREEN 4: REAR CAMERA QR SCAN */}
            {currentStep === steps.QR_SCAN && (
              <motion.div
                key="qr-scan"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full h-full flex flex-col items-center"
              >
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold text-slate-900">Scan Attendance QR</h2>
                  <p className="text-xs text-slate-500">Point rear camera at the live classroom display</p>
                </div>
                <QRScanner
                  isActive={true}
                  onScan={handleQRScanned}
                  onError={handleQRError}
                  onCancel={resetFlow}
                />
              </motion.div>
            )}

            {/* SUBMITTING STATE */}
            {currentStep === steps.SUBMITTING && (
              <motion.div
                key="submitting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-4 text-center"
              >
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                <h2 className="text-base font-semibold text-slate-800">Validating Institutional Credentials...</h2>
                <p className="text-xs text-slate-400">Verifying session, QR expiration, and biometric signature</p>
              </motion.div>
            )}

            {/* SCREEN 5: SUCCESS */}
            {currentStep === steps.SUCCESS && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center space-y-6 w-full"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                  className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center ring-8 ring-emerald-50"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Attendance Marked ✓</h2>
                  <p className="text-xs text-slate-500">Your presence has been recorded on the institutional ledger.</p>
                </div>

                <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-left text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Student</span>
                    <span className="font-semibold text-slate-800">{attendanceData?.studentName || 'Self'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Register Number</span>
                    <span className="font-semibold text-slate-800">{attendanceData?.registerNumber || 'Verified'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Status</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold uppercase text-[10px]">
                      {attendanceData?.status || 'PRESENT'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Recorded At</span>
                    <span className="font-semibold text-slate-800">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>

                <Button
                  onClick={() => navigate('/student')}
                  className="w-full h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-semibold"
                >
                  Return to Dashboard
                </Button>
              </motion.div>
            )}

            {/* ERROR STATE */}
            {currentStep === steps.ERROR && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center space-y-5 w-full"
              >
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center ring-8 ring-red-50">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1">Check-in Rejected</h2>
                  <p className="text-xs text-red-600 font-medium px-4 leading-relaxed">{errorMsg}</p>
                </div>
                <div className="flex gap-3 w-full mt-2">
                  <Button onClick={resetFlow} className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </Button>
                  <Button onClick={() => navigate('/student')} variant="outline" className="flex-1 h-12 rounded-xl">
                    Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
