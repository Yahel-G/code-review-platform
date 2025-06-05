const request = require('supertest');
const mongoose = require('mongoose');

jest.mock('../utils/logger', () => ({ error: jest.fn() }));
const logger = require('../utils/logger');
const { server } = require('../server');

describe('Terminus healthcheck endpoint', () => {
  let httpServer;

  beforeAll((done) => {
    httpServer = server.listen(0, done);
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  it('returns 503 when MongoDB is not connected', async () => {
    mongoose.connection.readyState = 0;
    const res = await request(httpServer).get('/healthcheck');
    expect(res.status).toBe(503);
  });

  it('returns 200 when MongoDB is connected', async () => {
    mongoose.connection.readyState = 1;
    const res = await request(httpServer).get('/healthcheck');
    expect(res.status).toBe(200);
  });
});

describe('unhandledRejection event', () => {
  beforeAll(() => {
    jest.spyOn(server, 'close').mockImplementation((cb) => cb());
    jest.spyOn(process, 'exit').mockImplementation((code) => { throw new Error('exit:' + code); });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('logs error and exits on unhandledRejection', () => {
    expect(() => {
      process.emit('unhandledRejection', new Error('boom'));
    }).toThrow('exit:1');
    expect(logger.error).toHaveBeenCalledWith('Unhandled Rejection:', expect.any(Error));
    expect(server.close).toHaveBeenCalled();
  });
});
