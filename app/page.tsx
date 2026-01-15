'use client';

import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useP402Store, useIsConnected } from '@/lib/store';

import { ConnectScreen } from '@/components/ConnectScreen';
import { Header } from '@/components/Header';
import { Chat } from '@/components/Chat';
import { ModelSelector } from '@/components/ModelSelector';
import { FundModal } from '@/components/FundModal';
import { AuditTool } from '@/components/AuditTool';
import { SettingsModal } from '@/components/SettingsModal';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'audit'>('chat');

  const isConnected = useIsConnected();
  const loadProviders = useP402Store((s) => s.loadProviders);
  const walletAddress = useP402Store((s) => s.walletAddress);
  const connect = useP402Store((s) => s.connect);

  // Initialize MiniKit SDK
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Signal ready as early as possible
        sdk.actions.ready();

        // Reconnect if needed
        if (walletAddress) {
          await connect(walletAddress);
        }

        if (isMounted) setIsReady(true);

        // Fallback: Signal ready again after UI should be rendered
        setTimeout(() => {
          if (isMounted) {
            sdk.actions.ready();
            console.log('Farcaster SDK signaled ready (retry)');
          }
        }, 500);
      } catch (error) {
        console.error('Failed to initialize:', error);
        if (isMounted) setIsReady(true);
      }
    };

    init();
    return () => { isMounted = false; };
  }, []); // Run only once on mount

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
    return <ConnectScreen onConnect={() => { }} />;
  }

  // Main app
  return (
    <main className="min-h-screen flex flex-col bg-black">
      <Header
        onFundClick={() => setShowFundModal(true)}
        onSettingsClick={() => setShowSettings(true)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {activeView === 'chat' ? (
        <Chat
          onModelClick={() => setShowModelSelector(true)}
          onFundClick={() => setShowFundModal(true)}
        />
      ) : (
        <AuditTool />
      )}

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

      {/* Settings Modal Overlay */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </main>
  );
}
