jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

const { validate, validateObjectId } = require('../middlewares/validation.middleware');
const { validationResult } = require('express-validator');
const { ApiError } = require('../middlewares/error.middleware');
const { StatusCodes } = require('http-status-codes');

describe('Validation Middleware', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validate', () => {
    it('calls next when there are no validation errors', () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });

      validate(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('throws ApiError when validation errors exist', () => {
      const req = {};
      const res = {};
      const next = jest.fn();
      const mockErrs = [{ param: 'field', msg: 'must not be empty' }];
      validationResult.mockReturnValue({ isEmpty: () => false, array: () => mockErrs });

      expect(() => validate(req, res, next)).toThrow(ApiError);
      try { validate(req, res, next); } catch (err) {
        expect(err.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
        expect(err.message).toBe('Validation failed');
        expect(err.isOperational).toBe(true);
        // Stack holds extracted errors
        expect(err.stack).toEqual([{ field: 'must not be empty' }]);
      }
    });
  });

  describe('validateObjectId', () => {
    const middleware = validateObjectId('id');
    it('calls next for valid ObjectId', () => {
      const req = { params: { id: '0123456789abcdef01234567' } };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('throws ApiError for missing or invalid id', () => {
      const req = { params: { id: 'short' } };
      const res = {};
      const next = jest.fn();

      expect(() => middleware(req, res, next)).toThrow(ApiError);
      try { middleware(req, res, next); } catch (err) {
        expect(err.statusCode).toBe(StatusCodes.BAD_REQUEST);
        expect(err.message).toBe('Invalid id format');
      }
    });
  });
});
