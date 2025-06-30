import React from 'react';

// Monaco Editor mock for Jest environment
// This file should be appended to setupTests.tsx if direct editing fails

jest.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ value, onChange, name, id, ['data-testid']: dataTestId }: any) => (
      <textarea
        data-testid={dataTestId || 'monaco-editor'}
        value={value}
        onChange={e => onChange?.(e.target.value, undefined)}
        name={name}
        id={id}
      />
    ),
  };
});
