const request = require('supertest');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const { setupTestDB, clearTestDB, closeTestDB, getAuthToken, testUser } = require('./testHelpers');
const Comment = require('../models/Comment');

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

describe('Comment Routes', () => {
  describe('GET /api/comments', () => {
    it('returns 400 when reviewId missing', async () => {
      const res = await request(app).get('/api/comments');
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.message).toBe('Review ID is required');
    });

    it('returns empty array when no comments', async () => {
      const reviewId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get('/api/comments')
        .query({ reviewId: reviewId.toString() });
      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });

    it('returns comments for a given reviewId', async () => {
      const reviewId = new mongoose.Types.ObjectId();
      await Comment.create({ content: 'Great code', reviewId, user: userId });
      const res = await request(app)
        .get('/api/comments')
        .query({ reviewId: reviewId.toString() });
      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      const comment = res.body[0];
      expect(comment.content).toBe('Great code');
      expect(comment.reviewId).toBe(reviewId.toString());
      expect(comment.user).toHaveProperty('username', testUser.username);
    });
  });

  describe('POST /api/comments', () => {
    it('rejects unauthenticated', async () => {
      const res = await request(app)
        .post('/api/comments')
        .send({ content: 'x', reviewId: '123' });
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
      expect(res.body.message).toMatch(/not authorized|token/i);
    });

    it('returns 400 when missing content or reviewId', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body.message).toBe('Content and review ID are required');
    });

    it('creates comment and returns 201 with populated user', async () => {
      const reviewId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Nice work', reviewId });
      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('content', 'Nice work');
      expect(res.body).toHaveProperty('reviewId', reviewId);
      expect(res.body.user).toHaveProperty('username', testUser.username);
      const dbComment = await Comment.findById(res.body._id);
      expect(dbComment).not.toBeNull();
      expect(dbComment.content).toBe('Nice work');
    });
  });
});
