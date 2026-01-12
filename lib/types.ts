// P402 Mini App Types

export interface P402Session {
  session_id: string;
  wallet_address: string;
  balance_usdc: number;
  budget_total: number;
  budget_spent: number;
  status: 'active' | 'paused' | 'exhausted';
  created_at: string;
  expires_at: string;
}

export interface P402Provider {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  models: P402Model[];
}

export interface P402Model {
  id: string;
  name: string;
  provider: string;
  tier: 'flagship' | 'balanced' | 'efficient' | 'budget';
  context_window: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  capabilities: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: string;
  cost?: MessageCost;
  timestamp: number;
}

export interface MessageCost {
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  direct_cost: number;  // What it would cost going direct
  savings: number;
  savings_percent: number;
}

export interface ChatRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  id: string;
  model: string;
  provider: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost: MessageCost;
}

export interface FundRequest {
  session_id: string;
  amount: string;  // USDC amount as string
  tx_hash?: string;
}

export interface FundResponse {
  success: boolean;
  session: P402Session;
  tx_hash?: string;
}

export interface SpendSummary {
  total_spent: number;
  total_saved: number;
  total_requests: number;
  by_provider: Record<string, number>;
  by_model: Record<string, number>;
}

// UI State
export interface AppState {
  // Connection
  isConnected: boolean;
  walletAddress: string | null;

  // Session
  session: P402Session | null;
  isLoadingSession: boolean;

  // Providers/Models
  providers: P402Provider[];
  selectedModel: string;

  // Chat
  messages: ChatMessage[];
  isStreaming: boolean;

  // Spend tracking
  spendSummary: SpendSummary | null;

  // Actions
  connect: (address: string) => Promise<void>;
  disconnect: () => void;
  fund: (amount: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  selectModel: (modelId: string) => void;
  clearChat: () => void;
}

// Constants
export const DEFAULT_MODEL = 'gpt-5.2-turbo';

export const MODEL_TIERS: Record<string, { label: string; color: string }> = {
  flagship: { label: 'FLAGSHIP', color: '#B6FF2E' },
  balanced: { label: 'BALANCED', color: '#22D3EE' },
  efficient: { label: 'EFFICIENT', color: '#22C55E' },
  budget: { label: 'BUDGET', color: '#F59E0B' },
};
