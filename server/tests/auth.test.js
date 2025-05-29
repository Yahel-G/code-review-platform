process.env.NODE_ENV = 'test';
const request = require('supertest');
const { setupTestDB, clearTestDB, closeTestDB } = require('./testHelpers');

let app, server;

beforeAll(async () => {
  // Setup test database and get app instance
  await setupTestDB();
  
  // Import app after setting up environment variables
  const { app: _app, server: _server } = require('../server');
  app = _app;
  server = _server;
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
  
  // Close the server if it's running
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user (201) and return token + user without password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'alice',
          email: 'alice@example.com',
          password: 'password123'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toMatchObject({
        username: 'alice',
        email: 'alice@example.com'
      });
      // password & refreshToken should not come back
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.refreshToken).toBeUndefined();
    });

    it('should reject duplicate email/username (409)', async () => {
      // first registration
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bob',
          email: 'bob@example.com',
          password: 'password123'
        });
      // duplicate
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bob',
          email: 'bob@example.com',
          password: 'password123'
        });
      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already exists/);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // create a user to log in against
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'carol',
          email: 'carol@example.com',
          password: 'secretpw'
        });
    });

    it('should login successfully (200) and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'carol@example.com',
          password: 'secretpw'
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('carol@example.com');
    });

    it('should reject wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'carol@example.com',
          password: 'badpw'
        });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid email or password/);
    });

    it('should reject non-existent user (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'whatever'
        });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid email or password/);
    });
  });
});