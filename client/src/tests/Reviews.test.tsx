import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Reviews from '../pages/Reviews';
import { getReviews } from '../services/review.service';
import { useAuth } from '../context/AuthContext';

const authContextMock = {
  loading: false,
  user: { _id: 'user1', username: 'testuser' },
  token: 'dummy_token',
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
};

const reviewAuthorAlice = { _id: 'alice_id', username: 'alice' };
const reviewAuthorBob = { _id: 'bob_id', username: 'bob' };

// Mock the useAuth hook
jest.mock('../context/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the getReviews API call
jest.mock('../services/review.service');
const mockGetReviews = getReviews as jest.MockedFunction<typeof getReviews>;

describe('Reviews page', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue(authContextMock);
    mockGetReviews.mockResolvedValue({
      data: [
        {
          _id: '1',
          title: 'Review 1',
          author: reviewAuthorAlice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          code: '// code sample 1',
          language: 'typescript',
        },
        {
          _id: '2',
          title: 'Review 2',
          author: reviewAuthorBob,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          code: '// code sample 2',
          language: 'typescript',
        },
      ],
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReset().mockReturnValue(authContextMock);
    mockGetReviews.mockReset().mockResolvedValue({
      data: [
        {
          _id: '1',
          title: 'Review 1',
          author: reviewAuthorAlice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          code: '// code sample 1',
          language: 'typescript',
        },
        {
          _id: '2',
          title: 'Review 2',
          author: reviewAuthorBob,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          code: '// code sample 2',
          language: 'typescript',
        },
      ]
    });
  });

  it('shows only header when loading', () => {
    mockUseAuth.mockReturnValue({
      ...authContextMock,
      loading: true,
    });

    act(() => {
      render(
        <MemoryRouter>
          <Reviews />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/All Reviews/i)).toBeInTheDocument();
    expect(screen.queryByText(/Review 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Review 2/i)).not.toBeInTheDocument();
  });

  it('renders empty state when no reviews', async () => {
    mockGetReviews.mockResolvedValueOnce({ data: [] });
    
    // Use async act to handle the async operations inside useEffect
    await act(async () => {
      render(
        <MemoryRouter>
          <Reviews />
        </MemoryRouter>
      );
      // Wait a tick for all promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(screen.getByText(/All Reviews/i)).toBeInTheDocument();
      expect(screen.queryByText(/Review 1/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Review 2/i)).not.toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    mockGetReviews.mockRejectedValueOnce(new Error('Network Error'));
    
    // Use async act to handle the async operations inside useEffect
    await act(async () => {
      render(
        <MemoryRouter>
          <Reviews />
        </MemoryRouter>
      );
      // Wait a tick for all promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should still render header, but not crash or show reviews
    await waitFor(() => {
      expect(screen.getByText(/All Reviews/i)).toBeInTheDocument();
      expect(screen.queryByText(/Review 1/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Review 2/i)).not.toBeInTheDocument();
    });
  });

  it('navigates to review detail on click', async () => {
    // Use async act to handle the async operations inside useEffect
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/reviews']}>
          <Reviews />
        </MemoryRouter>
      );
      // Wait a tick for all promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Wait for reviews to load
    const review1 = await screen.findByText(/Review 1/i);
    
    expect(review1).toBeInTheDocument();
    
    // Wrap user events in act
    await act(async () => {
      userEvent.click(review1);
    });
    
    // Since Router is in-memory, check the link's href
    expect(review1.closest('a')).toHaveAttribute('href', '/reviews/1');
  });

  it('renders reviews after loading', async () => {
    // Use async act to handle the async operations inside useEffect
    await act(async () => {
      render(
        <MemoryRouter>
          <Reviews />
        </MemoryRouter>
      );
      // Wait a tick for all promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const review1 = await screen.findByText(/Review 1/i);
    const review2 = await screen.findByText(/Review 2/i);
    expect(review1).toBeInTheDocument();
    expect(review2).toBeInTheDocument();
  });

  it('renders author and date', async () => {
    // Use async act to handle the async operations inside useEffect
    await act(async () => {
      render(
        <MemoryRouter>
          <Reviews />
        </MemoryRouter>
      );
      // Wait a tick for all promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const alice = await screen.findByText(/alice/i);
    const bob = await screen.findByText(/bob/i);
    expect(alice).toBeInTheDocument();
    expect(bob).toBeInTheDocument();
  });
});
