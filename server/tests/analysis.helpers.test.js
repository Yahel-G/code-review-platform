const { generateSuggestions, getSeverity } = require('../controllers/analysis.controller');

describe('getSeverity', () => {
  it('returns error for severity 2', () => {
    expect(getSeverity(2)).toBe(2);
  });
  it('returns warning for severity 1', () => {
    expect(getSeverity(1)).toBe(1);
  });
  it('defaults to warning for unknown', () => {
    expect(getSeverity(0)).toBe(1);
    expect(getSeverity(undefined)).toBe(1);
  });
});

describe('generateSuggestions', () => {
  const defaultMetrics = { complexity: 1, maintainability: 80, linesOfCode: 50 };

  it('suggests refactoring when complexity > 10', () => {
    const issues = [];
    const metrics = { ...defaultMetrics, complexity: 20 };
    const sugg = generateSuggestions(issues, metrics);
    expect(sugg).toContainEqual(
      expect.stringContaining('refactoring to reduce cyclomatic complexity')
    );
  });

  it('suggests low maintainability when maintainability < 30', () => {
    const metrics = { ...defaultMetrics, maintainability: 20 };
    const sugg = generateSuggestions([], metrics);
    expect(sugg).toContainEqual(
      expect.stringContaining('low maintainability')
    );
  });

  it('suggests improve maintainability when 30 <= maintainability < 60', () => {
    const metrics = { ...defaultMetrics, maintainability: 50 };
    const sugg = generateSuggestions([], metrics);
    expect(sugg).toContainEqual(
      expect.stringContaining('Improve code maintainability')
    );
  });

  it('suggests var replacement for no-var issue', () => {
    const issues = [{ ruleId: 'no-var' }];
    const sugg = generateSuggestions(issues, defaultMetrics);
    expect(sugg).toContain('Replace `var` with `let` or `const` to improve scoping and prevent hoisting issues.');
  });

  it('suggests strict equality for eqeqeq issue', () => {
    const issues = [{ ruleId: 'eqeqeq' }];
    const sugg = generateSuggestions(issues, defaultMetrics);
    expect(sugg).toContain('Use strict equality (===) instead of loose equality (==) to avoid type coercion.');
  });

  it('suggests removing console for no-console issue', () => {
    const issues = [{ ruleId: 'no-console' }];
    const sugg = generateSuggestions(issues, defaultMetrics);
    expect(sugg).toContain('Remove or replace `console` statements before deploying to production.');
  });

  it('suggests avoiding eval for no-eval issue', () => {
    const issues = [{ ruleId: 'no-eval' }];
    const sugg = generateSuggestions(issues, defaultMetrics);
    expect(sugg).toContain('Avoid using `eval()` as it can lead to security vulnerabilities.');
  });

  it('suggests removing debugger for no-debugger issue', () => {
    const issues = [{ ruleId: 'no-debugger' }];
    const sugg = generateSuggestions(issues, defaultMetrics);
    expect(sugg).toContain('Remove `debugger` statements before committing code.');
  });

  it('suggests splitting code when linesOfCode > 200', () => {
    const metrics = { ...defaultMetrics, linesOfCode: 250 };
    const sugg = generateSuggestions([], metrics);
    expect(sugg).toContain('Consider splitting your code into smaller, more manageable modules.');
  });

  it('returns default suggestion when no issues or metrics', () => {
    const sugg = generateSuggestions([], { complexity: 1, maintainability: 80, linesOfCode: 10 });
    expect(sugg).toEqual(['Your code follows good practices. Keep it up!']);
  });
});
