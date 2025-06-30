import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ReviewDetail from '../pages/ReviewDetail';
import { SocketProviderMock } from './__mocks__/SocketProviderMock';
import * as reviewService from '../services/review.service';
import * as commentService from '../services/comment.service';
import { useParams } from 'react-router-dom';

jest.mock('../services/review.service', () => ({
  getReview: jest.fn(),
}));
jest.mock('../services/comment.service', () => ({
  getComments: jest.fn(),
  createComment: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

describe('ReviewDetail Page', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'abc123' });
    (reviewService.getReview as jest.Mock).mockResolvedValue({ data: { _id: 'abc123', title: 'Test Review', code: 'print(1)', language: 'python', author: { username: 'bob' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } });
    (commentService.getComments as jest.Mock).mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders review details', async () => {
    render(
  <SocketProviderMock>
    <ReviewDetail />
  </SocketProviderMock>
);
    expect(await screen.findByText(/Test Review/)).toBeInTheDocument();
    expect(await screen.findByText(/print\(1\)/)).toBeInTheDocument();
    expect(await screen.findByText(/bob/)).toBeInTheDocument();
  });

  it('renders comments section', async () => {
    render(
  <SocketProviderMock>
    <ReviewDetail />
  </SocketProviderMock>
);
    expect(await screen.findByText(/comments/i)).toBeInTheDocument();
  });
});
