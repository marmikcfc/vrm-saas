# VRM API Server Logging System

## Overview

The VRM API Server implements a comprehensive, modular logging system following SOLID principles. The system provides structured logging with request tracking, performance monitoring, and configurable output formats.

## Architecture

### SOLID Principles Implementation

1. **Single Responsibility Principle (SRP)**
   - `ILogger`: Defines the logging contract
   - `WinstonLogger`: Implements Winston-specific logging
   - `LoggerFactory`: Creates logger instances
   - Logging middleware: Handles HTTP request/response logging

2. **Open/Closed Principle (OCP)**
   - New logger implementations can be added without modifying existing code
   - Logger factory supports multiple logger types

3. **Liskov Substitution Principle (LSP)**
   - All logger implementations are interchangeable through the `ILogger` interface

4. **Interface Segregation Principle (ISP)**
   - `ILogger` interface is focused and minimal
   - Clients only depend on methods they use

5. **Dependency Inversion Principle (DIP)**
   - High-level modules depend on the `ILogger` abstraction
   - Concrete implementations are injected via factory

## Components

### Core Logging Services

```
src/services/logging/
├── ILogger.js          # Abstract logger interface
├── WinstonLogger.js    # Winston implementation
└── LoggerFactory.js    # Factory for creating loggers
```

### Middleware

```
src/middleware/
├── logging.js          # Request/response logging middleware
└── errorHandler.js     # Enhanced error handler with logging
```

## Configuration

### Environment Variables

```bash
# Log level: error, warn, info, debug, verbose
LOG_LEVEL=info

# Enable/disable console logging (default: true in development)
LOG_CONSOLE=true

# Enable/disable file logging (default: true)
LOG_FILE=true

# Directory for log files (default: logs)
LOG_DIR=logs

# Silent mode - disable all logging (default: false)
LOG_SILENT=false

# Request logging options
LOG_REQUEST_BODY=true
LOG_REQUEST_HEADERS=true
LOG_MAX_BODY_LENGTH=1000

# Performance monitoring
SLOW_REQUEST_THRESHOLD=1000
```

## Usage Examples

### Basic Logging in Routes

```javascript
import { createModuleLogger } from '../services/logging/LoggerFactory.js';

const logger = createModuleLogger('mcps');

router.get('/', authenticateToken, async (req, res, next) => {
  const requestLogger = logger.child({ 
    operation: 'getMCPs',
    userId: req.user.id,
    correlationId: req.correlationId 
  });

  try {
    requestLogger.info('Fetching MCP servers for user');
    
    // ... business logic ...
    
    requestLogger.info('Successfully fetched MCP servers', { 
      count: mcps?.length || 0 
    });
    
    res.json(mcps);
  } catch (error) {
    requestLogger.error('Failed to fetch MCP servers', {}, error);
    next(error);
  }
});
```

### Creating Child Loggers

```javascript
// Create a child logger with default context
const operationLogger = logger.child({
  operation: 'createMCP',
  userId: req.user.id
});

// All logs from this logger will include the default context
operationLogger.info('Starting MCP creation');
operationLogger.warn('Validation warning', { field: 'name' });
```

## Log Formats

### Console Output (Development)
```
2024-01-15T10:30:45.123Z [vrm-api-mcps] info: Fetching MCP servers for user {
  "operation": "getMCPs",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "correlationId": "req_abc123"
}
```

### File Output (JSON)
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "info",
  "message": "Fetching MCP servers for user",
  "service": "vrm-api-mcps",
  "module": "mcps",
  "operation": "getMCPs",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "correlationId": "req_abc123",
  "environment": "development"
}
```

## Request Tracking

### Correlation IDs
Every request gets a unique correlation ID for tracking across services.

### Request/Response Logging
All HTTP requests and responses are automatically logged with structured data including method, URL, status code, duration, and optional body/headers.

## Error Handling

### Structured Error Logging
Errors are automatically categorized and logged with relevant context:

- **Database errors**: PostgreSQL/Supabase errors
- **Validation errors**: Request validation failures  
- **Authentication errors**: Auth token issues
- **Rate limiting**: Too many requests
- **File upload errors**: Multer/upload issues
- **OpenAPI processing**: Specification parsing errors

## Performance Monitoring

### Metrics Tracked
- Request duration
- Slow request detection
- Memory usage (health endpoint)
- Process uptime

Requests exceeding the configured threshold are automatically logged as warnings.

## Best Practices

1. **Use Module Loggers**: Create module-specific loggers for better organization
2. **Add Context**: Use child loggers to add operation-specific context
3. **Log Meaningful Events**: Log start/end of operations and key business events
4. **Include Metadata**: Add relevant context like IDs, counts, and error details
5. **Use Appropriate Levels**: Choose the right log level for each message

## Log Levels

- **error**: System errors, exceptions
- **warn**: Recoverable issues, slow requests
- **info**: Normal operations, business events
- **debug**: Detailed tracing information
- **verbose**: Very detailed information

## File Management

### Log Files
- `app-YYYY-MM-DD.log`: General application logs
- `error-YYYY-MM-DD.log`: Error-only logs

### Rotation Policy
- Daily rotation with compression
- General logs: 14 days retention
- Error logs: 30 days retention
- Max file size: 20MB

## Security

- Sensitive headers are automatically redacted
- Request bodies are truncated to prevent log flooding
- Error stack traces are excluded in production
- IP addresses are logged for security monitoring 