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
import { TransactionHistory } from '@/components/TransactionHistory';
import { ToastContainer } from '@/components/Toast';

export default function Home() {
  const [isReady, setIsReady] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
        await new Promise(resolve => setTimeout(resolve, 100));

        if (typeof window !== 'undefined' && sdk?.actions?.ready) {
          sdk.actions.ready();
        }

        // Reconnect if wallet address persisted
        if (walletAddress) {
          try {
            await connect(walletAddress);
          } catch (e) {
            console.error('[P402] Reconnection failed:', e);
          }
        }

        if (isMounted) {
          setIsReady(true);
        }

        // Fallback ready signals for host detection
        [200, 500, 1000].forEach(delay => {
          setTimeout(() => {
            if (isMounted && sdk?.actions?.ready) {
              sdk.actions.ready();
            }
          }, delay);
        });
      } catch (error) {
        console.error('[P402] Initialization failure:', error);
        if (isMounted) setIsReady(true);
      }
    };

    init();
    return () => { isMounted = false; };
  }, [walletAddress, connect]);

  // Load providers when connected
  useEffect(() => {
    if (isConnected) {
      loadProviders();
    }
  }, [isConnected, loadProviders]);

  // Loading state
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

  // Connect screen
  if (!isConnected) {
    return <ConnectScreen onConnect={() => { }} />;
  }

  // Main app
  return (
    <main className="min-h-screen flex flex-col bg-black">
      <Header
        onFundClick={() => setShowFundModal(true)}
        onSettingsClick={() => setShowSettings(true)}
        onHistoryClick={() => setShowHistory(true)}
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

      {/* Overlays */}
      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
      />

      <FundModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
      />

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <TransactionHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </main>
  );
}
