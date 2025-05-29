const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const { setupTestDB, clearTestDB, closeTestDB, getAuthToken } = require('./testHelpers');
const Analysis = require('../models/Analysis');

let app, server, token, userId;

beforeAll(async () => {
  await setupTestDB();
  const srv = require('../server');
  app = srv.app;
  server = srv.server;
});

beforeEach(async () => {
  token = await getAuthToken(app);
  const payload = jwt.decode(token);
  userId = payload.id;
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
  if (server) await new Promise(res => server.close(res));
});

describe('Analysis Routes', () => {
  describe('POST /api/analyze', () => {
    it('rejects unauthenticated', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .send({ code: 'x', language: 'javascript' });
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(res.body.message).toMatch(/not authorized|token/i);
    });

    it('returns 400 if code missing', async () => {
      const res = await request(app)
        .post('/api/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'javascript' });
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.message).toBe('Code is required');
    });

    it('analyzes code and returns results', async () => {
      const code = 'var a = 1; console.log(a);';
      const res = await request(app)
        .post('/api/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({ code, language: 'javascript' });
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('issues');
      expect(Array.isArray(res.body.issues)).toBe(true);
      expect(res.body).toHaveProperty('metrics');
      expect(res.body.metrics).toHaveProperty('linesOfCode');
      expect(res.body.metrics).toHaveProperty('complexity');
      expect(res.body.metrics).toHaveProperty('maintainability');
      expect(res.body).toHaveProperty('suggestions');
    });
  });

  describe('GET /api/analyze/history', () => {
    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/analyze/history');
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(res.body.message).toMatch(/not authorized|token/i);
    });

    it('returns empty array when no history', async () => {
      const res = await request(app)
        .get('/api/analyze/history')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('returns history entries', async () => {
      await Analysis.create({
        user: userId,
        language: 'javascript',
        issues: [],
        metrics: { linesOfCode: 1, complexity: 1, maintainability: 100 },
        codeSnippet: 'x',
      });
      const res = await request(app)
        .get('/api/analyze/history')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      const entry = res.body[0];
      expect(entry).toHaveProperty('id');
      expect(entry.language).toBe('javascript');
      expect(entry.metrics).toHaveProperty('complexity');
    });
  });
});
