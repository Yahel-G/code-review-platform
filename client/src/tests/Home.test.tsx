import React from 'react';
import { render, screen, fireEvent } from './test-utils';
import Home from '../pages/Home';
import { useAuth } from '../context/AuthContext';

jest.mock('../pages/Reviews', () => ({
  __esModule: true,
  default: () => <div>Mocked Reviews</div>
}));

jest.mock('../services/review.service', () => ({
  __esModule: true,
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

import { act } from 'react';

describe('Home page', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      token: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders tabs and switches panel', async () => {
    await act(async () => {
      render(<Home />);
    });

    // Verify initial tab
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText(/Recent Code Reviews/i)).toBeInTheDocument();

    // Switch to Submit Code tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Submit Code/i }));
    });
    expect(screen.getByRole('tab', { name: /Submit Code/i })).toHaveAttribute('aria-selected', 'true');
  });
});
