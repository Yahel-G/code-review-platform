import React from 'react';
import { render, screen } from '@/tests/test-utils';
import Header from '@/components/Header';
import { MemoryRouter } from 'react-router-dom';

test('renders header links', () => {
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

  expect(screen.getByText(/CodeReview/i)).toBeInTheDocument();
  expect(screen.getByText(/Login/i)).toBeInTheDocument();
  expect(screen.getByText(/Register/i)).toBeInTheDocument();
});
