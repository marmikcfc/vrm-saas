/**
 * Logging Middleware
 * 
 * Following the Single Responsibility Principle (SRP):
 * - Responsible only for HTTP request/response logging
 * - Uses dependency injection for logger (Dependency Inversion Principle)
 */

import { v4 as uuidv4 } from 'uuid';
import { LoggerFactory } from '../services/logging/LoggerFactory.js';

/**
 * Create request logging middleware
 * @param {Object} options - Configuration options
 * @returns {Function} - Express middleware function
 */
export function createRequestLogger(options = {}) {
  const logger = options.logger || LoggerFactory.createRequestLogger();
  
  const config = {
    logBody: options.logBody !== false, // Default to true
    logHeaders: options.logHeaders !== false, // Default to true
    logUserAgent: options.logUserAgent !== false, // Default to true
    logIP: options.logIP !== false, // Default to true
    excludePaths: options.excludePaths || ['/health', '/favicon.ico'],
    excludeHeaders: options.excludeHeaders || ['authorization', 'cookie', 'set-cookie'],
    maxBodyLength: options.maxBodyLength || 1000,
    ...options
  };

  return (req, res, next) => {
    // Generate correlation ID for request tracking
    const correlationId = req.headers['x-correlation-id'] || uuidv4();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    // Skip logging for excluded paths
    if (config.excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const startTime = Date.now();
    
    // Create request logger with correlation ID
    const requestLogger = logger.child({
      correlationId,
      requestId: uuidv4(),
      type: 'http_request'
    });

    // Log incoming request
    const requestData = {
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      query: req.query,
      ...(config.logIP && { ip: getClientIP(req) }),
      ...(config.logUserAgent && { userAgent: req.get('User-Agent') }),
      ...(config.logHeaders && { 
        headers: filterHeaders(req.headers, config.excludeHeaders) 
      }),
      ...(config.logBody && req.body && { 
        body: truncateBody(req.body, config.maxBodyLength) 
      })
    };

    requestLogger.info('Incoming request', requestData);

    // Capture original res.json and res.send to log responses
    const originalJson = res.json;
    const originalSend = res.send;
    
    let responseBody = null;

    res.json = function(data) {
      responseBody = data;
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      if (!responseBody) {
        responseBody = data;
      }
      return originalSend.call(this, data);
    };

    // Log response when request finishes
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const responseData = {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('content-length'),
        ...(config.logHeaders && {
          headers: filterHeaders(res.getHeaders(), config.excludeHeaders)
        }),
        ...(config.logBody && responseBody && {
          body: truncateBody(responseBody, config.maxBodyLength)
        })
      };

      if (res.statusCode >= 400) {
        requestLogger.warn('Request completed with error', responseData);
      } else {
        requestLogger.info('Request completed', responseData);
      }
    });

    // Log errors
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      requestLogger.error('Request failed', {
        statusCode: res.statusCode,
        duration: `${duration}ms`
      }, error);
    });

    // Add logger to request for use in route handlers
    req.logger = requestLogger;
    
    next();
  };
}

/**
 * Create performance logging middleware
 * @param {Object} options - Configuration options
 * @returns {Function} - Express middleware function
 */
export function createPerformanceLogger(options = {}) {
  const logger = options.logger || LoggerFactory.createModuleLogger('performance');
  const slowRequestThreshold = options.slowRequestThreshold || 1000; // 1 second

  return (req, res, next) => {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      const performanceData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        correlationId: req.correlationId
      };

      if (duration > slowRequestThreshold) {
        logger.warn('Slow request detected', performanceData);
      } else {
        logger.debug('Request performance', performanceData);
      }
    });

    next();
  };
}

/**
 * Create error logging middleware
 * @param {Object} options - Configuration options
 * @returns {Function} - Express error middleware function
 */
export function createErrorLogger(options = {}) {
  const logger = options.logger || LoggerFactory.createModuleLogger('errors');

  return (err, req, res, next) => {
    const errorLogger = logger.child({
      correlationId: req.correlationId,
      type: 'http_error'
    });

    const errorData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: err.status || err.statusCode || 500,
      userAgent: req.get('User-Agent'),
      ip: getClientIP(req)
    };

    errorLogger.error('Request error', errorData, err);
    
    next(err);
  };
}

/**
 * Helper function to get client IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         'unknown';
}

/**
 * Helper function to filter sensitive headers
 */
function filterHeaders(headers, excludeHeaders) {
  const filtered = { ...headers };
  
  excludeHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[REDACTED]';
    }
  });

  return filtered;
}

/**
 * Helper function to truncate request/response body
 */
function truncateBody(body, maxLength) {
  if (!body) return body;
  
  let bodyStr;
  if (typeof body === 'string') {
    bodyStr = body;
  } else {
    try {
      bodyStr = JSON.stringify(body);
    } catch (e) {
      return '[Unable to serialize body]';
    }
  }

  if (bodyStr.length > maxLength) {
    return bodyStr.substring(0, maxLength) + '... [TRUNCATED]';
  }

  return body;
} 