const { calculateCodeMetrics } = require('../utils/codeMetrics');

describe('calculateCodeMetrics', () => {
  it('returns defaults for empty or falsy code', () => {
    const result = calculateCodeMetrics('');
    expect(result).toEqual({ linesOfCode: 0, complexity: 1, maintainability: 99.5 });
  });

  it('counts single-line simple code correctly', () => {
    const code = 'const a = 1;';
    const metrics = calculateCodeMetrics(code);
    expect(metrics.linesOfCode).toBe(1);
    expect(metrics.complexity).toBe(1);
    const expectedMaint = 100 - (1 * 0.1 + 1 * 0.5);
    expect(metrics.maintainability).toBeCloseTo(expectedMaint, 5);
  });

  it('calculates complexity from decision points and loops', () => {
    const code = ['if(a){}', 'if(b){}', 'for(let i=0;i<1;i++){}', 'a||b && c;', 'a?b:c'].join('\n');
    const metrics = calculateCodeMetrics(code);
    expect(metrics.linesOfCode).toBe(5);
    expect(metrics.complexity).toBe(7);
    const expectedMaint = 100 - (5 * 0.1 + 7 * 0.5);
    expect(metrics.maintainability).toBeCloseTo(expectedMaint, 5);
  });

  it('caps maintainability at zero for very long code', () => {
    // 1000 lines of code
    const longCode = Array(1000).fill('let x = 1;').join('\n');
    const metrics = calculateCodeMetrics(longCode);
    expect(metrics.linesOfCode).toBe(1000);
    expect(metrics.complexity).toBe(1);
    expect(metrics.maintainability).toBe(0);
  });
});
