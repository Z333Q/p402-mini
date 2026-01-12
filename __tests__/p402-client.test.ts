import { formatCost, formatSavings, estimateCost, p402 } from '@/lib/p402-client';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('P402 Client SDK', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        // Reset singleton state if possible or just rely on overwriting
    });

    describe('Utilities', () => {
        describe('formatCost', () => {
            it('formats normal costs correctly', () => {
                expect(formatCost(0.123)).toBe('$0.123');
                expect(formatCost(0.05)).toBe('$0.050');
            });
            it('formats small costs as millicents', () => {
                expect(formatCost(0.0005)).toBe('$0.500m');
                expect(formatCost(0.000123)).toBe('$0.123m');
            });
            it('formats medium costs with 4 decimals', () => {
                expect(formatCost(0.005)).toBe('$0.0050');
                expect(formatCost(0.0099)).toBe('$0.0099');
            });
        });

        describe('formatSavings', () => {
            it('calculates percentage correctly', () => {
                expect(formatSavings(70, 100)).toBe('70%');
                expect(formatSavings(5, 20)).toBe('25%');
            });
            it('handles zero direct cost', () => {
                expect(formatSavings(10, 0)).toBe('0%');
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

    describe('API Interactions', () => {
        const mockAddress = '0x123';
        const mockSession = { session_id: 'sess_1', wallet_address: mockAddress, balance_usdc: 10 };

        describe('getOrCreateSession', () => {
            it('returns existing session if found', async () => {
                // Mock response for GET /sessions
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
                // First call returns empty list
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => ({ sessions: [] }),
                });
                // Second call (create) returns new session
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockSession,
                });

                const session = await p402.getOrCreateSession(mockAddress);
                expect(session).toEqual(mockSession);
                expect(mockFetch).toHaveBeenCalledTimes(2);
                expect(mockFetch).toHaveBeenLastCalledWith(
                    expect.stringContaining('/api/v2/sessions'),
                    expect.objectContaining({ method: 'POST' })
                );
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
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/v2/providers?health=true'),
                    expect.anything()
                );
            });

            it('throws error on failure', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: async () => ({ error: 'Internal Error' }),
                });

                await expect(p402.getProviders()).rejects.toThrow('Internal Error');
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
                        body: JSON.stringify({ session_id: 'sess_1', amount: '10' }),
                    })
                );
            });
        });
    });
});
