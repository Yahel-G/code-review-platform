const { ApiError, errorConverter, errorHandler, notFound } = require('../middlewares/error.middleware');
const { StatusCodes } = require('http-status-codes');

describe('ApiError', () => {
  it('sets properties correctly', () => {
    // Match new signature: (statusCode, message, errors, isOperational, stack)
    const err = new ApiError(StatusCodes.BAD_REQUEST, 'Test error', [], true, 'stacktrace');
    expect(err.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(err.message).toBe('Test error');
    expect(err.isOperational).toBe(true);
    expect(err.stack).toBe('stacktrace');
    expect(err.status).toBe('fail');
  });
});

describe('errorConverter', () => {
  it('passes ApiError through', () => {
    const original = new ApiError(StatusCodes.NOT_FOUND, 'Not found');
    const next = jest.fn();
    errorConverter(original, {}, {}, next);
    expect(next).toHaveBeenCalledWith(original);
  });

  it('converts generic Error to ApiError', () => {
    const generic = new Error('Oops');
    generic.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    const next = jest.fn();
    errorConverter(generic, {}, {}, next);
    const passed = next.mock.calls[0][0];
    expect(passed).toBeInstanceOf(ApiError);
    expect(passed.message).toBe('Oops');
    expect(passed.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

describe('errorHandler', () => {
  it('sends proper JSON response', () => {
    const mockErr = new ApiError(StatusCodes.UNAUTHORIZED, 'No access');
    const req = { originalUrl: '/test', method: 'GET', ip: '127.0.0.1' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    // Should not include stack in non-development
    process.env.NODE_ENV = 'test';
    errorHandler(mockErr, req, res, next);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({ status: 'fail', message: 'No access' });
  });
});

describe('notFound', () => {
  it('creates a 404 ApiError', () => {
    const req = { originalUrl: '/missing' };
    const next = jest.fn();
    notFound(req, null, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(err.message).toMatch(/Not Found/);
  });
});
