const crypto = require('crypto');
const Bottleneck = require('bottleneck');
const NodeCache = require('node-cache');

// Simple in-memory cache for AI suggestions
// TTL defaults to 1h but can be tuned via AI_CACHE_TTL_SEC env var
const cache = new NodeCache({ stdTTL: parseInt(process.env.AI_CACHE_TTL_SEC || '3600', 10) });

// Rate-limit all outbound calls to the OpenAI API.
// Default: 60 requests / minute with min 250ms spacing, configurable via env vars.
const limiter = new Bottleneck({
  reservoir: parseInt(process.env.OPENAI_RESERVOIR || '60', 10), // max tokens/requests in current window
  reservoirRefreshAmount: parseInt(process.env.OPENAI_RESERVOIR || '60', 10),
  reservoirRefreshInterval: 60 * 1000, // 1 minute
  maxConcurrent: 1,
  minTime: parseInt(process.env.OPENAI_MIN_TIME_MS || '250', 10),
});

function getCacheKey(code, language) {
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  return `${language}:${hash}`;
}

async function callOpenAI(code, language) {
  const { Configuration, OpenAIApi } = require('openai');
  const config = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  const openai = new OpenAIApi(config);

  const lineCount = code.split(/\r?\n/).length;
  const prompt = [
    `Language: ${language}`,
    `Lines of code: ${lineCount}`,
    '',
    'The user submitted the following snippet for code review. Please provide concise, constructive feedback, focusing on correctness, maintainability, security, and performance. Answer in markdown bullet points.',
    '---',
    code.length > 4000 ? `${code.slice(0, 4000)}\n\n/* Snippet truncated */` : code,
  ].join('\n');

  const response = await openai.createChatCompletion({
    model: process.env.OPENAI_MODEL || 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are a senior software engineer tasked with providing high-quality code review feedback.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  return response.data.choices[0].message.content.trim();
}

async function getCodeSuggestions(code, language) {
  // Provide deterministic output in tests & offline development
  if (process.env.NODE_ENV === 'test' && !process.env.DISABLE_TEST_SUGGESTION) {
    return 'Test suggestion';
  }

  const cacheKey = getCacheKey(code, language);
  const fromCache = cache.get(cacheKey);
  if (fromCache) return fromCache;

  try {
    const suggestions = await limiter.schedule(() => callOpenAI(code, language));
    cache.set(cacheKey, suggestions);
    return suggestions;
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return `Error generating AI suggestions: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Record end-user feedback about the usefulness of AI suggestions. This is
 * currently a no-op that simply logs but can be wired to a DB later.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.codeHash
 * @param {string} params.language
 * @param {string} params.feedback Optional textual feedback
 * @param {number} params.rating 1-5 rating of usefulness
 */
async function submitAISuggestionFeedback({ userId, codeHash, language, feedback = '', rating = 0 }) {
  // Lazy-load model only when we actually store feedback (avoids circular deps in tests)
  try {
    const Feedback = require('../models/Feedback');
    await Feedback.create({ user: userId, codeHash, language, feedback, rating });
  } catch (err) {
    console.warn('Failed to save AI feedback (non-critical):', err.message);
  }
}

module.exports = { getCodeSuggestions, submitAISuggestionFeedback };

