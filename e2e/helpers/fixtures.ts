/**
 * Shared test fixtures and mock data for P402 Mini App E2E tests.
 * All values are realistic but safe for testing.
 */

export const MOCK_WALLET = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
export const MOCK_SESSION_ID = 'sess_abc123def456ghi789jkl012';

export const MOCK_SESSION = {
  object: 'session',
  id: MOCK_SESSION_ID,
  session_id: MOCK_SESSION_ID,
  session_key: MOCK_SESSION_ID,
  tenant_id: 'tenant_test_001',
  wallet_address: MOCK_WALLET,
  balance_usdc: 5.0,
  budget_total: 5.0,
  budget_spent: 0,
  budget: {
    total_usd: 5.0,
    used_usd: 0,
    remaining_usd: 5.0,
    utilization_percent: 0,
  },
  policy: {},
  status: 'active',
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 86_400_000).toISOString(),
};

export const MOCK_SESSION_LOW_BALANCE = {
  ...MOCK_SESSION,
  balance_usdc: 0.25,
  budget: { ...MOCK_SESSION.budget, remaining_usd: 0.25 },
};

export const MOCK_SESSION_EMPTY = {
  ...MOCK_SESSION,
  balance_usdc: 0,
  budget: { ...MOCK_SESSION.budget, remaining_usd: 0, used_usd: 5.0 },
};

export const MOCK_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    status: 'healthy',
    latency_ms: 150,
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        tier: 'flagship',
        context_window: 128_000,
        max_output_tokens: 4096,
        input_cost_per_1k: 0.005,
        output_cost_per_1k: 0.015,
        capabilities: ['vision', 'json_output'],
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        tier: 'efficient',
        context_window: 128_000,
        max_output_tokens: 16_384,
        input_cost_per_1k: 0.00015,
        output_cost_per_1k: 0.0006,
        capabilities: [],
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    status: 'healthy',
    latency_ms: 200,
    models: [
      {
        id: 'claude-sonnet-4-6',
        name: 'Claude Sonnet 4.6',
        tier: 'balanced',
        context_window: 200_000,
        max_output_tokens: 8192,
        input_cost_per_1k: 0.003,
        output_cost_per_1k: 0.015,
        capabilities: ['vision'],
      },
    ],
  },
];

/** Chat completion response (non-streaming) */
export const MOCK_CHAT_RESPONSE = {
  id: 'chatcmpl_test_001',
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model: 'gpt-4o-mini',
  choices: [
    {
      index: 0,
      message: { role: 'assistant', content: 'Hello from P402! This is a test response.' },
      finish_reason: 'stop',
    },
  ],
  usage: { prompt_tokens: 12, completion_tokens: 15, total_tokens: 27 },
  p402_metadata: {
    request_id: 'req_test_001',
    tenant_id: 'tenant_test_001',
    provider: 'openai',
    model: 'gpt-4o-mini',
    cost_usd: 0.000025,
    latency_ms: 320,
    cached: false,
    routing_mode: 'balanced',
    tokens_generated: 15,
  },
};

/** SSE streaming chunks for a mock chat response */
export function buildMockStreamChunks(content = 'Hello from P402! This is a test response.'): string {
  const words = content.split(' ');
  const id = 'chatcmpl_stream_001';
  const created = Math.floor(Date.now() / 1000);

  const chunks: string[] = [];

  // Role chunk
  chunks.push(
    `data: ${JSON.stringify({
      id,
      object: 'chat.completion.chunk',
      created,
      model: 'gpt-4o-mini',
      choices: [{ index: 0, delta: { role: 'assistant' }, finish_reason: null }],
    })}\n\n`,
  );

  // Content chunks (one word at a time)
  for (const word of words) {
    chunks.push(
      `data: ${JSON.stringify({
        id,
        object: 'chat.completion.chunk',
        created,
        model: 'gpt-4o-mini',
        choices: [{ index: 0, delta: { content: word + ' ' }, finish_reason: null }],
      })}\n\n`,
    );
  }

  // Final metadata chunk
  chunks.push(
    `data: ${JSON.stringify({
      id,
      object: 'chat.completion.chunk',
      created,
      model: 'gpt-4o-mini',
      choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
      p402_metadata: {
        request_id: 'req_stream_001',
        tenant_id: 'tenant_test_001',
        provider: 'openai',
        model: 'gpt-4o-mini',
        cost_usd: 0.000025,
        latency_ms: 320,
        ttfb_ms: 45,
        tokens_generated: words.length,
        cached: false,
        routing_mode: 'balanced',
      },
    })}\n\n`,
  );

  chunks.push('data: [DONE]\n\n');
  return chunks.join('');
}

export const MOCK_SETTLE_RESPONSE = {
  scheme: 'exact',
  success: true,
  settled: true,
  payer: MOCK_WALLET,
  transaction: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc123',
  receipt: {
    txHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc123',
    amount: '5000000',
    asset: 'USDC',
    timestamp: new Date().toISOString(),
  },
};

export const MOCK_FUND_RESPONSE = {
  success: true,
  session: {
    ...MOCK_SESSION,
    balance_usdc: 10.0,
    budget: { total_usd: 10.0, used_usd: 0, remaining_usd: 10.0 },
  },
  amount_credited: 5.0,
  tx_hash: MOCK_SETTLE_RESPONSE.receipt.txHash,
};

/**
 * The Zustand persisted store shape written to localStorage.
 * Only persisted keys — isConnected and session are NOT persisted.
 */
export function buildPersistedStore(
  walletAddress: string | null = MOCK_WALLET,
  overrides: Record<string, unknown> = {},
) {
  return JSON.stringify({
    state: {
      walletAddress,
      selectedModel: null,
      totalSpent: 0,
      totalSaved: 0,
      requestCount: 0,
      routingMode: 'balanced',
      useCache: true,
      transactions: [],
      ...overrides,
    },
    version: 0,
  });
}
