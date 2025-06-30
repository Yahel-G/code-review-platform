import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ProtectedRoute', () => {
  it('renders loading spinner while loading', () => {
    (useAuth as jest.Mock).mockReturnValue({ token: null, loading: true });
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders children if authenticated and admin required, and user is admin', () => {
    (useAuth as jest.Mock).mockReturnValue({ token: 'token', loading: false, user: { isAdmin: true } });
    render(
      <MemoryRouter initialEntries={['/admin']}> 
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to / if not admin and admin required', () => {
    (useAuth as jest.Mock).mockReturnValue({ token: 'token', loading: false, user: { isAdmin: false } });
    render(
      <MemoryRouter initialEntries={['/admin']}> 
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    // Should not render children
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
  it('redirects to login if not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ token: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders children if authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ token: 'token', loading: false });
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <ProtectedRoute>
          <div>Secret Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});
