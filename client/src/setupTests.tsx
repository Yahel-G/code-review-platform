// src/setupTests.ts
import '@testing-library/jest-dom';
import 'whatwg-fetch';
import React, { type ReactNode } from 'react';

// Silence React Router future flag warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) {
    return;
  }
  originalWarn(...args);
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
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

// Mock any other browser APIs your tests need
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'node.js',
  },
  writable: true,
});

// Export mock functions for react-router
export const mockNavigate = jest.fn();
export const mockUseNavigate = jest.fn(() => mockNavigate);
export const mockUseParams = jest.fn().mockReturnValue({});
export const mockUseLocation = jest.fn().mockReturnValue({ pathname: '/', search: '', hash: '', state: null });

// Mock socket.io
export const mockEmit = jest.fn();
export const mockOn = jest.fn();
export const mockDisconnect = jest.fn();

interface MockSocket {
  on: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
  connected: boolean;
  id: string;
}

const mockSocket: MockSocket = {
  on: jest.fn((event, callback) => {
    if (event === 'connect') {
      callback();
    }
    return mockSocket;
  }),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true,
  id: 'mock-socket-id'
};

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
  connect: jest.fn(() => mockSocket),
  Socket: jest.fn()
}));

// Partial mock of react-router-dom to override navigation and location hooks
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    __esModule: true,
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
    useLocation: () => mockUseLocation(),
  };
});

// Other setup mocks continue below