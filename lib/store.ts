/**
 * P402 Mini App State Store
 * ==========================
 * Zustand store for managing application state.
 * 
 * Last Updated: 2026-01-20
 * Aligned with: p402-router V2 API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { p402 } from './p402-client';
import type { P402Session, P402Provider, P402Model, ChatMessage, UserProfile } from './types';

// ============================================
// STATE INTERFACE
// ============================================

interface P402State {
  // Connection state
  isConnected: boolean;
  walletAddress: string | null;
  userProfile: UserProfile | null;

  // Session state
  session: P402Session | null;

  // Chat state
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamingContent: string;
  streamingContent: string; // Alias for backward compatibility

  // Provider state
  providers: P402Provider[];
  selectedModel: P402Model | null;

  // Settings
  routingMode: 'cost' | 'quality' | 'speed' | 'balanced';
  useCache: boolean;

  // Analytics
  totalSpent: number;
  totalSaved: number;
  requestCount: number;

  // Actions
  connect: (walletAddress: string, userProfile?: UserProfile) => Promise<void>;
  disconnect: () => void;
  loadProviders: () => Promise<void>;
  selectModel: (model: P402Model | string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  fundSession: (amount: string, txHash?: string) => Promise<void>;
  setRoutingMode: (mode: 'cost' | 'quality' | 'speed' | 'balanced') => void;
  setUseCache: (useCache: boolean) => void;
  refreshSession: () => Promise<void>;
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useP402Store = create<P402State>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      walletAddress: null,
      userProfile: null,
      session: null,
      messages: [],
      isStreaming: false,
      currentStreamingContent: '',
      streamingContent: '',
      providers: [],
      selectedModel: null,
      routingMode: 'balanced',
      useCache: true,
      totalSpent: 0,
      totalSaved: 0,
      requestCount: 0,

      // ============================================
      // CONNECTION ACTIONS
      // ============================================

      connect: async (walletAddress: string, userProfile?: UserProfile) => {
        try {
          const session = await p402.getOrCreateSession(walletAddress);

          set({
            isConnected: true,
            walletAddress,
            userProfile: userProfile || null,
            // Normalize session to ensure both id and session_id are available
            session: {
              ...session,
              id: session.id || session.session_id,
              session_id: session.session_id || session.id,
            } as P402Session,
          });
        } catch (error) {
          console.error('Failed to connect:', error);
          throw error;
        }
      },

      disconnect: () => {
        p402.setSession('');
        set({
          isConnected: false,
          walletAddress: null,
          userProfile: null,
          session: null,
          messages: [],
          isStreaming: false,
          currentStreamingContent: '',
        });
      },

      // ============================================
      // SESSION ACTIONS
      // ============================================

      refreshSession: async () => {
        const { session } = get();
        if (!session) return;

        try {
          const sessionId = (session.id || session.session_id) as string;
          const updated = await p402.getSession(sessionId);
          set({
            session: {
              ...updated,
              id: updated.id || updated.session_id,
              session_id: updated.session_id || updated.id,
            } as P402Session,
          });
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      },

      fundSession: async (amount: string, txHash?: string) => {
        const { session } = get();
        if (!session) throw new Error('No active session');

        try {
          const sessionId = session.id || session.session_id;
          const result = await p402.fundSession({
            session_id: sessionId as string,
            amount,
            tx_hash: txHash,
            source: 'base_pay',
          });

          if (result.success && result.session) {
            set({
              session: {
                ...result.session,
                id: result.session.id || result.session.session_id,
                session_id: result.session.session_id || result.session.id,
              } as P402Session,
            });
          }
        } catch (error) {
          console.error('Failed to fund session:', error);
          throw error;
        }
      },

      // ============================================
      // PROVIDER ACTIONS
      // ============================================

      loadProviders: async () => {
        try {
          const { providers } = await p402.getProviders();
          set({ providers });

          // Auto-select first available model if none selected
          const { selectedModel } = get();
          if (!selectedModel && providers.length > 0) {
            const firstProvider = providers.find((p) => p.models?.length > 0);
            if (firstProvider?.models?.[0]) {
              set({ selectedModel: firstProvider.models[0] });
            }
          }
        } catch (error) {
          console.error('Failed to load providers:', error);
        }
      },

      selectModel: (model: P402Model | string) => {
        if (typeof model === 'string') {
          // Find model by ID across all providers
          const { providers } = get();
          for (const p of providers) {
            const m = p.models.find(m => `${p.id}/${m.id}` === model || m.id === model);
            if (m) {
              set({ selectedModel: m });
              return;
            }
          }
        } else {
          set({ selectedModel: model });
        }
      },

      // ============================================
      // CHAT ACTIONS
      // ============================================

      sendMessage: async (content: string) => {
        const { session, selectedModel, messages, routingMode, useCache } = get();

        if (!session) throw new Error('No active session');
        if (!content.trim()) return;

        // Add user message
        const userMessage: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: 'user',
          content
        };
        set({
          messages: [...messages, userMessage],
          isStreaming: true,
          currentStreamingContent: '',
        });

        try {
          const sessionId = (session.id || session.session_id) as string;
          p402.setSession(sessionId);

          const response = await p402.chatStream({
            model: selectedModel?.id,
            messages: [...messages, userMessage],
            stream: true,
            p402: {
              mode: routingMode,
              cache: useCache,
              session_id: sessionId as string,
            },
          });

          // Parse streaming response
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';
          let fullContent = '';
          let metadata: any = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);

                  // Check for content
                  const deltaContent = parsed.choices?.[0]?.delta?.content;
                  if (deltaContent) {
                    fullContent += deltaContent;
                    set({
                      currentStreamingContent: fullContent,
                      streamingContent: fullContent // Update alias
                    });
                  }

                  // Check for final metadata
                  if (parsed.p402_metadata) {
                    metadata = parsed.p402_metadata;
                  }
                } catch (e) {
                  // Ignore parse errors for partial chunks
                }
              }
            }
          }

          // Add assistant message
          const assistantMessage: ChatMessage = {
            id: Math.random().toString(36).substring(7),
            role: 'assistant',
            content: fullContent,
            model: metadata?.model,
            latency_ms: metadata?.latency_ms,
            cached: metadata?.cached,
            cost: metadata ? {
              total_cost: metadata.cost_usd,
              input_tokens: metadata.tokens_prompt || 0,
              output_tokens: metadata.tokens_generated || 0,
              direct_cost: metadata.cost_usd * 1.5, // Estimated traditional cost
              savings: (metadata.cost_usd * 1.5) - metadata.cost_usd,
            } : undefined
          };

          // Update analytics if we got metadata
          if (metadata) {
            const currentSpent = get().totalSpent;
            const currentRequests = get().requestCount;
            set({
              totalSpent: currentSpent + (metadata.cost_usd || 0),
              requestCount: currentRequests + 1,
            });
          }

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isStreaming: false,
            currentStreamingContent: '',
            streamingContent: '',
          }));

          // Refresh session to get updated balance
          get().refreshSession();
        } catch (error) {
          console.error('Chat error:', error);
          set({
            isStreaming: false,
            currentStreamingContent: '',
          });
          throw error;
        }
      },

      clearMessages: () => {
        set({ messages: [], currentStreamingContent: '' });
      },

      // ============================================
      // SETTINGS ACTIONS
      // ============================================

      setRoutingMode: (mode) => set({ routingMode: mode }),
      setUseCache: (useCache) => set({ useCache }),
    }),
    {
      name: 'p402-miniapp-storage',
      partialize: (state) => ({
        // Only persist these fields
        walletAddress: state.walletAddress,
        selectedModel: state.selectedModel,
        totalSpent: state.totalSpent,
        totalSaved: state.totalSaved,
        requestCount: state.requestCount,
        routingMode: state.routingMode,
        useCache: state.useCache,
      }),
    }
  )
);

// Alias for backward compatibility
export const useStore = useP402Store;

// ============================================
// SELECTOR HOOKS
// ============================================

export const useSession = () => useP402Store((state) => state.session);
export const useBalance = () =>
  useP402Store((state) => state.session?.balance_usdc ?? state.session?.budget?.remaining_usd ?? 0);
export const useIsConnected = () => useP402Store((state) => state.isConnected);
export const useMessages = () => useP402Store((state) => state.messages);
export const useIsStreaming = () => useP402Store((state) => state.isStreaming);
export const useStreamingContent = () => useP402Store((state) => state.currentStreamingContent || state.streamingContent);
export const useSelectedModel = () => useP402Store((state) => {
  const model = state.selectedModel;
  if (!model) return '';
  // Try to find provider to reconstruct full ID if needed by component
  const providers = state.providers;
  for (const p of providers) {
    if (p.models.find(m => m.id === model.id)) {
      return `${p.id}/${model.id}`;
    }
  }
  return model.id;
});
export const useProviders = () => useP402Store((state) => state.providers);
export const useUserProfile = () => useP402Store((state) => state.userProfile);
export const useSavings = () =>
  useP402Store((state) => ({
    spent: state.totalSpent,
    saved: state.totalSaved,
    requests: state.requestCount,
  }));
export const useRoutingMode = () => useP402Store((state) => state.routingMode);
export const useUseCache = () => useP402Store((state) => state.useCache);
