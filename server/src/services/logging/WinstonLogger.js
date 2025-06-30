/**
 * Winston Logger Implementation
 * 
 * Following the Single Responsibility Principle (SRP):
 * - Responsible only for logging using Winston
 * - Implements the ILogger interface (Liskov Substitution Principle)
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ILogger } from './ILogger.js';

export class WinstonLogger extends ILogger {
  constructor(config = {}) {
    super();
    this.config = {
      level: config.level || 'info',
      silent: config.silent || false,
      service: config.service || 'vrm-api',
      ...config
    };

    this.logger = this.createWinstonLogger();
  }

  /**
   * Create the Winston logger instance with transports and formatting
   */
  createWinstonLogger() {
    const transports = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production' || this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
            })
          )
        })
      );
    }

    // File transport for all environments
    if (this.config.enableFileLogging !== false) {
      // Daily rotate file for general logs
      transports.push(
        new DailyRotateFile({
          filename: this.config.logDir ? `${this.config.logDir}/app-%DATE%.log` : 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );

      // Separate file for errors
      transports.push(
        new DailyRotateFile({
          filename: this.config.logDir ? `${this.config.logDir}/error-%DATE%.log` : 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      silent: this.config.silent,
      defaultMeta: {
        service: this.config.service,
        environment: process.env.NODE_ENV || 'development'
      },
      transports
    });
  }

  /**
   * Log an error message
   */
  error(message, meta = {}, error = null) {
    const logData = {
      ...meta,
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      })
    };

    this.logger.error(message, logData);
  }

  /**
   * Log a warning message
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log an info message
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log a debug message
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log a verbose message
   */
  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  /**
   * Create a child logger with additional context
   */
  child(defaultMeta = {}) {
    const childConfig = {
      ...this.config,
      defaultMeta: {
        ...this.config.defaultMeta,
        ...defaultMeta
      }
    };

    const childLogger = new WinstonLogger(childConfig);
    
    // Add the default metadata to the underlying Winston logger
    childLogger.logger.defaultMeta = {
      ...childLogger.logger.defaultMeta,
      ...defaultMeta
    };

    return childLogger;
  }

  /**
   * Set the logger level
   */
  setLevel(level) {
    this.logger.level = level;
  }

  /**
   * Get the underlying Winston logger (for advanced usage)
   */
  getWinstonLogger() {
    return this.logger;
  }
} 