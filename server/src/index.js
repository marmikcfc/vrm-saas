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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ 
    message: 'VRM API Server is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      agents: '/api/v1/agents',
      calls: '/api/v1/calls',
      knowledgeBases: '/api/v1/knowledge-bases',
      mcps: '/api/v1/mcps',
      metrics: '/api/v1/metrics',
      apiKeys: '/api/v1/api-keys'
    }
  });
});

// Mount API routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/calls', callsRoutes);
app.use('/api/v1/knowledge-bases', knowledgeBasesRoutes);
app.use('/api/v1/mcps', mcpsRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/api-keys', apiKeysRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
});