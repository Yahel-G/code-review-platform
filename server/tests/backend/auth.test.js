// Run in test mode
process.env.NODE_ENV = 'test';
jest.setTimeout(30000)   // 30s max per hook
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app, server;
let mongod;

beforeAll(async () => {
  // 1. Start in-memory MongoDB & set env vars
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_REFRESH_SECRET = 'testrefresh';
  process.env.JWT_EXPIRE = '1h';

  // 2. Import app and server (no auto-listen/connect in test)
  const { app: _app, server: _server } = require('../../server');
  app = _app;
  server = _server;

  // 3. Manually connect mongoose to in-memory DB
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterEach(async () => {
  // Clean all collections between tests
  const collections = mongoose.connection.collections;
  for (const coll of Object.values(collections)) {
    await coll.deleteMany({});
  }
});

afterAll(async () => {
  // Tear down in-memory MongoDB
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
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