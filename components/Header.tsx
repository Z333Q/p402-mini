'use client';

import { useP402Store, useBalance, useSavings } from '@/lib/store';
import { formatCost } from '@/lib/p402-client';

interface HeaderProps {
  onFundClick: () => void;
  onSettingsClick: () => void;
  onHistoryClick: () => void;
  activeView: 'chat' | 'audit' | 'agents';
  onViewChange: (view: 'chat' | 'audit' | 'agents') => void;
}

function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export function Header({ onFundClick, onSettingsClick, onHistoryClick, activeView, onViewChange }: HeaderProps) {
  const balance = useBalance();
  const { spent, saved, requests } = useSavings();
  const isConnected = useP402Store((s) => s.isConnected);
  const transactionCount = useP402Store((s) => s.transactions.length);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-neutral-900">
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/icon.png" alt="P402" className="w-8 h-8 border-2 border-black rounded" />
          <div className="hidden sm:block">
            <span className="font-bold text-base text-neutral-900 tracking-tight">P402</span>
            <span className="text-neutral-500 text-[10px] ml-1.5 font-mono uppercase font-bold">v2</span>
          </div>
        </div>

        {/* View Switcher */}
        {isConnected && (
          <nav className="flex items-center bg-neutral-100 border-2 border-neutral-900 p-0.5 flex-shrink-0">
            {(['chat', 'audit', 'agents'] as const).map((view) => (
              <button
                key={view}
                onClick={() => onViewChange(view)}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter transition-all ${
                  activeView === view
                    ? 'bg-neutral-900 text-p402-primary'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'
                }`}
              >
                {view}
              </button>
            ))}
          </nav>
        )}

        {/* Balance & Actions */}
        {isConnected && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Savings badge — visible on sm+ */}
            {saved > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono border border-neutral-200 px-2 py-1 bg-neutral-50">
                <span className="text-neutral-500 font-bold uppercase">SAVED</span>
                <span className="text-p402-success font-bold">{formatCost(saved)}</span>
              </div>
            )}

            {/* Balance button */}
            <button
              onClick={onFundClick}
              className="flex items-center bg-white border-2 border-neutral-900
                         hover:-translate-y-0.5 active:translate-y-0 transition-transform
                         shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
            >
              <div className="px-2.5 py-1 border-r-2 border-neutral-900 text-right">
                <div className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider leading-none mb-0.5">BAL</div>
                <div className={`font-mono font-bold text-sm leading-none ${balance < 1 ? 'text-p402-warning' : 'text-neutral-900'}`}>
                  ${balance.toFixed(2)}
                </div>
              </div>
              <div className="w-7 h-full bg-p402-primary flex items-center justify-center px-1.5 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
            </button>

            {/* History */}
            <button
              onClick={onHistoryClick}
              className="w-9 h-9 bg-white border-2 border-neutral-900 flex items-center justify-center
                         hover:bg-neutral-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                         hover:shadow-none hover:translate-y-0.5 transition-all relative"
              title="Transaction History"
              aria-label="Transaction History"
            >
              <IconHistory />
              {transactionCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-p402-primary border border-neutral-900
                                 text-[9px] font-bold flex items-center justify-center leading-none">
                  {transactionCount > 9 ? '9+' : transactionCount}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={onSettingsClick}
              className="w-9 h-9 bg-white border-2 border-neutral-900 flex items-center justify-center
                         hover:bg-neutral-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                         hover:shadow-none hover:translate-y-0.5 transition-all"
              title="Settings"
              aria-label="Settings"
            >
              <IconSettings />
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {isConnected && requests > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100
                        border-b-2 border-neutral-900 text-[10px] font-mono overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 whitespace-nowrap">
            <span className="text-neutral-500">
              <span className="text-neutral-900 font-bold">{requests}</span> REQUESTS
            </span>
            <span className="text-neutral-500">
              <span className="text-neutral-900 font-bold">{formatCost(spent)}</span> SPENT
            </span>
          </div>
          {saved > 0 && (
            <div className="text-p402-success font-bold whitespace-nowrap ml-4">
              -{formatCost(saved)} SAVED
            </div>
          )}
        </div>
      )}
    </header>
  );
}
