const { analyzeCode, JsTsAnalyzer, PythonAnalyzer, JavaAnalyzer, CppAnalyzer, CodeAnalyzer, CSharpAnalyzer } = require('../utils/codeAnalyzer');
const cp = require('child_process');
const fs = require('fs');

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

describe('JsTsAnalyzer extended cases', () => {
  const analyzer = new JsTsAnalyzer();

  it('detects no-debugger error', async () => {
    const code = 'debugger;';
    const issues = await analyzer.analyze(code, 'javascript');
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'no-debugger', severity: 2 })
      ])
    );
  });

  it('detects prefer-const warning', async () => {
    const code = 'let a = 2;';
    const issues = await analyzer.analyze(code, 'javascript');
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'prefer-const', severity: 1 })
      ])
    );
  });

  it('returns empty for clean code', async () => {
    const code = 'const x = 1;';
    const issues = await analyzer.analyze(code, 'javascript');
    expect(issues).toEqual([]);
  });

  it('analyzes TypeScript code with eqeqeq violation', async () => {
    const tsCode = 'let a: number = 5; if (a == 5) {}';
    const issues = await analyzer.analyze(tsCode, 'typescript');
    expect(issues.some(i => i.ruleId === 'eqeqeq')).toBe(true);
  });
});

describe('JsTsAnalyzer TypeScript extended cases', () => {
  const analyzer = new JsTsAnalyzer();

  it('detects multiple issues in TS code snippet', async () => {
    const code = 'var a: number = 1; console.log(a); debugger; if(a==1) { let b = 2; }';
    const issues = await analyzer.analyze(code, 'typescript');
    const ruleMap = issues.reduce((map, issue) => {
      map[issue.ruleId] = issue;
      return map;
    }, {});

    expect(Object.keys(ruleMap)).toEqual(
      expect.arrayContaining([
        'no-var', 'no-console', 'no-debugger', 'eqeqeq', 'prefer-const'
      ])
    );

    // Check severity for each rule
    expect(ruleMap['no-var'].severity).toBe(2);
    expect(ruleMap['no-console'].severity).toBe(1);
    expect(ruleMap['no-debugger'].severity).toBe(2);
    expect(ruleMap['eqeqeq'].severity).toBe(2);
    expect(ruleMap['prefer-const'].severity).toBe(1);
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

describe('analyzeCode helper extended', () => {
  it('analyzes TypeScript code via helper for var and debugger', async () => {
    const code = 'var b = 3; debugger;';
    const issues = await analyzeCode(code, 'typescript');
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: 'no-debugger', severity: 2 }),
        expect.objectContaining({ ruleId: 'no-var', severity: 2 })
      ])
    );
  });
});

describe('JsTsAnalyzer syntax error handling', () => {
  const analyzer = new JsTsAnalyzer();

  it('returns syntax-error for invalid JS code', async () => {
    const code = 'console.log('; // missing closing parenthesis
    const issues = await analyzer.analyze(code, 'javascript');
    expect(issues.some(i => i.ruleId === 'syntax-error')).toBe(true);
  });
});

describe('analyzeCode helper unsupported language', () => {
  it('returns unsupported-language for unknown language', async () => {
    const code = 'some random code';
    const issues = await analyzeCode(code, 'ruby');
    expect(issues).toEqual([
      {
        ruleId: 'unsupported-language',
        message: expect.stringContaining('Unsupported language: ruby'),
        line: 1,
        column: 1,
        severity: 1,
      },
    ]);
  });
});

describe('analyzeCode combined JS issues', () => {
  it('detects multiple JS issues in one snippet', async () => {
    const code = 'var x = 0; debugger; if(x==0){ let y = 1; console.log(y); }';
    const issues = await analyzeCode(code, 'javascript');
    const ruleIds = issues.map(i => i.ruleId);
    expect(ruleIds).toEqual(
      expect.arrayContaining([
        'no-var', 'no-debugger', 'eqeqeq', 'prefer-const', 'no-console'
      ])
    );
  });
});

