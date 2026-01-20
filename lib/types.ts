/**
 * P402 Mini App Types
 * ====================
 * TypeScript definitions aligned with P402 Router V2 API.
 * 
 * Last Updated: 2026-01-20
 */

// ============================================
// SESSION TYPES
// ============================================

export interface P402Session {
  /** Session ID (V2 uses 'id', keep session_id for backward compat) */
  id: string;
  session_id?: string; // Deprecated: use 'id'

  /** Session key for API authentication (returned on creation) */
  session_key?: string;

  /** Object type marker */
  object?: 'session';

  /** Tenant ID */
  tenant_id: string;

  /** Optional agent identifier */
  agent_identifier?: string;

  /** Wallet address associated with session */
  wallet_address?: string;

  /** Current available balance in USDC */
  balance_usdc: number;

  /** Total budget ever allocated */
  budget_total: number;

  /** Total amount spent */
  budget_spent: number;

  /** Legacy budget object for backward compatibility */
  budget: {
    total_usd: number;
    used_usd: number;
    remaining_usd: number;
  };

  /** Policy configuration */
  policy?: Record<string, unknown>;

  /** Session status */
  status: 'active' | 'exhausted' | 'expired' | 'ended' | 'revoked';

  /** Timestamps */
  created_at: string;
  expires_at: string;
  ended_at?: string;
}

// ============================================
// PROVIDER TYPES
// ============================================

export interface P402Provider {
  id: string;
  name: string;
  description?: string;
  models: P402Model[];
  status?: 'healthy' | 'degraded' | 'down';
  latency_ms?: number;
}

export const MODEL_TIERS: Record<string, { label: string; color: string }> = {
  flagship: { label: 'Flagship', color: '#B6FF2E' },
  balanced: { label: 'Balanced', color: '#00F0FF' },
  efficient: { label: 'Efficient', color: '#FF00F5' },
  budget: { label: 'Budget', color: '#888888' },
};

export interface P402Model {
  id: string;
  name: string;
  description?: string;
  context_window: number;
  max_output_tokens?: number;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  capabilities: string[];
  tier: 'flagship' | 'balanced' | 'efficient' | 'budget';
}

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
  id?: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;

  // P402 Metadata for UI
  model?: string;
  latency_ms?: number;
  cached?: boolean;
  cost?: {
    total_cost: number;
    input_tokens: number;
    output_tokens: number;
    direct_cost: number;
    savings: number;
  };
}

export interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  tools?: any[];
  tool_choice?: any;
  response_format?: { type: 'text' | 'json_object' };
  user?: string;
  p402?: P402Options;
}

export interface P402Options {
  /** Routing mode */
  mode?: 'cost' | 'quality' | 'speed' | 'balanced';
  /** Preferred providers (ordered) */
  prefer_providers?: string[];
  /** Providers to exclude */
  exclude_providers?: string[];
  /** Required capabilities */
  require_capabilities?: string[];
  /** Maximum cost per request (USD) */
  max_cost?: number;
  /** Session ID for budget tracking */
  session_id?: string;
  /** Enable semantic caching */
  cache?: boolean;
  /** Cache TTL in seconds */
  cache_ttl?: number;
  /** Enable failover */
  failover?: boolean;
  /** Tenant ID (for multi-tenant) */
  tenant_id?: string;
}

export interface P402Metadata {
  request_id: string;
  tenant_id: string;
  provider: string;
  model: string;
  cost_usd: number;
  latency_ms: number;
  provider_latency_ms?: number;
  ttfb_ms?: number;
  tokens_generated?: number;
  cached: boolean;
  routing_mode?: 'cost' | 'quality' | 'speed' | 'balanced';
}

export interface ChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
      tool_calls?: any[];
    };
    finish_reason: string | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  p402_metadata: P402Metadata;
}

export interface StreamingChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      tool_calls?: any[];
    };
    finish_reason: string | null;
  }>;
  /** Final chunk includes metadata */
  p402_metadata?: P402Metadata;
}

// ============================================
// FUNDING TYPES
// ============================================

export interface FundRequest {
  session_id: string;
  amount: string | number;
  tx_hash?: string;
  source?: 'base_pay' | 'direct' | 'test';
  network?: 'base' | 'base_sepolia';
}

export interface FundResponse {
  success: boolean;
  session: P402Session;
  amount_credited: number;
  tx_hash: string | null;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface SpendSummary {
  period: string;
  total_spent: number;
  total_saved: number;
  request_count: number;
  average_cost: number;
  top_models: Array<{
    model: string;
    provider: string;
    requests: number;
    cost: number;
  }>;
  daily_breakdown?: Array<{
    date: string;
    spent: number;
    requests: number;
  }>;
}

// ============================================
// USER PROFILE TYPES
// ============================================

export interface UserProfile {
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  fid?: number;
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ListResponse<T> {
  object: 'list';
  data: T[];
  total?: number;
}

export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    code?: string;
  };
}
