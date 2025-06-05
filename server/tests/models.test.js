const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Analysis = require('../models/Analysis');

describe('User model instance methods', () => {
  let user;
  beforeEach(() => {
    user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'plaintext',
    });
  });

  it('correctPassword returns true for matching passwords', async () => {
    const raw = 'secret';
    const hashed = await bcrypt.hash(raw, 12);
    const match = await user.correctPassword(raw, hashed);
    expect(match).toBe(true);
  });

  it('changedPasswordAfter returns false when no change', () => {
    expect(user.changedPasswordAfter(1000)).toBe(false);
  });

  it('changedPasswordAfter returns true when changed after token', () => {
    user.passwordChangedAt = new Date(Date.now() - 1000);
    const jsTime = Math.floor((Date.now() - 2000) / 1000);
    expect(user.changedPasswordAfter(jsTime)).toBe(true);
  });

  it('createPasswordResetToken sets token and expiry', () => {
    const resetToken = user.createPasswordResetToken();
    expect(resetToken).toBeDefined();
    expect(typeof user.passwordResetToken).toBe('string');
    expect(user.passwordResetExpires).toBeGreaterThan(Date.now());
  });

  it('toJSON removes sensitive fields', () => {
    user.password = 'hashed';
    user.refreshToken = 'rt';
    user.passwordResetToken = 'prt';
    user.passwordResetExpires = Date.now();
    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.refreshToken).toBeUndefined();
    expect(json.passwordResetToken).toBeUndefined();
    expect(json.passwordResetExpires).toBeUndefined();
  });
});

describe('User.findByCredentials static method', () => {
  afterEach(() => jest.restoreAllMocks());

  it('throws when user not found', async () => {
    jest.spyOn(User, 'findOne').mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    await expect(User.findByCredentials('a@b.com', 'pass')).rejects.toThrow('Unable to login');
  });

  it('throws when password mismatch', async () => {
    const fakeUser = { password: 'hashed' };
    jest.spyOn(User, 'findOne').mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
    await expect(User.findByCredentials('a@b.com', 'pass')).rejects.toThrow('Unable to login');
  });

  it('returns user when credentials valid', async () => {
    const fakeUser = { password: 'hashed' };
    jest.spyOn(User, 'findOne').mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    const userFound = await User.findByCredentials('a@b.com', 'pass');
    expect(userFound).toBe(fakeUser);
  });
});

describe('Analysis model static findByUser', () => {
  afterEach(() => jest.restoreAllMocks());

  it('chains find, sort, limit, exec correctly', async () => {
    const exec = jest.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId() }]);
    const chain = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec,
    };
    jest.spyOn(Analysis, 'find').mockReturnValue(chain);
    const result = await Analysis.findByUser('user1', 5);
    expect(Analysis.find).toHaveBeenCalledWith({ user: 'user1' });
    expect(chain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(chain.limit).toHaveBeenCalledWith(5);
    expect(exec).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });

  it('validateSync fails on invalid metrics', () => {
    const invalid = {
      user: 'u', language: 'javascript', issues: [],
      metrics: { linesOfCode: 1, complexity: 1, maintainability: 150 },
      codeSnippet: 'a',
    };
    const doc = new Analysis(invalid);
    const err = doc.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.metrics.message).toContain('Invalid metrics');
  });

  it('toJSON transforms _id to id and removes __v', () => {
    const valid = {
      user: 'u', language: 'python', issues: [],
      metrics: { linesOfCode: 0, complexity: 1, maintainability: 50 },
      codeSnippet: 'a',
    };
    const doc = new Analysis(valid);
    doc.__v = 1;
    const json = doc.toJSON();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });
});
