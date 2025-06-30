/*
 * Simple static security scanner using regex heuristics.
 * This is NOT a substitute for a real SAST tool but offers quick feedback.
 */
function buildChecks() {
  return {
    generic: [
      { regex: /\beval\s*\(/g, rule: 'eval-call', msg: 'Avoid using eval() as it can lead to code injection vulnerabilities.' },
      { regex: /new\s+Function\s*\(/g, rule: 'new-function', msg: 'Avoid dynamically creating functions with new Function().' },
      { regex: /select\s+.+\s+from\s+.+where\s+.+=[\s\S]*?[`'"$]/i, rule: 'raw-sql', msg: 'Possible raw SQL query detected – consider using parameterised queries/ORM.' },
      { regex: /secret_?key|api_?key|password/i, rule: 'hardcoded-credential', msg: 'Possible hard-coded credential detected.' },
    ],
    javascript: [
      { 
        regex: /(?:require\s*\(\s*["']child_process["']\s*\)|import\s*[^\n]+\s*from\s*["']child_process["'])[\s\S]*?\.(exec|spawn|execSync)\s*\(/g, 
        rule: 'child-process', 
        msg: 'Review child_process usage for potential command injection.' 
      },
      // Add a simpler pattern that matches direct child_process method calls
      { 
        regex: /\.(exec|spawn|execSync)\s*\(/g, 
        rule: 'child-process',
        msg: 'Direct child process method call detected. Ensure proper input validation.'
      },
      // Add a pattern for bare exec/spawn/execSync calls (e.g., spawn('ls'))
      {
        regex: /\b(exec|spawn|execSync)\s*\(/g,
        rule: 'child-process',
        msg: 'Direct child process function call detected. Ensure proper input validation.'
      },
      { 
        regex: /crypto\.randomBytes\(/g, 
        rule: 'weak-rng', 
        msg: 'crypto.randomBytes is synchronous; consider async version to avoid blocking.' 
      },
    ],
    python: [
      { regex: /subprocess\./g, rule: 'subprocess', msg: 'Review subprocess usage for potential command injection.' },
      { regex: /pickle\.load\(/g, rule: 'unsafe-deserialisation', msg: 'pickle.load() can execute arbitrary code; prefer safe alternatives like json.' },
    ],
    java: [
      { regex: /Runtime\.getRuntime\(\)\.exec\s*\(/g, rule: 'runtime-exec', msg: 'Avoid Runtime.exec() which can lead to command injection.' },
      { regex: /ObjectInputStream/g, rule: 'unsafe-deserialisation', msg: 'Java deserialisation may be unsafe; validate or avoid.' },
    ],
    c: [
      { regex: /\bgets\s*\(/g, rule: 'gets-call', msg: 'gets() is unsafe and can cause buffer overflows.' },
      { regex: /\bstrcpy\s*\(/g, rule: 'strcpy-call', msg: 'strcpy() is unsafe; use strncpy() or safer alternatives.' },
    ],
  };
}

function scanSecurityIssues(code, language = '') {
  if (!code) return [];
  const patterns = buildChecks();
  const langKey = (language || '').toLowerCase();
  const checks = [...patterns.generic, ...(patterns[langKey] || [])];

  const lines = code.split(/\r?\n/);
  const issues = [];

  checks.forEach(({ regex, rule, msg }) => {
    lines.forEach((ln, idx) => {
      if (regex.test(ln)) {
        issues.push({
          ruleId: `security-${rule}`,
          message: msg,
          line: idx + 1,
          column: 1,
          severity: 2,
        });
      }
    });
  });
  return issues;
}

module.exports = { scanSecurityIssues };
