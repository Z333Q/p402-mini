import { estimateCost, formatCost, formatSavings } from './p402-client';

describe('P402Client Helper Functions', () => {
    describe('estimateCost', () => {
        it('should correctly estimate cost for given tokens', () => {
            const model = { input_cost_per_1k: 0.01, output_cost_per_1k: 0.1 };
            const cost = estimateCost(model, 1000, 1000);
            expect(cost).toBe(0.11);
        });

        it('should handle zero tokens', () => {
            const model = { input_cost_per_1k: 0.01, output_cost_per_1k: 0.1 };
            const cost = estimateCost(model, 0, 0);
            expect(cost).toBe(0);
        });
    });

    describe('formatCost', () => {
        it('should format small costs as millicents', () => {
            expect(formatCost(0.0001)).toBe('$0.100m');
        });

        it('should format cents correctly', () => {
            expect(formatCost(0.05)).toBe('$0.050');
        });

        it('should format larger costs', () => {
            expect(formatCost(1.2346)).toBe('$1.235');
        });
    });

    describe('formatSavings', () => {
        it('should calculate percentage correctly', () => {
            expect(formatSavings(25, 100)).toBe('25%');
        });

        it('should handle zero direct cost', () => {
            expect(formatSavings(10, 0)).toBe('0%');
        });
    });
});
