import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from './test-utils';
import App from '../App';
import * as reviewService from '@/services/review.service';
import { mockNavigate } from '../setupTests';

// Mock the ReviewDetail component
jest.mock('../pages/ReviewDetail', () => ({
  __esModule: true,
  default: () => <div>Mocked Review Detail</div>,
}));

// Partial mock of review.service with default resolved getReviews
jest.mock('@/services/review.service', () => {
  const actual = jest.requireActual('@/services/review.service');
  return {
    __esModule: true,
    ...actual,
    getReviews: jest.fn().mockResolvedValue({ data: [] }),
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (reviewService.getReviews as jest.Mock).mockClear();
    mockNavigate.mockClear();
  });

  test('renders CodeReview header and handles initial load', async () => {
    render(<App />, { initialEntries: ['/'] });
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

    render(<App />, { initialEntries: ['/reviews'] });

    // Wait for the Reviews component to load and call getReviews
    await waitFor(() => {
      expect(reviewService.getReviews).toHaveBeenCalled();
    });

    // Example: Check if the review title is displayed
    // This depends on your Reviews.tsx component's rendering logic
    // await screen.findByText('Test Review'); // if it displays titles
  });
});

describe('App', () => {
  test('renders app without crashing', () => {
    render(<App />, { initialEntries: ['/'] });
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});