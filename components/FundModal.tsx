'use client';

import { useState } from 'react';
import { useP402Store, useBalance, useSession } from '@/lib/store';

interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FUND_AMOUNTS = [
  { value: '5', label: '$5', requests: '~500' },
  { value: '10', label: '$10', requests: '~1,000' },
  { value: '25', label: '$25', requests: '~2,500' },
  { value: '50', label: '$50', requests: '~5,000' },
];

// P402 Treasury address
const P402_TREASURY = '0xb23f146251e3816a011e800bcbae704baa5619ec';

export function FundModal({ isOpen, onClose }: FundModalProps) {
  const [selectedAmount, setSelectedAmount] = useState('5');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const balance = useBalance();
  const session = useSession();
  const fundSession = useP402Store((s) => s.fundSession);

  const amount = customAmount || selectedAmount;

  const handleFund = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Use Base Pay SDK
      const { pay, getPaymentStatus } = await import('@base-org/account');

      const payment = await pay({
        amount: amount,
        to: P402_TREASURY,
        testnet: process.env.NEXT_PUBLIC_TESTNET === 'true',
      });

      // Wait for payment to complete
      const { status } = await getPaymentStatus({
        id: payment.id,
        testnet: process.env.NEXT_PUBLIC_TESTNET === 'true',
      });

      if (status === 'completed') {
        // Credit the session
        await fundSession(amount, (payment as any).transactionHash);
        setSuccess(true);

        // Close after showing success
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err) {
      console.error('Fund error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-neutral-900 bg-neutral-50">
          <h2 className="text-lg font-black uppercase tracking-tight">Add Funds</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white border-2 border-neutral-900 
                       hover:bg-neutral-900 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Balance */}
          <div className="bg-neutral-900 text-white border-2 border-neutral-900 p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(182,255,46,1)]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-p402-primary mb-1">Current Protocol Balance</div>
            <div className="text-3xl font-mono font-bold">${balance.toFixed(2)} <span className="text-sm text-neutral-400">USDC</span></div>
          </div>

          {/* Success State */}
          {success && (
            <div className="bg-p402-success/10 border-2 border-p402-success p-4 mb-6 text-center animate-fadeIn">
              <div className="text-p402-success text-2xl mb-2 font-black">✓</div>
              <div className="font-bold text-neutral-900 uppercase">Funds Authenticated</div>
              <div className="text-sm font-mono text-neutral-600">+${amount} USDC</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-p402-error/10 border-2 border-p402-error p-3 mb-6 text-sm font-bold text-p402-error uppercase">
              ! {error}
            </div>
          )}

          {!success && (
            <>
              {/* Amount Selection */}
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                  Select Amount
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {FUND_AMOUNTS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSelectedAmount(opt.value);
                        setCustomAmount('');
                      }}
                      className={`p-3 border-2 transition-all ${selectedAmount === opt.value && !customAmount
                        ? 'bg-neutral-900 text-p402-primary border-neutral-900 shadow-[2px_2px_0px_0px_rgba(182,255,46,1)]'
                        : 'bg-white text-neutral-900 border-neutral-200 hover:border-neutral-900 hover:-translate-y-0.5'
                        }`}
                    >
                      <div className="font-black text-xl">${opt.value}</div>
                      <div className="text-[10px] font-mono font-bold uppercase text-neutral-500">{opt.requests} REQ</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-8">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-2">
                  Or Custom Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0"
                    className="w-full h-12 bg-white border-2 border-neutral-900 pl-8 pr-16 text-lg font-bold font-mono
                               focus:border-p402-info focus:outline-none focus:ring-0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">USDC</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                onClick={handleFund}
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                className="w-full btn-primary flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none disabled:opacity-50 disabled:shadow-none"
              >
                {isProcessing ? (
                  <>
                    <span className="w-5 h-5 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRM ${amount} USDC</span>
                    <span className="text-xl">→</span>
                  </>
                )}
              </button>

              {/* Info */}
              <div className="mt-6 text-[10px] text-neutral-400 font-mono text-center uppercase tracking-wider">
                <p>SECURED BY BASE CHAIN • INSTANT SETTLEMENT</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
