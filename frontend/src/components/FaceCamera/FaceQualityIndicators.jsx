import React from 'react';
import { CheckCircle, XCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FaceQualityIndicators({ checks }) {
  return (
    <div className="w-full max-w-sm bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Quality Checks</h3>
      <div className="space-y-2">
        <AnimatePresence>
          {checks.map((check, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-3"
            >
              {check.passed === true ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : check.passed === false ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300" />
              )}
              <span className={`text-sm ${check.passed === false ? 'text-red-600 font-medium' : 'text-slate-700'}`}>
                {check.message || check.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
