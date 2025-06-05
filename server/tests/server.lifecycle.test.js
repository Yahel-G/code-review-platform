const mongoose = require('mongoose');
const { onSignal, onHealthCheck } = require('../server');

describe('Server lifecycle hooks', () => {
  beforeEach(() => {
    jest.spyOn(mongoose.connection, 'close').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('onSignal closes mongoose connection', async () => {
    await expect(onSignal()).resolves.toBeUndefined();
    expect(mongoose.connection.close).toHaveBeenCalled();
  });

  it('onHealthCheck resolves when Mongo ready', async () => {
    mongoose.connection.readyState = 1;
    await expect(onHealthCheck()).resolves.toBeUndefined();
  });

  it('onHealthCheck rejects when Mongo not connected', async () => {
    mongoose.connection.readyState = 0;
    await expect(onHealthCheck()).rejects.toThrow();
  });
});
