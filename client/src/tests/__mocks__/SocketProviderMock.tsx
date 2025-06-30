import React, { ReactNode } from 'react';
import { SocketContext } from '../../context/SocketContext';

// Provide a mock socket object (can be just an empty object or a jest.fn())
const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

// Patch Monaco mock to filter out unknown props
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: (props: any) => {
    // Only allow valid textarea props
    const { value, onChange, name, id, ['data-testid']: dataTestId } = props;
    return <textarea value={value} onChange={onChange} name={name} id={id} data-testid={dataTestId || 'monaco-editor'} />;
  },
}));

export const SocketProviderMock = ({ children }: { children: ReactNode }) => (
  <SocketContext.Provider value={mockSocket as any}>
    {children}
  </SocketContext.Provider>
);