describe('analyzeCode helper alias support and error handling', () => {
  it('handles ts alias for TypeScript analysis', async () => {
    const code = 'if(a==b) {}';
    const issues = await analyzeCode(code, 'ts');
    expect(issues.some(i => i.ruleId === 'eqeqeq')).toBe(true);
  });

  it('fallbacks for js alias with unsupported-language', async () => {
    const issues = await analyzeCode('var x = 1;', 'js');
    expect(issues).toEqual([
      expect.objectContaining({ ruleId: 'unsupported-language' })
    ]);
  });

  it('returns analysis error when javac is not available', async () => {
    // Mock execSync to simulate javac not being available
    const originalExecSync = cp.execSync;
    cp.execSync = jest.fn(() => { 
      const err = new Error('javac not found');
      err.status = 127; // Simulate command not found
      throw err;
    });

    const issues = await analyzeCode('class Foo {}', 'java');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'dependency-missing',
        message: expect.stringContaining('Required dependency "javac" is not installed'),
        severity: 2,
      }),
    ]);
    
    // Restore original execSync
    cp.execSync = originalExecSync;
  });

  it('returns empty array for C# analyzer when dotnet is not available', async () => {
    const originalExecSync = cp.execSync;
    try {
      // Mock execSync to simulate dotnet not being found
      cp.execSync = jest.fn().mockImplementation(() => {
        const error = new Error('dotnet command not found');
        error.code = 'ENOENT';
        throw error;
      });
      
      const issues = await analyzeCode('public class C {}', 'cs');
      expect(issues).toEqual([]);
    } finally {
      // Restore original execSync
      cp.execSync = originalExecSync;
    }
  });

  it('returns empty for blank python code via py alias', async () => {
    const issues = await analyzeCode('   ', 'py');
    expect(issues).toEqual([]);
  });
});

describe('PythonAnalyzer and CppAnalyzer fallback cases', () => {
  it('returns analysis error when pylint is not available', async () => {
    // Mock execSync to simulate pylint not being available
    const originalExecSync = cp.execSync;
    cp.execSync = jest.fn(() => { 
      const err = new Error('pylint not found');
      err.status = 127; // Simulate command not found
      throw err;
    });

    const issues = await analyzeCode('def foo:', 'python');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'dependency-missing',
        message: expect.stringContaining('Required dependency "pylint" is not installed'),
        severity: 2,
      }),
    ]);
    
    // Restore original execSync
    cp.execSync = originalExecSync;
  });

  it('returns analysis error for C code when cppcheck is not available', async () => {
    // Mock execSync to simulate cppcheck not being available
    const originalExecSync = cp.execSync;
    cp.execSync = jest.fn(() => { 
      const err = new Error('cppcheck not found');
      err.status = 127; // Simulate command not found
      throw err;
    });

    const issues = await analyzeCode('int main()', 'c');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'dependency-missing',
        message: expect.stringContaining('Required dependency "cppcheck" is not installed'),
        severity: 2,
      }),
    ]);
    
    // Restore original execSync
    cp.execSync = originalExecSync;
  });

  it('returns analysis error for C++ code when cppcheck is not available', async () => {
    // Mock execSync to simulate cppcheck not being available
    const originalExecSync = cp.execSync;
    cp.execSync = jest.fn(() => { 
      const err = new Error('cppcheck not found');
      err.status = 127; // Simulate command not found
      throw err;
    });

    const issues = await analyzeCode('int main()', 'c++');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'dependency-missing',
        message: expect.stringContaining('Required dependency "cppcheck" is not installed'),
        severity: 2,
      }),
    ]);
    
    // Restore original execSync
    cp.execSync = originalExecSync;
  });

  it('returns empty for blank Python code via python alias', async () => {
    const issues = await analyzeCode('   ', 'python');
    expect(issues).toEqual([]);
  });
});

describe('analyzeCode case-insensitive support', () => {
  it('handles uppercase JS and TS aliases', async () => {
    const jsIssues = await analyzeCode('var x = 1;', 'JAVASCRIPT');
    expect(jsIssues.some(i => i.ruleId === 'no-var')).toBe(true);

    const tsIssues = await analyzeCode('let y: number = 5;', 'TYPESCRIPT');
    expect(tsIssues.some(i => i.ruleId === 'prefer-const')).toBe(true);
  });
});

describe('analyzeCode unsupported languages', () => {
  it('returns unsupported-language for Go', async () => {
    const issues = await analyzeCode('package main', 'go');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'unsupported-language',
        message: expect.stringContaining('Unsupported language: go'),
        severity: 1,
      }),
    ]);
  });
});

describe('JsTsAnalyzer error handling methods', () => {
  const analyzer = new JsTsAnalyzer();

  it('handleError returns syntax-error for parsing errors', () => {
    const issues = analyzer.handleError(new Error('Parsing error: Unexpected token'));
    expect(issues).toEqual([
      {
        ruleId: 'syntax-error',
        message: 'Parsing error: Unexpected token',
        line: 1,
        column: 1,
        severity: 2,
      }
    ]);
  });

  it('handleError returns analysis-error for generic errors', () => {
    const issues = analyzer.handleError(new Error('Generic failure'));
    expect(issues).toEqual([
      {
        ruleId: 'analysis-error',
        message: expect.stringContaining('Failed to analyze code: Generic failure'),
        line: 1,
        column: 1,
        severity: 2,
      }
    ]);
  });
});

