// src/setupTests.ts
import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated but some libraries still use it
    removeListener: jest.fn(), // deprecated but some libraries still use it
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock any other browser APIs your tests need
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'node.js',
  },
  writable: true,
});