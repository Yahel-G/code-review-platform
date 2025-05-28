import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Editor from '@monaco-editor/react';
import { createReview } from '../services/review.service';
import { analyzeCode, AnalysisResult } from '../services/analysis.service';
import { useAuth } from '../context/AuthContext';
import CodeAnalysisResults from './CodeAnalysisResults';

type Language = 'javascript' | 'typescript' | 'python' | 'csharp';

const languageConfigs = {
  javascript: { label: 'JavaScript', extension: 'js' },
  typescript: { label: 'TypeScript', extension: 'ts' },
  python: { label: 'Python', extension: 'py' },
  csharp: { label: 'C#', extension: 'cs' },
};

const DEFAULT_CODE = {
  javascript: '// Write your JavaScript code here\nfunction hello() {\n  console.log(\'Hello, world!\');\n}',
  typescript: '// Write your TypeScript code here\nfunction hello(name: string): void {\n  console.log(`Hello, ${name}!`);\n}',
  python: '# Write your Python code here\ndef hello(name):\n    print(f\'Hello, {name}!\')',
  csharp: '// Write your C# code here\nusing System;\n\npublic class Program {\n    public static void Main() {\n        Console.WriteLine(\"Hello, World!\");\n    }\n}',
};

const CodeSubmissionForm: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState<Language>('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const editorRef = useRef<any>(null);
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState<string | null>(null);

  // Update code when language changes
  useEffect(() => {
    setCode(DEFAULT_CODE[language] || '');
  }, [language]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
  };

  const analyzeCodeHandler = useCallback(async () => {
    if (!user || !token) {
      setLoginDialogOpen(true);
      setRedirectPath('/submit');
      return;
    }

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setAnalysisError('Please enter some code to analyze');
      return;
    }

    // Don't re-analyze the same code
    if (lastAnalyzedCode === trimmedCode) {
      setShowAnalysis(true);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeCode(trimmedCode, language, token);
      setAnalysisResult(result);
      setLastAnalyzedCode(trimmedCode);
      setShowAnalysis(true);
      setSubmitError(''); // Clear any previous submit errors
    } catch (error) {
      console.error('Analysis error:', error);
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage = err.response?.data?.message || 'Failed to analyze code. Please try again.';
      setAnalysisError(errorMessage);
      
      // If unauthorized, prompt to login
      if (err.response?.status === 401) {
        setLoginDialogOpen(true);
        setRedirectPath('/submit');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language, token, user, lastAnalyzedCode]);

  // Auto-analyze code when it changes (debounced)
  useEffect(() => {
    if (!code.trim() || !analysisResult) return;
    
    const timer = setTimeout(() => {
      // Only auto-analyze if we have a previous result and the code has changed
      if (lastAnalyzedCode !== code.trim()) {
        analyzeCodeHandler();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [code, analyzeCodeHandler, analysisResult, lastAnalyzedCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !token) {
      setLoginDialogOpen(true);
      setRedirectPath('/submit');
      return;
    }
    
    const trimmedTitle = title.trim();
    const trimmedCode = code.trim();
    
    if (!trimmedTitle) {
      setSubmitError('Please enter a title for your submission');
      return;
    }

    if (!trimmedCode) {
      setSubmitError('Please enter some code to submit');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSuccess(false);

    try {
      let finalAnalysis = analysisResult;
      
      // If no analysis was done or code has changed since last analysis, run it first
      if (!finalAnalysis || lastAnalyzedCode !== trimmedCode) {
        finalAnalysis = await analyzeCode(trimmedCode, language, token);
        setAnalysisResult(finalAnalysis);
        setLastAnalyzedCode(trimmedCode);
      }

      // Prepare review data with proper typing
      const reviewData = {
        title: trimmedTitle,
        code: trimmedCode,
        language,
        analysis: finalAnalysis
      };

      await createReview(reviewData, token);
      
      // Reset form on success
      setSuccess(true);
      setTitle('');
      setCode(DEFAULT_CODE[language] || '');
      setAnalysisResult(null);
      setLastAnalyzedCode(null);
      setShowAnalysis(false);
      setSubmitError('');
    } catch (error) {
      console.error('Submission error:', error);
      const err = error as AxiosError<{ message?: string }>;
      const errorMessage = err.response?.data?.message || 'Failed to submit code. Please try again.';
      setSubmitError(errorMessage);
      
      // If unauthorized, prompt to login
      if (err.response?.status === 401) {
        setLoginDialogOpen(true);
        setRedirectPath('/submit');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = () => {
    setLoginDialogOpen(false);
    navigate('/login', { state: { from: redirectPath || '/' } });
  };

  const handleCloseDialog = useCallback(() => {
    setLoginDialogOpen(false);
  }, []);

  return (
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Submit Code for Review
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
          
          <FormControl fullWidth required disabled={isSubmitting}>
            <InputLabel>Language</InputLabel>
            <Select
              value={language}
              label="Language"
              onChange={(e) => setLanguage(e.target.value as Language)}
            >
              {Object.entries(languageConfigs).map(([value, { label }]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
            <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderBottom: '1px solid #ddd' }}>
              <Typography variant="caption" color="text.secondary">
                {languageConfigs[language]?.label || 'Code'}
              </Typography>
            </Box>
            <Box sx={{ height: '400px' }}>
              <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                theme="vs-light"
                value={code}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            {/* Analysis Controls */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={analyzeCodeHandler}
                  disabled={isAnalyzing || isSubmitting}
                  startIcon={
                    isAnalyzing ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <AssessmentIcon fontSize="small" />
                    )
                  }
                  sx={{ minWidth: 160 }}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
                </Button>
                
                {analysisError && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      flex: 1,
                      '& .MuiAlert-message': { 
                        display: 'flex', 
                        alignItems: 'center'
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="body2">
                        {analysisError}
                      </Typography>
                      <Button 
                        color="inherit" 
                        size="small" 
                        onClick={analyzeCodeHandler}
                        disabled={isAnalyzing}
                        sx={{ mt: 0.5 }}
                      >
                        Retry
                      </Button>
                    </Box>
                  </Alert>
                )}
              </Box>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                disabled={isSubmitting || isAnalyzing}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ minWidth: 160 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Code'}
              </Button>
            </Box>
            
            {/* Analysis Results */}
            <Box sx={{ mt: 2 }}>
              <CodeAnalysisResults
                result={analysisResult}
                show={showAnalysis}
                loading={isAnalyzing}
                error={analysisError}
                onToggle={() => setShowAnalysis(!showAnalysis)}
                onRetry={analyzeCodeHandler}
              />
            </Box>
          </Box>
        </Stack>
      </Box>

      <Snackbar
        open={!!submitError}
        autoHideDuration={6000}
        onClose={() => setSubmitError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSubmitError('')} 
          severity="error" 
          sx={{ width: '100%' }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                setSubmitError('');
                handleSubmit({ preventDefault: () => {} } as React.FormEvent);
              }}
            >
              Retry
            </Button>
          }
        >
          {submitError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Code submitted successfully for review!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CodeSubmissionForm;
