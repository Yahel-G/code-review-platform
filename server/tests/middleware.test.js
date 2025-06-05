const { ApiError, errorConverter, errorHandler, notFound } = require('../middlewares/error.middleware');
const { validateObjectId } = require('../middlewares/validation.middleware');
const { StatusCodes } = require('http-status-codes');

describe('ApiError class', () => {
  it('sets properties correctly and status based on code', () => {
    const err = new ApiError(400, 'Bad Request', true);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Bad Request');
    expect(err.isOperational).toBe(true);
    expect(err.status).toBe('fail');
  });

  it('sets status to error for 5xx codes', () => {
    const err = new ApiError(500, 'Server Error');
    expect(err.status).toBe('error');
  });
});

describe('errorConverter middleware', () => {
  it('passes through ApiError instances', () => {
    const apiErr = new ApiError(401, 'Unauthorized');
    let passed;
    const next = (err) => { passed = err; };
    errorConverter(apiErr, {}, {}, next);
    expect(passed).toBe(apiErr);
  });

  it('converts generic errors to ApiError', () => {
    const genErr = new Error('Boom');
    let passed;
    const next = (err) => { passed = err; };
    errorConverter(genErr, {}, {}, next);
    expect(passed).toBeInstanceOf(ApiError);
    expect(passed.message).toBe('Boom');
    expect(passed.isOperational).toBe(false);
    expect(passed.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});

describe('errorHandler middleware', () => {
  const req = { originalUrl: '/x', method: 'POST', ip: '1.2.3.4' };
  let statusMock, jsonMock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    process.env.NODE_ENV = 'development';
  });

  it('responds with error JSON including stack in development', () => {
    const err = new ApiError(404, 'Not Found');
    const res = { status: statusMock, json: jsonMock };
    errorHandler(err, req, res, () => {});
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'fail', message: 'Not Found', stack: expect.any(String) })
    );
  });

  it('omits stack in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new ApiError(500, 'Error');
    const res = { status: statusMock, json: jsonMock };
    errorHandler(err, req, res, () => {});
    expect(jsonMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ stack: expect.anything() })
    );
  });
});

describe('notFound middleware', () => {
  it('creates a 404 ApiError', () => {
    let passed;
    const next = (err) => { passed = err; };
    const req = { originalUrl: '/abc' };
    notFound(req, {}, next);
    expect(passed).toBeInstanceOf(ApiError);
    expect(passed.statusCode).toBe(StatusCodes.NOT_FOUND);
    expect(passed.message).toContain('/abc');
  });
});

describe('validateObjectId middleware', () => {
  it('calls next() for valid id', () => {
    const validId = '507f1f77bcf86cd799439011';
    const req = { params: { id: validId } };
    let called = false;
    const next = () => { called = true; };
    const mw = validateObjectId('id');
    mw(req, {}, next);
    expect(called).toBe(true);
  });

  it('throws ApiError for invalid id', () => {
    const req = { params: { id: 'nothex' } };
    const mw = validateObjectId('id');
    expect(() => mw(req, {}, () => {})).toThrow(ApiError);
    try {
      mw(req, {}, () => {});
    } catch (e) {
      expect(e.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(e.message).toMatch(/Invalid id format/);
    }
  });
});
