require('dotenv').config();
const dns = require('dns');

// Configure resilient DNS resolution for MongoDB Atlas SRV connection strings and force IPv4 for SMTP
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // fallback
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL || 'mongodb://localhost:27017/attendance_system',
  jwtSecret: process.env.JWT_SECRET || 'default_dev_secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  faceAuth: {
    tokenExpiry: 120, // 2 minutes in seconds
    matchThreshold: 0.6, // Euclidean distance threshold
  },
  qr: {
    rotationInterval: 10, // seconds (reduced to 10s)
    tokenExpiry: 15, // seconds
  },
  rateLimit: {
    auth: { windowMs: 15 * 60 * 1000, max: 1000 },
    api: { windowMs: 15 * 60 * 1000, max: 2000 },
    face: { windowMs: 5 * 60 * 1000, max: 500 },
  },
  notifications: {
    mode: process.env.NOTIFICATION_MODE || 'development',
    inAppEnabled: process.env.INAPP_ENABLED !== 'false',
    emailEnabled: process.env.EMAIL_ENABLED !== 'false', // Enabled by default
    whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true', // false by default (Simulation Mode)
    maxRetryAttempts: parseInt(process.env.NOTIFICATION_MAX_RETRIES, 10) || 3,
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || 'studentattend2026@gmail.com',
    password: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || 'qdjd aadb dnyr slja',
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'studentattend2026@gmail.com',
    attendanceReportEmail: process.env.ATTENDANCE_REPORT_EMAIL || 'kannansriram0910@gmail.com',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
  },
};

module.exports = config;
