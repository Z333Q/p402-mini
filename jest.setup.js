require('@testing-library/jest-dom');

// TextEncoder polyfill for jsdom environment (needed for some libs)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Fetch Global
global.fetch = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};
