'use client';

import { useState } from 'react';
import { useP402Store } from '@/lib/store';
import { sdk } from '@farcaster/miniapp-sdk';

interface ConnectScreenProps {
  onConnect: () => void;
}

export function ConnectScreen({ onConnect }: ConnectScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const connect = useP402Store((s) => s.connect);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if we are in a Farcaster mini app environment
      const isInMiniApp = await sdk.isInMiniApp();

      let walletAddress: string;
      let userProfile: { username?: string; displayName?: string; pfpUrl?: string } | undefined;

      if (isInMiniApp) {
        // Get the user's context from the SDK
        const context = await sdk.context;

        if (!context?.user?.fid) {
          throw new Error('Unable to get user context from Farcaster host');
        }

        // In Base mini apps, we can get the wallet from context
        // Use the connected wallet if available, otherwise use FID
        walletAddress = (context as any).connectedWallet?.address ||
          `fid:${context.user.fid}`;

        userProfile = {
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
        };
      } else {
        // Fallback for browser testing/development
        console.warn('Not in mini app environment. Using browser fallback.');

        // Use a deterministic mock address for browser testing
        walletAddress = '0x0000000000000000000000000000000000000000';

        // Set a non-blocking message
        setError('Environment: Browser (Demo Mode Enabled)');
      }

      await connect(walletAddress, userProfile);
      onConnect();
    } catch (err) {
      console.error('Connect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
        {/* Logo */}
        <div className="w-28 h-28 bg-neutral-900 border-4 border-neutral-900 flex items-center justify-center mb-8 shadow-[8px_8px_0px_0px_rgba(182,255,46,1)]">
          {/* Replaced with Image if available, keeping fallback P for now but styled */}
          <img src="/logo_new.jpg" alt="P402" className="w-full h-full object-cover" onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }} />
          <span className="text-p402-primary font-black text-6xl hidden">P</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold mb-3 tracking-tighter text-neutral-900">
          P402<span className="text-p402-primary bg-neutral-900 px-2 ml-1">SDK</span>
        </h1>
        <p className="text-neutral-500 text-lg font-bold font-mono uppercase mb-10 tracking-wide">
          Intelligence / Payment / Protocol
        </p>

        {/* Value Props */}
        <div className="w-full max-w-sm space-y-4 mb-10">
          {[
            { title: 'INTELLIGENCE SUITE', desc: 'Direct access to GPT-5.2, Claude Opus, Gemini 3', icon: '⚡' },
            { title: 'AUTONOMOUS ROUTING', desc: 'Protocol selects cheapest path automatically', icon: '🔄' },
            { title: 'USDC NATIVE', desc: 'Streaming payments. No subs. No fees.', icon: '💰' }
          ].map((item) => (
            <div key={item.title} className="panel flex items-start gap-4 hover:-translate-y-1 transition-transform cursor-default">
              <div className="w-10 h-10 bg-neutral-900 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{item.icon}</span>
              </div>
              <div className="text-left">
                <div className="font-extrabold text-sm uppercase text-neutral-900">{item.title}</div>
                <div className="text-neutral-500 text-xs font-mono mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="w-full max-w-sm bg-p402-error/10 border-2 border-p402-error p-3.5 mb-6 text-sm text-center font-bold text-p402-error uppercase">
            ! {error}
          </div>
        )}

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full max-w-sm btn-primary flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
        >
          {isConnecting ? (
            <>
              <span className="w-5 h-5 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              <span>INITIALIZING...</span>
            </>
          ) : (
            <>
              <span className="text-xl">→</span>
              <span>CONNECT WALLET</span>
            </>
          )}
        </button>

        {/* Terms */}
        <p className="mt-8 text-[10px] text-neutral-400 font-mono uppercase max-w-xs">
          By connecting, you accept the{' '}
          <a href="https://p402.io/terms" className="text-neutral-900 hover:text-p402-info underline decoration-2 underline-offset-2">
            Protocol Terms
          </a>
        </p>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center border-t-2 border-neutral-200 bg-white">
        <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
          v2.0.4 • BUILD 8921 • 2026 • STATE: ONLINE
        </p>
      </footer>
    </div>
  );
}
