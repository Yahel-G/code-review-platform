const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const { setupTestDB, clearTestDB, closeTestDB, getAuthToken } = require('./testHelpers');
const Analysis = require('../models/Analysis');

jest.mock('../utils/codeAnalyzer', () => ({
  analyzeCode: jest.fn().mockResolvedValue([
    { ruleId: 'no-var', message: 'Use let', line: 1, column: 1, severity: 1 },
  ]),
}));

jest.mock('../utils/codeMetrics', () => ({
  calculateCodeMetrics: jest.fn().mockReturnValue({
    linesOfCode: 10,
    complexity: 2,
    maintainability: 80,
  }),
}));

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

    it('saves analysis to DB and returns shape', async () => {
      const code = 'var a = 1; console.log(a);';
      const res = await request(app)
        .post('/api/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({ code, language: 'javascript' });
      expect(res.status).toBe(StatusCodes.OK);
      const entries = await Analysis.find({ user: userId });
      expect(entries).toHaveLength(1);
      const entry = entries[0];
      expect(entry).toHaveProperty('issues');
      expect(entry).toHaveProperty('metrics');
      expect(entry).toHaveProperty('language', 'javascript');
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
      expect(entry.metrics).toHaveProperty('linesOfCode', 1);
      expect(entry.metrics).toHaveProperty('maintainability', 100);
      expect(entry).toHaveProperty('createdAt');
    });
  });
});
