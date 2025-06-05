const cp = require('child_process');
const { CSharpAnalyzer, JavaAnalyzer } = require('../utils/codeAnalyzer');

describe('JavaAnalyzer error parsing', () => {
  const analyzer = new JavaAnalyzer();
  beforeEach(() => jest.restoreAllMocks());

  it('parses error output correctly with no ruleId', async () => {
    const out = 'Test.java:8: error: fatal error occurred';
    jest.spyOn(cp, 'execSync').mockReturnValueOnce(out);
    const issues = await analyzer.analyze('class Foo {}');
    expect(issues).toEqual([{
      ruleId: 'java',
      message: 'fatal error occurred',
      line: 8,
      column: 1,
      severity: 2,
    }]);
  });
});

describe('CSharpAnalyzer unit tests', () => {
  const analyzer = new CSharpAnalyzer();
  beforeEach(() => jest.restoreAllMocks());

  it('parses build failure stderr correctly', async () => {
    const err = new Error('dotnet build failed');
    err.stderr = 'Program.cs(10,5): error CS1002: ; expected';
    jest.spyOn(cp, 'execSync').mockImplementation(() => { throw err; });
    const issues = await analyzer.analyze('public class C {}');
    expect(issues).toEqual([{
      ruleId: 'CS1002',
      message: '; expected',
      line: 10,
      column: 5,
      severity: 2,
    }]);
  });

  it('parses analysis output after successful build', async () => {
    jest.spyOn(cp, 'execSync')
      .mockReturnValueOnce('') // first build succeeds
      .mockReturnValueOnce('Program.cs(15,3): warning CS2001: dummy warning');
    const issues = await analyzer.analyze('public class C {}');
    expect(issues).toEqual([{
      ruleId: 'CS2001',
      message: 'dummy warning',
      line: 15,
      column: 3,
      severity: 1,
    }]);
  });
});
