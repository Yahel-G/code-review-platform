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
import UploadIcon from '@mui/icons-material/Upload';
import Editor from '@monaco-editor/react';
import { createReview } from '../services/review.service';
import { analyzeCode, AnalysisResult } from '../services/analysis.service';
import { useAuth } from '../context/AuthContext';
import CodeAnalysisResults from './CodeAnalysisResults';

type Language = 'javascript' | 'typescript' | 'python' | 'csharp' | 'java' | 'c' | 'cpp';

const languageConfigs = {
  javascript: { label: 'JavaScript', extension: 'js' },
  typescript: { label: 'TypeScript', extension: 'ts' },
  python: { label: 'Python', extension: 'py' },
  csharp: { label: 'C#', extension: 'cs' },
  java: { label: 'Java', extension: 'java' },
  c: { label: 'C', extension: 'c' },
  cpp: { label: 'C++', extension: 'cpp' },
};

const DEFAULT_CODE = {
  javascript: '// Write your JavaScript code here\nfunction hello() {\n  console.log(\'Hello, world!\');\n}',
  typescript: '// Write your TypeScript code here\nfunction hello(name: string): void {\n  console.log(`Hello, ${name}!`);\n}',
  python: '# Write your Python code here\ndef hello(name):\n    print(f\'Hello, {name}!\')',
  csharp: '// Write your C# code here\nusing System;\n\npublic class Program {\n    public static void Main() {\n        Console.WriteLine(\"Hello, World!\");\n    }\n}',
  java: '// Write your Java code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}',
  c: '// Write your C code here\n#include <stdio.h>\n\nint main() {\n    printf(\"Hello, World!\\n\");\n    return 0;\n}',
  cpp: '// Write your C++ code here\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}'
};

const CodeSubmissionForm: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [redirectPath, setRedirectPath] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState<Language>('javascript');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false); // Start with analysis hidden
  const editorRef = useRef<any>(null);
  const [lastAnalyzedCode, setLastAnalyzedCode] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has interacted with the form

  // Update code when language changes
  useEffect(() => {
    setCode(DEFAULT_CODE[language] || '');
  }, [language]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    setCode(newValue);
    handleUserInteraction();
    // Clear file name when user manually edits the code
    if (newValue && newValue !== code) {
      setFileName('');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleUserInteraction();

    // Check file size (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setAnalysisError('File size should be less than 1MB');
      return;
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['js', 'ts', 'py', 'cs', 'jsx', 'tsx', 'java', 'c', 'cpp', 'h', 'hpp'];
    if (!extension || !validExtensions.includes(extension)) {
      setAnalysisError('Unsupported file type. Please upload a code file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      setFileName(file.name);
      
      // Auto-detect language based on file extension
      const langMap: Record<string, Language> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'cs': 'csharp',
        'java': 'java',
        'c': 'c',
        'cpp': 'cpp',
        'h': 'c',
        'hpp': 'cpp'
      } as const;
      
      const detectedLang = langMap[extension] as Language | undefined;
      if (detectedLang) {
        setLanguage(detectedLang);
      }
      
      setAnalysisError(null);
    };
    
    reader.onerror = () => {
      setAnalysisError('Error reading file');
    };
    
    reader.readAsText(file);
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
    const trimmedCode = code.trim();
    
    // Don't analyze empty code, if the code hasn't changed since last analysis,
    // or if the user hasn't interacted yet
    if (!trimmedCode || lastAnalyzedCode === trimmedCode || !hasUserInteracted) {
      return;
    }
    
    const timer = setTimeout(() => {
      // Only auto-analyze if we have a token (user is logged in)
      if (token) {
        analyzeCodeHandler();
      } else {
        // Clear any previous analysis results if user is not logged in
        setAnalysisResult(null);
        setLastAnalyzedCode('');
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [code, token, lastAnalyzedCode, analyzeCodeHandler, hasUserInteracted]);

  // Track user interaction
  const handleUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  }, [hasUserInteracted]);

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
        analysis: finalAnalysis,
      };

      // Submit the review
      const response = await createReview(reviewData, token);
      
      // Show success message and reset form
      setSuccess(true);
      setTitle('');
      setCode(DEFAULT_CODE[language]);
      setFileName('');
      setAnalysisResult(null);
      setLastAnalyzedCode(null);
      setShowAnalysis(false);
      
      // Redirect to the review page
      navigate(`/reviews/${response.data._id}`);
    } catch (error) {
      console.error('Submission error:', error);
      const err = error as AxiosError<{ message?: string }>;
      setSubmitError(err.response?.data?.message || 'Failed to submit code. Please try again.');
      
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
    <>
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
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <FormControl required disabled={isSubmitting} sx={{ minWidth: 200 }}>
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
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".js,.ts,.jsx,.tsx,.py,.cs,.java,.c,.cpp,.h,.hpp"
                style={{ display: 'none' }}
              />
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={handleUploadClick}
                disabled={isSubmitting}
                sx={{ minWidth: '150px' }}
              >
                Upload File
              </Button>
              {fileName && (
                <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                  {fileName}
                </Typography>
              )}
            </Box>
            
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#f5f5f5', p: 1, borderBottom: '1px solid #ddd' }}>
                <Typography variant="caption" color="text.secondary">
                  {languageConfigs[language]?.label || 'Code'}
                </Typography>
              </Box>
              <Box sx={{ height: '400px' }}>
                <Editor
                  data-testid="monaco-editor"
                  height="400px"
                  language={language}
                  value={code}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{ minimap: { enabled: false } }}
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

      <Dialog open={loginDialogOpen} onClose={handleCloseDialog} aria-labelledby="login-dialog-title" role="dialog">
        <DialogTitle id="login-dialog-title">Login Required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please log in to submit code.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoginClick} color="primary" autoFocus>
            Sign In
          </Button>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

};

export default CodeSubmissionForm;
