// Tests for socket.js

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation((server, opts) => ({
    server,
    opts,
    listeners: {},
    on(event, cb) { this.listeners[event] = cb; },
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    emit: jest.fn(),
  })),
}));

jest.mock('../utils/logger', () => ({ info: jest.fn() }));

const { Server } = require('socket.io');
const logger = require('../utils/logger');
const { initializeSocket, emitToReview, emitToAll, getIO } = require('../socket');

describe('socket module', () => {
  let fakeServer, io;

  beforeEach(() => {
    fakeServer = {};
    jest.clearAllMocks();
    process.env.NODE_ENV_ORIG = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    delete process.env.CLIENT_URL;
    io = initializeSocket(fakeServer);
  });

  afterEach(() => {
    process.env.NODE_ENV = process.env.NODE_ENV_ORIG;
  });

  it('initializes Server with development origin and transports', () => {
    expect(Server).toHaveBeenCalledWith(fakeServer, expect.objectContaining({
      cors: expect.objectContaining({ origin: 'http://localhost:3000' }),
      transports: ['websocket', 'polling'],
    }));
  });

  it('initializes Server with production origin from CLIENT_URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_URL = 'https://prod.app';
    const ioProd = initializeSocket(fakeServer);
    expect(Server).toHaveBeenCalledWith(fakeServer, expect.objectContaining({
      cors: expect.objectContaining({ origin: 'https://prod.app' }),
    }));
  });

  it('emitToReview calls io.to().emit with correct arguments', () => {
    const reviewId = 'rev123';
    const event = 'update';
    const data = { foo: 'bar' };
    emitToReview(reviewId, event, data);
    const emitted = io.to.mock.results[0].value;
    expect(io.to).toHaveBeenCalledWith(`review:${reviewId}`);
    expect(emitted.emit).toHaveBeenCalledWith(event, data);
  });

  it('emitToAll calls io.emit with correct arguments', () => {
    const event = 'broadcast';
    const data = { baz: 'qux' };
    emitToAll(event, data);
    expect(io.emit).toHaveBeenCalledWith(event, data);
  });

  it('getIO returns the io instance', () => {
    expect(getIO()).toBe(io);
  });

  it('handles socket events: joinReview, leaveReview, newComment, cursorMove, disconnect', () => {
    const mockSocket = {
      id: 'sock1',
      listeners: {},
      join: jest.fn(),
      leave: jest.fn(),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
      on(event, cb) { this.listeners[event] = cb; }
    };
    // Simulate new connection
    const connectionCb = io.listeners['connection'];
    connectionCb(mockSocket);
    // joinReview
    mockSocket.listeners.joinReview('rev1');
    expect(mockSocket.join).toHaveBeenCalledWith('review:rev1');
    expect(logger.info).toHaveBeenCalledWith('Client sock1 joined review rev1');
    // leaveReview
    mockSocket.listeners.leaveReview('rev1');
    expect(mockSocket.leave).toHaveBeenCalledWith('review:rev1');
    expect(logger.info).toHaveBeenCalledWith('Client sock1 left review rev1');
    // newComment
    mockSocket.listeners.newComment({ reviewId: 'rev2', comment: { author: 'userX', foo: 'bar' } });
    expect(io.to).toHaveBeenCalledWith('review:rev2');
    expect(io.to.mock.results.find(r => r.value.emit).value.emit)
      .toHaveBeenCalledWith('commentAdded', expect.objectContaining({ author: 'userX', foo: 'bar', timestamp: expect.any(Date) }));
    // cursorMove
    mockSocket.listeners.cursorMove({ reviewId: 'rev3', userId: 'u2', position: { x: 5 } });
    expect(mockSocket.to).toHaveBeenCalledWith('review:rev3');
    expect(mockSocket.to.mock.results[0].value.emit)
      .toHaveBeenCalledWith('userCursorMove', { userId: 'u2', position: { x: 5 } });
    // disconnect
    mockSocket.listeners.disconnect();
    expect(logger.info).toHaveBeenCalledWith('Client disconnected: sock1');
  });
});
