/**
 * P402 Types Validation Tests
 * Ensures type interfaces match P402 Router V2 API structures.
 */

import type {
    P402Session,
    P402Provider,
    P402Model,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    FundRequest,
    FundResponse,
} from './types';

import { MODEL_TIERS } from './types';

describe('P402 Types', () => {
    describe('P402Session', () => {
        it('should accept valid V2 session object', () => {
            const session: P402Session = {
                id: 'sess_abc123',
                object: 'session',
                tenant_id: 'tenant_xyz',
                wallet_address: '0x1234567890abcdef',
                budget: {
                    total_usd: 100.00,
                    used_usd: 5.50,
                    remaining_usd: 94.50,
                    utilization_percent: 5.5,
                },
                status: 'active',
                created_at: '2026-01-13T00:00:00Z',
                expires_at: '2026-01-20T00:00:00Z',
            };

            expect(session.id).toBe('sess_abc123');
            expect(session.status).toBe('active');
            expect(session.budget.remaining_usd).toBe(94.50);
        });

        it('should support all status types', () => {
            const statuses: P402Session['status'][] = ['active', 'exhausted', 'expired', 'ended', 'revoked'];
            expect(statuses).toHaveLength(5);
        });
    });

    describe('P402Model', () => {
        it('should accept valid model object', () => {
            const model: P402Model = {
                id: 'claude-sonnet-4-6',
                name: 'Claude Sonnet 4.6',
                tier: 'premium',
                context_window: 200000,
                input_cost_per_1k: 0.003,
                output_cost_per_1k: 0.015,
                capabilities: ['text', 'vision', 'code'],
            };

            expect(model.tier).toBe('premium');
            expect(model.capabilities).toContain('text');
        });

        it('should support all 3 tier types', () => {
            const tiers: P402Model['tier'][] = ['premium', 'mid', 'budget'];
            expect(tiers).toHaveLength(3);
        });
    });

    describe('ChatMessage', () => {
        it('should include V2 metadata fields', () => {
            const message: ChatMessage = {
                id: 'msg_123',
                role: 'assistant',
                content: 'Hello, how can I help you?',
                model: 'claude-sonnet-4-6',
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
            };

            expect(message.latency_ms).toBe(150);
            expect(message.cached).toBe(false);
            expect(message.cost?.savings_percent).toBe(33.3);
        });
    });

    describe('ChatRequest', () => {
        it('should include p402 configuration', () => {
            const request: ChatRequest = {
                model: 'claude-sonnet-4-6',
                messages: [{ role: 'user', content: 'Hello' }],
                stream: true,
                p402: {
                    mode: 'balanced',
                    cache: true,
                    failover: true,
                },
            };

            expect(request.p402?.mode).toBe('balanced');
            expect(request.p402?.cache).toBe(true);
        });
    });

    describe('MODEL_TIERS', () => {
        it('should have 3-tier system: premium, mid, budget', () => {
            expect(MODEL_TIERS.premium).toBeDefined();
            expect(MODEL_TIERS.mid).toBeDefined();
            expect(MODEL_TIERS.budget).toBeDefined();
        });

        it('should have correct tier colors', () => {
            expect(MODEL_TIERS.premium.color).toBe('#B6FF2E');
            expect(MODEL_TIERS.mid.color).toBe('#22D3EE');
            expect(MODEL_TIERS.budget.color).toBe('#7A7A7A');
        });

        it('should have correct tier labels', () => {
            expect(MODEL_TIERS.premium.label).toBe('Premium');
            expect(MODEL_TIERS.mid.label).toBe('Mid');
            expect(MODEL_TIERS.budget.label).toBe('Budget');
        });
    });
});
