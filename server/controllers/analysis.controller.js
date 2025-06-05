const Analysis = require('../models/Analysis');
const { analyzeCode } = require('../utils/codeAnalyzer');
const { calculateCodeMetrics } = require('../utils/codeMetrics');

/**
 * @desc    Analyze code
 * @route   POST /api/analyze
 * @access  Private
 */
exports.analyzeCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    // Analyze code for issues
    const issues = await analyzeCode(code, language);
    
    // Calculate code metrics
    const metrics = calculateCodeMetrics(code);
    
    // Generate suggestions based on analysis
    const suggestions = generateSuggestions(issues, metrics);

    // Save analysis result (only if user is authenticated)
    if (userId) {
      try {
        const analysis = new Analysis({
          user: userId,
          language,
          issues,
          metrics,
          codeSnippet: code.substring(0, 1000), // Store a preview of the code
        });
        await analysis.save();
      } catch (dbError) {
        console.error('Error saving analysis to database:', dbError);
        // Don't fail the request if saving to DB fails
      }
    }

    res.status(200).json({
      issues,
      metrics,
      suggestions,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      message: 'Server error during code analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get analysis history for the authenticated user
 * @route   GET /api/analysis/history
 * @access  Private
 */
exports.getAnalysisHistory = async (req, res) => {
  try {
    const analyses = await Analysis.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('language metrics.complexity metrics.maintainability metrics.linesOfCode createdAt')
      .limit(20);

    // Format the response to match the frontend expectations
    const formattedAnalyses = analyses.map(analysis => ({
      id: analysis._id,
      language: analysis.language,
      metrics: {
        complexity: analysis.metrics?.complexity || 0,
        maintainability: analysis.metrics?.maintainability || 0,
        linesOfCode: analysis.metrics?.linesOfCode || 0,
      },
      createdAt: analysis.createdAt,
    }));

    res.status(200).json(formattedAnalyses);
  } catch (error) {
    console.error('Get analysis history error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch analysis history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate suggestions based on analysis results
 */
function generateSuggestions(issues, metrics) {
  const suggestions = [];

  // Complexity suggestions
  if (metrics.complexity > 10) {
    suggestions.push('Consider refactoring to reduce cyclomatic complexity. Break down complex functions into smaller, single-purpose functions.');
  }

  // Maintainability suggestions
  if (metrics.maintainability < 60) {
    if (metrics.maintainability < 30) {
      suggestions.push('Your code has low maintainability. Consider significant refactoring to improve readability and structure.');
    } else {
      suggestions.push('Improve code maintainability by adding more comments, documentation, and breaking down large functions.');
    }
  }

  // Issue-based suggestions
  const issueTypes = new Set(issues.map(issue => issue.ruleId));
  
  if (issueTypes.has('no-var')) {
    suggestions.push('Replace `var` with `let` or `const` to improve scoping and prevent hoisting issues.');
  }
  
  if (issueTypes.has('eqeqeq')) {
    suggestions.push('Use strict equality (===) instead of loose equality (==) to avoid type coercion.');
  }

  if (issueTypes.has('no-console')) {
    suggestions.push('Remove or replace `console` statements before deploying to production.');
  }

  if (issueTypes.has('no-eval')) {
    suggestions.push('Avoid using `eval()` as it can lead to security vulnerabilities.');
  }

  if (issueTypes.has('no-debugger')) {
    suggestions.push('Remove `debugger` statements before committing code.');
  }

  // Add more general suggestions based on code metrics
  if (metrics.linesOfCode > 200) {
    suggestions.push('Consider splitting your code into smaller, more manageable modules.');
  }

  // If no specific issues but we have suggestions, return them
  if (suggestions.length > 0) {
    return suggestions;
  }

  // Default suggestion if no issues found
  return ['Your code follows good practices. Keep it up!'];
}

// Helper function to get severity level from ESLint rule
function getSeverity(eslintSeverity) {
  switch (eslintSeverity) {
    case 2: return 2; // error
    case 1: return 1;  // warning
    default: return 1; // default to warning
  }
}

// Export private helpers for testing
exports.generateSuggestions = generateSuggestions;
exports.getSeverity = getSeverity;
