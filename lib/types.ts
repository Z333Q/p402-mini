// P402 Mini App Types
// Last Updated: January 2025

// ============================================
// CONSTANTS
// ============================================

export const MODEL_TIERS = {
  flagship: { label: 'Flagship', description: 'Best capability, highest cost', color: '#a855f7' },
  balanced: { label: 'Balanced', description: 'Good trade-off between cost & quality', color: '#22c55e' },
  efficient: { label: 'Efficient', description: 'Fast, lower capability', color: '#eab308' },
  budget: { label: 'Budget', description: 'Lowest cost, basic tasks', color: '#94a3b8' },
} as const;

// ============================================
// SESSION TYPES
// ============================================

export interface P402Session {
  session_id: string;
  wallet_address: string;
  balance_usdc: number;
  budget_total: number;
  budget_spent: number;
  status: 'active' | 'paused' | 'exhausted' | 'expired' | 'revoked';
  created_at: string;
  expires_at: string;
  source?: string;
}

export interface CreateSessionRequest {
  wallet_address: string;
  budget_usd?: number;
  source?: string;
}

export interface CreateSessionResponse extends P402Session { }

export interface GetSessionsResponse {
  sessions: P402Session[];
}

// ============================================
// PROVIDER TYPES
// ============================================

export interface P402Provider {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency_p95?: number;
  uptime_30d?: number;
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
  supports_streaming?: boolean;
  supports_functions?: boolean;
  supports_vision?: boolean;
}

export interface GetProvidersResponse {
  providers: P402Provider[];
}

// ============================================
// CHAT TYPES
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  model?: string;
  provider?: string;
  cost?: MessageCost;
  latency_ms?: number;
  cached?: boolean;
  timestamp: number;
}

export interface MessageCost {
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  direct_cost: number;  // What it would cost going direct to provider
  savings: number;      // direct_cost - total_cost
  savings_percent: number;
}

export interface ChatRequestMessage {
  role: MessageRole;
  content: string;
}

export interface P402ChatOptions {
  mode?: 'cost' | 'quality' | 'speed' | 'balanced';
  cache?: boolean;
}

export interface ChatRequest {
  model?: string;
  messages: ChatRequestMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  p402?: P402ChatOptions;
}

export interface ChatResponseChoice {
  index: number;
  message: {
    role: 'assistant';
    content: string;
  };
  finish_reason: 'stop' | 'length' | 'content_filter' | 'function_call' | null;
}

export interface ChatResponseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface P402Metadata {
  provider: string;
  model: string;
  cost_usd: number;
  cached: boolean;
  cache_hit?: boolean;
  latency_ms: number;
  routing_reason?: string;
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  provider: string;
  choices: ChatResponseChoice[];
  usage: ChatResponseUsage;
  cost: MessageCost;
  p402_metadata?: P402Metadata;
}

// Streaming chunk types
export interface ChatStreamDelta {
  role?: 'assistant';
  content?: string;
}

export interface ChatStreamChoice {
  index: number;
  delta: ChatStreamDelta;
  finish_reason: 'stop' | 'length' | null;
}

export interface ChatStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatStreamChoice[];
  // Final chunk includes cost
  cost?: MessageCost;
  p402_metadata?: P402Metadata;
}

// ============================================
// FUNDING TYPES
// ============================================

export interface FundRequest {
  session_id: string;
  amount: string;  // USDC amount as string (e.g., "5.00")
  tx_hash?: string;
  source?: 'base_pay' | 'direct' | 'test';
  network?: 'base' | 'base_sepolia';
}

export interface FundResponse {
  success: boolean;
  session: P402Session;
  tx_hash?: string;
  amount_credited: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface SpendSummary {
  period: string;
  total_spent: number;
  total_saved: number;
  savings_percent: number;
  request_count: number;
  cache_hit_rate: number;
  top_models: Array<{
    model: string;
    provider: string;
    spend: number;
    requests: number;
  }>;
  daily_breakdown?: Array<{
    date: string;
    spent: number;
    saved: number;
    requests: number;
  }>;
}

export interface CostRecommendation {
  id: string;
  type: 'model_switch' | 'caching' | 'batching' | 'prompt_optimization';
  title: string;
  description: string;
  potential_savings: number;
  potential_savings_percent: number;
  current_model?: string;
  recommended_model?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface GetRecommendationsResponse {
  recommendations: CostRecommendation[];
  total_potential_savings: number;
}

// ============================================
// PROVIDER COMPARISON TYPES
// ============================================

export interface ProviderCompareRequest {
  input_tokens: number;
  output_tokens: number;
  capabilities?: string[];
  exclude_providers?: string[];
}

export interface ProviderCompareResult {
  model: string;
  provider: string;
  cost: number;
  tier: string;
  latency_estimate_ms: number;
  quality_score: number;
}

export interface ProviderCompareResponse {
  models: ProviderCompareResult[];
  cheapest: ProviderCompareResult;
  fastest: ProviderCompareResult;
  best_value: ProviderCompareResult;
}

// ============================================
// BALANCE TYPES
// ============================================

export interface BalanceResponse {
  session_id: string;
  balance_usdc: number;
  budget_total: number;
  budget_spent: number;
  budget_remaining: number;
  status: P402Session['status'];
}

// ============================================
// WEBHOOK / ANALYTICS EVENT TYPES
// ============================================

export type MiniAppEventType =
  | 'frame_added'
  | 'frame_removed'
  | 'notifications_enabled'
  | 'notifications_disabled';

export interface MiniAppEvent {
  type: MiniAppEventType;
  fid?: number;
  timestamp?: string;
}

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: string;
  session_id?: string;
  fid?: number;
}

// ============================================
// ERROR TYPES
// ============================================

export interface P402Error {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export type P402ErrorCode =
  | 'INVALID_INPUT'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'INSUFFICIENT_BALANCE'
  | 'RATE_LIMITED'
  | 'PROVIDER_ERROR'
  | 'TIMEOUT'
  | 'INTERNAL_ERROR';

// ============================================
// STORE STATE TYPES
// ============================================

export type RoutingMode = 'cost' | 'quality' | 'speed' | 'balanced';

export interface AppState {
  // Connection state
  isConnected: boolean;
  walletAddress: string | null;
  session: P402Session | null;

  // UI state
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;

  // Providers
  providers: P402Provider[];
  isLoadingProviders: boolean;
  selectedModel: string;

  // Chat
  messages: ChatMessage[];

  // Analytics
  totalSpent: number;
  totalSaved: number;
  requestCount: number;

  // Settings
  routingMode: RoutingMode;
  useCache: boolean;
}

export interface AppActions {
  connect: (walletAddress: string) => Promise<void>;
  disconnect: () => void;
  loadProviders: () => Promise<void>;
  selectModel: (modelId: string) => void;
  sendMessage: (content: string) => Promise<void>;
  fundSession: (amount: string, txHash?: string) => Promise<void>;
  setRoutingMode: (mode: RoutingMode) => void;
  setUseCache: (useCache: boolean) => void;
  clearError: () => void;
  clearMessages: () => void;
}

export type AppStore = AppState & AppActions;
