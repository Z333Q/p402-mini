'use client';

import { useP402Store, useBalance, useSavings } from '@/lib/store';
import { formatCost } from '@/lib/p402-client';

interface HeaderProps {
  onFundClick: () => void;
}

export function Header({ onFundClick }: HeaderProps) {
  const balance = useBalance();
  const { spent, saved, requests } = useSavings();
  const isConnected = useP402Store((s) => s.isConnected);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-neutral-900">
      <div className="flex items-center justify-between p-3.5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-p402-primary border-2 border-neutral-900 flex items-center justify-center">
            <span className="text-neutral-900 font-extrabold text-xl">P</span>
          </div>
          <div>
            <span className="font-bold text-lg text-neutral-900 tracking-tight">P402</span>
            <span className="text-neutral-500 text-xs ml-1.5 font-mono uppercase font-bold">SDK // v2</span>
          </div>
        </div>

        {/* Balance & Stats */}
        {isConnected && (
          <div className="flex items-center gap-3">
            {/* Savings Badge */}
            {saved > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono border-2 border-transparent px-2 py-1">
                <span className="text-neutral-500 font-bold uppercase">SAVED:</span>
                <span className="text-p402-success font-bold">{formatCost(saved)}</span>
              </div>
            )}

            {/* Balance */}
            <button
              onClick={onFundClick}
              className="flex items-center bg-white border-2 border-neutral-900 
                         hover:-translate-y-0.5 transition-transform active:translate-y-0"
            >
              <div className="px-3 py-1 text-right border-r-2 border-neutral-900">
                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider leading-none mb-0.5">Balance</div>
                <div className={`font-mono font-bold text-sm leading-none ${balance < 1 ? 'text-p402-warning' : 'text-neutral-900'}`}>
                  ${balance.toFixed(2)}
                </div>
              </div>
              <div className="w-8 h-8 bg-p402-primary flex items-center justify-center hover:bg-p402-primary-hover transition-colors">
                <span className="text-neutral-900 text-xl font-bold">+</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar (only show if has activity) */}
      {isConnected && requests > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 
                        border-b-2 border-neutral-900 text-xs font-mono">
          <div className="flex items-center gap-6">
            <span className="text-neutral-500">
              <span className="text-neutral-900 font-bold">{requests}</span> REQUESTS
            </span>
            <span className="text-neutral-500">
              <span className="text-neutral-900 font-bold">{formatCost(spent)}</span> SPENT
            </span>
          </div>
          <div className="text-p402-success font-bold">
            -{formatCost(saved)} SAVED
          </div>
        </div>
      )}
    </header>
  );
}
