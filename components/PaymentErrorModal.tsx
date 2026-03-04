'use client';

import type { PaymentError } from '@/lib/types';

const ERROR_CONFIG: Record<
  string,
  { title: string; description: string; action: string; actionHref: string | null }
> = {
  insufficient_funds: {
    title: 'Insufficient USDC Balance',
    description: 'Your wallet does not have enough USDC on Base to complete this payment. Bridge or swap to get USDC on Base.',
    action: 'Get USDC on Base',
    actionHref: 'https://www.coinbase.com/bridge',
  },
  signature_rejected: {
    title: 'Payment Cancelled',
    description: 'You cancelled the payment signature request. No funds were transferred.',
    action: 'Try Again',
    actionHref: null,
  },
  network_error: {
    title: 'Network Error',
    description: 'Unable to reach the Base network. Check your internet connection and try again.',
    action: 'Retry',
    actionHref: null,
  },
  settlement_failed: {
    title: 'Settlement Failed',
    description: 'The payment could not be verified on-chain. Your funds were not transferred.',
    action: 'Retry',
    actionHref: null,
  },
  unknown: {
    title: 'Payment Failed',
    description: 'An unexpected error occurred during payment.',
    action: 'Contact Support',
    actionHref: 'mailto:support@p402.io',
  },
};

interface PaymentErrorModalProps {
  error: PaymentError;
  onClose: () => void;
  onRetry?: () => void;
}

export function PaymentErrorModal({ error, onClose, onRetry }: PaymentErrorModalProps) {
  const config = ERROR_CONFIG[error.type] || ERROR_CONFIG.unknown;
  const description = error.type === 'unknown' && error.message
    ? error.message
    : config.description;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-neutral-900 max-w-sm w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Error icon */}
        <div className="w-12 h-12 bg-p402-error/10 border-2 border-p402-error flex items-center justify-center mb-4">
          <span className="text-p402-error text-2xl font-bold">!</span>
        </div>

        <h2 className="text-xl font-bold uppercase mb-2">{config.title}</h2>
        <p className="text-neutral-600 text-sm mb-6">{description}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-neutral-900 p-3 font-bold uppercase text-sm
                       hover:bg-neutral-100 transition-colors"
          >
            Close
          </button>

          {config.actionHref ? (
            <a
              href={config.actionHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-p402-primary border-2 border-neutral-900 p-3 font-bold uppercase text-sm
                         text-center hover:-translate-y-0.5 active:translate-y-0 transition-transform
                         shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
            >
              {config.action}
            </a>
          ) : (
            <button
              onClick={onRetry || error.recoveryAction || onClose}
              className="flex-1 bg-p402-primary border-2 border-neutral-900 p-3 font-bold uppercase text-sm
                         hover:-translate-y-0.5 active:translate-y-0 transition-transform
                         shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
            >
              {config.action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
