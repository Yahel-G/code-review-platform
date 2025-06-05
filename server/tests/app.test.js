const request = require('supertest');

describe('app.js CORS and Rate Limiter', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.NODE_ENV;
    delete process.env.CLIENT_URL;
  });

  it('reflects Origin header in development', async () => {
    process.env.NODE_ENV = 'development';
    const { default: express } = require('express'); // ensure reload
    const loadedApp = require('../app');
    app = loadedApp;
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://example.com');
    expect(res.headers['access-control-allow-origin']).toBe('http://example.com');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows only CLIENT_URL in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://prod.app';
    jest.resetModules();
    const loadedApp = require('../app');
    app = loadedApp;
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://prod.app');
    expect(res.headers['access-control-allow-origin']).toBe('https://prod.app');
  });

  it('returns 429 after too many requests', async () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const loadedApp = require('../app');
    app = loadedApp;
    // exceed rate limit (100 requests)
    for (let i = 0; i < 101; i++) {
      // ignore responses until limit reached
      // eslint-disable-next-line no-await-in-loop
      await request(app).get('/health');
    }
    const res = await request(app).get('/health');
    expect(res.status).toBe(429);
    expect(res.text).toMatch(/Too many requests from this IP/);
  }, 20000);

  it('returns 404 and JSON on unknown route', async () => {
    jest.resetModules();
    const loadedApp = require('../app');
    const resNotFound = await request(loadedApp).get('/notfound');
    expect(resNotFound.status).toBe(404);
    expect(resNotFound.body).toEqual({ status: 'error', message: 'Not Found', path: '/notfound' });
  });
});
