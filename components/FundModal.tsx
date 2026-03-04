'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { formatCost } from '@/lib/p402-client';
import { usePayment } from '@/hooks/usePayment';
import { PaymentErrorModal } from './PaymentErrorModal';
import { useToastStore } from '@/lib/toast-store';

const FUND_OPTIONS = [
  { amount: '1.00', label: '$1' },
  { amount: '5.00', label: '$5' },
  { amount: '10.00', label: '$10' },
  { amount: '25.00', label: '$25' },
];

interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FundModal({ isOpen, onClose }: FundModalProps) {
  const [selectedAmount, setSelectedAmount] = useState('5.00');
  const [customAmount, setCustomAmount] = useState('');
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { session, addTransaction } = useStore();
  const { pay, isProcessing, error: paymentError, clearError } = usePayment();

  const amount = customAmount || selectedAmount;

  const handleFund = useCallback(async () => {
    if (!session) return;

    const amountUSD = parseFloat(amount);
    if (isNaN(amountUSD) || amountUSD <= 0) return;

    const sessionId = (session.id || session.session_id) as string;
    const result = await pay({ amountUSD, sessionId });

    if (result.success) {
      if (result.txHash) {
        addTransaction({
          id: result.txHash,
          amount: amountUSD,
          txHash: result.txHash,
          timestamp: new Date().toISOString(),
          status: 'confirmed',
        });
        setTxHash(result.txHash);
      }
      setSuccessAmount(amountUSD);

      useToastStore.getState().addToast({
        type: 'success',
        title: 'Credits Loaded',
        message: `${formatCost(amountUSD)} USDC added to session`,
      });
    }
  }, [session, amount, pay, addTransaction]);

  const handleClose = () => {
    setSuccessAmount(null);
    setTxHash(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-neutral-900/80 flex items-end sm:items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <div
          className="bg-white border-2 border-neutral-900 w-full max-w-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-neutral-900 bg-neutral-900 text-p402-primary">
            <h2 className="text-lg font-black uppercase tracking-tight">
              {successAmount ? 'Payment Confirmed' : 'Load USDC Credits'}
            </h2>
            <button
              onClick={handleClose}
              className="hover:text-white transition-colors font-bold"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Success state */}
          {successAmount !== null ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-p402-primary border-2 border-neutral-900 flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-900">{formatCost(successAmount)} USDC</p>
                <p className="text-xs font-mono text-neutral-500 mt-1 uppercase">Added to session</p>
              </div>
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[10px] font-mono text-p402-info hover:underline"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)} ↗
                </a>
              )}
              <button
                onClick={handleClose}
                className="w-full btn-primary py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                DONE
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-5">
              {/* Current Balance */}
              <div className="flex items-center justify-between bg-neutral-50 border-2 border-neutral-200 px-4 py-3">
                <span className="text-xs font-black uppercase text-neutral-500 tracking-wider">Balance</span>
                <span className={`font-mono font-bold text-lg ${(session?.balance_usdc ?? 0) < 1 ? 'text-p402-warning' : 'text-neutral-900'}`}>
                  ${(session?.balance_usdc ?? 0).toFixed(2)}
                </span>
              </div>

              {/* Amount presets */}
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-400 mb-2 tracking-wider">Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {FUND_OPTIONS.map((option) => (
                    <button
                      key={option.amount}
                      onClick={() => { setSelectedAmount(option.amount); setCustomAmount(''); }}
                      className={`py-2.5 font-bold text-sm border-2 transition-all
                        ${selectedAmount === option.amount && !customAmount
                          ? 'bg-p402-primary border-neutral-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white border-neutral-300 hover:border-neutral-900'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-neutral-500 pointer-events-none">$</span>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="0.01"
                    max="10000"
                    step="0.01"
                    className="w-full h-10 pl-7 pr-4 border-2 border-neutral-900 font-mono text-sm
                               focus:outline-none focus:border-p402-primary bg-white"
                  />
                </div>
              </div>

              {/* Pay button */}
              <button
                onClick={handleFund}
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                className={`w-full py-4 font-black uppercase text-sm border-2 border-neutral-900 transition-all
                  ${isProcessing
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-p402-primary text-neutral-900 hover:-translate-y-0.5 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                    SIGNING PAYMENT...
                  </span>
                ) : (
                  `PAY ${formatCost(parseFloat(amount) || 0)} USDC`
                )}
              </button>

              <p className="text-[10px] text-neutral-400 text-center font-mono">
                Gasless · EIP-3009 · USDC on Base
              </p>
            </div>
          )}
        </div>
      </div>

      {paymentError && (
        <PaymentErrorModal
          error={paymentError}
          onClose={clearError}
          onRetry={handleFund}
        />
      )}
    </>
  );
}

export default FundModal;
