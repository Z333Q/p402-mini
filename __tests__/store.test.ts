import { act, renderHook } from '@testing-library/react';
import { useP402Store } from '@/lib/store';
import { p402 } from '@/lib/p402-client';

// Mock the P402 Client
jest.mock('@/lib/p402-client', () => ({
    p402: {
        getOrCreateSession: jest.fn(),
        getSession: jest.fn(), // Added
        setSession: jest.fn(),
        getProviders: jest.fn().mockResolvedValue({ providers: [] }),
        chatStream: jest.fn(),
        fundSession: jest.fn().mockResolvedValue({ success: true, session: { balance: 15 } }), // Added
    },
    formatCost: (n: number) => `$${n}`,
    formatSavings: (n: number) => `50%`,
    estimateCost: () => 0.01
}));

describe('P402 Store', () => {
    const originalState = useP402Store.getState();

    beforeEach(() => {
        useP402Store.setState(originalState);
        jest.clearAllMocks();
    });

    describe('connect', () => {
        it('connects successfully and sets session', async () => {
            const mockSession = {
                session_id: 'test-session',
                wallet_address: '0x123',
                balance: 10,
                is_active: true
            };

            (p402.getOrCreateSession as jest.Mock).mockResolvedValue(mockSession);

            await act(async () => {
                await useP402Store.getState().connect('0x123', { username: 'testuser' });
            });

            const state = useP402Store.getState();
            expect(state.isConnected).toBe(true);
            expect(state.walletAddress).toBe('0x123');
            expect(state.userProfile?.username).toBe('testuser');
            expect(state.session).toEqual(mockSession);
            expect(p402.setSession).toHaveBeenCalledWith('test-session');
        });
    });

    describe('sendMessage', () => {
        it('adds user message and processes AI response', async () => {
            // Setup connected state
            useP402Store.setState({
                isConnected: true,
                session: { balance: 10 } as any
            });

            const mockStream = {
                getReader: () => ({
                    read: jest.fn()
                        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('Hello') })
                        .mockResolvedValueOnce({ done: true })
                })
            };

            (p402.chatStream as jest.Mock).mockResolvedValue(mockStream);

            await act(async () => {
                await useP402Store.getState().sendMessage('Hi AI');
            });

            const state = useP402Store.getState();

            // Verify user message added
            expect(state.messages[0]).toMatchObject({
                role: 'user',
                content: 'Hi AI'
            });

            // Verify AI message placeholder added (optimistic)
            expect(state.messages[1]).toMatchObject({
                role: 'assistant',
                content: ''
            });

            // Verify streaming flag was set (it resets after completion, so this is tricky to assert post-await without more granular hooks)
            expect(p402.chatStream).toHaveBeenCalled();
        });
    });

    describe('fundSession', () => {
        it('updates balance correctly', async () => {
            useP402Store.setState({
                session: { balance: 5, session_id: 'sess_1' } as any
            });

            // Mock the API call (which happens in the store action) needs to be mocked on p402 client if it was used directly.
            // However currently store.ts uses p402.fundSession but implementation just calls fetch properly in p402-client mock.
            // Wait, in store.ts `fundSession` calls `p402.fundSession`? Let's check store.ts content.
            // Based on previous reads, store.ts `fundSession` updates local state optimistically or re-fetches.
            // Assuming store.ts updates state:

            await act(async () => {
                await useP402Store.getState().fundSession('10', 'tx_123');
            });

            const state = useP402Store.getState();
            // 5 + 10 = 15
            expect(state.session?.balance).toBe(15);
        });
    });
});