describe('blank code across languages', () => {
  const langs = ['javascript','typescript','ts','java','py','python','cs','c','cpp','c++'];
  langs.forEach(lang => {
    it(`returns [] for blank code via ${lang}`, async () => {
      const issues = await analyzeCode('   ', lang);
      expect(issues).toEqual([]);
    });
  });
});

describe('C++ alias fallback', () => {
  it('returns analysis error for C++ code via cpp alias when cppcheck is not available', async () => {
    // Mock execSync to simulate cppcheck not being available
    const originalExecSync = cp.execSync;
    cp.execSync = jest.fn(() => { 
      const err = new Error('cppcheck not found');
      err.status = 127; // Simulate command not found
      throw err;
    });

    const issues = await analyzeCode('int main()', 'cpp');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'dependency-missing',
        message: expect.stringContaining('Required dependency "cppcheck" is not installed'),
        severity: 2,
      }),
    ]);
    
    // Restore original execSync
    cp.execSync = originalExecSync;
  });
});

describe('CodeAnalyzer parseLintOutput', () => {
  const analyzer = new JsTsAnalyzer();
  it('parses and filters output lines correctly', () => {
    const output = `1:2: foo

3:4: bar`;
    const parser = line => {
      const [l, c, msg] = line.split(':');
      return { line: Number(l), column: Number(c), message: msg };
    };
    const issues = analyzer.parseLintOutput(output, parser);
    expect(issues).toEqual([
      { line: 1, column: 2, message: ' foo' },
      { line: 3, column: 4, message: ' bar' },
    ]);
  });
});

describe('PythonAnalyzer parsing and error handling', () => {
  const analyzer = new PythonAnalyzer();
  beforeEach(() => jest.restoreAllMocks());

  it('parses pylint JSON output correctly', async () => {
    const json = JSON.stringify([{
      messageId: 'C0103', symbol: 'invalid-name', message: 'Invalid name', line: 3, column: 1, type: 'convention'
    }]);
    jest.spyOn(cp, 'execSync').mockReturnValueOnce(json);
    const issues = await analyzer.analyze('x=1');
    expect(issues).toEqual([{ ruleId: 'C0103', message: 'Invalid name (invalid-name)', line: 3, column: 1, severity: 1 }]);
  });

  it('parses stderr on pylint failure', async () => {
    const err = new Error('pylint failed');
    err.stderr = 'test.py:4:2: E0001: something wrong (syntax-error)';
    jest.spyOn(cp, 'execSync').mockImplementation(() => { throw err; });
    const issues = await analyzer.analyze('x=1');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'pylint-error',
        message: expect.stringContaining('something wrong'),
        line: 4,
        column: 2,
        severity: 2
      })
    ]);
  });
});

describe('JavaAnalyzer unit tests', () => {
  const analyzer = new JavaAnalyzer();
  beforeEach(() => jest.restoreAllMocks());

  it('returns [] for blank code', async () => {
    expect(await analyzer.analyze('')).toEqual([]);
  });

  it('parses warning output correctly', async () => {
    const out = 'Test.java:10: warning: [deprecation] deprecated method';
    jest.spyOn(cp, 'execSync').mockReturnValueOnce(out);
    const issues = await analyzer.analyze('class X {}');
    expect(issues).toEqual([{ ruleId: 'deprecation', message: 'deprecated method', line: 10, column: 1, severity: 1 }]);
  });

  it('handles execSync error', async () => {
    jest.spyOn(cp, 'execSync').mockImplementation(() => { throw new Error('javac missing'); });
    const issues = await analyzer.analyze('class X {}');
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'analysis-error',
        message: expect.stringContaining('Failed to analyze Java code'),
        severity: 2,
      })
    ]);
  });
});

describe('CppAnalyzer unit tests', () => {
  const analyzer = new CppAnalyzer();
  beforeEach(() => jest.restoreAllMocks());

  it('returns [] for blank code', async () => {
    const issues = await analyzer.analyze('', false);
    expect(issues).toEqual([]);
  });

  it('parses error output correctly', async () => {
    const analyzer = new CppAnalyzer();
    const out = 'test.c:4:5: error: out of bounds [arrayIndexOutOfBounds]';
    jest.spyOn(cp, 'execSync').mockReturnValueOnce(out);
    const issues = await analyzer.analyze('int main()', false);
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'arrayIndexOutOfBounds',
        message: 'out of bounds',
        line: 4,
        column: 5,
        severity: 2
      })
    ]);
  });

  it('handles execSync error', async () => {
    jest.spyOn(cp, 'execSync').mockImplementation(() => { throw new Error('cppcheck missing'); });
    const issues = await analyzer.analyze('int main()', true);
    expect(issues).toEqual([
      expect.objectContaining({
        ruleId: 'analysis-error',
        message: expect.stringContaining('Failed to analyze C++ code'),
        severity: 2,
      })
    ]);
  });
});
