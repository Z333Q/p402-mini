'use client';

import { useState } from 'react';
import { useP402Store } from '@/lib/store';
import { sdk } from '@farcaster/miniapp-sdk';
import { P402Logo } from './P402Logo';

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
      let userProfile: {
        username?: string;
        displayName?: string;
        pfpUrl?: string;
        fid?: number;
      } | undefined;

      if (isInMiniApp) {
        // Get the user's context from the SDK
        const context = await sdk.context;

        if (!context?.user?.fid) {
          throw new Error('Unable to get user context from Farcaster host');
        }

        // Cast to any to access all possible wallet fields
        const contextAny = context as any;

        // Priority order for wallet detection:
        // 1. Connected wallet from context (if user connected externally)
        // 2. Verified Ethereum addresses from Farcaster profile
        // 3. Custody address
        // 4. FID-based identifier as last resort
        walletAddress =
          contextAny.connectedWallet?.address ||
          contextAny.user.verifiedAddresses?.ethAddresses?.[0] ||
          contextAny.custodyAddress ||
          `fid:${context.user.fid}`;

        userProfile = {
          username: context.user.username,
          displayName: context.user.displayName,
          pfpUrl: context.user.pfpUrl,
          fid: context.user.fid,
        };

        console.log('[P402] Connected with wallet:', walletAddress);
        console.log('[P402] User FID:', context.user.fid);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      {/* Logo */}
      <P402Logo size="xl" className="mb-8" />

      {/* Title */}
      <h1 className="text-white text-2xl font-bold mb-2 text-center">
        P402
      </h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-xs">
        Access 100+ AI models. Pay with USDC. Save up to 70%.
      </p>

      {/* Features */}
      <div className="w-full max-w-xs mb-8 space-y-3">
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs">✓</span>
          </div>
          <span>GPT-5.2, Claude 4.5, Gemini 3 & more</span>
        </div>
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs">✓</span>
          </div>
          <span>Smart routing saves you money</span>
        </div>
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs">✓</span>
          </div>
          <span>Pay per request with USDC</span>
        </div>
      </div>

      {/* Connect Button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`
          w-full max-w-xs px-6 py-4 
          bg-[#B6FF2E] text-black font-bold text-sm uppercase
          border-2 border-black
          transition-transform duration-75
          ${isConnecting ? 'opacity-50' : 'hover:-translate-y-0.5 active:translate-y-0'}
          disabled:cursor-not-allowed
        `}
      >
        {isConnecting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            CONNECTING...
          </span>
        ) : (
          'CONNECT WALLET'
        )}
      </button>

      {/* Error/Status Message */}
      {error && (
        <p
          className={`mt-4 text-sm text-center max-w-xs ${error.includes('Demo Mode') ? 'text-gray-500' : 'text-red-400'
            }`}
        >
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 text-xs">
          Powered by{' '}
          <a
            href="https://p402.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#22D3EE] hover:underline"
          >
            P402.io
          </a>
        </p>
      </div>
    </div>
  );
}
