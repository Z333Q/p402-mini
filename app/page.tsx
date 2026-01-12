'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useP402Store, useIsConnected } from '@/lib/store';

import { ConnectScreen } from '@/components/ConnectScreen';
import { Header } from '@/components/Header';
import { Chat } from '@/components/Chat';
import { ModelSelector } from '@/components/ModelSelector';
import { FundModal } from '@/components/FundModal';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);

  const isConnected = useIsConnected();
  const loadProviders = useP402Store((s) => s.loadProviders);
  const walletAddress = useP402Store((s) => s.walletAddress);
  const connect = useP402Store((s) => s.connect);

  // Initialize MiniKit SDK
  useEffect(() => {
    const init = async () => {
      try {
        // Signal app is ready
        await sdk.actions.ready();

        // Try to auto-reconnect if we have a stored wallet
        if (walletAddress) {
          await connect(walletAddress);
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setIsReady(true); // Still show UI even if init fails
      }
    };

    init();
  }, []);

  // Load providers when connected
  useEffect(() => {
    if (isConnected) {
      loadProviders();
    }
  }, [isConnected, loadProviders]);

  // Show loading state
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#B6FF2E] flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-black font-black text-3xl">P</span>
          </div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Show connect screen if not connected
  if (!isConnected) {
    return <ConnectScreen onConnect={() => {}} />;
  }

  // Main app
  return (
    <main className="min-h-screen flex flex-col bg-black">
      <Header onFundClick={() => setShowFundModal(true)} />
      
      <Chat
        onModelClick={() => setShowModelSelector(true)}
        onFundClick={() => setShowFundModal(true)}
      />

      {/* Model Selector Overlay */}
      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
      />

      {/* Fund Modal Overlay */}
      <FundModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
      />
    </main>
  );
}
