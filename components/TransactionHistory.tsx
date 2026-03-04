'use client';

import { useState, useCallback } from 'react';
import { useP402Store } from '@/lib/store';
import { formatCost } from '@/lib/p402-client';
import type { Transaction } from '@/lib/types';

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function CopyHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }, [hash]);

  return (
    <button
      onClick={handleCopy}
      title="Copy transaction hash"
      className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-neutral-200
                 hover:border-neutral-900 bg-white hover:bg-neutral-50 text-neutral-400
                 hover:text-neutral-900 transition-all ml-1"
    >
      {copied ? 'OK' : 'COPY'}
    </button>
  );
}

function StatusDot({ status }: { status: Transaction['status'] }) {
  const colors = {
    confirmed: 'bg-p402-success',
    pending: 'bg-p402-warning animate-pulse',
    failed: 'bg-p402-error',
  };
  const labels = { confirmed: 'Confirmed', pending: 'Pending', failed: 'Failed' };

  return (
    <span className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-500">
      <span className={`w-2 h-2 flex-shrink-0 ${colors[status]}`} />
      {labels[status]}
    </span>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <div className="border-2 border-neutral-200 hover:border-neutral-900 bg-white p-3 transition-colors
                    shadow-[2px_2px_0px_0px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono font-bold text-sm text-neutral-900">
            +{formatCost(tx.amount)} USDC
          </div>
          <div className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">
            {timeAgo(tx.timestamp)}
          </div>
        </div>
        <StatusDot status={tx.status} />
      </div>

      <div className="flex items-center mt-2 gap-1">
        <a
          href={`https://basescan.org/tx/${tx.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-p402-info hover:underline font-mono flex-shrink-0"
        >
          {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)} ↗
        </a>
        <CopyHash hash={tx.txHash} />
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

  const totalFunded = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div
      className="fixed inset-0 bg-neutral-900/80 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-neutral-900 w-full max-w-sm max-h-[80vh] flex flex-col
                   shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-neutral-900 bg-neutral-900 text-p402-primary flex-shrink-0">
          <h2 className="text-lg font-black uppercase tracking-tight">Transactions</h2>
          <button onClick={onClose} className="hover:text-white transition-colors font-bold" aria-label="Close">
            ✕
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {transactions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center mx-auto">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                  <rect x="2" y="5" width="20" height="14" rx="0"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <p className="text-neutral-500 text-sm font-mono">No transactions yet</p>
              <p className="text-neutral-400 text-xs">Fund your session to start using AI models</p>
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
          <div className="p-4 bg-neutral-50 border-t-2 border-neutral-900 flex-shrink-0">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-500 uppercase font-bold">
                {transactions.length} tx{transactions.length !== 1 ? 's' : ''}
              </span>
              <span className="text-neutral-900 font-bold">
                {formatCost(totalFunded)} USDC total
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
