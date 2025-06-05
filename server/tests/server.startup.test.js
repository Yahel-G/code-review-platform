// tests/server.startup.test.js

describe('Server startup failure', () => {
  let exitSpy;
  let errorSpy;

  beforeEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    // Spy on logger.error
    errorSpy = jest.spyOn(require('../utils/logger'), 'error').mockImplementation(() => {});
    // Mock mongoose.connect to reject
    jest.doMock('mongoose', () => {
      const actualMongoose = jest.requireActual('mongoose'); // Get actual mongoose for Schema and other utilities
      return {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')), // Mock connect to fail for this test
        connection: { 
          close: jest.fn().mockResolvedValue(undefined),
          on: jest.fn(),
          once: jest.fn(),
          readyState: 0, // Simulate disconnected state
        },
        Schema: actualMongoose.Schema, // Use actual Schema
        model: jest.fn().mockReturnValue(function model() {}), // Mock model to return a dummy constructor
        Types: actualMongoose.Types, // Include Types if needed by models
        set: jest.fn(), // Mock other mongoose functions if they are called during startup
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls process.exit(1) on MongoDB connection error', async () => {
    // Require server after mocks
    require('../server');
    // Wait for promise rejection to be handled
    await new Promise((resolve) => setImmediate(resolve));
    const mongoose = require('mongoose');
    expect(mongoose.connect).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith('MongoDB connection error:', expect.any(Error));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
