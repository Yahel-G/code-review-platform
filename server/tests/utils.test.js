const { JsTsAnalyzer } = require('../utils/codeAnalyzer');
const { calculateCodeMetrics } = require('../utils/codeMetrics');
const logger = require('../utils/logger');

describe('Base CodeAnalyzer.parseLintOutput', () => {
  const analyzer = new JsTsAnalyzer();

  it('filters empty lines and null parser returns', () => {
    const raw = 'first\n\nsecond\nthird';
    const parse = line => (line === 'second' ? null : { val: line });
    const result = analyzer.parseLintOutput(raw, parse);
    expect(result).toEqual([{ val: 'first' }, { val: 'third' }]);
  });

  it('returns empty array for empty output', () => {
    const result = analyzer.parseLintOutput('', () => ({ val: 'x' }));
    expect(result).toEqual([]);
  });
});

describe('calculateCodeMetrics', () => {
  it('calculates metrics for non-empty code', () => {
    const code = 'line1\nif(x){ }\nfor(i=0;i<1;i++){ }';
    const metrics = calculateCodeMetrics(code);
    expect(metrics.linesOfCode).toBe(3);
    expect(metrics.complexity).toBeGreaterThanOrEqual(1);
    expect(metrics.maintainability).toBeGreaterThanOrEqual(0);
    expect(metrics.maintainability).toBeLessThanOrEqual(100);
  });

  it('handles empty code', () => {
    const metrics = calculateCodeMetrics('');
    expect(metrics.linesOfCode).toBe(0);
    expect(metrics.complexity).toBe(1);
    expect(typeof metrics.maintainability).toBe('number');
  });
});

describe('logger.stream', () => {
  it('writes trimmed messages to info', () => {
    const infoSpy = jest.spyOn(logger, 'info').mockImplementation(() => {});
    logger.stream.write('hello world\n');
    expect(infoSpy).toHaveBeenCalledWith('hello world');
    infoSpy.mockRestore();
  });
});
