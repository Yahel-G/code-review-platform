import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from '../pages/Register';
import { useAuth } from '../context/AuthContext';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('Register Page', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('registers successfully', async () => {
    render(<Register />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => {
      expect(useAuth().register).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123');
    });
  });

  it('shows error on registration failure', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      register: jest.fn().mockRejectedValue({ response: { data: { message: 'Registration failed' } } }),
    });
    render(<Register />);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(await screen.findByText(/registration failed/i)).toBeInTheDocument();
  });
});
