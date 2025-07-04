/**
 * Simple code analyzer that uses ESLint to find common issues
 * @param {string} code - The code to analyze
 * @param {string} language - The programming language ('javascript' or 'typescript')
 * @returns {Promise<Array>} Array of issues found
 */
const { ESLint } = require('eslint');
const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Base analyzer class with common functionality
 */
class CodeAnalyzer {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'code-review-temp');
    this.ensureTempDir();
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  createTempFile(extension, content) {
    const tempFile = path.join(this.tempDir, `temp_${Date.now()}.${extension}`);
    fs.writeFileSync(tempFile, content);
    return tempFile;
  }

  cleanUp(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  parseLintOutput(output, lineParser) {
    if (!output) return [];
    return output
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(lineParser)
      .filter(issue => issue);
  }

  createDependencyMissingIssue(toolName) {
    return [{
      ruleId: 'dependency-missing',
      message: `Required dependency "${toolName}" is not installed or not found in PATH. Please install it and retry the analysis.`,
      line: 1,
      column: 1,
      severity: 2,
    }];
  }
}

/**
 * JavaScript/TypeScript analyzer using ESLint
 */
class JsTsAnalyzer extends CodeAnalyzer {
  constructor() {
    super();
  }

  getEslintConfig(language) {
    return {
      parser: language === 'typescript' ? '@typescript-eslint/parser' : undefined,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      plugins: language === 'typescript' ? ['@typescript-eslint'] : [],
      extends: [
        'eslint:recommended',
        language === 'typescript' ? 'plugin:@typescript-eslint/recommended' : '',
      ].filter(Boolean),
      rules: {
        'no-console': 'warn',
        'no-debugger': 'error',
        'eqeqeq': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'warn',
        'no-unused-vars': 'off',
      },
      env: {
        browser: true,
        node: true,
        es2020: true,
      },
    };
  }

  async analyze(code, language = 'javascript') {
    try {
      if (!code?.trim()) return [];
      
      // Create a temporary file for analysis
      const tempFile = this.createTempFile(language === 'typescript' ? 'ts' : 'js', code);
      
      try {
        // Instantiate ESLint with config per language
        const eslint = new ESLint({
          useEslintrc: false,
          overrideConfig: this.getEslintConfig(language)
        });
        // Run ESLint on the file
        const results = await eslint.lintFiles([tempFile]);
        
        // Format results
        const issues = [];
        for (const result of results) {
          for (const message of result.messages) {
            issues.push({
              ruleId: message.ruleId || (message.message.includes('Parsing error') ? 'syntax-error' : 'unknown-rule'),
              message: message.message,
              line: message.line,
              column: message.column,
              endLine: message.endLine,
              endColumn: message.endColumn,
              severity: message.severity === 2 ? 2 : 1,
            });
          }
        }
        
        return issues;
      } finally {
        this.cleanUp(tempFile);
      }
    } catch (error) {
      console.error(`Error in ${language} analysis:`, error);
      return this.handleError(error);
    }
  }

  handleError(error) {
    if (error.message?.includes('Parsing error:')) {
      return [this.createIssue('syntax-error', error.message.split('\n')[0], 1, 1, 2)];
    }
    return [this.createIssue('analysis-error', `Failed to analyze code: ${error.message || 'Unknown error'}`, 1, 1, 2)];
  }

  createIssue(ruleId, message, line, column, severity) {
    return { ruleId, message, line, column, severity };
  }
}

/**
 * Python analyzer using pylint
 */
