import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';

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
type Store = Record<string, string>;
const localStorageMock = (() => {
  let store: Store = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Custom render with all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

const customRender = (
  ui: ReactElement | { children: ReactElement }, // Adjust type to reflect what might be coming in
  { initialEntries = ['/'], ...options }: CustomRenderOptions = {}
) => {
  const actualUi: ReactElement = (ui as any).children || ui;
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter
      initialEntries={initialEntries}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemoryRouter>
  );
  return render(actualUi, { wrapper: Wrapper, ...options });
};

export * from '@testing-library/react';
export { customRender as render };