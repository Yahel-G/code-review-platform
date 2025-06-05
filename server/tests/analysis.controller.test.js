jest.mock('../utils/codeAnalyzer', () => ({ analyzeCode: jest.fn() }));
jest.mock('../utils/codeMetrics', () => ({ calculateCodeMetrics: jest.fn() }));

const { analyzeCode: analyzeCodeMock } = require('../utils/codeAnalyzer');
const { calculateCodeMetrics } = require('../utils/codeMetrics');
const { analyzeCode, getAnalysisHistory } = require('../controllers/analysis.controller');
const Analysis = require('../models/Analysis');

describe('analysis.controller', () => {
  afterEach(() => jest.clearAllMocks());

  describe('analyzeCode', () => {
    it('returns 400 if code missing', async () => {
      const req = { body: {}, user: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await analyzeCode(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Code is required' });
    });

    it('returns 200 with issues, metrics, suggestions', async () => {
      analyzeCodeMock.mockResolvedValue([{ ruleId: 'no-var' }]);
      calculateCodeMetrics.mockReturnValue({ complexity: 5, maintainability: 50, linesOfCode: 100 });
      const req = { body: { code: 'x', language: 'js' }, user: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await analyzeCode(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const jsonRes = res.json.mock.calls[0][0];
      expect(jsonRes).toHaveProperty('issues', [{ ruleId: 'no-var' }]);
      expect(jsonRes).toHaveProperty('metrics', { complexity: 5, maintainability: 50, linesOfCode: 100 });
      expect(Array.isArray(jsonRes.suggestions)).toBe(true);
    });

    it('handles internal errors', async () => {
      analyzeCodeMock.mockRejectedValue(new Error('fail'));
      const req = { body: { code: 'x', language: 'js' }, user: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await analyzeCode(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error during code analysis' });
    });
  });

  describe('getAnalysisHistory', () => {
    it('returns formatted history on success', async () => {
      const mockData = [
        { _id: '1', language: 'js', metrics: { complexity: 1, maintainability: 2, linesOfCode: 3 }, createdAt: new Date('2025-01-01') },
      ];
      jest.spyOn(Analysis, 'find').mockReturnValue({
        sort: () => ({
          select: () => ({
            limit: () => Promise.resolve(mockData),
          }),
        }),
      });
      const req = { user: { id: 'u1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAnalysisHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      const data = res.json.mock.calls[0][0];
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toEqual({
        id: '1',
        language: 'js',
        metrics: { complexity: 1, maintainability: 2, linesOfCode: 3 },
        createdAt: mockData[0].createdAt,
      });
    });

    it('handles errors gracefully', async () => {
      jest.spyOn(Analysis, 'find').mockImplementation(() => { throw new Error('db'); });
      const req = { user: { id: 'u1' } };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      await getAnalysisHistory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to fetch analysis history' });
    });
  });
});
