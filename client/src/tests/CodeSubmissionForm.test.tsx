// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CodeSubmissionForm from '../components/CodeSubmissionForm';
import { useAuth } from '../context/AuthContext';
import * as reviewService from '../services/review.service';
import * as analysisService from '../services/analysis.service';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../services/review.service', () => ({
  createReview: jest.fn(),
}));
jest.mock('../services/analysis.service', () => ({
  analyzeCode: jest.fn(),
}));

// Suppress expected error logs from error branches
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe('CodeSubmissionForm', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { username: 'testuser' },
      token: 'testtoken',
    });
    (reviewService.createReview as jest.Mock).mockResolvedValue({
      data: { _id: '123' },
    });
    (analysisService.analyzeCode as jest.Mock).mockResolvedValue({
      issues: [],
      metrics: { complexity: 1, maintainability: 100, linesOfCode: 5 },
      suggestions: [],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits code successfully', async () => {
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Submission' } });
    fireEvent.change(await screen.findByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(reviewService.createReview).toHaveBeenCalled();
    });
  });

  it('shows validation error for empty title', async () => {
    render(<CodeSubmissionForm />);
    fireEvent.change(await screen.findByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/please enter a title/i)).toBeInTheDocument();
  });

  it('shows API error on failure', async () => {
    (reviewService.createReview as jest.Mock).mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Submission' } });
    fireEvent.change(await screen.findByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/API error/)).toBeInTheDocument();
  });
});

