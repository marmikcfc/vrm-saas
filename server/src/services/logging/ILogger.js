/**
 * Abstract Logger Interface
 * 
 * Following the Dependency Inversion Principle (DIP):
 * - High-level modules depend on abstractions, not concretions
 * - Allows for easy substitution of logger implementations
 */

export const LogLevel = {
  ERROR: 'error',
  WARN: 'warn', 
  INFO: 'info',
  DEBUG: 'debug',
  VERBOSE: 'verbose'
};

/**
 * Logger interface defining the contract for all logger implementations
 * Following Interface Segregation Principle (ISP) - focused interface
 */
export class ILogger {
  /**
   * Log an error message
   * @param {string} message - The error message
   * @param {Object} meta - Additional metadata
   * @param {Error} error - The error object
   */
  error(message, meta = {}, error = null) {
    throw new Error('Method "error" must be implemented');
  }

  /**
   * Log a warning message
   * @param {string} message - The warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    throw new Error('Method "warn" must be implemented');
  }

  /**
   * Log an info message
   * @param {string} message - The info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    throw new Error('Method "info" must be implemented');
  }

  /**
   * Log a debug message
   * @param {string} message - The debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    throw new Error('Method "debug" must be implemented');
  }

  /**
   * Log a verbose message
   * @param {string} message - The verbose message
   * @param {Object} meta - Additional metadata
   */
  verbose(message, meta = {}) {
    throw new Error('Method "verbose" must be implemented');
  }

  /**
   * Create a child logger with additional context
   * @param {Object} defaultMeta - Default metadata for all logs from this child
   * @returns {ILogger} - A new logger instance with default metadata
   */
  child(defaultMeta = {}) {
    throw new Error('Method "child" must be implemented');
  }

  /**
   * Set the logger level
   * @param {string} level - The log level
   */
  setLevel(level) {
    throw new Error('Method "setLevel" must be implemented');
  }
} 