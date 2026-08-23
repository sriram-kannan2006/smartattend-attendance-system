import React from 'react';
import { motion } from 'framer-motion';

export default function FaceViewport({ videoRef, size = 320, isDetecting, faceDetected, instructions }) {
  const borderColor = faceDetected ? 'border-emerald-500' : 'border-slate-300';
  const shadowColor = faceDetected ? 'shadow-[0_0_20px_rgba(16,185,129,0.5)]' : '';

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className={`relative overflow-hidden rounded-full border-4 ${borderColor} ${shadowColor} transition-all duration-300`}
        style={{ width: size, height: size }}
      >
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
          autoPlay
          playsInline
          muted
        />
        <div className="absolute inset-0 border-[8px] border-black/10 rounded-full pointer-events-none" />
        <div className="absolute inset-[20%] border border-white/30 rounded-full pointer-events-none border-dashed" />
        
        {isDetecting && !faceDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-white border-t-transparent rounded-full"
            />
          </div>
        )}
      </div>
      {instructions && (
        <p className="text-lg font-medium text-slate-700 animate-pulse">{instructions}</p>
      )}
    </div>
  );
}
