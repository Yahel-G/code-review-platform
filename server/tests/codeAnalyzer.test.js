const { analyzeCode, JsTsAnalyzer } = require('../utils/codeAnalyzer');

describe('JsTsAnalyzer', () => {
  const analyzer = new JsTsAnalyzer();

  it('returns empty array for blank code', async () => {
    const issues = await analyzer.analyze('', 'javascript');
    expect(issues).toEqual([]);
  });

  it('detects no-var and no-console warnings', async () => {
    const code = 'var a = 1; console.log(a);';
    const issues = await analyzer.analyze(code, 'javascript');
    const ruleIds = issues.map(i => i.ruleId);
    expect(ruleIds).toContain('no-var');
    expect(ruleIds).toContain('no-console');
  });

  it('detects eqeqeq violation', async () => {
    const code = 'if (a == b) {}';
    const issues = await analyzer.analyze(code, 'javascript');
    expect(issues.some(i => i.ruleId === 'eqeqeq')).toBe(true);
  });
});

describe('analyzeCode helper', () => {
  it('returns empty array for whitespace-only code', async () => {
    const res = await analyzeCode('   ', 'javascript');
    expect(res).toEqual([]);
  });

  it('handles parsing errors gracefully', async () => {
    // Missing closing brace
    const issues = await analyzeCode('function() {', 'javascript');
    expect(issues.length).toBeGreaterThan(0);
    const ruleIds = issues.map(i => i.ruleId);
    expect(ruleIds).toContain('syntax-error');
  });
});
