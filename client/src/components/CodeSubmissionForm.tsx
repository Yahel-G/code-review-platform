import React, { useState, useRef, useEffect } from 'react';
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
} from '@mui/material';
import Editor from '@monaco-editor/react';
import { createReview } from '../services/review.service';

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
  const [title, setTitle] = useState('');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = useState<Language>('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const editorRef = useRef<any>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    if (!code.trim()) {
      setError('Please enter some code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createReview({ 
        title,
        code,
        language 
      });
      
      // Reset form on success
      setTitle('');
      setCode(DEFAULT_CODE[language]);
      setSuccess(true);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: 200 }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </Box>
        </Stack>
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
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
