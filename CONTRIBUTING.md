# Contribution Guidelines

Thank you for your interest in contributing to the Code Review and Optimization Platform! Please follow these guidelines to ensure a smooth workflow and maintain code quality.

## Getting Started

1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/yourusername/code-review-platform.git
   cd code-review-platform
   ```
2. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ../client && npm install
   ```
3. Create a new feature branch:
   ```bash
   git checkout -b feature/YourFeatureName
   ```

## Development Workflow

- Adhere to the existing coding style. Use Prettier for formatting and ESLint for linting.
- Write unit and integration tests for new features or bug fixes.
- Ensure all tests pass locally before pushing.

## Pull Request Process

1. Push your branch to your fork:
   ```bash
   git push origin feature/YourFeatureName
   ```
2. Open a Pull Request against the `main` branch of the upstream repository.
3. Provide a clear description of the changes and reference any related issues (e.g., `Fixes #123`).
4. A maintainer will review your PR, provide feedback, and request changes if needed.
5. Once approved, your PR will be merged.

## Code Review

- Be responsive to review comments and update your PR as needed.
- Maintain a clean commit history; consider rebasing or squashing commits for clarity.

## Reporting Bugs & Suggesting Enhancements

- Create an issue on the repository describing the bug or feature request.
- Provide steps to reproduce any bugs and relevant code snippets.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
