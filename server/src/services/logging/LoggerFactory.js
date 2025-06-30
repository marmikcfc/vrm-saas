/**
 * Logger Factory
 * 
 * Following the Open/Closed Principle (OCP):
 * - Open for extension (new logger types can be added)
 * - Closed for modification (existing code doesn't change)
 * 
 * Also follows the Factory Pattern for object creation
 */

import { WinstonLogger } from './WinstonLogger.js';
import { LogLevel } from './ILogger.js';

export class LoggerFactory {
  static loggerTypes = {
    WINSTON: 'winston',
    CONSOLE: 'console' // For future console-only implementation
  };

  /**
   * Create a logger instance
   * @param {string} type - The type of logger to create
   * @param {Object} config - Configuration for the logger
   * @returns {ILogger} - Logger instance
   */
  static createLogger(type = LoggerFactory.loggerTypes.WINSTON, config = {}) {
    const loggerConfig = LoggerFactory.buildConfig(config);

    switch (type) {
      case LoggerFactory.loggerTypes.WINSTON:
        return new WinstonLogger(loggerConfig);
      
      case LoggerFactory.loggerTypes.CONSOLE:
        // Future implementation for console-only logger
        throw new Error('Console logger not yet implemented');
      
      default:
        throw new Error(`Unknown logger type: ${type}`);
    }
  }

  /**
   * Create a logger for a specific module/service
   * @param {string} module - The module name (e.g., 'mcp', 'auth', 'agents')
   * @param {Object} config - Additional configuration
   * @returns {ILogger} - Logger instance with module context
   */
  static createModuleLogger(module, config = {}) {
    const moduleConfig = {
      ...config,
      service: `vrm-api-${module}`,
      defaultMeta: {
        module,
        ...config.defaultMeta
      }
    };

    return LoggerFactory.createLogger(LoggerFactory.loggerTypes.WINSTON, moduleConfig);
  }

  /**
   * Create a request logger with correlation ID support
   * @param {Object} config - Configuration
   * @returns {ILogger} - Logger instance for requests
   */
  static createRequestLogger(config = {}) {
    const requestConfig = {
      ...config,
      service: 'vrm-api-requests',
      defaultMeta: {
        type: 'request',
        ...config.defaultMeta
      }
    };

    return LoggerFactory.createLogger(LoggerFactory.loggerTypes.WINSTON, requestConfig);
  }

  /**
   * Build configuration from environment and provided config
   * @param {Object} config - User provided configuration
   * @returns {Object} - Complete configuration
   */
  static buildConfig(config = {}) {
    return {
      level: process.env.LOG_LEVEL || config.level || LogLevel.INFO,
      enableConsole: process.env.LOG_CONSOLE !== 'false' && config.enableConsole !== false,
      enableFileLogging: process.env.LOG_FILE !== 'false' && config.enableFileLogging !== false,
      logDir: process.env.LOG_DIR || config.logDir || 'logs',
      silent: process.env.LOG_SILENT === 'true' || config.silent === true,
      ...config
    };
  }

  /**
   * Get available logger types
   * @returns {Object} - Available logger types
   */
  static getAvailableTypes() {
    return { ...LoggerFactory.loggerTypes };
  }
}

/**
 * Default logger instance for the application
 * Can be used directly or as a base for creating child loggers
 */
export const defaultLogger = LoggerFactory.createLogger();

/**
 * Convenience function to create module loggers
 * @param {string} module - Module name
 * @param {Object} config - Additional configuration
 * @returns {ILogger} - Module logger
 */
export const createModuleLogger = (module, config = {}) => {
  return LoggerFactory.createModuleLogger(module, config);
}; 