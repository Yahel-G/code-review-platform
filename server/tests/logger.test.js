// tests/logger.test.js
const process = require('process');

describe('Logger format toggling', () => {
  let writeSpy;
  let mockConsoleTransportLogMethod;

  beforeEach(() => {
    jest.resetModules(); // Crucial to ensure mocks are fresh for each test

    // This will be the function we spy on
    mockConsoleTransportLogMethod = jest.fn();

    // Mock winston and its transports
    jest.doMock('winston', () => {
      const actualWinston = jest.requireActual('winston');
      const Transport = require('winston-transport');

      class MockConsole extends Transport {
        constructor(opts = {}) { // Default opts to an empty object
          super(opts);
          this.log = mockConsoleTransportLogMethod; // This is the spy target
          this.silent = opts.silent || false;
        }
      }

      class MockFile extends Transport {
        constructor(opts = {}) { // Default opts to an empty object
          super(opts);
          this.log = jest.fn(); // MockFile's log can be a simple, silent jest.fn()
          this.silent = opts.silent || true;
        }
      }

      return {
        ...actualWinston, // Retain actual winston functionalities (format, createLogger, etc.)
        transports: {
          ...actualWinston.transports, // Retain other actual transports (e.g., Http, Stream)
          Console: MockConsole, // Override Console transport with our mock
          File: MockFile,       // Override File transport with our mock
        },
        // createLogger will now be the actual winston.createLogger,
        // but it will use our mocked Console and File transports due to the override above.
      };
    });

    // writeSpy will now point to the log method of our mocked Console transport instance
    writeSpy = mockConsoleTransportLogMethod;
  });

  afterEach(() => {
    jest.dontMock('winston'); // Undoes the mock for 'winston'
    jest.resetModules(); // Clean up modules to prevent state leakage between tests
    jest.restoreAllMocks(); // Restores all spies and mocks
  });

  it('uses colorized format in development', () => {
    process.env.NODE_ENV = 'development';
    const logger = require('../utils/logger'); // require logger *after* mocks are set up
    logger.info('test-dev');

    expect(writeSpy).toHaveBeenCalled();
    const logEntryObject = writeSpy.mock.calls[0][0]; // Winston transports log an object
    const formattedMessage = logEntryObject[Symbol.for('message')]; // Formatted message is under this symbol
    expect(formattedMessage).toMatch(/\x1b\[/); // Check for ANSI color codes
  });

  it('uses JSON format in production', () => {
    process.env.NODE_ENV = 'production';
    const logger = require('../utils/logger'); // require logger *after* mocks are set up
    logger.info('test-prod');

    expect(writeSpy).toHaveBeenCalled();
    const logEntryObject = writeSpy.mock.calls[0][0];
    const formattedMessage = logEntryObject[Symbol.for('message')];
    expect(formattedMessage.trim()).toMatch(/^\{.*"level":"info","message":"test-prod".*\}$/); // Check for JSON structure
    expect(formattedMessage).not.toMatch(/\x1b\[/); // No ANSI color codes
  });
});
