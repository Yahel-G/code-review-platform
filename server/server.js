require('dotenv').config();
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createTerminus } = require('@godaddy/terminus');
const logger = require('./utils/logger');
const { initializeSocket } = require('./socket');

// Import routes
const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// Graceful shutdown
function onSignal() {
  logger.info('Server is starting cleanup');
  return Promise.all([
    mongoose.connection.close(),
    // Add any other cleanup tasks here
  ]);
}

async function onHealthCheck() {
  const checks = [
    mongoose.connection.readyState === 1 ? 'MongoDB: OK' : 'MongoDB: Not Connected'
  ];
  
  const isHealthy = checks.every(check => check.endsWith('OK'));
  return isHealthy ? Promise.resolve() : Promise.reject(new Error(checks.join(' | ')));
}

createTerminus(server, {
  signal: 'SIGINT',
  healthChecks: { '/healthcheck': onHealthCheck },
  onSignal,
  onShutdown: () => logger.info('Cleanup finished, server is shutting down'),
  logger: (msg, err) => logger.error({ err }, msg)
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/code-review';

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info('Connected to MongoDB');
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server };
