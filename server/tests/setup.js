// Set up test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRE = '1h';
process.env.JWT_COOKIE_EXPIRE = 30;
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRE = '7d';

// Set up global test timeout
jest.setTimeout(30000); // 30 seconds

// Add global afterAll to ensure all tests complete
const mongoose = require('mongoose');

// Global teardown
afterAll(async () => {
  // Close any open connections
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});
