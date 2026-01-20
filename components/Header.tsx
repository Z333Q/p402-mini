'use client';

import { useP402Store, useBalance, useSavings } from '@/lib/store';
import { formatCost } from '@/lib/p402-client';
import { P402Logo } from './P402Logo';

interface HeaderProps {
  onFundClick: () => void;
  onSettingsClick: () => void;
  activeView: 'chat' | 'audit';
  onViewChange: (view: 'chat' | 'audit') => void;
}

export function Header({ onFundClick, onSettingsClick, activeView, onViewChange }: HeaderProps) {
  const balance = useBalance();
  const { spent, saved, requests } = useSavings();
  const isConnected = useP402Store((s) => s.isConnected);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-neutral-900">
      <div className="flex items-center justify-between p-3.5">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <P402Logo size="md" />
          <div>
            <span className="font-bold text-lg text-neutral-900 tracking-tight">P402</span>
            <span className="text-neutral-500 text-xs ml-1.5 font-mono uppercase font-bold">SDK // v2</span>
          </div>
        </div>

        {/* View Switcher */}
        {isConnected && (
          <nav className="flex items-center bg-neutral-100 border-2 border-neutral-900 p-1">
            <button
              onClick={() => onViewChange('chat')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter transition-all ${activeView === 'chat' ? 'bg-neutral-900 text-p402-primary' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
              Chat
            </button>
            <button
              onClick={() => onViewChange('audit')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-tighter transition-all ${activeView === 'audit' ? 'bg-neutral-900 text-p402-primary' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
              Audit
            </button>
          </nav>
        )}

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

            {/* Settings Button */}
            <button
              onClick={onSettingsClick}
              className="w-10 h-10 bg-white border-2 border-neutral-900 flex items-center justify-center
                         hover:bg-neutral-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-xl">⚙</span>
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
