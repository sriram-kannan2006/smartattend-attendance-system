import React, { useEffect, useRef } from 'react';
import { useQRScanner } from '@/hooks/useQRScanner';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, X, SwitchCamera, Sparkles } from 'lucide-react';

const QRScanner = ({ onScan, onError, onCancel, isActive }) => {
  const { scannerRef, isScanning, error, cameras, startScanning, stopScanning, switchCamera, resetResult } = useQRScanner();
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    let isMounted = true;

    if (isActive) {
      // Allow slight delay for transition animation to settle DOM
      const timer = setTimeout(() => {
        if (!isMounted) return;
        startScanning((decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.sessionId && data.token) {
              if (onScanRef.current) onScanRef.current(data);
            } else if (data.sessionId || data.sid) {
              if (onScanRef.current) onScanRef.current(data);
            } else {
              if (onScanRef.current) onScanRef.current(decodedText);
            }
          } catch (e) {
            // Handle plain string tokens or JSON
            if (onScanRef.current) onScanRef.current(decodedText);
          }
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        isMounted = false;
        stopScanning();
      };
    }
  }, [isActive, startScanning, stopScanning]);

  const handleRetry = () => {
    resetResult();
    startScanning((decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        if (onScanRef.current) onScanRef.current(data);
      } catch (e) {
        if (onScanRef.current) onScanRef.current(decodedText);
      }
    });
  };

  const handleFlipCamera = () => {
    switchCamera((decodedText) => {
      try {
        const data = JSON.parse(decodedText);
        if (onScanRef.current) onScanRef.current(data);
      } catch (e) {
        if (onScanRef.current) onScanRef.current(decodedText);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto p-2 space-y-4">
      {/* Scanner Viewfinder Frame */}
      <div className="relative w-full aspect-square bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center p-6 text-center text-red-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/60 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="font-semibold text-xs leading-relaxed text-red-200">{error}</p>
            <Button
              onClick={handleRetry}
              size="sm"
              variant="outline"
              className="mt-2 text-xs border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Camera
            </Button>
          </div>
        ) : (
          <>
            <div
              id="qr-reader-viewport"
              ref={scannerRef}
              className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 relative rounded-2xl border border-white/20">
                {/* 4 Glowing Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-xl -translate-x-1 -translate-y-1" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-xl translate-x-1 -translate-y-1" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-xl -translate-x-1 translate-y-1" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-xl translate-x-1 translate-y-1" />

                {/* Animated Scanner Laser */}
                {isScanning && (
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#3b82f6] animate-pulse"
                    style={{
                      top: '50%',
                      transform: 'translateY(-50%)',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Flip Camera floating button */}
            {cameras.length > 1 && (
              <button
                onClick={handleFlipCamera}
                className="absolute bottom-3 right-3 p-2.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-slate-700 hover:bg-slate-800 transition shadow-lg active:scale-95"
                title="Switch Camera"
              >
                <SwitchCamera className="w-4 h-4 text-blue-400" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-2 w-full justify-between pt-1">
        {cameras.length > 1 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleFlipCamera}
            className="text-xs rounded-xl flex-1 border-slate-200"
          >
            <SwitchCamera className="w-3.5 h-3.5 mr-1" /> Switch Camera
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-700 flex-1"
        >
          <X className="w-3.5 h-3.5 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
};

export default QRScanner;
