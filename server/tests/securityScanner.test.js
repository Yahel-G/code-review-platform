const { scanSecurityIssues } = require('../utils/securityScanner');

describe('securityScanner util', () => {
  it('detects generic insecure patterns', () => {
    const code = 'eval("alert(1)");';
    const issues = scanSecurityIssues(code, 'javascript');
    expect(issues.some(i => i.ruleId === 'security-eval-call')).toBe(true);
  });

  it('detects language-specific patterns (JavaScript child_process)', () => {
    const code = 'const cp = require("child_process");\ncp.exec("ls -la");';
    const issues = scanSecurityIssues(code, 'javascript');
    expect(issues.some(i => i.ruleId === 'security-child-process')).toBe(true);
    
    // Test with spawn
    const spawnCode = 'const { spawn } = require("child_process");\nspawn("ls", ["-la"]);';
    const spawnIssues = scanSecurityIssues(spawnCode, 'javascript');
    expect(spawnIssues.some(i => i.ruleId === 'security-child-process')).toBe(true);
  });
  
  it('detects eval and new Function', () => {
    const code = 'eval("2 + 2");\nconst fn = new Function("a", "b", "return a + b");';
    const issues = scanSecurityIssues(code, 'javascript');
    expect(issues.some(i => i.ruleId === 'security-eval-call')).toBe(true);
    expect(issues.some(i => i.ruleId === 'security-new-function')).toBe(true);
  });
  
  it('detects potential SQL injection', () => {
    const code = 'const query = `SELECT id FROM users WHERE id = ${userInput}`;';
    const issues = scanSecurityIssues(code, 'javascript');
    expect(issues.some(i => i.ruleId === 'security-raw-sql')).toBe(true);
  });

  it('returns empty array when no issues', () => {
    const safeCode = 'function add(a, b) { return a + b; }';
    expect(scanSecurityIssues(safeCode, 'javascript')).toHaveLength(0);
  });
});
