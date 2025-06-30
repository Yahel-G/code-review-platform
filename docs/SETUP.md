# Setup Instructions

This project supports code review and analysis for JavaScript, Python, and C#.

## Prerequisites

- **Node.js** v16 or later & **npm** v8 or later
- **MongoDB** v5 or later (for backend database)
- **Python** v3.8 or later & **pip** (for Python analysis with Pylint)
- **.NET SDK** (6.0 or later) for C# analysis with Roslyn
- **Docker** (optional, for containerized development)

## JavaScript & Node.js (Frontend & Backend)

1. Install npm dependencies:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```
2. Copy `.env.example` to `.env` in both `server` and `client` directories and configure variables.
3. Start servers in development mode:
   ```bash
   cd server && npm start
   cd ../client && npm start
   ```

## Python (Automated Analysis)

1. Navigate to the Python analyzer directory (if separate) or ensure Pylint is installed:
   ```bash
   pip install pylint
   ```
2. Run Pylint analysis:
   ```bash
   pylint your_script.py
   ```

## C# (Roslyn Analyzer)

1. Ensure .NET SDK is installed:
   ```bash
   dotnet --version
   ```
2. Navigate to the Roslyn analyzer project (if separate) and restore packages:
   ```bash
   cd roslyn-analyzer
   dotnet restore
   ```
3. Build and run analyses:
   ```bash
   dotnet build
   dotnet run --path path/to/code.cs
   ```

## Docker (Optional)

1. Build images and start containers:
   ```bash
   npm run docker:build
   npm run docker:up
   ```
2. Tear down containers:
   ```bash
   npm run docker:down
   ```
