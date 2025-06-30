import { createModuleLogger } from '../services/logging/LoggerFactory.js';

const logger = createModuleLogger('error-handler');

export const errorHandler = (err, req, res, next) => {
  // Create error logger with request context
  const errorLogger = logger.child({
    correlationId: req.correlationId,
    requestId: req.headers['x-request-id'],
    userId: req.user?.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection?.remoteAddress
  });

  // Handle Supabase errors
  if (err.code && err.message) {
    // PostgreSQL/Supabase specific errors
    switch (err.code) {
      case '23505': // Unique violation
        errorLogger.warn('Database unique constraint violation', {
          errorCode: err.code,
          constraint: err.constraint,
          detail: err.detail
        });
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'This resource already exists'
        });
      case '23503': // Foreign key violation
        errorLogger.warn('Database foreign key constraint violation', {
          errorCode: err.code,
          constraint: err.constraint,
          detail: err.detail
        });
        return res.status(400).json({
          error: 'Invalid reference',
          message: 'Referenced resource does not exist'
        });
      case '42P01': // Table not found
        errorLogger.error('Database table not found', {
          errorCode: err.code,
          relation: err.relation
        });
        return res.status(500).json({
          error: 'Database error',
          message: 'Database configuration issue'
        });
      case 'PGRST116': // PostgREST not found
        errorLogger.debug('Resource not found', {
          errorCode: err.code
        });
        return res.status(404).json({
          error: 'Not found',
          message: 'Resource not found'
        });
      default:
        errorLogger.error('Database error', {
          errorCode: err.code,
          hint: err.hint,
          detail: err.detail
        }, err);
        return res.status(500).json({
          error: 'Database error',
          message: process.env.NODE_ENV === 'production' ? 'Database operation failed' : err.message
        });
    }
  }

  // Handle validation errors
  if (err.type === 'ValidationError' || err.name === 'ValidationError') {
    errorLogger.warn('Validation error', {
      validationErrors: err.details || err.errors
    });
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
      details: err.details || err.errors
    });
  }

  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    errorLogger.warn('File size limit exceeded', {
      limit: err.limit,
      field: err.field
    });
    return res.status(400).json({
      error: 'File too large',
      message: 'File size exceeds the maximum allowed limit'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    errorLogger.warn('Unexpected file upload', {
      field: err.field
    });
    return res.status(400).json({
      error: 'Invalid file',
      message: 'Unexpected file upload'
    });
  }

  // Handle authentication errors
  if (err.status === 401 || err.message === 'Unauthorized' || err.name === 'UnauthorizedError') {
    errorLogger.warn('Authentication failed', {
      authError: err.message
    });
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  // Handle forbidden errors
  if (err.status === 403 || err.message === 'Forbidden') {
    errorLogger.warn('Access forbidden', {
      resource: req.originalUrl
    });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  }

  // Handle not found errors
  if (err.status === 404) {
    errorLogger.debug('Resource not found', {
      resource: req.originalUrl
    });
    return res.status(404).json({
      error: 'Not found',
      message: err.message || 'Resource not found'
    });
  }

  // Handle rate limiting errors
  if (err.status === 429) {
    errorLogger.warn('Rate limit exceeded', {
      limit: err.limit,
      resetTime: err.resetTime
    });
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }

  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed' || err.name === 'SyntaxError') {
    errorLogger.warn('JSON parsing error', {
      body: err.body?.substring(0, 100) // Log first 100 chars of invalid JSON
    });
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // Handle OpenAPI/MCP generator errors
  if (err.message?.includes('OpenAPI') || err.message?.includes('specification')) {
    errorLogger.warn('OpenAPI processing error', {
      processingError: err.message
    });
    return res.status(400).json({
      error: 'OpenAPI processing failed',
      message: err.message
    });
  }

  // Default error response - log as error since it's unexpected
  errorLogger.error('Unhandled error', {
    errorName: err.name,
    errorMessage: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
  }, err);

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};