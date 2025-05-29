import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SocketProvider } from '@/context/SocketContext';
import { AuthProvider } from '@/context/AuthContext';

// Mock socket.io
export const mockEmit = jest.fn();
export const mockOn = jest.fn();
export const mockDisconnect = jest.fn();

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: mockOn,
    emit: mockEmit,
    disconnect: mockDisconnect,
  })),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Custom render with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