class PythonAnalyzer extends CodeAnalyzer {
  async analyze(code) {
    try {
      if (!code?.trim()) return [];
      
      const tempFile = this.createTempFile('py', code);
      
      try {
        const command = `pylint --output-format=json ${tempFile}`;
        const output = cp.execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        
        // Parse pylint JSON output
        const results = JSON.parse(output || '[]');
        return results.map(issue => ({
          ruleId: issue.messageId || issue.symbol || 'pylint',
          message: `${issue.message} (${issue.symbol})`,
          line: issue.line,
          column: issue.column || 1,
          severity: issue.type === 'error' ? 2 : 1,
        }));
      } catch (error) {
        // Pylint exits with non-zero on issues, so we need to check stderr
        if (error.stderr) {
          return this.parseLintOutput(error.stderr.toString(), line => {
            const match = line.match(/(\d+):(\d+):\s*([^:]+):\s*(.+)/);
            if (match) {
              return {
                ruleId: 'pylint-error',
                message: match[4].trim(),
                line: parseInt(match[1]),
                column: parseInt(match[2]) || 1,
                severity: 2,
              };
            }
            return null;
          });
        }
        if (error.code === 'ENOENT' || /not (?:found|recognized)/i.test(error.message || '')) {
          return this.createDependencyMissingIssue('pylint');
        }
        throw error;
      } finally {
        this.cleanUp(tempFile);
      }
    } catch (error) {
      console.error('Error in Python analysis:', error);
      return [{
        ruleId: 'analysis-error',
        message: `Failed to analyze Python code: ${error.message || 'Unknown error'}`,
        line: 1,
        column: 1,
        severity: 2,
      }];
    }
  }
}

/**
 * C# analyzer using .NET SDK's built-in analysis
 */
