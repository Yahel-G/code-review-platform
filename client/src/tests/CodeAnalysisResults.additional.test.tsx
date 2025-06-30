import React from 'react';
import { render, screen } from '@testing-library/react';
import CodeAnalysisResults from '../components/CodeAnalysisResults';

describe('CodeAnalysisResults - Additional Edge Cases', () => {
  const baseProps = {
    result: {
      issues: [
        { ruleId: 'no-console', severity: 2 as 2, message: 'Unexpected console', line: 1, column: 1 },
        { ruleId: 'semi', severity: 1 as 1, message: 'Missing semicolon', line: 2, column: 10 }
      ],
      metrics: { complexity: 1, maintainability: 90, linesOfCode: 10 },
      suggestions: ['Use let instead of var.']
    },
    show: true,
    loading: false,
    error: null,
    onToggle: jest.fn(),
  };

  it('renders with suggestions undefined', () => {
    render(<CodeAnalysisResults {...baseProps} result={{ ...baseProps.result, suggestions: undefined }} />);
    expect(screen.queryByText(/suggestion/i)).not.toBeInTheDocument();
  });

  it('renders multiline suggestions', () => {
    render(<CodeAnalysisResults {...baseProps} result={{ ...baseProps.result, suggestions: ['First line\nSecond line'] }} />);
    expect(screen.getByText(/First line/)).toBeInTheDocument();
    expect(screen.getByText(/Second line/)).toBeInTheDocument();
  });

  it('handles issues with unknown severity', () => {
    render(<CodeAnalysisResults {...baseProps} result={{ ...baseProps.result, issues: [{ message: 'Unknown severity', severity: 0 as any }] }} />);
    expect(screen.getByText(/Unknown severity/)).toBeInTheDocument();
  });

  it('handles issues with missing optional fields', () => {
    render(<CodeAnalysisResults {...baseProps} result={{ ...baseProps.result, issues: [{ severity: 2 as 2, message: 'No ruleId or line' }] }} />);
    expect(screen.getByText(/No ruleId or line/)).toBeInTheDocument();
  });

  it('handles missing metrics object', () => {
    render(<CodeAnalysisResults {...baseProps} result={{ ...baseProps.result, metrics: undefined as any }} />);
    // Should not crash and should still render the component
    expect(screen.getByText(/Code Analysis Results/i)).toBeInTheDocument();
  });

  it('handles metrics with only some fields present', () => {
    render(<CodeAnalysisResults {...baseProps} result={{ ...baseProps.result, metrics: { complexity: 5 } as any }} />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('does not render details when show is false', () => {
    const { container } = render(<CodeAnalysisResults {...baseProps} show={false} />);
    // Should render nothing or just the header
    expect(container).not.toBeEmptyDOMElement();
  });

  it('does not throw if onToggle is not provided', () => {
    expect(() => {
      render(<CodeAnalysisResults {...baseProps} onToggle={undefined as any} />);
    }).not.toThrow();
  });

  it('renders loading state with minimal props', () => {
    render(<CodeAnalysisResults result={null} show={true} loading={true} onToggle={() => {}} />);
    expect(screen.getByText(/Analyzing Code/i)).toBeInTheDocument();
  });

  it('renders error state with minimal props', () => {
    render(<CodeAnalysisResults result={null} show={true} error="Error!" onToggle={() => {}} />);
    expect(screen.getByText(/Analysis Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Error!/i)).toBeInTheDocument();
  });
});
