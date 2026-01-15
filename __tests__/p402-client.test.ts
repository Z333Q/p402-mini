import { formatCost, formatSavings, estimateCost, estimateTokens, p402, P402Client } from '@/lib/p402-client';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('P402 Client SDK', () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    describe('Helper Functions', () => {
        describe('formatCost', () => {
            it('formats zero correctly', () => {
                expect(formatCost(0)).toBe('$0.00');
            });

            it('formats small amounts in millicents', () => {
                expect(formatCost(0.00001)).toBe('$0.10m');
            });

            it('formats micro amounts with 4 decimals', () => {
                expect(formatCost(0.0012)).toBe('$0.0012');
            });

            it('formats normal amounts with 3 decimals', () => {
                expect(formatCost(0.123)).toBe('$0.123');
            });

            it('formats dollar amounts with 2 decimals', () => {
                expect(formatCost(12.345)).toBe('$12.35');
            });
        });

        describe('formatSavings', () => {
            it('returns 0% when direct cost is 0', () => {
                expect(formatSavings(5, 0)).toBe('0%');
            });

            it('calculates correct percentage', () => {
                expect(formatSavings(30, 100)).toBe('30%');
            });
        });

        describe('estimateTokens', () => {
            it('estimates tokens from text length', () => {
                const text = 'Hello world!'; // 12 chars
                expect(estimateTokens(text)).toBe(3); // ceil(12/4)
            });
        });

        describe('estimateCost', () => {
            it('calculates total cost based on tokens and rates', () => {
                const model = { input_cost_per_1k: 0.01, output_cost_per_1k: 0.03 };
                expect(estimateCost(model, 1000, 1000)).toBeCloseTo(0.04);
                expect(estimateCost(model, 500, 0)).toBeCloseTo(0.005);
            });
        });
    });

    describe('P402Client Error Handling', () => {
        // Create a dedicated client instance for error tests if needed, 
        // using the imported class or checking the default instance behaviour
        const client = new P402Client('https://mock.p402.io');

        it('throws error with code on 402', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 402,
                json: async () => ({ error: 'Insufficient balance', code: 'INSUFFICIENT_BALANCE' }),
            });

            try {
                await client.chat({ model: 'test', messages: [] });
                // @ts-ignore - explicitly testing failure
                fail('Should have thrown');
            } catch (e: any) {
                expect(e.message).toBe('Insufficient balance');
                expect(e.code).toBe('INSUFFICIENT_BALANCE');
                expect(e.status).toBe(402);
            }
        });

        it('handles network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));
            await expect(client.getProviders()).rejects.toThrow('Network error');
        });
    });

    describe('API Interactions', () => {
        const mockAddress = '0x123';
        const mockSession = { session_id: 'sess_1', wallet_address: mockAddress, balance_usdc: 10 };

        describe('getOrCreateSession', () => {
            it('returns existing session if found', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ sessions: [mockSession] }),
                });

                const session = await p402.getOrCreateSession(mockAddress);
                expect(session).toEqual(mockSession);
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/v2/sessions?wallet=0x123'),
                    expect.anything()
                );
            });

            it('creates new session if none found', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ sessions: [] }),
                });
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockSession,
                });

                const session = await p402.getOrCreateSession(mockAddress);
                expect(session).toEqual(mockSession);
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });
        });

        describe('getProviders', () => {
            it('fetches providers successfully', async () => {
                const mockProviders = [{ id: 'p1', name: 'Provider 1' }];
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ providers: mockProviders }),
                });

                const { providers } = await p402.getProviders();
                expect(providers).toEqual(mockProviders);
            });
        });

        describe('fundSession', () => {
            it('calls fund endpoint correctly', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ success: true, session: mockSession }),
                });

                const res = await p402.fundSession({ session_id: 'sess_1', amount: '10' });
                expect(res.success).toBe(true);
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/v2/sessions/fund'),
                    expect.objectContaining({
                        method: 'POST',
                        body: JSON.stringify({ session_id: 'sess_1', amount: '10', source: 'base_pay' }),
                    })
                );
            });
        });
    });
});
