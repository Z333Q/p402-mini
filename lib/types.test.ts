/**
 * P402 Types Validation Tests
 * Ensures type interfaces match expected structures
 */

import type {
    P402Session,
    P402Provider,
    P402Model,
    ChatMessage,
    MessageCost,
    ChatRequest,
    ChatResponse,
    FundRequest,
    FundResponse,
    SpendSummary,
} from './types';

import { DEFAULT_MODEL, MODEL_TIERS } from './types';

describe('P402 Types', () => {
    describe('P402Session', () => {
        it('should accept valid session object', () => {
            const session: P402Session = {
                session_id: 'sess_123',
                wallet_address: '0x1234567890abcdef',
                balance_usdc: 100.00,
                budget_total: 100.00,
                budget_spent: 0,
                status: 'active',
                created_at: '2026-01-13T00:00:00Z',
                expires_at: '2026-01-20T00:00:00Z',
            };

            expect(session.session_id).toBeDefined();
            expect(session.status).toBe('active');
        });

        it('should support all status types', () => {
            const statuses: P402Session['status'][] = ['active', 'paused', 'exhausted'];
            expect(statuses).toHaveLength(3);
        });
    });

    describe('P402Model', () => {
        it('should accept valid model object', () => {
            const model: P402Model = {
                id: 'openai/gpt-5.2-turbo',
                name: 'GPT-5.2 Turbo',
                provider: 'openai',
                tier: 'flagship',
                context_window: 128000,
                input_cost_per_1k: 0.01,
                output_cost_per_1k: 0.03,
                capabilities: ['text', 'vision', 'function_calling'],
            };

            expect(model.tier).toBe('flagship');
            expect(model.capabilities).toContain('text');
        });

        it('should support all tier types', () => {
            const tiers: P402Model['tier'][] = ['flagship', 'balanced', 'efficient', 'budget'];
            expect(tiers).toHaveLength(4);
        });
    });

    describe('ChatMessage', () => {
        it('should include V2 metadata fields', () => {
            const message: ChatMessage = {
                id: 'msg_123',
                role: 'assistant',
                content: 'Hello, how can I help you?',
                model: 'gpt-5.2-turbo',
                provider: 'openai',
                cost: {
                    input_tokens: 10,
                    output_tokens: 20,
                    total_cost: 0.001,
                    direct_cost: 0.0015,
                    savings: 0.0005,
                    savings_percent: 33.3,
                },
                latency_ms: 150,
                cached: false,
                timestamp: Date.now(),
            };

            expect(message.latency_ms).toBe(150);
            expect(message.cached).toBe(false);
        });
    });

    describe('ChatRequest', () => {
        it('should include p402 configuration', () => {
            const request: ChatRequest = {
                model: 'gpt-5.2-turbo',
                messages: [{ role: 'user', content: 'Hello' }],
                stream: true,
                p402: {
                    mode: 'balanced',
                    cache: true,
                },
            };

            expect(request.p402?.mode).toBe('balanced');
            expect(request.p402?.cache).toBe(true);
        });
    });

    describe('ChatResponse', () => {
        it('should include p402_metadata', () => {
            const response: ChatResponse = {
                id: 'resp_123',
                model: 'gpt-5.2-turbo',
                provider: 'openai',
                choices: [
                    {
                        index: 0,
                        message: { role: 'assistant', content: 'Hello!' },
                        finish_reason: 'stop',
                    },
                ],
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 5,
                    total_tokens: 15,
                },
                cost: {
                    input_tokens: 10,
                    output_tokens: 5,
                    total_cost: 0.0005,
                    direct_cost: 0.0008,
                    savings: 0.0003,
                    savings_percent: 37.5,
                },
                p402_metadata: {
                    provider: 'openai',
                    cost_usd: 0.0005,
                    cached: true,
                    latency_ms: 85,
                },
            };

            expect(response.p402_metadata?.cached).toBe(true);
            expect(response.p402_metadata?.latency_ms).toBe(85);
        });
    });

    describe('Constants', () => {
        it('should have correct default model', () => {
            expect(DEFAULT_MODEL).toBe('gpt-5.2-turbo');
        });

        it('should have all model tiers defined', () => {
            expect(MODEL_TIERS.flagship).toBeDefined();
            expect(MODEL_TIERS.balanced).toBeDefined();
            expect(MODEL_TIERS.efficient).toBeDefined();
            expect(MODEL_TIERS.budget).toBeDefined();
        });

        it('should have correct tier colors', () => {
            expect(MODEL_TIERS.flagship.color).toBe('#B6FF2E');
            expect(MODEL_TIERS.balanced.color).toBe('#22D3EE');
        });
    });
});
