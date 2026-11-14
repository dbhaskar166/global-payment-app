import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle 
} from 'lucide-react';

interface ToastProps {
  toast: { message: string; type: 'success' | 'error' | 'info' | 'warning' } | null;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
    error: 'bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200',
    warning: 'bg-amber-50 dark:bg-amber-950/90 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
    info: 'bg-sky-50 dark:bg-sky-950/90 border-sky-300 dark:border-sky-800 text-sky-900 dark:text-sky-200',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm font-medium ${bgStyles[toast.type]}`}>
        {icons[toast.type]}
        <div className="flex-1">{toast.message}</div>
      </div>
    </div>
  );
};
