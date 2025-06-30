const { getCodeSuggestions } = require('../services/aiAnalysis.service');

describe('AI Service', () => {
  it('returns Test suggestion in test env', async () => {
    process.env.NODE_ENV = 'test';
    const result = await getCodeSuggestions('function foo() {}', 'javascript');
    expect(result).toBe('Test suggestion');
  });
});
