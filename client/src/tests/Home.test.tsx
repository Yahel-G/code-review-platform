import React from 'react';
import { render, screen, fireEvent } from '@/tests/test-utils';
import Home from '@/pages/Home';
import { MemoryRouter } from 'react-router-dom';

describe('Home page', () => {
  test('renders tabs and switches panel', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Verify initial tab
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText(/Recent Code Reviews/i)).toBeInTheDocument();

    // Switch to Submit Code tab
    fireEvent.click(screen.getByText(/Submit Code/i));
    expect(screen.getByText(/Submit Code/i)).toHaveAttribute('aria-selected', 'true');
  });
});
