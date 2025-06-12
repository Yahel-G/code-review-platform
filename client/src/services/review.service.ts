import api from '@/services/api';

export interface Review {
  _id: string;
  title: string;
  code: string;
  language: string;
  author: {
    _id: string;
    username: string;
  };
  analysis?: {
    issues: Array<{
      ruleId: string;
      severity: number;
      message: string;
      line: number;
      column: number;
      endLine?: number;
      endColumn?: number;
    }>;
    metrics: {
      complexity: number;
      maintainability: number;
      linesOfCode: number;
    };
    suggestions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export const getReviews = (): Promise<{ data: Review[] }> => api.get('/reviews');
export const getReview = (id: string): Promise<{ data: Review }> => api.get(`/reviews/${id}`);
export const createReview = async (
  data: {
    title: string;
    code: string;
    language: string;
    analysis?: any; // Matches the analysis data structure
  },
  token: string
): Promise<{ data: Review }> => {
  const response = await api.post('/reviews', data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const updateReview = async (
  id: string,
  data: Partial<{
    title?: string;
    code?: string;
    language?: string;
  }>,
  token: string
): Promise<{ data: Review }> => {
  const response = await api.put(`/reviews/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

export const deleteReview = async (id: string, token: string): Promise<void> => {
  await api.delete(`/reviews/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