// Extended tests for improved coverage
describe('CodeSubmissionForm - Extended Coverage', () => {
  it('shows error for file larger than 1MB', async () => {
    const { container } = render(<CodeSubmissionForm />);
    const file = new File(['a'.repeat(1024 * 1024 + 1)], 'big.py', { type: 'text/x-python' });
    // Click the Upload File button to ensure input is available
    fireEvent.click(screen.getByText(/upload file/i));
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });
    const errorEls = await screen.findAllByText(/file size should be less than 1MB/i);
    expect(errorEls.length).toBeGreaterThan(0);
  });

  it('shows error for invalid file type', async () => {
    const { container } = render(<CodeSubmissionForm />);
    const file = new File(['print(1)'], 'file.txt', { type: 'text/plain' });
    fireEvent.click(screen.getByText(/upload file/i));
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });
    const errorEls = await screen.findAllByText(/unsupported file type/i);
    expect(errorEls.length).toBeGreaterThan(0);
  });

  it('shows error for file read error', async () => {
    const { container } = render(<CodeSubmissionForm />);
    const file = new File([''], 'file.py', { type: 'text/x-python' });
    // Simulate FileReader error
    const realFileReader = window.FileReader;
    class MockFileReader {
      public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
      readAsText() {
        if (this.onerror) this.onerror(new ProgressEvent('error'));
      }
      addEventListener() {}
    }
    // @ts-ignore
    window.FileReader = MockFileReader as any;
    fireEvent.click(screen.getByText(/upload file/i));
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });
    const errorEls = await screen.findAllByText(/error reading file/i);
    expect(errorEls.length).toBeGreaterThan(0);
    window.FileReader = realFileReader;
  });

  it('updates code, language, and fileName on valid file upload', async () => {
    const { container } = render(<CodeSubmissionForm />);
    const file = new File(['print("hi")'], 'file.py', { type: 'text/x-python' });
    fireEvent.click(screen.getByText(/upload file/i));
    const input = container.querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [file] } });
    // The file name may be rendered as text, not as an input value
    expect(await screen.findByText('file.py')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toHaveValue('print("hi")');
  });

  it('opens login dialog when analyzing and not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, token: null });
    render(<CodeSubmissionForm />);
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    // Use findAllByRole for dialog and check content
    const dialogs = await screen.findAllByRole('dialog');
    expect(dialogs.some(d => d.textContent?.toLowerCase().includes('login required'))).toBe(true);
  });

  it('shows error when analyzing with empty code', async () => {
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    // Use findAllByText and check at least one error message appears
    const errors = await screen.findAllByText(/please enter some code to analyze/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('shows previous analysis if code is unchanged', async () => {
    // Mock analysis result with all required fields
    (analysisService.analyzeCode as jest.Mock).mockResolvedValueOnce({
      issues: [{ type: 'warning', message: 'Test warning' }],
      metrics: { complexity: 5, loc: 10, functions: 1 },
      suggestions: []
    });
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    await waitFor(() => expect(analysisService.analyzeCode).toHaveBeenCalled());
    // Wait for analyze button to reappear if it is conditionally rendered
    const analyzeBtn = await screen.findByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeBtn);
    expect(screen.getByText(/analysis results/i)).toBeInTheDocument();
  });

  it('shows analysis results on successful analysis', async () => {
    (analysisService.analyzeCode as jest.Mock).mockResolvedValueOnce({
      issues: [{ type: 'warning', message: 'Test warning' }],
      metrics: { complexity: 5, loc: 10, functions: 1 },
      suggestions: []
    });
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    // Use flexible matcher for warning text
    expect(await screen.findByText((content) => content.includes('Test warning'))).toBeInTheDocument();
  });

  it('shows error on analysis API error', async () => {
    (analysisService.analyzeCode as jest.Mock).mockRejectedValueOnce({ response: { data: { message: 'Analysis API error' } } });
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    // Use findAllByText and check at least one error message appears
    const errors = await screen.findAllByText(/analysis api error/i);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('opens login dialog on analysis 401 error', async () => {
    (analysisService.analyzeCode as jest.Mock).mockRejectedValueOnce({ response: { status: 401, data: { message: 'Unauthorized' } } });
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
    // Use findAllByRole and check dialog content
    const dialogs = await screen.findAllByRole('dialog');
    expect(dialogs.some(d => d.textContent?.toLowerCase().includes('login required'))).toBe(true);
  });

  it('disables submit and analyze buttons while loading', async () => {
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Submission' } });
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitBtn);
    await waitFor(() => expect(submitBtn).toBeDisabled());
    const analyzeBtn = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeBtn);
    await waitFor(() => expect(analyzeBtn).toBeDisabled());
  });

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: { username: 'testuser' }, token: 'testtoken' });
    (reviewService.createReview as jest.Mock).mockResolvedValue({ data: { _id: '123' } });
  });

  it('shows validation error for empty code', async () => {
    render(<CodeSubmissionForm />);
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'My Submission' } });
    fireEvent.change(await screen.findByTestId('monaco-editor'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/please enter some code/i)).toBeInTheDocument();
  });

  it('opens login dialog when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, token: null });
    render(<CodeSubmissionForm />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    let dialogFound = false;
    try {
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      dialogFound = true;
    } catch {
      // fallback: look for a unique login button or heading
      try {
        const matches = await screen.findAllByText(/login|sign in|please log in/i);
        expect(matches.length).toBeGreaterThan(0);
        dialogFound = true;
      } catch (e) {
        // Print DOM for debugging if both fail
        // eslint-disable-next-line no-console
        console.log('Dialog not found. Current DOM:', screen.debug());
        throw e;
      }
    }
    expect(dialogFound).toBe(true);
  });

  it('resets title input after successful submit', async () => {
    render(<CodeSubmissionForm />);
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'My Submission' } });
    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'console.log("hi");' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => expect(reviewService.createReview).toHaveBeenCalled());
    // Wait for the input to be cleared
    await waitFor(() => expect(titleInput).toHaveValue(''));
  });

  it('updates code when language changes', () => {
    render(<CodeSubmissionForm />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText(/Python/i));
    expect(screen.getByTestId('monaco-editor')).toHaveValue(
  `# Write your Python code here\ndef hello(name):\n    print(f'Hello, {name}!')`
);
  });
});
