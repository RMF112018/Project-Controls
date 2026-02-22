import '@testing-library/jest-dom';

// jsdom doesn't provide TextEncoder/TextDecoder — needed by @tanstack/router-core SSR serializer
if (typeof globalThis.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// jsdom doesn't implement ResizeObserver — stub it for components using HbcEChart
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).ResizeObserver = class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// jsdom doesn't implement window.matchMedia — stub it for components that use useResponsive
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
