process.env.NODE_ENV = 'test';
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
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

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      // Create user directly in database to ensure it exists
      const user = new User({
        username: 'edward',
        email: 'ed@example.com',
        password: 'edwardpass123'
      });
      await user.save();

      // Login to get token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ed@example.com',
          password: 'edwardpass123'
        });
      
      token = loginRes.body.token;
      if (!token) {
        throw new Error('Failed to obtain token during login');
      }
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('returns current user', async () => {
      if (!token) {
        throw new Error('No token available for test');
      }
      
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      console.log('Response:', JSON.stringify(res.body, null, 2)); // Debug log
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user).toHaveProperty('email', 'ed@example.com');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('refreshToken');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // First create the user
      const user = new User({
        username: 'franklin',
        email: 'frank@example.com',
        password: 'franklinpass123'
      });
      await user.save();

      // Make sure user ID is a string
      const userId = user._id.toString();
      
      // Generate refresh token with the same secret used by the auth controller
      const testRefreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      console.log('Generated refresh token for user:', {
        userId: userId,
        token: testRefreshToken
      });

      // Update user with refresh token using findByIdAndUpdate to bypass any middleware
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { refreshToken: testRefreshToken } },
        { new: true, select: '+refreshToken' }
      );
      
      console.log('Updated user with refresh token:', {
        userId: updatedUser._id,
        hasRefreshToken: !!updatedUser.refreshToken,
        tokenMatch: updatedUser.refreshToken === testRefreshToken
      });

      // Set the refresh token for the test with proper cookie format
      refreshToken = `refreshToken=${testRefreshToken}; Path=/;`;
      
      if (!refreshToken) {
        throw new Error('Failed to obtain refresh token for testing');
      }
    });

    it('rejects when no cookie', async () => {
      const res = await request(app).post('/api/auth/refresh-token');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('No refresh token provided');
    });

    it('returns new token when cookie is valid', async () => {
      const tokenValue = refreshToken.split('=')[1].split(';')[0];
      console.log('Sending refresh token in cookie:', tokenValue);
      
      try {
        // First verify the token directly to ensure it's valid
        const decoded = jwt.verify(tokenValue, process.env.JWT_REFRESH_SECRET);
        console.log('Decoded token:', decoded);
        
        // Make sure the token is in the database with proper selection
        const user = await User.findOne({ refreshToken: tokenValue }).select('+refreshToken');
        console.log('User from DB:', user ? {
          id: user._id,
          hasToken: !!user.refreshToken,
          tokenMatch: user.refreshToken === tokenValue
        } : 'Not found');
        
        if (!user) {
          console.error('No user found with the given refresh token');
          const allUsers = await User.find({}).select('_id refreshToken');
          console.log('All users in DB:', allUsers);
        }
        
        const res = await request(app)
          .post('/api/auth/refresh-token')
          .set('Cookie', refreshToken) // Send as single string, not array
          .expect('Content-Type', /json/);
        
        console.log('Refresh token response:', {
          status: res.status,
          body: res.body,
          headers: res.headers,
          request: {
            method: res.req?.method,
            path: res.req?.path,
            headers: res.req?._headers
          }
        });
        
        if (res.status !== 200) {
          console.error('Refresh token error:', res.body);
          console.error('Environment JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'Set' : 'Not set');
        }
        
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.token).toBeDefined();
      } catch (error) {
        console.error('Test error:', {
          message: error.message,
          stack: error.stack,
          jwtError: error.name === 'JsonWebTokenError' ? error.message : undefined
        });
        throw error;
      }
    });

    it('rejects invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalidtoken');
      
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'george',
          email: 'george@example.com',
          password: 'georgepw'
        });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'george@example.com',
          password: 'georgepw'
        });
      token = loginRes.body.token;
    });

    it('rejects unauthenticated', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('logs out user and returns success', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Successfully logged out');
    });
  });
});