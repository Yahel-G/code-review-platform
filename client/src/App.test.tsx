import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the ReviewDetail component since it's causing issues with useSocket
jest.mock('./pages/ReviewDetail', () => ({
  __esModule: true,
  default: () => <div>Mocked Review Detail</div>,
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element }: { element: React.ReactNode }) => element,
  Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  useParams: () => ({}),
  useLocation: () => ({}),
}));

test('renders CodeReview header', () => {
  render(<App />);
  const header = screen.getByText(/CodeReview/i);
  expect(header).toBeInTheDocument();
});
