const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Socket.IO Service — Manages real-time communication.
 */

/**
 * Initialize Socket.IO on the HTTP server.
 *
 * @param {Object} server - HTTP server instance
 * @param {Object} app - Express app instance
 * @returns {Object} Socket.IO instance
 */
const initializeSocket = (server, app) => {
  const { Server } = require('socket.io');

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(null, true),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Store io instance on app for use in controllers
  app.set('io', io);

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-specific room
    socket.join(`role:${socket.userRole}`);

    // Teacher joins session room
    socket.on('session:join', (sessionId) => {
      socket.join(`session:${sessionId}`);
      console.log(`📡 User ${socket.userId} joined session room: ${sessionId}`);
    });

    // Teacher leaves session room
    socket.on('session:leave', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      console.log(`📡 User ${socket.userId} left session room: ${sessionId}`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.userId} (${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.userId}:`, error.message);
    });
  });

  console.log('✅ Socket.IO initialized');

  return io;
};

module.exports = { initializeSocket };
