import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { p402, formatCost, formatSavings } from './p402-client';
import type {
  AppStore,
  P402Session,
  P402Provider,
  ChatMessage,
  MessageCost,
  RoutingMode,
} from './types';

// Default model to use
const DEFAULT_MODEL = 'groq/llama-3.3-70b-versatile';

// Create store with persistence
export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ============================================
      // Initial State
      // ============================================

      // Connection state
      isConnected: false,
      walletAddress: null,
      session: null,

      // UI state
      isLoading: false,
      isStreaming: false,
      streamingContent: '',
      error: null,

      // Providers
      providers: [],
      isLoadingProviders: false,
      selectedModel: DEFAULT_MODEL,

      // Chat
      messages: [],

      // Analytics
      totalSpent: 0,
      totalSaved: 0,
      requestCount: 0,

      // Settings
      routingMode: 'cost' as RoutingMode,
      useCache: true,

      // ============================================
      // Actions
      // ============================================

      // Connect wallet and get/create session
      connect: async (walletAddress: string) => {
        set({ isLoading: true, error: null });

        try {
          const session = await p402.getOrCreateSession(walletAddress);

          set({
            isConnected: true,
            walletAddress: walletAddress.toLowerCase(),
            session,
            isLoading: false,
          });

          // Load providers in background
          get().loadProviders();
        } catch (error) {
          console.error('Connection error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to connect',
          });
          throw error;
        }
      },

      // Disconnect and clear state
      disconnect: () => {
        p402.clearSession();
        set({
          isConnected: false,
          walletAddress: null,
          session: null,
          messages: [],
          totalSpent: 0,
          totalSaved: 0,
          requestCount: 0,
          error: null,
        });
      },

      // Load available providers and models
      loadProviders: async () => {
        set({ isLoadingProviders: true });

        try {
          const { providers } = await p402.getProviders(true);
          set({ providers, isLoadingProviders: false });
        } catch (error) {
          console.error('Failed to load providers:', error);
          set({
            isLoadingProviders: false,
            // Don't set error - providers are non-critical
          });
        }
      },

      // Select a model
      selectModel: (modelId: string) => {
        set({ selectedModel: modelId });
      },

      // Send a chat message
      sendMessage: async (content: string) => {
        const { session, selectedModel, messages, routingMode, useCache } = get();

        if (!session) {
          throw new Error('No active session');
        }

        if (session.balance_usdc <= 0) {
          set({ error: 'Insufficient balance. Please add funds.' });
          throw new Error('Insufficient balance');
        }

        // Create user message
        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_user`,
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        // Add user message and start streaming
        set({
          messages: [...messages, userMessage],
          isStreaming: true,
          streamingContent: '',
          error: null,
        });

        try {
          // Build message history for context
          const messageHistory = [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user' as const, content },
          ];

          // Use streaming for better UX
          const response = await p402.chatStream({
            model: selectedModel,
            messages: messageHistory,
            stream: true,
            p402: {
              mode: routingMode,
              cache: useCache,
            },
          });

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let finalCost: MessageCost | null = null;
          let modelUsed = selectedModel;
          let providerUsed = '';
          let wasCached = false;
          let latencyMs = 0;

          if (reader) {
            const startTime = Date.now();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(data);

                    // Handle content delta
                    if (parsed.choices?.[0]?.delta?.content) {
                      fullContent += parsed.choices[0].delta.content;
                      set({ streamingContent: fullContent });
                    }

                    // Capture model/provider info
                    if (parsed.model) {
                      modelUsed = parsed.model;
                    }

                    // Handle final cost info (sent in last chunk)
                    if (parsed.cost) {
                      finalCost = parsed.cost;
                    }

                    // Handle p402 metadata
                    if (parsed.p402_metadata) {
                      providerUsed = parsed.p402_metadata.provider || '';
                      wasCached = parsed.p402_metadata.cached || false;
                      latencyMs = parsed.p402_metadata.latency_ms || 0;
                    }
                  } catch (e) {
                    // Ignore JSON parse errors for incomplete chunks
                  }
                }
              }
            }

            // Calculate latency if not provided
            if (!latencyMs) {
              latencyMs = Date.now() - startTime;
            }
          }

          // Create assistant message
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_assistant`,
            role: 'assistant',
            content: fullContent,
            model: modelUsed,
            provider: providerUsed,
            cost: finalCost || undefined,
            latency_ms: latencyMs,
            cached: wasCached,
            timestamp: Date.now(),
          };

          // Update state
          const currentMessages = get().messages;
          const { totalSpent, totalSaved, requestCount } = get();

          set({
            messages: [...currentMessages, assistantMessage],
            isStreaming: false,
            streamingContent: '',
            totalSpent: totalSpent + (finalCost?.total_cost || 0),
            totalSaved: totalSaved + (finalCost?.savings || 0),
            requestCount: requestCount + 1,
          });

          // Refresh session balance
          try {
            const updatedSession = await p402.getBalance();
            set({
              session: {
                ...get().session!,
                balance_usdc: updatedSession.balance_usdc,
                budget_spent: updatedSession.budget_spent,
              }
            });
          } catch (e) {
            // Non-critical - balance will refresh on next interaction
          }

        } catch (error) {
          console.error('Chat error:', error);

          // Remove user message on error
          set({
            messages: get().messages.slice(0, -1),
            isStreaming: false,
            streamingContent: '',
            error: error instanceof Error ? error.message : 'Failed to send message',
          });

          throw error;
        }
      },

      // Fund session
      fundSession: async (amount: string, txHash?: string) => {
        const { session } = get();

        if (!session) {
          throw new Error('No active session');
        }

        set({ isLoading: true, error: null });

        try {
          const result = await p402.fundSession({
            session_id: session.session_id,
            amount,
            tx_hash: txHash,
            source: 'base_pay',
          });

          if (result.success && result.session) {
            set({
              session: result.session,
              isLoading: false,
            });
          } else {
            throw new Error('Funding failed');
          }
        } catch (error) {
          console.error('Fund error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fund session',
          });
          throw error;
        }
      },

      // Set routing mode
      setRoutingMode: (mode: RoutingMode) => {
        set({ routingMode: mode });
      },

      // Set cache preference
      setUseCache: (useCache: boolean) => {
        set({ useCache });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Clear messages
      clearMessages: () => {
        set({ messages: [] });
      },
    }),
    {
      name: 'p402-mini-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        selectedModel: state.selectedModel,
        routingMode: state.routingMode,
        useCache: state.useCache,
        // Note: Don't persist session/wallet - require reconnection
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectBalance = (state: AppStore) => state.session?.balance_usdc ?? 0;
export const selectIsReady = (state: AppStore) => state.isConnected && state.session !== null;
export const selectCanSend = (state: AppStore) =>
  state.isConnected &&
  state.session !== null &&
  state.session.balance_usdc > 0 &&
  !state.isStreaming;

export const selectSavingsPercent = (state: AppStore) => {
  const total = state.totalSpent + state.totalSaved;
  if (total === 0) return 0;
  return Math.round((state.totalSaved / total) * 100);
};

export const selectFormattedBalance = (state: AppStore) =>
  formatCost(state.session?.balance_usdc ?? 0);

export const selectFormattedSpent = (state: AppStore) =>
  formatCost(state.totalSpent);

export const selectFormattedSaved = (state: AppStore) =>
  formatCost(state.totalSaved);

// ============================================
// Legacy compatibility Hooks
// ============================================

export const useP402Store = useStore;

export const useBalance = () => useStore(selectBalance);
export const useIsStreaming = () => useStore((s) => s.isStreaming);
export const useUserProfile = () => useStore((s) => ({
  walletAddress: s.walletAddress,
  isConnected: s.isConnected,
  session: s.session,
  username: s.walletAddress ? `${s.walletAddress.slice(0, 6)}...${s.walletAddress.slice(-4)}` : undefined,
  pfpUrl: undefined
}));
export const useSavings = () => useStore((s) => ({
  totalSaved: s.totalSaved,
  savingsPercent: selectSavingsPercent(s),
  spent: s.totalSpent,
  saved: s.totalSaved,
  requests: s.requestCount
}));
export const useProviders = () => useStore((s) => s.providers);
export const useSelectedModel = () => useStore((s) => s.selectedModel);
export const useIsConnected = () => useStore((s) => s.isConnected);
export const useMessages = () => useStore((s) => s.messages);
