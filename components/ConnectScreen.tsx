'use client';

import { useState, useEffect } from 'react';
import { useP402Store } from '@/lib/store';
import { sdk } from '@farcaster/miniapp-sdk';

interface ConnectScreenProps {
  onConnect: () => void;
}

export function ConnectScreen({ onConnect }: ConnectScreenProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInFarcaster, setIsInFarcaster] = useState<boolean | null>(null);
  const [farcasterUrl, setFarcasterUrl] = useState('');
  const connect = useP402Store((s) => s.connect);

  // Detect environment on mount
  useEffect(() => {
    async function detectEnvironment() {
      try {
        const inMiniApp = await sdk.isInMiniApp();
        setIsInFarcaster(inMiniApp);
      } catch {
        setIsInFarcaster(false);
      }
    }
    detectEnvironment();
    setFarcasterUrl(`https://warpcast.com/~/mini-app?url=${encodeURIComponent(window.location.href)}`);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const isInMiniApp = await sdk.isInMiniApp();

      if (!isInMiniApp) {
        setError('Please open P402 Mini in the Farcaster app for wallet access.');
        return;
      }

      const context = await sdk.context;

      if (!context?.user?.fid) {
        throw new Error('Unable to get user context from Farcaster');
      }

      // Wallet detection priority:
      // 1. Connected wallet from context
      // 2. Verified Ethereum addresses from Farcaster profile
      // 3. Custody address
      // 4. FID-based identifier as last resort
      const contextAny = context as any;
      const walletAddress =
        contextAny.connectedWallet?.address ||
        contextAny.user.verifiedAddresses?.ethAddresses?.[0] ||
        contextAny.custodyAddress ||
        `fid:${context.user.fid}`;

      const userProfile = {
        username: context.user.username,
        displayName: context.user.displayName,
        pfpUrl: context.user.pfpUrl,
        fid: context.user.fid,
      };

      await connect(walletAddress, userProfile);
      onConnect();
    } catch (err) {
      console.error('Connect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  // Loading state while detecting environment
  if (isInFarcaster === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-16 h-16 bg-[#B6FF2E] flex items-center justify-center animate-pulse">
          <span className="text-black font-black text-3xl">P</span>
        </div>
      </div>
    );
  }

  // Browser fallback: Farcaster required
  if (!isInFarcaster) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
        <img src="/icon.png" alt="P402" className="w-20 h-20 mb-8 border-2 border-black rounded-lg" />

        <h1 className="text-white text-2xl font-bold mb-2 text-center">
          Open in Farcaster
        </h1>
        <p className="text-gray-400 text-sm mb-8 text-center max-w-xs">
          P402 Mini requires Farcaster for secure wallet connection and USDC payments on Base.
        </p>

        {/* Instructions */}
        <div className="w-full max-w-xs mb-8 space-y-3">
          <div className="flex items-center gap-3 text-gray-300 text-sm">
            <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
              <span className="text-black text-xs font-bold">1</span>
            </div>
            <span>Install Warpcast on your device</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300 text-sm">
            <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
              <span className="text-black text-xs font-bold">2</span>
            </div>
            <span>Open the link below in Warpcast</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300 text-sm">
            <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
              <span className="text-black text-xs font-bold">3</span>
            </div>
            <span>Connect your Base wallet and start</span>
          </div>
        </div>

        {/* Open in Farcaster */}
        <a
          href={farcasterUrl}
          className="w-full max-w-xs px-6 py-4 bg-[#B6FF2E] text-black font-bold text-sm uppercase
                     border-2 border-black text-center block
                     transition-transform duration-75 hover:-translate-y-0.5 active:translate-y-0"
        >
          Open in Farcaster
        </a>

        {/* Copy URL fallback */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setError('Link copied! Paste it in Warpcast.');
          }}
          className="mt-3 text-gray-500 text-xs hover:text-gray-400 underline"
        >
          Copy link to clipboard
        </button>

        {error && (
          <p className="mt-4 text-sm text-center max-w-xs text-gray-400">
            {error}
          </p>
        )}

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

  // Farcaster context: Normal connection flow
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4">
      <img src="/icon.png" alt="P402" className="w-20 h-20 mb-8 border-2 border-black rounded-lg" />

      <h1 className="text-white text-2xl font-bold mb-2 text-center">
        P402
      </h1>
      <p className="text-gray-400 text-sm mb-8 text-center max-w-xs">
        Access 100+ AI models. Pay with USDC. Save up to 70%.
      </p>

      <div className="w-full max-w-xs mb-8 space-y-3">
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs">&#10003;</span>
          </div>
          <span>GPT-5.2, Claude 4.5, Gemini 3 & more</span>
        </div>
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs">&#10003;</span>
          </div>
          <span>Smart routing saves you money</span>
        </div>
        <div className="flex items-center gap-3 text-gray-300 text-sm">
          <div className="w-6 h-6 bg-[#B6FF2E] flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xs">&#10003;</span>
          </div>
          <span>Pay per request with USDC</span>
        </div>
      </div>

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

      {error && (
        <p className="mt-4 text-sm text-center max-w-xs text-red-400">
          {error}
        </p>
      )}

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
