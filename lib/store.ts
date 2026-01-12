// P402 Mini App State Management (Zustand)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { p402 } from './p402-client';
import type {
  P402Session,
  P402Provider,
  ChatMessage,
  SpendSummary,
  DEFAULT_MODEL,
} from './types';

interface P402Store {
  // Connection
  isConnected: boolean;
  walletAddress: string | null;

  // Session
  session: P402Session | null;
  isLoadingSession: boolean;
  sessionError: string | null;

  // Providers/Models
  providers: P402Provider[];
  selectedModel: string;
  isLoadingProviders: boolean;

  // Chat
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;

  // Spend tracking
  totalSpent: number;
  totalSaved: number;
  requestCount: number;

  // Actions
  // User Profile
  userProfile: {
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null;

  // Actions
  connect: (address: string, profile?: { username?: string; displayName?: string; pfpUrl?: string }) => Promise<void>;
  disconnect: () => void;
  loadProviders: () => Promise<void>;
  selectModel: (modelId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  refreshSession: () => Promise<void>;
  fundSession: (amount: string, txHash?: string) => Promise<void>;
}

export const useP402Store = create<P402Store>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      walletAddress: null,
      userProfile: null, // Initial profile state
      session: null,
      isLoadingSession: false,
      sessionError: null,
      providers: [],
      selectedModel: 'openai/gpt-5.2-turbo',
      isLoadingProviders: false,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      totalSpent: 0,
      totalSaved: 0,
      requestCount: 0,

      // Connect wallet and create/load session
      connect: async (address: string, profile?: { username?: string; displayName?: string; pfpUrl?: string }) => {
        set({ isLoadingSession: true, sessionError: null });

        try {
          const session = await p402.getOrCreateSession(address);
          p402.setSession(session.session_id);

          set({
            isConnected: true,
            walletAddress: address,
            userProfile: profile || null, // Create profile
            session,
            isLoadingSession: false,
          });

          // Load providers after connecting
          get().loadProviders();
        } catch (error) {
          set({
            isLoadingSession: false,
            sessionError: error instanceof Error ? error.message : 'Failed to connect',
          });
        }
      },

      // Disconnect
      disconnect: () => {
        set({
          isConnected: false,
          walletAddress: null,
          session: null,
          messages: [],
          totalSpent: 0,
          totalSaved: 0,
          requestCount: 0,
        });
      },

      // Load available providers and models
      loadProviders: async () => {
        set({ isLoadingProviders: true });

        try {
          const { providers } = await p402.getProviders();
          set({ providers, isLoadingProviders: false });
        } catch (error) {
          console.error('Failed to load providers:', error);
          set({ isLoadingProviders: false });
        }
      },

      // Select a model
      selectModel: (modelId: string) => {
        set({ selectedModel: modelId });
      },

      // Send a chat message
      sendMessage: async (content: string) => {
        const { session, selectedModel, messages } = get();

        if (!session || session.balance_usdc <= 0) {
          throw new Error('Insufficient balance');
        }

        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'user',
          content,
          timestamp: Date.now(),
        };

        set({
          messages: [...messages, userMessage],
          isStreaming: true,
          streamingContent: '',
        });

        try {
          // Use streaming for better UX
          const response = await p402.chatStream({
            model: selectedModel,
            messages: [
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: 'user' as const, content },
            ],
            stream: true,
          });

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let finalCost: any = null;

          if (reader) {
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

                    // Capture final cost info
                    if (parsed.cost) {
                      finalCost = parsed.cost;
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          // Create assistant message with cost
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: fullContent,
            model: selectedModel,
            cost: finalCost || {
              input_tokens: 0,
              output_tokens: 0,
              total_cost: 0,
              direct_cost: 0,
              savings: 0,
              savings_percent: 0,
            },
            timestamp: Date.now(),
          };

          // Update state
          const newMessages = [...get().messages, assistantMessage];
          const newSpent = get().totalSpent + (finalCost?.total_cost || 0);
          const newSaved = get().totalSaved + (finalCost?.savings || 0);

          set({
            messages: newMessages,
            isStreaming: false,
            streamingContent: '',
            totalSpent: newSpent,
            totalSaved: newSaved,
            requestCount: get().requestCount + 1,
          });

          // Refresh session to get updated balance
          get().refreshSession();

        } catch (error) {
          set({ isStreaming: false, streamingContent: '' });
          throw error;
        }
      },

      // Clear chat history
      clearChat: () => {
        set({ messages: [] });
      },

      // Refresh session data
      refreshSession: async () => {
        const { session } = get();
        if (!session) return;

        try {
          const updated = await p402.getSession(session.session_id);
          set({ session: updated });
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      },

      // Fund the session
      fundSession: async (amount: string, txHash?: string) => {
        const { session } = get();
        if (!session) throw new Error('No active session');

        try {
          const result = await p402.fundSession({
            session_id: session.session_id,
            amount,
            tx_hash: txHash,
          });

          if (result.success) {
            set({ session: result.session });
          }
        } catch (error) {
          throw error;
        }
      },
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
      }),
    }
  )
);

// Selector hooks for performance
export const useSession = () => useP402Store((state) => state.session);
export const useBalance = () => useP402Store((state) => state.session?.balance_usdc ?? 0);
export const useIsConnected = () => useP402Store((state) => state.isConnected);
export const useMessages = () => useP402Store((state) => state.messages);
export const useIsStreaming = () => useP402Store((state) => state.isStreaming);
export const useSelectedModel = () => useP402Store((state) => state.selectedModel);
export const useProviders = () => useP402Store((state) => state.providers);
export const useUserProfile = () => useP402Store((state) => state.userProfile);
export const useSavings = () => useP402Store((state) => ({
  spent: state.totalSpent,
  saved: state.totalSaved,
  requests: state.requestCount,
}));
