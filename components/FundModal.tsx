'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { formatCost } from '@/lib/p402-client';

// Fund amount options in USD
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { session, fundSession } = useStore();

  const amount = customAmount || selectedAmount;

  const handleFund = useCallback(async () => {
    if (!session) return;

    setIsProcessing(true);
    setError(null);

    try {
      // In production, this would trigger Base Pay
      // For now, we'll simulate the flow

      // TODO: Integrate with Base Pay SDK
      // const payment = await pay({
      //   amount: amount,
      //   to: process.env.NEXT_PUBLIC_P402_TREASURY!,
      // });
      // await fundSession(amount, payment.transactionHash);

      // Temporary: direct fund for testing
      await fundSession(amount);

      onClose();
    } catch (err) {
      console.error('Fund error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  }, [session, amount, fundSession, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-black p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold uppercase">Add Funds</h2>
          <button
            onClick={onClose}
            className="text-2xl font-bold hover:text-gray-600"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Current Balance */}
        <div className="bg-gray-100 border-2 border-black p-4 mb-6">
          <div className="text-sm font-bold uppercase text-gray-600">Current Balance</div>
          <div className="text-2xl font-bold text-lime-500">
            {formatCost(session?.balance_usdc ?? 0)}
          </div>
        </div>

        {/* Amount Selection */}
        <div className="mb-6">
          <label className="block text-sm font-bold uppercase mb-2">
            Select Amount
          </label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {FUND_OPTIONS.map((option) => (
              <button
                key={option.amount}
                onClick={() => {
                  setSelectedAmount(option.amount);
                  setCustomAmount('');
                }}
                className={`
                  py-3 font-bold uppercase border-2 border-black transition-transform
                  ${selectedAmount === option.amount && !customAmount
                    ? 'bg-lime-400 hover:bg-lime-500'
                    : 'bg-white hover:bg-gray-100'
                  }
                  hover:-translate-y-0.5 active:translate-y-0
                `}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold">$</span>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="0.01"
              max="10000"
              step="0.01"
              className="w-full h-11 pl-8 pr-4 border-2 border-black font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-700 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handleFund}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0}
          className={`
            w-full py-4 font-bold uppercase border-2 border-black transition-transform
            ${isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-lime-400 hover:bg-lime-500 hover:-translate-y-0.5 active:translate-y-0'
            }
          `}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              Processing...
            </span>
          ) : (
            `Pay ${formatCost(parseFloat(amount) || 0)} USDC`
          )}
        </button>

        {/* Info */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          Payments processed via Base Pay. USDC on Base network.
        </p>
      </div>
    </div>
  );
}

export default FundModal;
