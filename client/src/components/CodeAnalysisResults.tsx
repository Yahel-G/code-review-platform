import React from 'react';
import { AnalysisResult, CodeIssue } from '../services/analysis.service';
import {
  Paper,
  Typography,
  Box,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  AlertTitle,
  useTheme,
  CircularProgress,
  CircularProgressProps,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  AutoFixHigh as SuggestionIcon,
  Assessment as MetricsIcon,
} from '@mui/icons-material';

interface CodeAnalysisResultsProps {
  result: AnalysisResult | null;
  show: boolean;
  loading?: boolean;
  error?: string | null;
  onToggle: () => void;
  onRetry?: () => void;
}

const CodeAnalysisResults: React.FC<CodeAnalysisResultsProps> = ({
  result,
  show,
  loading = false,
  error = null,
  onToggle,
}) => {
  const theme = useTheme();
  
  // Show loading state
  if (loading) {
    return (
      <Paper elevation={2} sx={{ mt: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
            Analyzing Code...
          </Typography>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      </Paper>
    );
  }

  // Show error state only if there was an actual error
  if (error) {
    return (
      <Paper elevation={2} sx={{ mt: 3, overflow: 'hidden' }}>
        <Alert severity="error" onClick={onToggle} sx={{ cursor: 'pointer' }}>
          <AlertTitle>Analysis Failed</AlertTitle>
          {error}
        </Alert>
      </Paper>
    );
  }

  // Don't show anything if there's no result yet
  if (!result) {
    return null;
  }

  const hasIssues = result.issues.length > 0;
  const errorCount = result.issues.filter(issue => issue.severity === 2).length;
  const warningCount = result.issues.filter(issue => issue.severity === 1).length;
  const hasSuggestions = result.suggestions && result.suggestions.length > 0;

  return (
    <Paper elevation={2} sx={{ mt: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={onToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Code Analysis Results
            </Typography>
          </Box>
          
          <Box sx={{ ml: 3, display: 'flex', gap: 1 }}>
            {errorCount > 0 && (
              <Chip
                size="small"
                icon={<ErrorIcon />}
                label={`${errorCount} ${errorCount === 1 ? 'Error' : 'Errors'}`}
                color="error"
                variant="outlined"
              />
            )}
            {warningCount > 0 && (
              <Chip
                size="small"
                icon={<WarningIcon />}
                label={`${warningCount} ${warningCount === 1 ? 'Warning' : 'Warnings'}`}
                color="warning"
                variant="outlined"
              />
            )}
            {!hasIssues && (
              <Chip
                size="small"
                icon={<CheckCircleIcon />}
                label="No issues found"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
        
        <IconButton size="small" sx={{ ml: 'auto' }}>
          <ExpandMoreIcon
            sx={{
              transform: show ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </IconButton>
      </Box>

      <Collapse in={show}>
        <Box sx={{ p: 2 }}>
          {hasIssues ? (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Found {errorCount} {errorCount === 1 ? 'error' : 'errors'} and {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 2 }}>
                {result.issues.map((issue, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: issue.severity === 2 ? 'error.lighter' : 'warning.lighter',
                      borderLeft: `3px solid ${
                        issue.severity === 2 ? 'error.main' : 'warning.main'
                      }`,
                      '&:hover': {
                        bgcolor: issue.severity === 2 ? 'error.light' : 'warning.light',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      {issue.severity === 2 ? (
                        <ErrorIcon color="error" sx={{ mr: 1, mt: 0.5, flexShrink: 0 }} />
                      ) : (
                        <WarningIcon color="warning" sx={{ mr: 1, mt: 0.5, flexShrink: 0 }} />
                      )}
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {issue.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          Line {issue.line}:{issue.column} • {issue.ruleId}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                bgcolor: 'success.lighter',
                borderRadius: 1,
                mb: 3,
              }}
            >
              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2" color="success.dark">
                No issues found! Your code looks good.
              </Typography>
            </Box>
          )}

          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: 'background.default',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <MetricsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" fontWeight="medium">
                Code Metrics
              </Typography>
            </Box>
            
            <Box display="flex" gap={2} flexWrap="wrap">
              <Tooltip title="Cyclomatic complexity measures the number of linearly independent paths through a program's source code">
                <Chip
                  label={`Complexity: ${result.metrics.complexity.toFixed(1)}`}
                  color={result.metrics.complexity > 10 ? 'error' : 'default'}
                  variant="outlined"
                  sx={{ 
                    bgcolor: 'background.paper',
                    '& .MuiChip-label': { fontWeight: 500 }
                  }}
                />
              </Tooltip>
              
              <Tooltip title="A higher score indicates better maintainability (0-100)">
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      component="div"
                      sx={{ 
                        fontWeight: 500,
                        color: 
                          result.metrics.maintainability < 50 
                            ? theme.palette.error.main 
                            : result.metrics.maintainability < 70 
                            ? theme.palette.warning.dark 
                            : theme.palette.success.dark
                      }}
                    >
                      {`${Math.round(result.metrics.maintainability)}`}
                    </Typography>
                  </Box>
                  <CircularProgressWithLabel 
                    value={result.metrics.maintainability} 
                    color={
                      result.metrics.maintainability < 50
                        ? 'error'
                        : result.metrics.maintainability < 70
                        ? 'warning'
                        : 'success'
                    }
                    size={40}
                    thickness={4}
                  />
                </Box>
              </Tooltip>
              
              <Tooltip title="Total number of lines of code">
                <Chip
                  label={`${result.metrics.linesOfCode} lines`}
                  variant="outlined"
                  sx={{ 
                    bgcolor: 'background.paper',
                    '& .MuiChip-label': { fontWeight: 500 }
                  }}
                />
              </Tooltip>
            </Box>
          </Paper>

          {hasSuggestions && (
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                bgcolor: 'info.light',
                border: `1px solid ${theme.palette.info.light}`,
                borderRadius: 1
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <SuggestionIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" fontWeight="medium">
                  Suggestions for Improvement
                </Typography>
              </Box>
              
              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: 2.5,
                  '& li': {
                    mb: 1.5,
                    pl: 1,
                    '&::marker': {
                      color: 'primary.main',
                      fontWeight: 'bold',
                    },
                    '&:last-child': {
                      mb: 0,
                    },
                  },
                }}
              >
                {result.suggestions.map((suggestion, i) => (
                  <li key={i}>
                    <Typography variant="body2">
                      {suggestion}
                    </Typography>
                  </li>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

// Circular progress with label for maintainability score
interface CircularProgressWithLabelProps extends CircularProgressProps {
  value: number;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
  size?: number;
  thickness?: number;
}

const CircularProgressWithLabel: React.FC<CircularProgressWithLabelProps> = ({
  value,
  color = 'primary',
  size = 40,
  thickness = 4,
  ...props
}) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={thickness}
        sx={{
          color: (theme: any) => theme.palette.grey[200],
          position: 'absolute',
        }}
      />
      <CircularProgress
        variant="determinate"
        value={value}
        size={size}
        thickness={thickness}
        color={color as any}
        sx={{
          animationDuration: '1.5s',
        }}
      />
    </Box>
  );
};

export default CodeAnalysisResults;
