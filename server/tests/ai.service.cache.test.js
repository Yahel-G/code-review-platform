/*
 * Tests advanced behaviours of aiAnalysis.service: caching & rate limiting integration.
 */

const crypto = require('crypto');

// --- Mocks must be set up before any non-built-in imports ---
// Mock the node-cache module
const mockNodeCache = {
  get: jest.fn(),
  set: jest.fn(),
  flushAll: jest.fn()
};

// Mock the Bottleneck module
const mockBottleneck = {
  schedule: jest.fn((fn) => fn())
};

// Mock the OpenAI client
const mockCreateChatCompletion = jest.fn();
const createMockAIResponse = (content) => ({
  data: {
    choices: [
      { message: { content } }
    ]
  }
});

jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => mockNodeCache);
});
jest.mock('bottleneck', () => {
  return jest.fn().mockImplementation(() => mockBottleneck);
});
jest.mock('openai', () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn().mockImplementation(() => ({
    createChatCompletion: mockCreateChatCompletion
  }))
}));

const code1 = 'const x = 1;';
const code2 = 'const y = 2;';
const language = 'javascript';
const getCacheKey = (code, lang) => `${lang}:${crypto.createHash('sha256').update(code).digest('hex')}`;

let getCodeSuggestions;

describe('aiAnalysis.service – caching & rate limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    // Bypass the test-only suggestion shortcut
    process.env.DISABLE_TEST_SUGGESTION = 'true';
    jest.resetModules();
    // Re-import the service
    getCodeSuggestions = require('../services/aiAnalysis.service').getCodeSuggestions;
  });
  const code1 = 'const x = 1;';
  const code2 = 'const y = 2;';
  const language = 'javascript';
  
  // Helper to generate the expected cache key
  const getCacheKey = (code, lang) => 
    `${lang}:${crypto.createHash('sha256').update(code).digest('hex')}`;

  it('caches identical requests and hits OpenAI only once', async () => {
    const cacheKey = getCacheKey(code1, language);
    const mockSuggestion = 'Unique suggestion for this test';
    
    // First call - cache miss
    mockNodeCache.get.mockReturnValueOnce(undefined);
    mockCreateChatCompletion.mockReset(); // Ensure no old resolves
    mockCreateChatCompletion.mockResolvedValueOnce(createMockAIResponse(mockSuggestion));
    
    const firstResult = await getCodeSuggestions(code1, language);
    
    // Verify cache was checked and set
    expect(mockNodeCache.get).toHaveBeenCalledWith(cacheKey);
    expect(mockNodeCache.set).toHaveBeenCalledWith(
      cacheKey,
      mockSuggestion
    );
    
    // Second call - cache hit
    const cachedSuggestion = 'Cached suggestion';
    mockNodeCache.get.mockReturnValueOnce(cachedSuggestion);
    const secondResult = await getCodeSuggestions(code1, language);
    
    // Verify results
    expect(firstResult).toBe(mockSuggestion);
    expect(secondResult).toBe(cachedSuggestion);
    
    // OpenAI should be called only once
    expect(mockCreateChatCompletion).toHaveBeenCalledTimes(1);
    
    // Verify rate limiting was used
    expect(mockBottleneck.schedule).toHaveBeenCalledTimes(1);
  });

  it('makes separate OpenAI calls for different code', async () => {
    const cacheKey1 = getCacheKey(code1, language);
    const cacheKey2 = getCacheKey(code2, language);
    const mockSuggestion1 = 'Unique suggestion 1';
    const mockSuggestion2 = 'Unique suggestion 2';
    
    // First code - cache miss
    mockNodeCache.get.mockImplementation(key => 
      key === cacheKey1 ? undefined : null
    );
    
    // Second code - cache miss
    mockNodeCache.get.mockImplementationOnce(key => 
      key === cacheKey2 ? undefined : null
    );
    
    // Mock different responses for each call
    mockCreateChatCompletion.mockReset();
    mockCreateChatCompletion
      .mockResolvedValueOnce(createMockAIResponse(mockSuggestion1))
      .mockResolvedValueOnce(createMockAIResponse(mockSuggestion2));
    
    // Make the calls
    const result1 = await getCodeSuggestions(code1, language);
    const result2 = await getCodeSuggestions(code2, language);
    
    // Verify results
    expect(result1).toBe(mockSuggestion1);
    expect(result2).toBe(mockSuggestion2);
    
    // Should make two separate API calls
    expect(mockCreateChatCompletion).toHaveBeenCalledTimes(2);
    
    // Verify cache was checked for both
    expect(mockNodeCache.get).toHaveBeenNthCalledWith(1, cacheKey1);
    expect(mockNodeCache.get).toHaveBeenNthCalledWith(2, cacheKey2);
  });
});
