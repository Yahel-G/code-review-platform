import api from './api';

export interface CodeIssue {
  ruleId?: string;
  severity: 1 | 2; // 1: warning, 2: error
  message: string;
  line?: number;
  column?: number;
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  linesOfCode: number;
}

export interface AnalysisResult {
  issues: CodeIssue[];
  metrics?: CodeMetrics;
  suggestions?: string[];
}

export interface AnalysisHistoryItem {
  id: string;
  language: string;
  metrics: CodeMetrics;
  createdAt: string;
}

const ANALYSIS_ENDPOINT = '/analyze';

/**
 * Analyzes the provided code and returns analysis results
 */
export const analyzeCode = async (
  code: string,
  language: string,
  token: string
): Promise<AnalysisResult> => {
  if (!code || typeof code !== 'string') {
    throw new Error('Code must be a non-empty string');
  }

  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    const response = await api.post<AnalysisResult>(
      ANALYSIS_ENDPOINT,
      { 
        code, 
        language: language.toLowerCase() || 'javascript' 
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    // Validate the response structure
    if (!response.data || !response.data.metrics || !response.data.issues) {
      throw new Error('Invalid analysis response format');
    }

    return response.data;
  } catch (error: any) {
    if (typeof process.env.JEST_WORKER_ID === 'undefined') console.error('Analysis error:', error);
    const errorMessage = error.response?.data?.message || 
                       error.message || 
                       'Failed to analyze code. Please try again.';
    
    // Return a default error response with the error message as a suggestion
    return {
      issues: [{
        ruleId: 'analysis-error',
        severity: 2,
        message: errorMessage,
        line: 1,
        column: 1,
      }],
      metrics: {
        complexity: 0,
        maintainability: 0,
        linesOfCode: code.split('\n').length,
      },
      suggestions: [errorMessage],
    };
  }
};

const HISTORY_ENDPOINT = '/analyze/history';

/**
 * Fetches the analysis history for the authenticated user
 */
export const getAnalysisHistory = async (token: string): Promise<AnalysisHistoryItem[]> => {
  if (!token) {
    throw new Error('Authentication token is required');
  }

  try {
    const response = await api.get<AnalysisHistoryItem[]>(HISTORY_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000, // 5 second timeout
    });

    // Validate and normalize the response
    if (!Array.isArray(response.data)) {
      throw new Error('Invalid history response format');
    }

    return response.data.map(item => ({
      id: item.id,
      language: item.language || 'unknown',
      metrics: {
        complexity: item.metrics?.complexity || 0,
        maintainability: item.metrics?.maintainability || 0,
        linesOfCode: item.metrics?.linesOfCode || 0,
      },
      createdAt: item.createdAt || new Date().toISOString(),
    }));
  } catch (error: any) {
    if (typeof process.env.JEST_WORKER_ID === 'undefined') console.error('Failed to fetch analysis history:', error);
    // Return empty array instead of throwing to allow the UI to handle it gracefully
    return [];
  }
};