class CSharpAnalyzer extends CodeAnalyzer {
  async analyze(code) {
    try {
      if (!code?.trim()) return [];
      
      let tempFile; // Will be assigned after creation
      let tempDir;  // Will be derived from tempFile
      let projectFile; // Will be derived from tempDir

      try {
        tempFile = this.createTempFile('cs', code);
        tempDir = path.dirname(tempFile);
        projectFile = path.join(tempDir, 'temp.csproj');
        
        // Create a minimal .csproj file for analysis
        const csprojContent = `<?xml version="1.0" encoding="utf-8"?>
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <AnalysisLevel>latest</AnalysisLevel>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <EnableNETAnalyzers>true</EnableNETAnalyzers>
  </PropertyGroup>
</Project>`;
        
        fs.writeFileSync(projectFile, csprojContent);
        
        // First, try to build the project to get compilation errors
        try {
          cp.execSync(`dotnet build "${projectFile}" -nologo -v q`, { stdio: 'pipe' });
          
          // If build succeeds, run code analysis
          const analysisOutput = cp.execSync(
            `dotnet build "${projectFile}" -p:GenerateFullPaths=true -consoleloggerparameters:NoSummary -nologo`, 
            { stdio: 'pipe' }
          ).toString();
          
          return this.parseLintOutput(analysisOutput, line => {
            // Match build output format: Program.cs(10,9): error CS1002: ; expected
            const match = line.match(/(.+)\((\d+),(\d+)\):\s*(error|warning|info)\s+([^:]+):\s*(.+)/i);
            if (match) {
              return {
                ruleId: match[5].trim(),
                message: match[6].trim(),
                line: parseInt(match[2]),
                column: parseInt(match[3]) || 1,
                severity: match[4].toLowerCase() === 'error' ? 2 : 1,
              };
            }
            return null;
          });
          
        } catch (buildError) {
          const errOutput = buildError.stderr?.toString() || buildError.stdout?.toString() || '';
          // Check if dotnet command itself failed to run (e.g., not installed)
          if (buildError.code === 'ENOENT' || /command not found|not recognized/i.test(errOutput) || /is not recognized as an internal or external command/i.test(errOutput)) {
            console.warn('dotnet command not found or failed to execute. C# analysis skipped.');
            return []; // Return empty array if dotnet is not available
          }

          // Check if 'projectFile' (which is temp.csproj) was not found.
          if (projectFile && typeof projectFile === 'string') { 
            const expectedMissingProjectMessage = `The project file "${projectFile.replace(/\\/g, '\\\\')}" was not found`;
            if (errOutput.includes(expectedMissingProjectMessage)) {
              console.warn(`Temporary C# project file '${projectFile}' not found during build. C# analysis skipped.`);
              return [];
            }
          }
          // If tempProjPath was undefined, not a string, or the specific message wasn't found, proceed to parse general build errors.
          // If build fails for other reasons, parse the error output
          return this.parseLintOutput(errOutput, line => {
            const match = line.match(/(.+)\((\d+),(\d+)\):\s*(error|warning|info)\s+([^:]+):\s*(.+)/i);
            if (match) {
              return {
                ruleId: match[5].trim(),
                message: match[6].trim(),
                line: parseInt(match[2]),
                column: parseInt(match[3]) || 1,
                severity: match[4].toLowerCase() === 'error' ? 2 : 1,
              };
            }
            return null;
          });
        }
        
      } catch (error) {
        // Check if dotnet command itself failed to run (e.g., not installed) during setup or initial execSync
        if (error.code === 'ENOENT' || /command not found|not recognized/i.test(error.message) || /is not recognized as an internal or external command/i.test(error.message)) {
          console.warn('dotnet command not found or failed to execute during C# analysis setup. C# analysis skipped.');
          return []; // Return empty array if dotnet is not available
        }
        if (error.code === 'ENOENT' || /not (?:found|recognized)/i.test(error.message || '')) {
          return this.createDependencyMissingIssue('dotnet');
        }
        console.error('Error in C# analysis:', error);
        return [{
          ruleId: 'analysis-error',
          message: `Failed to analyze C# code: ${error.message || 'Unknown error'}`,
          line: 1,
          column: 1,
          severity: 2,
        }];
      } finally {
        // Ensure tempFile and projectFile are cleaned up if they were created
        if (tempFile) {
          this.cleanUp(tempFile);
        }
        if (projectFile && fs.existsSync(projectFile)) { // Check existence before cleaning
          this.cleanUp(projectFile); // Also cleanup the .csproj
        }
        // Clean up bin and obj directories if they were created
        const binDir = path.join(tempDir, 'bin');
        const objDir = path.join(tempDir, 'obj');
        if (fs.existsSync(binDir)) fs.rmSync(binDir, { recursive: true, force: true });
        if (fs.existsSync(objDir)) fs.rmSync(objDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Error in C# analysis:', error);
      return [{
        ruleId: 'analysis-error',
        message: `Failed to analyze C# code: ${error.message || 'Unknown error'}`,
        line: 1,
        column: 1,
        severity: 2,
      }];
    }
  }
}

/**
 * Java analyzer using checkstyle
 */
class JavaAnalyzer extends CodeAnalyzer {
  async analyze(code) {
    try {
      if (!code?.trim()) return [];
      
      const tempFile = this.createTempFile('java', code);
      
      try {
        const command = `javac -Xlint:all ${tempFile}`;
        const output = cp.execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        
        return this.parseLintOutput(output, line => {
          // Example: Test.java:10: warning: [deprecation] someMethod() in A has been deprecated
          const match = line.match(/.+?:(\d+):\s*(warning|error):\s*(?:\[([^\]]+)\]\s*)?(.+)/);
          if (match) {
            return {
              ruleId: match[3] || 'java',
              message: match[4].trim(),
              line: parseInt(match[1]),
              column: 1,
              severity: match[2].toLowerCase() === 'error' ? 2 : 1,
            };
          }
          return null;
        });
      } catch (error) {
        if (error.code === 'ENOENT' || /not (?:found|recognized)/i.test(error.message || '')) {
          return this.createDependencyMissingIssue('javac');
        }
        console.error('Error in Java analysis:', error);
        return [{
          ruleId: 'analysis-error',
          message: `Failed to analyze Java code: ${error.message || 'Unknown error'}`,
          line: 1,
          column: 1,
          severity: 2,
        }];
      } finally {
        this.cleanUp(tempFile);
        // Clean up .class file if it was created
        const classFile = tempFile.replace(/\.java$/, '.class');
        this.cleanUp(classFile);
      }
    } catch (error) {
      console.error('Error in Java analysis:', error);
      return [{
        ruleId: 'analysis-error',
        message: `Failed to analyze Java code: ${error.message || 'Unknown error'}`,
        line: 1,
        column: 1,
        severity: 2,
      }];
    }
  }
}

/**
 * C/C++ analyzer using cppcheck
 */
class CppAnalyzer extends CodeAnalyzer {
  async analyze(code, isCpp = false) {
    try {
      if (!code?.trim()) return [];
      
      const ext = isCpp ? 'cpp' : 'c';
      const tempFile = this.createTempFile(ext, code);
      
      try {
        const command = `cppcheck --enable=all ${tempFile} 2>&1`;
        const output = cp.execSync(command, { encoding: 'utf-8' });
        
        return this.parseLintOutput(output, line => {
          // Example: test.c:4:5: error: Array 'a[10]' accessed at index 10, which is out of bounds. [arrayIndexOutOfBounds]
          const match = line.match(/.+?:(\d+):(\d+):\s*(\w+):\s*([^\[]+)(?:\s*\[(\w+)\])?/);
          if (match) {
            return {
              ruleId: match[5] || 'cppcheck',
              message: match[4].trim(),
              line: parseInt(match[1]),
              column: parseInt(match[2]) || 1,
              severity: match[3].toLowerCase() === 'error' ? 2 : 1,
            };
          }
          return null;
        });
      } catch (error) {
        if (error.code === 'ENOENT' || /not (?:found|recognized)/i.test(error.message || '')) {
          return this.createDependencyMissingIssue('cppcheck');
        }
        console.error(`Error in ${isCpp ? 'C++' : 'C'} analysis:`, error);
        return [{
          ruleId: 'analysis-error',
          message: `Failed to analyze ${isCpp ? 'C++' : 'C'} code: ${error.message || 'Unknown error'}`,
          line: 1,
          column: 1,
          severity: 2,
        }];
      } finally {
        this.cleanUp(tempFile);
      }
    } catch (error) {
      console.error(`Error in ${isCpp ? 'C++' : 'C'} analysis:`, error);
      return [{
        ruleId: 'analysis-error',
        message: `Failed to analyze ${isCpp ? 'C++' : 'C'} code: ${error.message || 'Unknown error'}`,
        line: 1,
        column: 1,
        severity: 2,
      }];
    }
  }
}

// Initialize analyzers
const jsTsAnalyzer = new JsTsAnalyzer();
const pythonAnalyzer = new PythonAnalyzer();
const csharpAnalyzer = new CSharpAnalyzer();
const javaAnalyzer = new JavaAnalyzer();
const cppAnalyzer = new CppAnalyzer();

/**
 * Main analysis function that routes to the appropriate analyzer
 */
async function analyzeCode(code, language = 'javascript') {
  if (!code?.trim()) {
    return [];
  }

  try {
    switch (language.toLowerCase()) {
      case 'javascript':
        return await jsTsAnalyzer.analyze(code, 'javascript');
      case 'typescript':
      case 'ts':
        return await jsTsAnalyzer.analyze(code, 'typescript');
      case 'python':
      case 'py':
        return await pythonAnalyzer.analyze(code);
      case 'csharp':
      case 'cs':
        return await csharpAnalyzer.analyze(code);
      case 'java':
        return await javaAnalyzer.analyze(code);
      case 'c':
        return await cppAnalyzer.analyze(code, false);
      case 'cpp':
      case 'c++':
        return await cppAnalyzer.analyze(code, true);
      default:
        return [{
          ruleId: 'unsupported-language',
          message: `Unsupported language: ${language}. Using basic analysis.`,
          line: 1,
          column: 1,
          severity: 1,
        }];
    }
  } catch (error) {
    console.error(`Error in analyzeCode for ${language}:`, error);
    return [{
      ruleId: 'analysis-error',
      message: `Failed to analyze ${language} code: ${error.message || 'Unknown error'}`,
      line: 1,
      column: 1,
      severity: 2,
    }];
  }
}

module.exports = {
  analyzeCode,
  // Export individual analyzers for testing
  JsTsAnalyzer,
  PythonAnalyzer,
  CSharpAnalyzer,
  JavaAnalyzer,
  CppAnalyzer,
};
