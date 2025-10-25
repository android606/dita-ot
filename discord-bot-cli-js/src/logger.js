/**
 * Logging configuration for Discord Bot CLI
 */

const winston = require('winston');
const path = require('path');

class Logger {
  constructor(config) {
    this.config = config;
    this.logger = this.createLogger();
  }

  createLogger() {
    const transports = [];

    // Console transport
    transports.push(new winston.transports.Console({
      level: this.config.logging.level,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    }));

    // File transport if configured
    if (this.config.logging.file) {
      transports.push(new winston.transports.File({
        filename: this.config.logging.file,
        level: this.config.logging.level,
        maxsize: this.config.logging.maxFileSize,
        maxFiles: this.config.logging.backupCount,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    }

    return winston.createLogger({
      level: this.config.logging.level,
      transports,
      exitOnError: false
    });
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }
}

module.exports = Logger;