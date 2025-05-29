import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '@/App';

// Mock the ReviewDetail component since it's causing issues with useSocket
jest.mock('@/pages/ReviewDetail', () => ({
  __esModule: true,
  default: () => <div>Mocked Review Detail</div>,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  useParams: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/' })),
}));

test('renders CodeReview header', () => {
  render(<App />);
  const header = screen.getByText(/CodeReview/i);
  expect(header).toBeInTheDocument();
});
