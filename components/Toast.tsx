'use client';

import { useEffect } from 'react';
import { useToastStore } from '@/lib/toast-store';
import type { Toast as ToastType } from '@/lib/types';

const TOAST_BG: Record<ToastType['type'], string> = {
  success: 'bg-p402-primary',
  error: 'bg-red-100 border-p402-error',
  info: 'bg-blue-50 border-p402-info',
};

const TOAST_ICON: Record<ToastType['type'], string> = {
  success: '\u2713',
  error: '!',
  info: 'i',
};

function ToastItem({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`${TOAST_BG[toast.type]} border-2 border-neutral-900 p-4 min-w-[280px] max-w-[360px]
                  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-slideUp`}
    >
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 bg-neutral-900 text-white flex items-center justify-center flex-shrink-0
                        text-xs font-bold">
          {TOAST_ICON[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm uppercase">{toast.title}</div>
          {toast.message && (
            <div className="text-xs text-neutral-600 mt-0.5 font-mono">{toast.message}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-900 font-bold text-lg leading-none flex-shrink-0"
        >
          &#215;
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-[60]">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
