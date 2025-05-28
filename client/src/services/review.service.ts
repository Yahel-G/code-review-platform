import api from './api';

export const getReviews = () => api.get('/reviews');
export const getReview = (id: string) => api.get(`/reviews/${id}`);
export const createReview = (data: any) => api.post('/reviews', data);
