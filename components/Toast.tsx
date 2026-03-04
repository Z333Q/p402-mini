'use client';

import { useEffect } from 'react';
import { useToastStore } from '@/lib/toast-store';
import type { Toast as ToastType } from '@/lib/types';

const TOAST_TIMEOUT: Record<ToastType['type'], number> = {
  success: 4000,
  error: 8000,
  info: 5000,
};

const TOAST_ACCENT: Record<ToastType['type'], string> = {
  success: 'border-l-4 border-l-p402-success',
  error: 'border-l-4 border-l-p402-error',
  info: 'border-l-4 border-l-p402-info',
};

const TOAST_ICON_BG: Record<ToastType['type'], string> = {
  success: 'bg-p402-success text-neutral-900',
  error: 'bg-p402-error text-white',
  info: 'bg-p402-info text-white',
};

function ToastIcon({ type }: { type: ToastType['type'] }) {
  if (type === 'success') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    );
  }
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square">
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_TIMEOUT[toast.type]);
    return () => clearTimeout(timer);
  }, [onClose, toast.type]);

  return (
    <div
      className={`bg-white border-2 border-neutral-900 ${TOAST_ACCENT[toast.type]}
                  min-w-[260px] max-w-[340px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-slideUp`}
    >
      <div className="flex items-start gap-3 p-3">
        <div className={`w-5 h-5 ${TOAST_ICON_BG[toast.type]} flex items-center justify-center flex-shrink-0`}>
          <ToastIcon type={toast.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm uppercase text-neutral-900 leading-tight">{toast.title}</div>
          {toast.message && (
            <div className="text-[11px] text-neutral-500 mt-0.5 font-mono leading-relaxed">{toast.message}</div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-900 transition-colors flex-shrink-0 p-0.5"
          aria-label="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-[60]" role="region" aria-label="Notifications">
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
