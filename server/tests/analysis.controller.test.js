// Mock the JavaAnalyzer instance that will be used in the code
const mockJavaAnalyzerInstance = {
  analyze: jest.fn().mockResolvedValue([{ ruleId: 'java-rule' }])
};

// Mock the codeAnalyzer module
const mockAnalyzeCode = jest.fn();

jest.mock('../utils/codeAnalyzer', () => {
  const originalModule = jest.requireActual('../utils/codeAnalyzer');
  return {
    ...originalModule,
    analyzeCode: mockAnalyzeCode,
    JavaAnalyzer: jest.fn().mockImplementation(() => mockJavaAnalyzerInstance)
  };
});

// Mock codeMetrics
const mockCalculateMetrics = jest.fn().mockReturnValue({
  complexity: 10,
  maintainability: 60,
  linesOfCode: 50
});

jest.mock('../utils/codeMetrics', () => ({
  calculateCodeMetrics: mockCalculateMetrics
}));

// Mock AI service
const mockGetCodeSuggestions = jest.fn().mockResolvedValue('AI suggestion');
jest.mock('../services/aiAnalysis.service', () => ({
  getCodeSuggestions: mockGetCodeSuggestions
}));

// Mock Analysis model
const mockAnalysisSave = jest.fn().mockResolvedValue({});
jest.mock('../models/Analysis', () => ({
  find: jest.fn(),
  save: mockAnalysisSave,
  prototype: { save: mockAnalysisSave }
}));

const { analyzeCode, getAnalysisHistory } = require('../controllers/analysis.controller');
const Analysis = require('../models/Analysis');
const codeAnalyzer = require('../utils/codeAnalyzer');

describe('analysis.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeCode', () => {
    it('returns 400 if code missing', async () => {
      const req = { body: {}, user: {} };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      
      await analyzeCode(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Code is required' });
    });

    it('returns 200 with issues, metrics, suggestions for JavaScript', async () => {
      // Setup mocks
      mockAnalyzeCode.mockResolvedValue([{ ruleId: 'no-var' }]);
      mockCalculateMetrics.mockReturnValue({ 
        complexity: 5, 
        maintainability: 50, 
        linesOfCode: 100 
      });
      
      const req = { 
        body: { 
          code: 'const x = 1;', 
          language: 'javascript' 
        }, 
        user: { id: 'test-user' } 
      };
      
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn() 
      };
      
      await analyzeCode(req, res);
      
      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('issues');
      expect(response).toHaveProperty('metrics');
      expect(response).toHaveProperty('suggestions');
      expect(response).toHaveProperty('aiSuggestions');
      expect(response.metrics).toMatchObject({
        complexity: 5,
        maintainability: 50,
        linesOfCode: 100
      });
    });

    it('handles Java code analysis', async () => {
      // Setup mocks for Java analysis
      mockAnalyzeCode.mockImplementation(async (code, language) => {
        if (language === 'java') {
          return [{ ruleId: 'java-rule', message: 'Test issue', line: 1, column: 1, severity: 1 }];
        }
        return [];
      });
      
      const req = { 
        body: { 
          code: 'public class Test {}', 
          language: 'java' 
        }, 
        user: { id: 'test-user' } 
      };
      
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn() 
      };
      
      await analyzeCode(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveProperty('issues');
      expect(Array.isArray(response.issues)).toBe(true);
      expect(response.issues.length).toBeGreaterThan(0);
      expect(response.issues.some(issue => issue.ruleId === 'java-rule')).toBe(true);
    });

    it('handles internal errors', async () => {
      mockAnalyzeCode.mockRejectedValue(new Error('Test error'));
      
      const req = { 
        body: { 
          code: 'const x = 1;', 
          language: 'javascript' 
        }, 
        user: {} 
      };
      
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn() 
      };
      
      await analyzeCode(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Server error during code analysis')
      }));
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