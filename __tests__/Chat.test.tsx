import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Chat } from '@/components/Chat';
import { useP402Store } from '@/lib/store';

// Mock Store
jest.mock('@/lib/store', () => {
    const actual = jest.requireActual('@/lib/store');
    return {
        ...actual,
        useP402Store: jest.fn(),
        useMessages: jest.fn(),
        useIsStreaming: jest.fn(),
        useBalance: jest.fn(),
        useUserProfile: jest.fn(),
    };
});

describe('Chat Component', () => {
    const mockOnModelClick = jest.fn();
    const mockOnFundClick = jest.fn();

    // Helpers to mock hooks
    const mockHooks = (
        messages = [],
        isStreaming = false,
        balance = 0,
        profile = null
    ) => {
        (require('@/lib/store').useMessages as jest.Mock).mockReturnValue(messages);
        (require('@/lib/store').useIsStreaming as jest.Mock).mockReturnValue(isStreaming);
        (require('@/lib/store').useBalance as jest.Mock).mockReturnValue(balance);
        (require('@/lib/store').useUserProfile as jest.Mock).mockReturnValue(profile);
        (require('@/lib/store').useP402Store as jest.Mock).mockImplementation((selector) => {
            // Mock selector for sendMessage inside ChatInput and streamingContent
            if (selector.toString().includes('sendMessage')) return jest.fn();
            if (selector.toString().includes('streamingContent')) return '';
            return null;
        });
    };

    beforeEach(() => {
        jest.clearAllMocks();
        window.HTMLElement.prototype.scrollIntoView = jest.fn();
    });

    it('renders EmptyState when no messages', () => {
        mockHooks([], false, 0);
        render(<Chat onModelClick={mockOnModelClick} onFundClick={mockOnFundClick} />);

        expect(screen.getByText('System Ready')).toBeInTheDocument();
        expect(screen.getByText('INITIALIZE WALLET ($5)')).toBeInTheDocument();
    });

    it('renders "Awaiting Input" when funded but empty', () => {
        mockHooks([], false, 10);
        render(<Chat onModelClick={mockOnModelClick} onFundClick={mockOnFundClick} />);

        expect(screen.getByText('AWAITING INPUT...')).toBeInTheDocument();
        expect(screen.queryByText('INITIALIZE WALLET ($5)')).not.toBeInTheDocument();
    });

    it('renders messages correctly', () => {
        const messages = [
            { id: '1', role: 'user', content: 'Hello AI' },
            { id: '2', role: 'assistant', content: 'Hello Human', cost: { total_cost: 0.001 } }
        ];

        mockHooks(messages as any, false, 10, { pfpUrl: 'http://pfp.com' });
        render(<Chat onModelClick={mockOnModelClick} onFundClick={mockOnFundClick} />);

        expect(screen.getByText('Hello AI')).toBeInTheDocument();
        expect(screen.getByText('Hello Human')).toBeInTheDocument();

        // Check for avatar image since pfpUrl is provided
        const avatar = screen.getByRole('img');
        expect(avatar).toHaveAttribute('src', 'http://pfp.com');
    });

    it('disables input while streaming', () => {
        mockHooks([], true, 10);
        render(<Chat onModelClick={mockOnModelClick} onFundClick={mockOnFundClick} />);

        const textarea = screen.getByPlaceholderText('Enter prompt...');
        expect(textarea).toBeDisabled();
        expect(screen.getByText('STATUS: BUSY')).toBeInTheDocument();
    });
});
