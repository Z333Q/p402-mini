// P402 API Client for Mini App

import type {
  P402Session,
  P402Provider,
  ChatRequest,
  ChatResponse,
  FundRequest,
  FundResponse,
  SpendSummary,
} from './types';

const P402_API_URL = process.env.NEXT_PUBLIC_P402_API_URL || 'https://p402.io';

class P402Client {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string = P402_API_URL) {
    this.baseUrl = baseUrl;
  }

  setSession(sessionId: string) {
    this.sessionId = sessionId;
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
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Session Management
  async createSession(walletAddress: string): Promise<P402Session> {
    const session = await this.fetch<P402Session>('/api/v2/sessions', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        budget_usd: 0,  // Start with 0, user will fund
        source: 'base_miniapp',
      }),
    });
    this.sessionId = session.session_id;
    return session;
  }

  async getSession(sessionId: string): Promise<P402Session> {
    return this.fetch<P402Session>(`/api/v2/sessions/${sessionId}`);
  }

  async getOrCreateSession(walletAddress: string): Promise<P402Session> {
    // Try to find existing session for this wallet
    try {
      const sessions = await this.fetch<{ sessions: P402Session[] }>(
        `/api/v2/sessions?wallet=${walletAddress}&status=active`
      );
      if (sessions.sessions.length > 0) {
        const session = sessions.sessions[0];
        this.sessionId = session.session_id;
        return session;
      }
    } catch (e) {
      // No existing session, create new one
    }
    return this.createSession(walletAddress);
  }

  // Funding
  async fundSession(request: FundRequest): Promise<FundResponse> {
    return this.fetch<FundResponse>('/api/v2/sessions/fund', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Providers
  async getProviders(): Promise<{ providers: P402Provider[] }> {
    return this.fetch<{ providers: P402Provider[] }>('/api/v2/providers?health=true');
  }

  // Chat (non-streaming)
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return this.fetch<ChatResponse>('/api/v2/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        ...request,
        stream: false,
      }),
    });
  }

  // Chat (streaming) - returns a ReadableStream
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
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response;
  }

  // Analytics
  async getSpendSummary(period: string = '30d'): Promise<SpendSummary> {
    return this.fetch<SpendSummary>(`/api/v2/analytics/spend?period=${period}`);
  }

  // Recommendations
  async getRecommendations(): Promise<{ recommendations: any[] }> {
    return this.fetch<{ recommendations: any[] }>('/api/v2/analytics/recommendations');
  }

  // Cost comparison for a specific request
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
}

// Singleton instance
export const p402 = new P402Client();

// Helper to estimate cost before sending
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

// Helper to format cost
export function formatCost(cost: number): string {
  if (cost < 0.001) {
    return `$${(cost * 1000).toFixed(3)}m`; // millicents
  }
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(3)}`;
}

// Helper to format savings percentage
export function formatSavings(savings: number, directCost: number): string {
  if (directCost === 0) return '0%';
  const percent = (savings / directCost) * 100;
  return `${percent.toFixed(0)}%`;
}
