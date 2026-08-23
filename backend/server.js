const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const http = require('http');

const config = require('./config');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { initializeSocket } = require('./services/socketService');

// Create Express app
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// MongoDB query sanitization
app.use(mongoSanitize());

// Compression
app.use(compression());

// Request logging (development only)
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Mount API routes
app.use('/api', routes);

// Serve static files for reports (generated Excel files)
app.use('/reports', express.static('reports'));

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Socket.IO
    initializeSocket(server, app);

    // Start listening
    server.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║          AttendSync API Server                 ║
║────────────────────────────────────────────────║
║  Environment : ${config.env.padEnd(30)}║
║  Port        : ${String(config.port).padEnd(30)}║
║  Frontend    : ${config.frontendUrl.padEnd(30)}║
║  Socket.IO   : ${'Enabled'.padEnd(30)}║
╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export for external use
module.exports = { app, server };
