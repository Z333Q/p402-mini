/**
 * P402 Store Unit Tests
 * Comprehensive tests for Zustand state management
 */

import { useP402Store } from './store';
import { act } from '@testing-library/react';

// Mock the p402 client
jest.mock('./p402-client', () => ({
    p402: {
        getOrCreateSession: jest.fn(),
        setSession: jest.fn(),
        getProviders: jest.fn(),
        chatStream: jest.fn(),
        getSession: jest.fn(),
        fundSession: jest.fn(),
    },
}));

import { p402 } from './p402-client';

describe('P402Store', () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        const store = useP402Store.getState();
        store.disconnect();
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
            expect(state.selectedModel).toBe('openai/gpt-5.2-turbo');
        });
    });

    describe('Connection', () => {
        it('should connect wallet and create session', async () => {
            const mockSession = {
                session_id: 'test-session-123',
                wallet_address: '0x1234',
                balance_usdc: 10.0,
                budget_total: 10.0,
                budget_spent: 0,
                status: 'active' as const,
                created_at: new Date().toISOString(),
                expires_at: new Date().toISOString(),
            };

            (p402.getOrCreateSession as jest.Mock).mockResolvedValue(mockSession);
            (p402.getProviders as jest.Mock).mockResolvedValue({ providers: [] });

            await act(async () => {
                await useP402Store.getState().connect('0x1234');
            });

            const state = useP402Store.getState();
            expect(state.isConnected).toBe(true);
            expect(state.walletAddress).toBe('0x1234');
            expect(state.session).toEqual(mockSession);
            expect(p402.setSession).toHaveBeenCalledWith('test-session-123');
        });

        it('should handle connection errors gracefully', async () => {
            (p402.getOrCreateSession as jest.Mock).mockRejectedValue(new Error('Network error'));

            await act(async () => {
                await useP402Store.getState().connect('0x1234');
            });

            const state = useP402Store.getState();
            expect(state.isConnected).toBe(false);
            expect(state.sessionError).toBe('Network error');
        });

        it('should disconnect and clear state', async () => {
            // First connect
            const mockSession = {
                session_id: 'test-session',
                wallet_address: '0x1234',
                balance_usdc: 10.0,
                budget_total: 10.0,
                budget_spent: 0,
                status: 'active' as const,
                created_at: new Date().toISOString(),
                expires_at: new Date().toISOString(),
            };

            (p402.getOrCreateSession as jest.Mock).mockResolvedValue(mockSession);
            (p402.getProviders as jest.Mock).mockResolvedValue({ providers: [] });

            await act(async () => {
                await useP402Store.getState().connect('0x1234');
            });

            // Then disconnect
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
            act(() => {
                useP402Store.getState().setRoutingMode('cost');
            });

            expect(useP402Store.getState().routingMode).toBe('cost');

            act(() => {
                useP402Store.getState().setRoutingMode('quality');
            });

            expect(useP402Store.getState().routingMode).toBe('quality');
        });

        it('should toggle cache setting', () => {
            expect(useP402Store.getState().useCache).toBe(true);

            act(() => {
                useP402Store.getState().setUseCache(false);
            });

            expect(useP402Store.getState().useCache).toBe(false);
        });
    });

    describe('Model Selection', () => {
        it('should select a model', () => {
            act(() => {
                useP402Store.getState().selectModel('anthropic/claude-3.5-opus');
            });

            expect(useP402Store.getState().selectedModel).toBe('anthropic/claude-3.5-opus');
        });
    });

    describe('Chat', () => {
        it('should clear chat messages', () => {
            // Add a message first
            const state = useP402Store.getState();
            useP402Store.setState({
                messages: [{ id: '1', role: 'user', content: 'Hello', timestamp: Date.now() }],
            });

            act(() => {
                useP402Store.getState().clearChat();
            });

            expect(useP402Store.getState().messages).toEqual([]);
        });

        it('should throw error when sending message without balance', async () => {
            useP402Store.setState({
                session: {
                    session_id: 'test',
                    wallet_address: '0x1234',
                    balance_usdc: 0, // No balance
                    budget_total: 0,
                    budget_spent: 0,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    expires_at: new Date().toISOString(),
                },
            });

            await expect(useP402Store.getState().sendMessage('Hello')).rejects.toThrow('Insufficient balance');
        });
    });

    describe('Selector Hooks', () => {
        it('should return correct balance from selector', () => {
            useP402Store.setState({
                session: {
                    session_id: 'test',
                    wallet_address: '0x1234',
                    balance_usdc: 25.50,
                    budget_total: 30,
                    budget_spent: 4.50,
                    status: 'active',
                    created_at: new Date().toISOString(),
                    expires_at: new Date().toISOString(),
                },
            });

            // Access the balance through the store directly (selector test)
            const balance = useP402Store.getState().session?.balance_usdc;
            expect(balance).toBe(25.50);
        });
    });
});
