const request = require('supertest');
const { app, server } = require('../server');
let httpServer;

// Start HTTP server on ephemeral port before tests
beforeAll((done) => {
  httpServer = server.listen(0, done);
});

// Close server after tests
afterAll((done) => {
  httpServer.close(done);
});

describe('Server Basic Endpoints', () => {
  it('GET /health should return 200 with status ok and timestamp', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('GET unknown route should return 404 and error JSON', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      status: 'error',
      message: 'Not Found',
      path: '/nonexistent'
    });
  });
});
