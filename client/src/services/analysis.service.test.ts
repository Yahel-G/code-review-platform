import api from './api';
import { analyzeCode, getAnalysisHistory, AnalysisResult, AnalysisHistoryItem } from './analysis.service';

jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('analysis.service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('analyzeCode', () => {
    it('throws error when code is empty', async () => {
      await expect(analyzeCode('', 'javascript', 'token')).rejects.toThrow('Code must be a non-empty string');
    });

    it('throws error when token is missing', async () => {
      await expect(analyzeCode('const x = 1;', 'javascript', '')).rejects.toThrow('Authentication token is required');
    });

    it('returns data on successful api.post', async () => {
      const fakeResult: AnalysisResult = {
        issues: [{ ruleId: 'no-undef', severity: 2, message: 'Undefined var', line: 1, column: 5 }],
        metrics: { complexity: 1, maintainability: 90, linesOfCode: 1 },
        suggestions: ['Define variable'],
      };
      mockedApi.post.mockResolvedValue({ data: fakeResult });

      const result = await analyzeCode('const x;', 'Javascript', 'token123');
      expect(mockedApi.post).toHaveBeenCalledWith(
        '/analyze',
        { code: 'const x;', language: 'javascript' },
        expect.any(Object)
      );
      expect(result).toEqual(fakeResult);
    });

    it('returns error object when api.post fails', async () => {
      mockedApi.post.mockRejectedValue({ response: { data: { message: 'Server error' } } });
      const result = await analyzeCode('code', 'js', 'token');
      expect(result.issues[0].ruleId).toBe('analysis-error');
      expect(result.suggestions).toContain('Server error');
    });
  });

  describe('getAnalysisHistory', () => {
    it('throws error when token is missing', async () => {
      await expect(getAnalysisHistory('')).rejects.toThrow('Authentication token is required');
    });

    it('returns data on successful api.get', async () => {
      const fakeItems: AnalysisHistoryItem[] = [
        { id: '1', language: 'js', metrics: { complexity: 1, maintainability: 100, linesOfCode: 2 }, createdAt: '2025-01-01T00:00:00Z' },
      ];
      mockedApi.get.mockResolvedValue({ data: fakeItems });

      const items = await getAnalysisHistory('token');
      expect(mockedApi.get).toHaveBeenCalledWith(
        '/analyze/history',
        expect.any(Object)
      );
      expect(items).toEqual(fakeItems);
    });

    it('returns empty array when api.get fails', async () => {
      mockedApi.get.mockRejectedValue(new Error('Network'));
      const items = await getAnalysisHistory('token');
      expect(items).toEqual([]);
    });
  });
});
