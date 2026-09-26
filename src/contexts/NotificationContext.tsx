/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Listen for OTP dispatch events
  React.useEffect(() => {
    const handleOtpEvent = (e: any) => {
      const detail = e.detail;
      if (detail && detail.code) {
        showToast(
          'info',
          `🔐 OTP Verification Code`,
          `Code for ${detail.destination}: ${detail.code} (Expires in 10 mins)`,
          9000
        );
      }
    };

    window.addEventListener('civicfix_otp_dispatched', handleOtpEvent);
    return () => {
      window.removeEventListener('civicfix_otp_dispatched', handleOtpEvent);
    };
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      
      {/* Toast container overlay */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            let Icon = Info;
            let iconColor = 'text-blue-500';
            let borderGlow = 'shadow-glow-blue border-blue-500/30';
            
            if (toast.type === 'success') {
              Icon = CheckCircle2;
              iconColor = 'text-emerald-400';
              borderGlow = 'shadow-glow-emerald border-emerald-500/30';
            } else if (toast.type === 'warning') {
              Icon = AlertTriangle;
              iconColor = 'text-amber-400';
              borderGlow = 'shadow-amber-500/30';
            } else if (toast.type === 'error') {
              Icon = XCircle;
              iconColor = 'text-rose-400';
              borderGlow = 'shadow-glow-rose border-rose-500/30';
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-xl ${borderGlow} shadow-lg text-slate-100`}
              >
                <div className={`mt-0.5 ${iconColor}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm leading-tight text-white">{toast.title}</h4>
                  <p className="mt-1 text-xs text-slate-300 leading-normal">{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
