const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const { setupTestDB, clearTestDB, closeTestDB, getAuthToken, testUser } = require('./testHelpers');

let app, server;
let tokenUser, tokenOther;
const otherUser = {
  username: 'otheruser',
  email: 'other@example.com',
  password: 'Other123!'
};

const reviewData = {
  title: 'Test Review',
  code: 'function test() { return "test"; }',
  language: 'javascript',
  analysis: {
    metrics: { linesOfCode: 1, complexity: 1, maintainability: 100 },
    issues: [],
    suggestions: []
  }
};

describe('Review Routes', () => {
  beforeAll(async () => {
    await setupTestDB();
    const srv = require('../server');
    app = srv.app;
    server = srv.server;
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
    if (server) {
      await new Promise(res => server.close(res));
    }
  });

  beforeEach(async () => {
    // get token for default test user
    tokenUser = await getAuthToken(app);
    // register and login other user
    await request(app)
      .post('/api/auth/register')
      .send(otherUser);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: otherUser.email, password: otherUser.password });
    tokenOther = loginRes.body.token;
  });

  describe('GET /api/reviews', () => {
    it('returns empty array when no reviews', async () => {
      const res = await request(app).get('/api/reviews');
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toEqual([]);
    });

    it('returns list of reviews', async () => {
      // create one review
      await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send(reviewData);

      const res = await request(app).get('/api/reviews');
      expect(res.status).toBe(StatusCodes.OK);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      const r = res.body[0];
      expect(r).toHaveProperty('id');
      expect(r.title).toBe(reviewData.title);
    });
  });

  describe('GET /api/reviews/:id', () => {
    it('returns 404 for non-existent review', async () => {
      const res = await request(app).get('/api/reviews/507f1f77bcf86cd799439011');
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('returns a review by id', async () => {
      const createRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send(reviewData);
      const id = createRes.body.id;

      const res = await request(app).get(`/api/reviews/${id}`);
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.id).toBe(id);
      expect(res.body.title).toBe(reviewData.title);
    });
  });

  describe('PUT /api/reviews/:id', () => {
    it('rejects without token', async () => {
      const res = await request(app).put('/api/reviews/anyid').send({ title: 'X' });
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('returns 404 for invalid id', async () => {
      const res = await request(app)
        .put('/api/reviews/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ title: 'X' });
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    it('rejects if not author', async () => {
      const createRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send(reviewData);
      const id = createRes.body.id;

      const res = await request(app)
        .put(`/api/reviews/${id}`)
        .set('Authorization', `Bearer ${tokenOther}`)
        .send({ title: 'Hacked' });
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('updates review for author', async () => {
      const createRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send(reviewData);
      const id = createRes.body.id;

      const newTitle = 'Updated Title';
      const res = await request(app)
        .put(`/api/reviews/${id}`)
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ title: newTitle });
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.title).toBe(newTitle);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('rejects without token', async () => {
      const res = await request(app).delete('/api/reviews/anyid');
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    it('returns 404 for non-existent', async () => {
      const res = await request(app)
        .delete('/api/reviews/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${tokenUser}`);
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
    });

    it('rejects if not author', async () => {
      const createRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send(reviewData);
      const id = createRes.body.id;

      const res = await request(app)
        .delete(`/api/reviews/${id}`)
        .set('Authorization', `Bearer ${tokenOther}`);
      expect(res.status).toBe(StatusCodes.FORBIDDEN);
    });

    it('deletes review for author', async () => {
      const createRes = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send(reviewData);
      const id = createRes.body.id;

      const res = await request(app)
        .delete(`/api/reviews/${id}`)
        .set('Authorization', `Bearer ${tokenUser}`);
      expect(res.status).toBe(StatusCodes.NO_CONTENT);
    });
  });
});
