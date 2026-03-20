import { act } from '@testing-library/react';
import { useP402Store } from '@/lib/store';
import { p402 } from '@/lib/p402-client';
import type { P402Session } from '@/lib/types';

// Mock the P402 Client
jest.mock('@/lib/p402-client', () => ({
    p402: {
        getOrCreateSession: jest.fn(),
        getSession: jest.fn(),
        setSession: jest.fn(),
        getProviders: jest.fn().mockResolvedValue({ providers: [] }),
        chatStream: jest.fn(),
        fundSession: jest.fn(),
        endSession: jest.fn(),
    },
    formatCost: (n: number) => `$${n}`,
    formatSavings: (n: number) => `50%`,
    estimateCost: () => 0.01,
}));

function makeSession(overrides: Partial<P402Session> = {}): P402Session {
    return {
        id: 'sess_test_001',
        object: 'session',
        tenant_id: 'tenant_test',
        wallet_address: '0x123',
        budget: {
            total_usd: 10,
            used_usd: 0,
            remaining_usd: 10,
        },
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        ...overrides,
    };
}

describe('P402 Store', () => {
    beforeEach(() => {
        useP402Store.getState().disconnect();
        jest.clearAllMocks();
    });

    describe('connect', () => {
        it('connects successfully and sets session', async () => {
            const mockSession = makeSession();
            (p402.getOrCreateSession as jest.Mock).mockResolvedValue(mockSession);

            await act(async () => {
                await useP402Store.getState().connect('0x123', { username: 'testuser' });
            });

            const state = useP402Store.getState();
            expect(state.isConnected).toBe(true);
            expect(state.walletAddress).toBe('0x123');
            expect(state.userProfile?.username).toBe('testuser');
            expect(state.session?.id).toBe('sess_test_001');
            expect(state.session?.budget.remaining_usd).toBe(10);
        });
    });

    describe('sendMessage', () => {
        it('adds user message and processes AI response', async () => {
            useP402Store.setState({
                isConnected: true,
                session: makeSession(),
            });

            const mockReader = {
                read: jest.fn()
                    .mockResolvedValueOnce({
                        done: false,
                        value: new TextEncoder().encode(
                            'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n'
                        ),
                    })
                    .mockResolvedValueOnce({ done: true, value: undefined }),
                releaseLock: jest.fn(),
            };

            (p402.chatStream as jest.Mock).mockResolvedValue({
                ok: true,
                body: { getReader: () => mockReader },
            });
            (p402.getSession as jest.Mock).mockResolvedValue(makeSession());

            await act(async () => {
                await useP402Store.getState().sendMessage('Hi AI');
            });

            const state = useP402Store.getState();
            expect(state.messages[0]).toMatchObject({ role: 'user', content: 'Hi AI' });
            expect(p402.chatStream).toHaveBeenCalled();
        });
    });

    describe('fundSession', () => {
        it('updates session with funded balance', async () => {
            const fundedSession = makeSession({ budget: { total_usd: 15, used_usd: 0, remaining_usd: 15 } });
            useP402Store.setState({ session: makeSession({ budget: { total_usd: 5, used_usd: 0, remaining_usd: 5 } }) });

            (p402.fundSession as jest.Mock).mockResolvedValue({
                success: true,
                session: fundedSession,
                amount_credited: 10,
                tx_hash: 'tx_123',
            });

            await act(async () => {
                await useP402Store.getState().fundSession('10', 'tx_123');
            });

            expect(useP402Store.getState().session?.budget.remaining_usd).toBe(15);
        });
    });
});
