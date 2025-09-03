/**
 * Centralized logging utility with structured logging support
 */

import { EnvConfig } from '../config/app-config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  format: 'json' | 'pretty';
}

class LoggerService {
  private config: LoggerConfig;
  
  constructor() {
    this.config = {
      level: EnvConfig.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableFile: false, // Could be enabled for production
      enableRemote: false, // Could be enabled for production monitoring
      format: EnvConfig.isDevelopment ? 'pretty' : 'json',
    };
  }
  
  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    return entry;
  }
  
  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }
    
    // Pretty format for development
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    
    let output = `[${timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return output;
  }
  
  /**
   * Output log entry to configured destinations
   */
  private output(entry: LogEntry) {
    if (entry.level > this.config.level) {
      return; // Skip if below configured level
    }
    
    const formatted = this.formatLogEntry(entry);
    
    if (this.config.enableConsole) {
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
      }
    }
    
    // TODO: Add file logging if needed
    if (this.config.enableFile) {
      // Implementation for file logging
    }
    
    // TODO: Add remote logging if needed
    if (this.config.enableRemote) {
      // Implementation for remote logging (e.g., to monitoring service)
    }
  }
  
  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.ERROR, message, error, context);
    this.output(entry);
  }
  
  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.WARN, message, undefined, context);
    this.output(entry);
  }
  
  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.INFO, message, undefined, context);
    this.output(entry);
  }
  
  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, undefined, context);
    this.output(entry);
  }
  
  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>) {
    return {
      error: (message: string, error?: Error, additionalContext?: Record<string, any>) =>
        this.error(message, error, { ...context, ...additionalContext }),
      warn: (message: string, additionalContext?: Record<string, any>) =>
        this.warn(message, { ...context, ...additionalContext }),
      info: (message: string, additionalContext?: Record<string, any>) =>
        this.info(message, { ...context, ...additionalContext }),
      debug: (message: string, additionalContext?: Record<string, any>) =>
        this.debug(message, { ...context, ...additionalContext }),
    };
  }
  
  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: Record<string, any>) {
    this.info(`Performance: ${operation}`, {
      duration,
      operation,
      ...context,
    });
  }
  
  /**
   * Log API request/response
   */
  apiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, any>
  ) {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    
    const entry = this.createLogEntry(level, message, undefined, {
      method,
      url,
      statusCode,
      duration,
      ...context,
    });
    
    this.output(entry);
  }
  
  /**
   * Log database operations
   */
  database(operation: string, table: string, duration?: number, context?: Record<string, any>) {
    this.debug(`Database: ${operation} on ${table}`, {
      operation,
      table,
      duration,
      ...context,
    });
  }
  
  /**
   * Log authentication events
   */
  auth(event: string, userId?: string, context?: Record<string, any>) {
    this.info(`Auth: ${event}`, {
      event,
      userId,
      ...context,
    });
  }
  
  /**
   * Log security events
   */
  security(event: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>) {
    const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    const message = `Security: ${event} (${severity})`;
    
    const entry = this.createLogEntry(level, message, undefined, {
      event,
      severity,
      ...context,
    });
    
    this.output(entry);
  }
}

// Export singleton instance
export const Logger = new LoggerService();

/**
 * Performance measurement decorator
 */
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        Logger.performance(operation, duration, {
          method: propertyName,
          args: args.length,
        });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        Logger.error(`Performance: ${operation} failed`, error as Error, {
          method: propertyName,
          duration,
        });
        throw error;
      }
    };
  };
}

/**
 * Request logging middleware helper
 */
export function createRequestLogger(requestId?: string) {
  return Logger.child({ requestId });
}

/**
 * User context logger helper
 */
export function createUserLogger(userId: string, requestId?: string) {
  return Logger.child({ userId, requestId });
}
