'use client';

import { useP402Store } from '@/lib/store';
import { formatCost } from '@/lib/p402-client';
import type { Transaction } from '@/lib/types';

/** Format a timestamp into a relative "time ago" string */
function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <div className="border-2 border-neutral-900 p-3 flex justify-between items-center bg-white
                    shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <div>
        <div className="font-mono font-bold text-sm">
          {formatCost(tx.amount)} USDC
        </div>
        <div className="text-[10px] text-neutral-500 font-mono uppercase mt-0.5">
          {timeAgo(tx.timestamp)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 ${tx.status === 'confirmed' ? 'bg-p402-success' : tx.status === 'pending' ? 'bg-p402-warning animate-pulse' : 'bg-p402-error'}`} />
        <a
          href={`https://basescan.org/tx/${tx.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-p402-info hover:underline font-mono"
        >
          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
        </a>
      </div>
    </div>
  );
}

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionHistory({ isOpen, onClose }: TransactionHistoryProps) {
  const transactions = useP402Store((s) => s.transactions);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-neutral-900 max-w-md w-full max-h-[80vh] flex flex-col
                   shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-neutral-900 bg-neutral-900 text-p402-primary">
          <h2 className="text-lg font-black uppercase tracking-tight">Transaction History</h2>
          <button onClick={onClose} className="hover:text-white text-lg font-bold">&#10005;</button>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-4">
          {transactions.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center mx-auto mb-4">
                <span className="text-neutral-400 text-xl">$</span>
              </div>
              <p className="text-neutral-500 text-sm font-mono">No transactions yet</p>
              <p className="text-neutral-400 text-xs mt-1">
                Fund your session to start using AI models
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...transactions].reverse().map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {transactions.length > 0 && (
          <div className="p-4 bg-neutral-100 border-t-2 border-neutral-900">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-500 uppercase font-bold">
                {transactions.length} Transaction{transactions.length !== 1 ? 's' : ''}
              </span>
              <span className="text-neutral-900 font-bold">
                Total: {formatCost(transactions.reduce((sum, tx) => sum + tx.amount, 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
