/**
 * P402 API Client for Mini App
 * =============================
 * Client library for interacting with P402 Router V2 API.
 * 
 * Last Updated: 2026-01-20
 * Aligned with: p402-router V2 API specification
 */

import type {
  P402Session,
  P402Provider,
  ChatRequest,
  ChatResponse,
  FundRequest,
  FundResponse,
  SpendSummary,
  ListResponse,
} from './types';

const P402_API_URL = typeof window !== 'undefined'
  ? '' // Use local proxy in browser
  : (process.env.P402_API_URL || 'https://p402.io');

class P402Client {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = P402_API_URL) {
    this.baseUrl = baseUrl;
  }

  setSession(sessionId: string) {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.sessionId) {
      headers['x-p402-session'] = this.sessionId;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Normalize session response to ensure both id and session_id are present
   */
  private normalizeSession(session: any): P402Session {
    return {
      ...session,
      // Ensure both id and session_id are available
      id: session.id || session.session_id,
      session_id: session.session_id || session.id,
      // Ensure balance_usdc is available
      balance_usdc: session.balance_usdc ?? session.budget?.remaining_usd ?? 0,
      budget_total: session.budget_total ?? session.budget?.total_usd ?? 0,
      budget_spent: session.budget_spent ?? session.budget?.used_usd ?? 0,
    };
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  /**
   * Create a new session for a wallet address
   */
  async createSession(walletAddress: string): Promise<P402Session> {
    const response = await this.fetch<any>('/api/v2/sessions', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        budget_usd: 0.01, // Minimum budget required by V2 Router
        source: 'base_miniapp',
      }),
    });

    const session = this.normalizeSession(response);
    this.sessionId = session.id;
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<P402Session> {
    const response = await this.fetch<any>(`/api/v2/sessions/${sessionId}`);
    return this.normalizeSession(response);
  }

  /**
   * Get or create session for a wallet address
   * First tries to find an existing active session, creates new if none exists
   */
  async getOrCreateSession(walletAddress: string): Promise<P402Session> {
    try {
      // V2 returns { object: 'list', data: [...] }
      const response = await this.fetch<ListResponse<any>>(
        `/api/v2/sessions?wallet=${encodeURIComponent(walletAddress)}&status=active`
      );

      const sessions = response.data || [];
      if (sessions.length > 0) {
        const session = this.normalizeSession(sessions[0]);
        this.sessionId = session.id;
        return session;
      }
    } catch (e) {
      // No existing session found, will create new one
      console.log('No existing session found, creating new one');
    }

    return this.createSession(walletAddress);
  }

  // ============================================
  // FUNDING
  // ============================================

  /**
   * Fund a session after payment
   */
  async fundSession(request: FundRequest): Promise<FundResponse> {
    const response = await this.fetch<any>('/api/v2/sessions/fund', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    // Normalize the session in the response
    if (response.session) {
      response.session = this.normalizeSession(response.session);
    }

    return response;
  }

  // ============================================
  // PROVIDERS
  // ============================================

  /**
   * Get list of available providers with health status
   */
  async getProviders(): Promise<{ providers: P402Provider[] }> {
    const response = await this.fetch<any>('/api/v2/providers?health=true');

    // V2 returns { data: [...] } or { providers: [...] }
    const providers = response.data || response.providers || [];

    return { providers };
  }

  /**
   * Compare costs across providers for a specific request
   */
  async compareCosts(
    inputTokens: number,
    outputTokens: number,
    capabilities?: string[]
  ): Promise<{
    models: Array<{
      model: string;
      provider: string;
      cost: number;
      tier: string;
    }>;
    picks?: {
      cheapest: any;
      fastest: any;
      best_value: any;
    };
  }> {
    return this.fetch('/api/v2/providers/compare', {
      method: 'POST',
      body: JSON.stringify({
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        capabilities,
      }),
    });
  }

  // ============================================
  // CHAT COMPLETIONS
  // ============================================

  /**
   * Send a chat completion request (non-streaming)
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.fetch<ChatResponse>('/api/v2/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });
  }

  /**
   * Send a streaming chat completion request
   * Returns the raw Response for streaming consumption
   */
  async chatStream(request: ChatRequest): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.sessionId) {
      headers['x-p402-session'] = this.sessionId;
    }

    const response = await fetch(`${this.baseUrl}/api/v2/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error?.message || error.error || `HTTP ${response.status}`);
    }

    return response;
  }

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get spending summary for a period
   */
  async getSpendSummary(period: string = '30d'): Promise<SpendSummary> {
    return this.fetch<SpendSummary>(`/api/v2/analytics/spend?period=${period}`);
  }

  /**
   * Get cost optimization recommendations
   */
  async getRecommendations(): Promise<{ recommendations: any[] }> {
    return this.fetch<{ recommendations: any[] }>('/api/v2/analytics/recommendations');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const p402 = new P402Client();

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Estimate cost before sending a request
 */
export function estimateCost(
  model: { input_cost_per_1k: number; output_cost_per_1k: number },
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1000) * model.input_cost_per_1k +
    (outputTokens / 1000) * model.output_cost_per_1k
  );
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.0001) {
    return `<$0.0001`;
  }
  if (cost < 0.001) {
    return `$${(cost * 1000).toFixed(2)}m`; // millicents
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  }
  return `$${cost.toFixed(2)}`;
}

/**
 * Format savings percentage
 */
export function formatSavings(savings: number, directCost: number): string {
  if (directCost === 0) return '0%';
  const percent = (savings / directCost) * 100;
  return `${percent.toFixed(0)}%`;
}

/**
 * Parse SSE stream and extract p402_metadata from final chunk
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<{ content?: string; metadata?: any; done: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);

            // Check if this is an error chunk
            if (parsed.error) {
              throw new Error(parsed.error.message || 'Stream error');
            }

            // Check for content in choices
            const content = parsed.choices?.[0]?.delta?.content;

            // Check for final metadata chunk
            const metadata = parsed.p402_metadata;

            if (content || metadata) {
              yield {
                content,
                metadata,
                done: false,
              };
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              console.warn('Failed to parse SSE chunk:', data);
            } else {
              throw e;
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
