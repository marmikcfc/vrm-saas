import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import route modules
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import callsRoutes from './routes/calls.js';
import knowledgeBasesRoutes from './routes/knowledgeBases.js';
import mcpsRoutes from './routes/mcps.js';
import metricsRoutes from './routes/metrics.js';
import apiKeysRoutes from './routes/apiKeys.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { 
  createRequestLogger, 
  createPerformanceLogger, 
  createErrorLogger 
} from './middleware/logging.js';

// Import logging system
import { createModuleLogger, defaultLogger } from './services/logging/LoggerFactory.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Create server logger
const serverLogger = createModuleLogger('server');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

// Logging middleware - must be early in the middleware stack
app.use(createRequestLogger({
  logBody: process.env.LOG_REQUEST_BODY !== 'false',
  logHeaders: process.env.LOG_REQUEST_HEADERS !== 'false',
  excludePaths: ['/health', '/favicon.ico', '/api/docs'],
  maxBodyLength: parseInt(process.env.LOG_MAX_BODY_LENGTH) || 1000
}));

// Performance monitoring middleware
app.use(createPerformanceLogger({
  slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000
}));

// Error logging middleware (before route handlers)
app.use(createErrorLogger());

// Basic health check route
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };

  serverLogger.debug('Health check requested', healthData);
  res.json(healthData);
});

// API routes
app.get('/api', (req, res) => {
  const apiInfo = {
    message: 'VRM API Server is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/v1/auth',
      agents: '/api/v1/agents',
      calls: '/api/v1/calls',
      knowledgeBases: '/api/v1/knowledge-bases',
      mcps: '/api/v1/mcps',
      metrics: '/api/v1/metrics',
      apiKeys: '/api/v1/api-keys'
    }
  };

  serverLogger.info('API info requested', {
    userAgent: req.get('User-Agent'),
    correlationId: req.correlationId
  });

  res.json(apiInfo);
});

// Mount API routes
serverLogger.info('Mounting API routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/calls', callsRoutes);
app.use('/api/v1/knowledge-bases', knowledgeBasesRoutes);
app.use('/api/v1/mcps', mcpsRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/api-keys', apiKeysRoutes);

serverLogger.info('API routes mounted successfully');

// Error handling middleware (after all routes)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  const notFoundData = {
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  // Log 404s as warnings since they might indicate client issues
  serverLogger.warn('Route not found', {
    ...notFoundData,
    userAgent: req.get('User-Agent'),
    correlationId: req.correlationId
  });

  res.status(404).json(notFoundData);
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  serverLogger.info(`Received ${signal}, starting graceful shutdown`);
  
  server.close(() => {
    serverLogger.info('HTTP server closed');
    
    // Close any database connections, cleanup resources, etc.
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    serverLogger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  serverLogger.error('Uncaught exception', {}, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  serverLogger.error('Unhandled promise rejection', {
    reason: reason?.toString(),
    promise: promise?.toString()
  });
  // Don't exit on unhandled rejections in production, just log them
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

const server = app.listen(PORT, () => {
  const startupInfo = {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    pid: process.pid
  };

  serverLogger.info('🚀 VRM API Server started successfully', startupInfo);
  
  // Log startup info to console as well for visibility
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Logging level: ${process.env.LOG_LEVEL || 'info'}`);
});