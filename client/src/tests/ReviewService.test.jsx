import { createReview, getReviews, getReview, updateReview, deleteReview } from '../services/review.service';
import api from '../services/api';

// Mock the API module
jest.mock('../services/api');

const mockToken = 'test-token-123';

describe('Review Service', () => {
  const mockReview = {
    _id: '1',
    title: 'Test Review',
    code: 'function test() { return "test"; }',
    language: 'javascript',
    author: {
      _id: 'user1',
      username: 'testuser'
    }
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    it('should create a new review', async () => {
      const reviewData = {
        title: 'Test Review',
        code: 'function test() { return "test"; }',
        language: 'javascript'
      };

      // Mock the API response
      api.post.mockResolvedValueOnce({
        data: { data: mockReview }
      });
      const result = await createReview(reviewData, mockToken);

      expect(api.post).toHaveBeenCalledWith(
        '/reviews',
        reviewData,
        {
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );
      expect(result).toEqual({ data: mockReview })
    });

    it('should handle API errors', async () => {
      const error = new Error('Network Error');
      api.post.mockRejectedValueOnce(error);

      await expect(
        createReview({ title: 'Test', code: 'test', language: 'javascript' }, mockToken)
      ).rejects.toThrow('Network Error');
    });
  });

  describe('getReviews', () => {
    it('should fetch all reviews', async () => {
      const mockReviews = [mockReview];
      api.get.mockResolvedValueOnce({
        data: { data: mockReviews }
      });

      const result = await getReviews();

      expect(api.get).toHaveBeenCalledWith('/reviews');
      expect(result).toEqual({ data: { data: mockReviews } })
    });
  });

  describe('getReview', () => {
    it('should fetch a single review by id', async () => {
      api.get.mockResolvedValueOnce({
        data: { data: mockReview }
      });

      const result = await getReview('1');

      expect(api.get).toHaveBeenCalledWith('/reviews/1');
      expect(result).toEqual({ data: { data: mockReview } })
    });
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const updatedData = { title: 'Updated Title' };
      api.put.mockResolvedValueOnce({
        data: { 
          data: { ...mockReview, ...updatedData } 
        }
      });

      const result = await updateReview('1', updatedData, mockToken);

      expect(api.put).toHaveBeenCalledWith(
        '/reviews/1',
        updatedData,
        {
          headers: { Authorization: `Bearer ${mockToken}` }
        }
      );
      expect(result.data.title).toBe('Updated Title');
    });
  });

  describe('deleteReview', () => {
    it('should delete a review', async () => {
      api.delete.mockResolvedValueOnce({});

      await deleteReview('1', mockToken);

      expect(api.delete).toHaveBeenCalledWith('/reviews/1', {
        headers: { Authorization: `Bearer ${mockToken}` }
      });
    });
  });
});