const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { authenticate } = require('../controllers/auth.controller');
const { ApiError } = require('../middlewares/error.middleware');

describe('authenticate middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, cookies: {} };
    res = {};
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls next with ApiError when no token', async () => {
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next with ApiError for malformed token', async () => {
    req.headers.authorization = 'Bearer badtoken';
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('jwt bad'); });
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next with ApiError for expired token', async () => {
    req.headers.authorization = 'Bearer expired';
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    jest.spyOn(jwt, 'verify').mockImplementation(() => { throw expiredError; });
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it('calls next with ApiError for non-existent user', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    req.headers.authorization = `Bearer valid`;
    jest.spyOn(jwt, 'verify').mockReturnValue({ id: fakeId });
    jest.spyOn(User, 'findById').mockResolvedValue(null);
    await authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });
});
