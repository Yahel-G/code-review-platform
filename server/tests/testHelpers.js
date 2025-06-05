process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongoServer;

// Test user credentials for authentication
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'Test123!'
};

// Initialize test database connection
const setupTestDB = async () => {
  // Only set up the in-memory server if not already running
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
    const uri = mongoServer.getUri();
    
    // Set environment variables
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'testsecret';
    process.env.JWT_REFRESH_SECRET = 'testrefresh';
    process.env.JWT_EXPIRE = '1h';
    
    // Connect to the in-memory database
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } else if (mongoose.connection.readyState === 0) { // 0 = disconnected
    // If mongoServer exists but mongoose is disconnected, reconnect
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  
  return { mongoServer, mongoose };
};

// Clear all test data after each test
const clearTestDB = async () => {
  if (mongoose.connection.readyState === 1) { // 1 = connected
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (error) {
        console.error(`Error clearing collection ${key}:`, error);
      }
    }
  }
};

// Close the database connection and stop the in-memory server
const closeTestDB = async () => {
  if (mongoServer) {
    try {
      // Ensure Mongoose is disconnected before stopping the server
      if (mongoose.connection.readyState !== 0) { // 0 = disconnected
        await mongoose.disconnect();
      }
      // Ensure mongoServer.stop is called and awaited
      await mongoServer.stop({ doCleanup: true, force: false }); // Added options for clarity/robustness
    } catch (error) {
      console.error('Error closing test database:', error);
    } finally {
      mongoServer = null;
    }
  }
};

// Get authentication token for test user
const getAuthToken = async (app) => {
  // Register test user if not exists
  try {
    await request(app)
      .post('/api/auth/register')
      .send(testUser);
  } catch (error) {
    // User might already exist, which is fine
    if (error.message.includes('duplicate key error')) {
      console.log('Test user already exists, continuing...');
    } else {
      console.error('Error registering test user:', error);
      throw error;
    }
  }
  
  // Login to get token
  try {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
      
    // Check the actual response structure
    console.log('Login response:', JSON.stringify(loginRes.body, null, 2));
    
    // Try to get the token from different possible response structures
    const token = loginRes.body?.token || 
                 loginRes.body?.data?.token ||
                 loginRes.body?.tokens?.access?.token;
    
    if (!token) {
      throw new Error('Could not find token in login response');
    }
    
    return token;
  } catch (error) {
    console.error('Error logging in test user:', error);
    console.error('Login response body:', error.response?.body);
    throw error;
  }
};

module.exports = {
  testUser,
  setupTestDB,
  clearTestDB,
  closeTestDB,
  getAuthToken
};
