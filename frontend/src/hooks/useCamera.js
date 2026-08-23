import { useState, useRef, useEffect, useCallback } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('user');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
  }, []);

  const getMediaStream = async (facingMode) => {
    // Check if mediaDevices API is available
    if (!navigator.mediaDevices && !navigator.getUserMedia && !navigator.webkitGetUserMedia) {
      throw new Error('SECURE_CONTEXT_REQUIRED');
    }

    const preferredFacing = facingMode === 'user' ? 'user' : 'environment';

    // Tier 1: Ideal constraints (standard mobile front/rear camera)
    const constraintTiers = [
      {
        video: {
          facingMode: preferredFacing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: preferredFacing,
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let lastError = null;

    for (const constraints of constraintTiers) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } else if (navigator.getUserMedia) {
          return await new Promise((resolve, reject) => {
            navigator.getUserMedia(constraints, resolve, reject);
          });
        }
      } catch (err) {
        lastError = err;
        console.warn('Media constraint attempt failed, trying fallback...', constraints, err);
      }
    }

    throw lastError || new Error('CAMERA_FAILED');
  };

  const startCamera = useCallback(async (facingMode = 'user') => {
    if (streamRef.current && streamRef.current.active && cameraFacing === facingMode) {
      if (videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const mediaStream = await getMediaStream(facingMode);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);
      setCameraFacing(facingMode);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch((e) => console.warn('Video play prevented:', e));
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let errorMsg = 'Failed to access camera.';
      if (err.message === 'SECURE_CONTEXT_REQUIRED' || !window.isSecureContext) {
        errorMsg = 'Camera requires HTTPS or localhost. Please open https://' + window.location.host;
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera permissions in your mobile browser settings.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'No camera hardware detected on this device.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Camera is currently in use by another app.';
      }
      setError(errorMsg);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, [cameraFacing]);

  const openFrontCamera = useCallback(() => startCamera('user'), [startCamera]);
  const openRearCamera = useCallback(() => startCamera('environment'), [startCamera]);

  const switchCamera = useCallback(() => {
    startCamera(cameraFacing === 'user' ? 'environment' : 'user');
  }, [cameraFacing, startCamera]);

  const requestPermission = useCallback(() => {
    startCamera('user');
  }, [startCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    isLoading,
    error,
    hasPermission,
    cameraFacing,
    openFrontCamera,
    openRearCamera,
    stopCamera,
    switchCamera,
    requestPermission,
  };
}
