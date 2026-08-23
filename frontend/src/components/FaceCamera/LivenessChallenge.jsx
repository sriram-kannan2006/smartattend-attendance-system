import React from 'react';
import { motion } from 'framer-motion';
import { Eye, ArrowLeftRight, Smile, Check } from 'lucide-react';

export default function LivenessChallenge({ currentChallenge, challengeStatus, progress }) {
  const getChallengeIcon = () => {
    switch(currentChallenge) {
      case 'BLINK': return <Eye className="w-8 h-8 text-indigo-500" />;
      case 'TURN_LEFT': 
      case 'TURN_RIGHT': return <ArrowLeftRight className="w-8 h-8 text-indigo-500" />;
      case 'SMILE': return <Smile className="w-8 h-8 text-indigo-500" />;
      default: return <Check className="w-8 h-8 text-indigo-500" />;
    }
  };

  const getChallengeText = () => {
    switch(currentChallenge) {
      case 'BLINK': return 'Blink twice naturally';
      case 'TURN_LEFT': return 'Turn your head slightly left';
      case 'TURN_RIGHT': return 'Turn your head slightly right';
      case 'SMILE': return 'Smile for the camera';
      default: return 'Please wait...';
    }
  };

  return (
    <div className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-sm w-full">
      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
        {getChallengeIcon()}
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">{getChallengeText()}</h3>
      
      <div className="w-full mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <motion.div 
            className="bg-indigo-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {challengeStatus === 'completed' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 text-emerald-600 flex items-center text-sm font-medium"
        >
          <Check className="w-4 h-4 mr-1" /> Great!
        </motion.div>
      )}
    </div>
  );
}
