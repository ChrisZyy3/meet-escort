import { useEffect, type FC } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ToastKind = 'success' | 'error';

interface ToastProps {
  message: string;
  kind?: ToastKind;
  onClose: () => void;
}

export const Toast: FC<ToastProps> = ({ message, kind = 'success', onClose }) => {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  const isSuccess = kind === 'success';

  return (
    <div className="fixed inset-x-4 top-5 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:top-6">
      <div
        className={`flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
          isSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-700'
        }`}
        role={isSuccess ? 'status' : 'alert'}
        aria-live="polite"
      >
        {isSuccess ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
        <span className="flex-1 text-sm font-bold">{message}</span>
        <button type="button" onClick={onClose} className="rounded-full p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100" aria-label="Close notification">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
