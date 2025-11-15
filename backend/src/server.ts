import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.routes.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { optionalAuthenticate, isAuthEnabled } from './middleware/auth.middleware.js';
import logger, { requestLogger } from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5001;

// Request logging middleware (before other middleware)
app.use(requestLogger);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL || '',
].filter(origin => origin.length > 0);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
  credentials: true,
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Optional authentication middleware (doesn't block if no auth configured)
app.use(optionalAuthenticate);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);

// Test endpoint (for backward compatibility)
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  const authEnabled = isAuthEnabled();

  logger.info('Server started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    authEnabled,
  });

  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat`);
  console.log(`📊 Detailed health: http://localhost:${PORT}/api/health/detailed`);
  console.log(`🤖 LLM health: http://localhost:${PORT}/api/health/llm`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);

  if (authEnabled) {
    console.log(`⚠️  Authentication is ENABLED`);
  } else {
    console.log(`⚠️  Authentication is DISABLED (set INVITE_CODES or ACCESS_PASSWORD to enable)`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
