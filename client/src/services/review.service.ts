import api from './api';

export interface Review {
  _id: string;
  title: string;
  code: string;
  language: string;
  author: {
    _id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const getReviews = (): Promise<{ data: Review[] }> => api.get('/reviews');

export const getReview = (id: string): Promise<{ data: Review }> => api.get(`/reviews/${id}`);

export const createReview = (data: {
  title: string;
  code: string;
  language: string;
}): Promise<{ data: Review }> => api.post('/reviews', data);

export const updateReview = (
  id: string,
  data: Partial<{
    title?: string;
    code?: string;
    language?: string;
  }>
): Promise<{ data: Review }> => api.put(`/reviews/${id}`, data);

export const deleteReview = (id: string): Promise<void> => api.delete(`/reviews/${id}`);
