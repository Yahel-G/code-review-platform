const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const { setupTestDB, clearTestDB, closeTestDB, getAuthToken } = require('./testHelpers');

jest.mock('../services/aiAnalysis.service', () => ({
  submitAISuggestionFeedback: jest.fn().mockResolvedValue(true)
}));
const { submitAISuggestionFeedback } = require('../services/aiAnalysis.service');

let app, server, token;

beforeAll(async () => {
  await setupTestDB();
  const srv = require('../server');
  app = srv.app;
  server = srv.server;
});

beforeEach(async () => {
  token = await getAuthToken(app);
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
  if (server) await new Promise((res) => server.close(res));
});

describe('Feedback Routes', () => {
  describe('POST /api/feedback', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).post('/api/feedback').send({ code: 'x', language: 'javascript' });
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('validates required body', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'javascript' });
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.message).toBe('code and language are required');
    });

    it('records feedback and delegates to service', async () => {
      const payload = {
        code: 'console.log(1);',
        language: 'javascript',
        rating: 5,
        feedback: 'Great',
      };
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe('Feedback recorded');
      expect(submitAISuggestionFeedback).toHaveBeenCalledTimes(1);
    });
  });
});
