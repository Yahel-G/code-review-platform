import React from 'react';
import { render, screen, fireEvent, waitFor } from './test-utils';
import Login from '../pages/Login';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/Home';
import { mockNavigate } from '../setupTests';
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

describe('Login page', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      login: jest.fn().mockResolvedValue(undefined),
    });
  });

  test('submits form successfully and navigates home', async () => {
    (useAuth as jest.Mock).mockReturnValue({ login: jest.fn().mockResolvedValue(undefined) });
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  test('displays error on login failure', async () => {
    const errorMsg = 'Invalid credentials';
    (useAuth as jest.Mock).mockReturnValue({ login: jest.fn().mockRejectedValue({ response: { data: { message: errorMsg } } }) });
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'bad@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'badpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    expect(await screen.findByText(errorMsg)).toBeInTheDocument();
  });
});
