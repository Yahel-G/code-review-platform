const { Server } = require('socket.io');
const logger = require('./utils/logger');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO connection handler
  io.on('connection', (socket) => {
    const clientId = socket.id;
    logger.info(`Client connected: ${clientId}`);

    // Join a code review room
    socket.on('joinReview', (reviewId) => {
      socket.join(`review:${reviewId}`);
      logger.info(`Client ${clientId} joined review ${reviewId}`);
    });

    // Leave a code review room
    socket.on('leaveReview', (reviewId) => {
      socket.leave(`review:${reviewId}`);
      logger.info(`Client ${clientId} left review ${reviewId}`);
    });

    // Handle real-time comments
    socket.on('newComment', (data) => {
      const { reviewId, comment } = data;
      io.to(`review:${reviewId}`).emit('commentAdded', {
        ...comment,
        timestamp: new Date(),
      });
      logger.info(`New comment in review ${reviewId} by ${comment.author}`);
    });

    // Handle real-time cursor position
    socket.on('cursorMove', (data) => {
      const { reviewId, userId, position } = data;
      socket.to(`review:${reviewId}`).emit('userCursorMove', {
        userId,
        position,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${clientId}`);
    });
  });

  return io;
};

// Helper function to emit events to a specific review room
const emitToReview = (reviewId, event, data) => {
  if (io) {
    io.to(`review:${reviewId}`).emit(event, data);
  }
};

// Helper function to emit events to all connected clients
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  emitToReview,
  emitToAll,
  getIO: () => io,
};
