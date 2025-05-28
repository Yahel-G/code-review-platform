const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
// Simple line counter
const countLines = (code) => {
  if (!code) return 0;
  return code.split(/\r\n|\r|\n/).length;
};

// Simple complexity estimator
const estimateComplexity = (code) => {
  if (!code) return 1;
  
  // Count decision points and loops
  const complexityIndicators = [
    'if\\(', 'else\\s*\\{', 'case\\s+', 'default\\s*:\\s*',
    '\\?\\s*[^:]+\\s*:', '\\|\\|', '&&', '\\bfor\\s*\\('
  ];
  
  const complexity = complexityIndicators.reduce((count, pattern) => {
    const matches = code.match(new RegExp(pattern, 'g'));
    return count + (matches ? matches.length : 0);
  }, 1); // Start with 1 for the main function
  
  return Math.min(complexity, 100); // Cap at 100
};

/**
 * Calculate various code metrics
 * @param {string} code - The source code to analyze
 * @returns {Object} Metrics object
 */
const calculateCodeMetrics = (code) => {
  try {
    // Basic metrics
    const loc = countLines(code);
    const complexityScore = estimateComplexity(code);
    
    // Calculate maintainability index (simplified version)
    // Using a simplified formula since we don't have Halstead metrics
    // Higher LOC and complexity reduce maintainability score
    const maintainability = Math.max(
      0,
      Math.min(100, 100 - (loc * 0.1 + complexityScore * 0.5))
    );
    
    return {
      linesOfCode: loc,
      complexity: Math.min(complexityScore, 100), // Cap at 100 for display
      maintainability: Math.max(0, Math.min(100, maintainability)), // Ensure between 0-100
      // Removed Halstead metrics as they required additional dependencies
    };
  } catch (error) {
    console.error('Error calculating code metrics:', error);
    // Return default values in case of error
    return {
      linesOfCode: 0,
      complexity: 1,
      maintainability: 70, // Default to medium maintainability
      // Removed Halstead metrics
    };
  }
};

module.exports = {
  calculateCodeMetrics,
};
