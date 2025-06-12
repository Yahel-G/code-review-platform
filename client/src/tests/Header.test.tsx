import React from 'react';
import { render, screen } from './test-utils';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import * as reviewService from '../services/review.service';

jest.mock('../services/review.service', () => ({
  getReviews: jest.fn().mockResolvedValue({ data: [] })
}));

jest.mock('../context/AuthContext', () => {
  const originalModule = jest.requireActual('../context/AuthContext');
  return {
    __esModule: true,
    ...originalModule,
    useAuth: jest.fn(),
  };
});

describe('Header', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      logout: jest.fn(),
    });
  });

  test('renders header with navigation links for logged out user', () => {
    render(<Header />);
    expect(screen.getByText(/CodeReview/i)).toBeInTheDocument();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Register/i)).toBeInTheDocument();
  });

  test('renders header with navigation links for logged in user', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      logout: jest.fn(),
    });
    render(<Header />);
    expect(screen.getByText(/CodeReview/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });
});
