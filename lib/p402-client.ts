// P402 API Client for Mini App
// Last Updated: January 2025

import type {
  P402Session,
  P402Provider,
  ChatRequest,
  ChatResponse,
  FundRequest,
  FundResponse,
  SpendSummary,
  GetRecommendationsResponse,
  ProviderCompareRequest,
  ProviderCompareResponse,
  BalanceResponse,
  GetProvidersResponse,
  GetSessionsResponse,
} from './types';

const P402_API_URL = process.env.NEXT_PUBLIC_P402_API_URL || 'https://p402.io';

export class P402Client {
  private baseUrl: string;
  private sessionId: string | null = null;
  private debug: boolean;

  constructor(baseUrl: string = P402_API_URL, debug: boolean = false) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.debug = debug;
  }

  // ============================================
  // Session Management
  // ============================================

  setSession(sessionId: string): void {
    if (sessionId && !sessionId.startsWith('sess_')) {
      console.warn('[P402Client] Session ID should start with "sess_"');
    }
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }

  // ============================================
  // Core HTTP Method
  // ============================================

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-p402-source': 'base-miniapp',
      ...(options.headers as Record<string, string>),
    };

    if (this.sessionId) {
      headers['x-p402-session'] = this.sessionId;
    }

    if (this.debug) {
      console.log('[P402Client] Request:', { url, method: options.method || 'GET', headers });
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));

      if (this.debug) {
        console.error('[P402Client] Error:', { status: response.status, error });
      }

      const errorMessage = error.error || `HTTP ${response.status}`;
      const err = new Error(errorMessage) as Error & { code?: string; status?: number };
      err.code = error.code;
      err.status = response.status;
      throw err;
    }

    const data = await response.json();

    if (this.debug) {
      console.log('[P402Client] Response:', data);
    }

    return data;
  }

  // ============================================
  // Session API
  // ============================================

  async createSession(walletAddress: string): Promise<P402Session> {
    const session = await this.fetch<P402Session>('/api/v2/sessions', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress.toLowerCase(),
        budget_usd: 0,
        source: 'base_miniapp',
      }),
    });
    this.sessionId = session.session_id;
    return session;
  }

  async getSession(sessionId: string): Promise<P402Session> {
    return this.fetch<P402Session>(`/api/v2/sessions/${sessionId}`);
  }

  async findSessions(walletAddress: string, status: string = 'active'): Promise<GetSessionsResponse> {
    const params = new URLSearchParams({
      wallet: walletAddress.toLowerCase(),
      status,
    });
    return this.fetch<GetSessionsResponse>(`/api/v2/sessions?${params}`);
  }

  async getOrCreateSession(walletAddress: string): Promise<P402Session> {
    // Try to find existing session for this wallet
    try {
      const { sessions } = await this.findSessions(walletAddress, 'active');
      if (sessions.length > 0) {
        const session = sessions[0];
        this.sessionId = session.session_id;
        return session;
      }
    } catch (e) {
      // No existing session, will create new one
      if (this.debug) {
        console.log('[P402Client] No existing session found, creating new one');
      }
    }
    return this.createSession(walletAddress);
  }

  // ============================================
  // Funding API
  // ============================================

  async fundSession(request: FundRequest): Promise<FundResponse> {
    return this.fetch<FundResponse>('/api/v2/sessions/fund', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        source: request.source || 'base_pay',
      }),
    });
  }

  async getBalance(sessionId?: string): Promise<BalanceResponse> {
    const id = sessionId || this.sessionId;
    if (!id) {
      throw new Error('No session ID provided');
    }
    return this.fetch<BalanceResponse>(`/api/v2/sessions/${id}`);
  }

  // ============================================
  // Providers API
  // ============================================

  async getProviders(includeHealth: boolean = true): Promise<GetProvidersResponse> {
    const params = includeHealth ? '?health=true' : '';
    return this.fetch<GetProvidersResponse>(`/api/v2/providers${params}`);
  }

  async compareProviders(request: ProviderCompareRequest): Promise<ProviderCompareResponse> {
    return this.fetch<ProviderCompareResponse>('/api/v2/providers/compare', {
      method: 'POST',
      body: JSON.stringify({
        input_tokens: request.input_tokens,
        output_tokens: request.output_tokens,
        capabilities: request.capabilities,
        exclude_providers: request.exclude_providers,
      }),
    });
  }

  // ============================================
  // Chat API
  // ============================================

  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.fetch<ChatResponse>('/api/v2/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });
  }

  async chatStream(request: ChatRequest): Promise<Response> {
    const url = `${this.baseUrl}/api/v2/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-p402-source': 'base-miniapp',
    };

    if (this.sessionId) {
      headers['x-p402-session'] = this.sessionId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      const err = new Error(error.error || `HTTP ${response.status}`) as Error & { code?: string; status?: number };
      err.code = error.code;
      err.status = response.status;
      throw err;
    }

    return response;
  }

  // ============================================
  // Analytics API
  // ============================================

  async getSpendSummary(period: string = '30d'): Promise<SpendSummary> {
    return this.fetch<SpendSummary>(`/api/v2/analytics/spend?period=${period}`);
  }

  async getRecommendations(): Promise<GetRecommendationsResponse> {
    return this.fetch<GetRecommendationsResponse>('/api/v2/analytics/recommendations');
  }
}

// ============================================
// Singleton Instance
// ============================================

export const p402 = new P402Client(
  P402_API_URL,
  process.env.NODE_ENV === 'development'
);

// ============================================
// Helper Functions
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
  if (cost === 0) return '$0.00';
  if (cost < 0.0001) return `$${(cost * 10000).toFixed(2)}m`; // millicents
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

/**
 * Format savings percentage for display
 */
export function formatSavings(savings: number, directCost: number): string {
  if (directCost === 0) return '0%';
  const percent = (savings / directCost) * 100;
  return `${percent.toFixed(0)}%`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}

/**
 * Estimate tokens from text (rough approximation)
 * ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Named export for class
export { P402Client };
