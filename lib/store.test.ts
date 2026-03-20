/**
 * P402 Store Unit Tests
 * Aligned with P402 Router V2 API response shapes.
 */

import { useP402Store } from './store';
import { act } from '@testing-library/react';
import type { P402Session } from './types';

// Mock the p402 client
jest.mock('./p402-client', () => ({
    p402: {
        getOrCreateSession: jest.fn(),
        setSession: jest.fn(),
        getProviders: jest.fn(),
        chatStream: jest.fn(),
        getSession: jest.fn(),
        fundSession: jest.fn(),
        endSession: jest.fn(),
    },
}));

import { p402 } from './p402-client';

/** V2 session shape as returned by the router */
function makeSession(overrides: Partial<P402Session> = {}): P402Session {
    return {
        id: 'sess_test_123',
        object: 'session',
        tenant_id: 'tenant_abc',
        wallet_address: '0x1234',
        budget: {
            total_usd: 10.0,
            used_usd: 0,
            remaining_usd: 10.0,
            utilization_percent: 0,
        },
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        meta: {
            is_active: true,
            is_expired: false,
            time_remaining_seconds: 86400,
        },
        ...overrides,
    };
}

describe('P402Store', () => {
    beforeEach(() => {
        useP402Store.getState().disconnect();
        jest.clearAllMocks();
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const state = useP402Store.getState();

            expect(state.isConnected).toBe(false);
            expect(state.walletAddress).toBe(null);
            expect(state.session).toBe(null);
            expect(state.messages).toEqual([]);
            expect(state.routingMode).toBe('balanced');
            expect(state.useCache).toBe(true);
            expect(state.selectedModel).toBe(null);
        });
    });

    describe('Connection', () => {
        it('should connect wallet and create session', async () => {
            const mockSession = makeSession();

            (p402.getOrCreateSession as jest.Mock).mockResolvedValue(mockSession);

            await act(async () => {
                await useP402Store.getState().connect('0x1234');
            });

            const state = useP402Store.getState();
            expect(state.isConnected).toBe(true);
            expect(state.walletAddress).toBe('0x1234');
            expect(state.session?.id).toBe('sess_test_123');
            expect(state.session?.budget.remaining_usd).toBe(10.0);
        });

        it('should throw on connection error', async () => {
            (p402.getOrCreateSession as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(
                act(async () => {
                    await useP402Store.getState().connect('0x1234');
                })
            ).rejects.toThrow('Network error');

            expect(useP402Store.getState().isConnected).toBe(false);
        });

        it('should disconnect and clear state', async () => {
            (p402.getOrCreateSession as jest.Mock).mockResolvedValue(makeSession());

            await act(async () => {
                await useP402Store.getState().connect('0x1234');
            });

            act(() => {
                useP402Store.getState().disconnect();
            });

            const state = useP402Store.getState();
            expect(state.isConnected).toBe(false);
            expect(state.walletAddress).toBe(null);
            expect(state.session).toBe(null);
            expect(state.messages).toEqual([]);
        });
    });

    describe('V2 Configuration', () => {
        it('should update routing mode', () => {
            act(() => { useP402Store.getState().setRoutingMode('cost'); });
            expect(useP402Store.getState().routingMode).toBe('cost');

            act(() => { useP402Store.getState().setRoutingMode('quality'); });
            expect(useP402Store.getState().routingMode).toBe('quality');
        });

        it('should toggle cache setting', () => {
            expect(useP402Store.getState().useCache).toBe(true);

            act(() => { useP402Store.getState().setUseCache(false); });
            expect(useP402Store.getState().useCache).toBe(false);
        });
    });

    describe('Balance Selector', () => {
        it('should return remaining_usd from budget object', () => {
            useP402Store.setState({ session: makeSession({ budget: { total_usd: 30, used_usd: 4.5, remaining_usd: 25.5 } }) });
            const balance = useP402Store.getState().session?.budget.remaining_usd;
            expect(balance).toBe(25.5);
        });

        it('should return 0 when no session', () => {
            useP402Store.setState({ session: null });
            const balance = useP402Store.getState().session?.budget?.remaining_usd ?? 0;
            expect(balance).toBe(0);
        });
    });

    describe('Chat', () => {
        it('should clear chat messages', () => {
            useP402Store.setState({
                messages: [{ id: '1', role: 'user', content: 'Hello' }],
            });

            act(() => { useP402Store.getState().clearMessages(); });

            expect(useP402Store.getState().messages).toEqual([]);
        });

        it('should include routing mode and cache in chat request', async () => {
            const mockSession = makeSession();
            useP402Store.setState({
                isConnected: true,
                session: mockSession,
                routingMode: 'cost',
                useCache: false,
            });

            const mockReader = {
                read: jest.fn().mockResolvedValueOnce({
                    done: false,
                    value: new TextEncoder().encode('data: {"choices":[{"delta":{"content":"Hi"},"finish_reason":null}]}\n\n'),
                }).mockResolvedValueOnce({ done: true, value: undefined }),
                releaseLock: jest.fn(),
            };

            (p402.chatStream as jest.Mock).mockResolvedValue({
                ok: true,
                body: { getReader: () => mockReader },
            });

            await act(async () => {
                await useP402Store.getState().sendMessage('Hello');
            });

            expect(p402.chatStream).toHaveBeenCalledWith(
                expect.objectContaining({
                    p402: expect.objectContaining({
                        mode: 'cost',
                        cache: false,
                        session_id: 'sess_test_123',
                        failover: true,
                    }),
                })
            );
        });
    });

    describe('Analytics', () => {
        it('should track real savings from metadata, not fabricated multiplier', async () => {
            const mockSession = makeSession();
            useP402Store.setState({
                isConnected: true,
                session: mockSession,
                totalSpent: 0,
                totalSaved: 0,
                requestCount: 0,
            });

            const metadata = {
                cost_usd: 0.001,
                savings: 0.0005,
                direct_cost: 0.0015,
                savings_percent: 33,
                model: 'claude-sonnet-4-6',
                provider: 'anthropic',
                latency_ms: 500,
                cached: false,
                request_id: 'req_123',
                tenant_id: 'tenant_abc',
            };

            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode(
                            `data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n`
                        ),
                    })
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode(
                            `data: {"choices":[{"delta":{},"finish_reason":"stop"}],"p402_metadata":${JSON.stringify(metadata)}}\n\n`
                        ),
                    })
                    .mockResolvedValueOnce({ done: true, value: undefined }),
                releaseLock: jest.fn(),
            };

            (p402.chatStream as jest.Mock).mockResolvedValue({
                ok: true,
                body: { getReader: () => mockReader },
            });
            (p402.getSession as jest.Mock).mockResolvedValue(mockSession);

            await act(async () => {
                await useP402Store.getState().sendMessage('Hello');
            });

            const state = useP402Store.getState();
            expect(state.totalSpent).toBeCloseTo(0.001);
            expect(state.totalSaved).toBeCloseTo(0.0005);
            expect(state.requestCount).toBe(1);

            // Should use real savings, not fabricated 1.5x
            const lastMessage = state.messages[state.messages.length - 1];
            expect(lastMessage.cost?.savings).toBeCloseTo(0.0005);
            expect(lastMessage.cost?.direct_cost).toBeCloseTo(0.0015);
        });
    });
});
