# Code Review and Optimization Platform - Created With Windsurf AI

A full-stack web application that helps developers improve their code through community feedback and automated analysis tools. The platform supports Python, JavaScript, and C# code review and optimization.

## Features

- **Multi-language Support**: Review and optimize code in Python, JavaScript, and C#
- **Real-time Collaboration**: Get instant feedback through comments and suggestions
- **Automated Analysis**: Integrated with Pylint, ESLint, and Roslyn-based analyzers
- **Version Control Integration**: Seamless GitHub integration for code import/export
- **Gamification**: Earn points and badges for community contributions

## Tech Stack

- **Frontend**: React with TypeScript, Monaco Editor, Material-UI
- **Backend**: Node.js, Express, MongoDB
- **Analysis Tools**: Pylint, ESLint, Roslyn-based analyzer
- **Real-time**: Socket.IO for live updates
- **Containerization**: Docker for consistent development environments

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v8 or later) or yarn
- MongoDB (v5 or later)
- Docker (optional, for containerized development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/code-review-platform.git
   cd code-review-platform
   ```

2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `client` and `server` directories
   - Update the variables with your configuration

### Running the Application

#### Development Mode

1. Start the development servers:
   ```bash
   npm start
   ```
   This will start both the frontend and backend servers in development mode.

#### Using Docker

1. Build and start the containers:
   ```bash
   npm run docker:build
   npm run docker:up
   ```

## Project Structure

```
code-review-platform/
├── client/          # Frontend React application
├── server/          # Backend Node.js application
├── docker/          # Docker configurations
├── .gitignore
└── README.md
```

## Environment Variables

### Server (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/code-review
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
NODE_ENV=development
```

### Client (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## Documentation

- [API Endpoints](docs/API.md)
- [Setup Instructions](docs/SETUP.md)
- [Architecture Decisions](docs/ARCHITECTURE.md)
- [Contribution Guidelines](CONTRIBUTING.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
