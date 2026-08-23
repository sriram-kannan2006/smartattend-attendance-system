import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }].slice(-5));
    
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 4000);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    addToast({ message, type: 'default', ...options });
  }, [addToast]);

  const showSuccess = useCallback((message, options = {}) => {
    addToast({ message, type: 'success', ...options });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    addToast({ message, type: 'error', ...options });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    addToast({ message, type: 'warning', ...options });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    addToast({ message, type: 'info', ...options });
  }, [addToast]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-500" />,
    error: <AlertCircle className="w-5 h-5 text-error-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-500" />,
    info: <Info className="w-5 h-5 text-info-500" />,
    default: null
  };

  const bgColors = {
    success: 'bg-success-50 border-success-200',
    error: 'bg-error-50 border-error-200',
    warning: 'bg-warning-50 border-warning-200',
    info: 'bg-info-50 border-info-200',
    default: 'bg-white border-secondary-200'
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 w-[350px] p-4 rounded-lg border shadow-lg",
                bgColors[toast.type || 'default']
              )}
            >
              <div className="shrink-0 mt-0.5">{icons[toast.type || 'default']}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-secondary-900">{toast.message}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-secondary-500">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-secondary-400 hover:text-secondary-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
