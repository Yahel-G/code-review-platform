const { submitFeedback } = require('../controllers/feedback.controller');

jest.mock('../services/aiAnalysis.service', () => ({
  submitAISuggestionFeedback: jest.fn().mockResolvedValue(true)
}));
const { submitAISuggestionFeedback } = require('../services/aiAnalysis.service');

describe('Feedback Controller', () => {
  const mockReq = (body = {}) => ({ body, user: { id: 'user1' } });
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('validates required fields', async () => {
    const req = mockReq({ language: 'javascript' }); // missing code
    const res = mockRes();
    await submitFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'code and language are required' });
  });

  it('records feedback and returns 200', async () => {
    const req = mockReq({ code: 'console.log(1);', language: 'javascript', rating: 4, feedback: 'Helpful!' });
    const res = mockRes();
    await submitFeedback(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Feedback recorded' });
    expect(submitAISuggestionFeedback).toHaveBeenCalledTimes(1);
    // Ensure hash and fields included
    const callArg = submitAISuggestionFeedback.mock.calls[0][0];
    expect(callArg).toHaveProperty('codeHash');
    expect(callArg).toMatchObject({ userId: 'user1', language: 'javascript', rating: 4, feedback: 'Helpful!' });
  });
});
