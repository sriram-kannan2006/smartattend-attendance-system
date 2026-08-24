import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useQRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);
  const isStoppingRef = useRef(false);

  const stopScanning = useCallback(async () => {
    if (html5QrCode.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        if (html5QrCode.current.isScanning) {
          await html5QrCode.current.stop();
        }
        await html5QrCode.current.clear();
      } catch (err) {
        console.warn("Failed to stop scanner cleanly:", err);
      } finally {
        html5QrCode.current = null;
        isStoppingRef.current = false;
        setIsScanning(false);
      }
    }
  }, []);

  const startScanning = useCallback(async (onSuccess, preferredCameraId = null) => {
    // Stop any active instance first
    await stopScanning();

    // Small delay to ensure mobile OS releases front camera hardware
    await new Promise((r) => setTimeout(r, 250));

    if (!scannerRef.current) {
      console.warn("Scanner element not mounted");
      return;
    }

    const containerId = scannerRef.current.id || 'qr-scanner-container';

    try {
      setError(null);
      setResult(null);
      setIsScanning(true);

      // 0. Explicitly trigger camera permission for Android WebViews / APKs
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const testStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          });
          testStream.getTracks().forEach(t => {
            try { t.stop(); } catch (e) {}
          });
        }
      } catch (permErr) {
        console.warn("Direct getUserMedia test:", permErr);
      }

      const scanner = new Html5Qrcode(containerId);
      html5QrCode.current = scanner;

      // 1. Enumerate available video devices
      let cameraList = [];
      try {
        cameraList = await Html5Qrcode.getCameras();
        setCameras(cameraList);
      } catch (e) {
        console.warn("Could not enumerate cameras:", e);
      }

      // 2. Select rear / environment camera
      let cameraConfig = { facingMode: "environment" };

      if (preferredCameraId) {
        cameraConfig = { deviceId: { exact: preferredCameraId } };
      } else if (cameraList && cameraList.length > 0) {
        // Find back/rear camera by label
        const backCam = cameraList.find((c) =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment') ||
          c.label.toLowerCase().includes('0')
        ) || cameraList[cameraList.length - 1]; // On mobile, last camera is typically rear

        if (backCam && backCam.id) {
          cameraConfig = backCam.id;
          setSelectedCameraId(backCam.id);
        }
      }

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const qrEdge = Math.floor(minEdge * 0.75);
          return { width: qrEdge, height: qrEdge };
        },
        aspectRatio: 1.0,
      };

      const handleSuccess = (decodedText) => {
        setResult(decodedText);
        stopScanning();
        if (onSuccess) onSuccess(decodedText);
      };

      // Attempt 1: Start with selected rear camera or facingMode
      try {
        await scanner.start(cameraConfig, qrConfig, handleSuccess, () => {});
      } catch (err1) {
        console.warn("Initial rear camera start failed, trying fallback { facingMode: 'environment' }...", err1);
        try {
          await scanner.start({ facingMode: "environment" }, qrConfig, handleSuccess, () => {});
        } catch (err2) {
          console.warn("FacingMode environment failed, trying generic video stream...", err2);
          // Fallback to any available camera (front or back)
          if (cameraList.length > 0) {
            await scanner.start(cameraList[0].id, qrConfig, handleSuccess, () => {});
          } else {
            await scanner.start({ facingMode: "user" }, qrConfig, handleSuccess, () => {});
          }
        }
      }
    } catch (err) {
      console.error("QR scanner start error:", err);
      let msg = "Could not start rear camera.";
      if (err.name === "NotAllowedError") {
        msg = "Camera permission was denied. Please allow camera permissions.";
      } else if (err.name === "NotReadableError") {
        msg = "Camera is currently busy. Please wait a moment and tap Retry.";
      }
      setError(msg);
      setIsScanning(false);
    }
  }, [stopScanning]);

  const switchCamera = useCallback(async (onSuccess) => {
    if (cameras.length < 2) {
      // Toggle facingMode if device list not available
      await stopScanning();
      await startScanning(onSuccess);
      return;
    }

    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);

    await stopScanning();
    await startScanning(onSuccess, nextCamera.id);
  }, [cameras, selectedCameraId, startScanning, stopScanning]);

  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    scannerRef,
    isScanning,
    result,
    error,
    cameras,
    startScanning,
    stopScanning,
    switchCamera,
    resetResult,
  };
};
