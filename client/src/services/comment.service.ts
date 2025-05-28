import api from './api';

export const getComments = (reviewId: string) => api.get(`/comments?reviewId=${reviewId}`);
export const createComment = (reviewId: string, content: string) =>
  api.post('/comments', { reviewId, content });
