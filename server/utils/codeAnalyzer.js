/**
 * Simple code analyzer that uses pattern matching to find common issues
 * @param {string} code - The code to analyze
 * @param {string} language - The programming language (not used in this simplified version)
 * @returns {Promise<Array>} Array of issues found
 */
const analyzeCodeWithESLint = async (code, language = 'javascript') => {
  const issues = [];
  
  try {
    if (!code || typeof code !== 'string') {
      return [];
    }
    
    const lines = code.split('\n');
    
    // Common patterns to detect issues
    const patterns = [
      {
        regex: /==/g,
        message: 'Use strict equality (===) instead of loose equality (==)',
        ruleId: 'eqeqeq',
        severity: 1, // warning
      },
      {
        regex: /var\s+\w+/g,
        message: 'Use let/const instead of var',
        ruleId: 'no-var',
        severity: 1, // warning
      },
      {
        regex: /console\.\w+\(/g,
        message: 'Unexpected console statement',
        ruleId: 'no-console',
        severity: 1, // warning
      },
      {
        regex: /\b(?:eval|new Function)\s*\(/g,
        message: 'eval can be harmful',
        ruleId: 'no-eval',
        severity: 2, // error
      },
      {
        regex: /\bdebugger\b/g,
        message: 'Unexpected debugger statement',
        ruleId: 'no-debugger',
        severity: 2, // error
      },
    ];
    
    // Check each line for issues
    lines.forEach((line, index) => {
      patterns.forEach(({ regex, message, ruleId, severity }) => {
        const matches = line.match(regex);
        if (matches) {
          issues.push({
            ruleId,
            message: `${message} (found ${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
            line: index + 1,
            column: line.indexOf(matches[0]) + 1,
            severity,
          });
        }
      });
    });
    
    return issues;
    
  } catch (error) {
    console.error('Error in analyzeCodeWithESLint:', error);
    // Return a generic error if analysis fails
    return [{
      ruleId: 'analysis-error',
      message: 'Failed to analyze code: ' + (error.message || 'Unknown error'),
      line: 1,
      column: 1,
      severity: 2, // Error
    }];
  }
};

module.exports = {
  analyzeCodeWithESLint,
};
