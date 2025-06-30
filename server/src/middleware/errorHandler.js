export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Supabase errors
  if (err.code && err.message) {
    // PostgreSQL/Supabase specific errors
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'This resource already exists'
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Invalid reference',
          message: 'Referenced resource does not exist'
        });
      case '42P01': // Table not found
        return res.status(500).json({
          error: 'Database error',
          message: 'Database configuration issue'
        });
      default:
        return res.status(500).json({
          error: 'Database error',
          message: err.message
        });
    }
  }

  // Handle validation errors
  if (err.type === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: err.message,
      details: err.details
    });
  }

  // Handle authentication errors
  if (err.status === 401 || err.message === 'Unauthorized') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  // Handle forbidden errors
  if (err.status === 403 || err.message === 'Forbidden') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  }

  // Handle not found errors
  if (err.status === 404) {
    return res.status(404).json({
      error: 'Not found',
      message: err.message || 'Resource not found'
    });
  }

  // Handle rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  });
};