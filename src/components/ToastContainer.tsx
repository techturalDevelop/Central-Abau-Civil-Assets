import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastType } from '../types';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-slate-900/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40';
      case 'error':
        return 'bg-slate-900/95 border-rose-500/40 text-rose-200 shadow-rose-950/40';
      case 'warning':
        return 'bg-slate-900/95 border-amber-500/40 text-amber-200 shadow-amber-950/40';
      case 'info':
      default:
        return 'bg-slate-900/95 border-blue-500/40 text-blue-200 shadow-blue-950/40';
    }
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-5 right-5 z-[1500] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-md shadow-2xl flex items-start justify-between gap-3 transition-all animate-fadeIn ${getToastStyle(
            toast.type
          )}`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5">{getToastIcon(toast.type)}</div>
            <div className="min-w-0 text-xs">
              <p className="font-bold text-white tracking-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug break-words">
                  {toast.message}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
