import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '@/hooks/useCamera';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import FaceViewport from './FaceViewport';
import { Button } from '@/components/ui/Button';
import { faceService } from '@/services/faceService';
import { CheckCircle2, XCircle, Loader2, Sparkles, RefreshCw, UserCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export default function FaceVerification({ onVerified, onFailed, onCancel }) {
  const navigate = useNavigate();
  const { videoRef, openFrontCamera, stopCamera, isLoading: cameraLoading, error: cameraError } = useCamera();
  const { modelsLoaded, loadModels, getFaceDescriptor, detectFace } = useFaceDetection();
  const [status, setStatus] = useState('warming_up'); // 'warming_up' | 'scanning' | 'verifying' | 'success' | 'failed' | 'not_registered'
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const isMountedRef = useRef(true);
  const verifyingRef = useRef(false);
  const liveSamplesRef = useRef([]);

  // Initialize camera cleanly on mount
  useEffect(() => {
    isMountedRef.current = true;
    verifyingRef.current = false;
    liveSamplesRef.current = [];

    loadModels().then(() => {
      if (isMountedRef.current) {
        openFrontCamera();
        setTimeout(() => {
          if (isMountedRef.current && status === 'warming_up') {
            setStatus('scanning');
          }
        }, 800);
      }
    });

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [loadModels, openFrontCamera, stopCamera]);

  // Multi-frame face scan loop (lasts ~1.8 seconds)
  useEffect(() => {
    if (status !== 'scanning') return;

    let progress = 0;
    liveSamplesRef.current = [];

    const interval = setInterval(async () => {
      if (!isMountedRef.current || verifyingRef.current) return;
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      // Sample live frame
      const desc = await getFaceDescriptor(videoRef.current);
      if (desc && desc.length > 0) {
        liveSamplesRef.current.push(desc);
      }

      progress += 20;
      setScanProgress(Math.min(progress, 100));

      if (progress >= 100) {
        clearInterval(interval);
        verifyingRef.current = true;
        setStatus('verifying');

        // Compute high-accuracy composite live descriptor across collected frames
        const samples = liveSamplesRef.current;
        let finalLiveDesc = null;

        if (samples.length > 0) {
          const len = samples[0].length || 256;
          finalLiveDesc = new Array(len).fill(0);
          for (const s of samples) {
            for (let i = 0; i < len; i++) {
              finalLiveDesc[i] += s[i];
            }
          }
          for (let i = 0; i < len; i++) {
            finalLiveDesc[i] = Number((finalLiveDesc[i] / samples.length).toFixed(5));
          }
        } else {
          finalLiveDesc = await getFaceDescriptor(videoRef.current);
        }

        try {
          // Call backend API for real face verification
          const response = await faceService.verifyFace(finalLiveDesc);
          const data = response?.data?.data || response?.data || response;

          if (data?.matched || response?.matched) {
            const authId = data?.authenticationId || response?.authenticationId;
            const expAt = data?.expiresAt || response?.expiresAt;

            if (isMountedRef.current) {
              setStatus('success');
              setTimeout(() => {
                stopCamera();
                if (onVerified) onVerified(authId, expAt);
              }, 800);
            }
          } else {
            if (isMountedRef.current) {
              if (data?.reason === 'NO_PROFILE') {
                setStatus('not_registered');
                setErrorMessage('No face biometric profile found for your student account.');
              } else {
                setStatus('failed');
                setErrorMessage(data?.message || 'Face did not match registered student template. Please ensure good lighting and face alignment.');
              }
              verifyingRef.current = false;
              if (onFailed) onFailed(data?.reason || 'NO_MATCH');
            }
          }
        } catch (err) {
          console.warn('Face verification API error:', err);
          const serverReason = err.response?.data?.data?.reason || err.response?.data?.reason;
          if (serverReason === 'NO_PROFILE' && isMountedRef.current) {
            setStatus('not_registered');
            setErrorMessage('No face profile found. Please register your face first.');
          } else if (isMountedRef.current) {
            setStatus('failed');
            setErrorMessage(err.response?.data?.message || 'Verification could not confirm identity. Please try again in good lighting.');
            verifyingRef.current = false;
            if (onFailed) onFailed('VERIFICATION_ERROR');
          }
        }
      }
    }, 320);

    return () => clearInterval(interval);
  }, [status, getFaceDescriptor, onVerified, onFailed, stopCamera, videoRef]);

  const handleRetry = () => {
    verifyingRef.current = false;
    liveSamplesRef.current = [];
    setScanProgress(0);
    setErrorMessage('');
    setStatus('warming_up');
    openFrontCamera();
    setTimeout(() => {
      if (isMountedRef.current) setStatus('scanning');
    }, 600);
  };

  return (
    <div className="flex flex-col items-center p-4 max-w-sm mx-auto">
      {cameraError && (
        <div className="w-full p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <span>{cameraError}</span>
          <Button size="sm" variant="outline" onClick={openFrontCamera} className="text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> Retry Camera
          </Button>
        </div>
      )}

      {/* Camera Viewport with status indicators */}
      <div className="relative mb-5">
        <FaceViewport
          videoRef={videoRef}
          size={250}
          isDetecting={status === 'warming_up' || status === 'scanning'}
          faceDetected={status === 'verifying' || status === 'success'}
          instructions={
            status === 'warming_up'
              ? 'Starting camera sensor...'
              : status === 'scanning'
              ? 'Scanning face... hold still'
              : status === 'verifying'
              ? 'Matching with KEC records...'
              : status === 'success'
              ? 'Identity Confirmed!'
              : status === 'not_registered'
              ? 'Face Not Registered'
              : 'Verification Failed'
          }
        />

        {/* Live scanning progress overlay */}
        {status === 'scanning' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 backdrop-blur-xs">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Scanning {scanProgress}%</span>
          </div>
        )}

        {status === 'success' && (
          <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-xs rounded-full flex items-center justify-center border-4 border-emerald-500 animate-in fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 drop-shadow-md" />
          </div>
        )}

        {(status === 'failed' || status === 'not_registered') && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-xs rounded-full flex items-center justify-center border-4 border-red-500 animate-in fade-in">
            <XCircle className="w-16 h-16 text-red-600 drop-shadow-md" />
          </div>
        )}
      </div>

      {/* Dynamic Status Text & Controls */}
      <div className="w-full text-center space-y-3">
        {status === 'verifying' && (
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying OpenCV biometric signature...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Face Verified! Switching to Rear Camera for QR scan...</span>
          </div>
        )}

        {status === 'not_registered' && (
          <div className="space-y-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center justify-center gap-1.5 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Face Not Registered Yet</span>
            </div>
            <p className="text-[11px] text-amber-800">
              You must register your face once before marking attendance.
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                stopCamera();
                navigate('/student/face-registration');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-xs"
            >
              Enroll Face Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-3">
            <p className="text-xs text-red-600 font-medium px-2">{errorMessage}</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={onCancel} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" variant="primary" onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700 text-xs">
                <RefreshCw className="w-3 h-3 mr-1" /> Try Again
              </Button>
            </div>
          </div>
        )}

        {(status === 'warming_up' || status === 'scanning') && (
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs text-slate-500">
            Cancel Check-in
          </Button>
        )}
      </div>
    </div>
  );
}
