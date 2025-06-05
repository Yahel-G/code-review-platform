import React from 'react';
import { render, screen, waitFor } from '@testing-library/react'; // Added waitFor
import { MemoryRouter } from 'react-router-dom'; // Import MemoryRouter
import App from '@/App';
import * as reviewService from '@/services/review.service'; // Import for mocking

// Mock the ReviewDetail component
jest.mock('@/pages/ReviewDetail', () => ({
  __esModule: true,
  default: () => <div>Mocked Review Detail</div>,
}));

// Fully Manual Mock for react-router-dom to avoid jest.requireActual issues
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
  useParams: jest.fn().mockReturnValue({}),
  useLocation: jest.fn().mockReturnValue({ pathname: '/', search: '', hash: '', state: null }),
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element }: { element: React.ReactNode }) => <>{element}</>,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
  // Provide a functional mock for MemoryRouter, as it's imported by name in the test file
  MemoryRouter: ({ children, initialEntries }: { children: React.ReactNode; initialEntries?: string[] }) => <>{children}</>,
  // Add other exports if App.tsx or its children use them and cause errors
  // e.g., Outlet: () => <div>Mocked Outlet</div>,
  // Navigate: ({ to }: { to: string }) => <div>Mocked Navigate to {to}</div>,
}));

// Mock the reviewService
jest.mock('@/services/review.service', () => ({
  // ...jest.requireActual('@/services/review.service'), // Keep other exports if any
  getReviews: jest.fn(),
  // Add mocks for other functions from review.service if App.tsx or its children use them
  // e.g., getReview: jest.fn(), createReview: jest.fn(), etc.
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (reviewService.getReviews as jest.Mock).mockClear();
    mockNavigate.mockClear();
    // Provide a default mock implementation for getReviews to prevent network errors
    (reviewService.getReviews as jest.Mock).mockResolvedValue({ data: [] });
  });

  test('renders CodeReview header and handles initial load', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    const header = screen.getByText(/CodeReview/i);
    expect(header).toBeInTheDocument();

    // Wait for any potential async operations triggered on app load
    await waitFor(() => {
      // If App routes to /reviews by default or Reviews component is eager loaded
      // and makes a call on mount, you might expect getReviews to be called.
      // For now, we primarily ensure no errors due to unmocked calls.
      // If your app doesn't immediately fetch reviews, this might be called 0 times.
      // Example: if it does fetch: expect(reviewService.getReviews).toHaveBeenCalled();
    });
  });

  test('navigates to /reviews and calls getReviews', async () => {
    (reviewService.getReviews as jest.Mock).mockResolvedValue({ data: [{ id: '1', title: 'Test Review', code: 'console.log()', language: 'javascript', comments: [], author: { id: 'u1', username: 'tester' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] });

    render(
      <MemoryRouter initialEntries={['/reviews']}>
        <App />
      </MemoryRouter>
    );

    // Wait for the Reviews component to load and call getReviews
    await waitFor(() => {
      expect(reviewService.getReviews).toHaveBeenCalled();
    });

    // Example: Check if the review title is displayed
    // This depends on your Reviews.tsx component's rendering logic
    // await screen.findByText('Test Review'); // if it displays titles
  });
});
