/**
 * Custom error classes for better error handling and debugging
 */

export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: this.stack,
    };
  }
}

// Authentication Errors
export class AuthenticationError extends BaseError {
  readonly code = 'AUTH_ERROR';
  readonly statusCode = 401;
  
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, context);
  }
}

export class UnauthorizedError extends BaseError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 403;
  
  constructor(action: string, context?: Record<string, any>) {
    super(`Unauthorized to perform action: ${action}`, context);
  }
}

export class InvalidCredentialsError extends BaseError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly statusCode = 401;
  
  constructor(message: string = 'Invalid credentials provided', context?: Record<string, any>) {
    super(message, context);
  }
}

// Resource Errors
export class NotFoundError extends BaseError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
  
  constructor(resource: string, id?: string, context?: Record<string, any>) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message, context);
  }
}

export class PollNotFoundError extends NotFoundError {
  constructor(pollId: string, context?: Record<string, any>) {
    super('Poll', pollId, context);
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor(userId: string, context?: Record<string, any>) {
    super('User', userId, context);
  }
}

// Validation Errors
export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(
    message: string,
    public readonly errors: Record<string, string[]> = {},
    context?: Record<string, any>
  ) {
    super(message, context);
  }
  
  static fromFieldErrors(errors: Record<string, string[]>) {
    const message = 'Validation failed';
    return new ValidationError(message, errors);
  }
}

export class InvalidInputError extends BaseError {
  readonly code = 'INVALID_INPUT';
  readonly statusCode = 400;
  
  constructor(field: string, value: any, reason?: string, context?: Record<string, any>) {
    const message = reason 
      ? `Invalid ${field}: ${reason}` 
      : `Invalid ${field}: ${value}`;
    super(message, { field, value, reason, ...context });
  }
}

// Business Logic Errors
export class BusinessLogicError extends BaseError {
  readonly code = 'BUSINESS_LOGIC_ERROR';
  readonly statusCode = 422;
  
  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

export class PollExpiredError extends BusinessLogicError {
  constructor(pollId: string, expirationDate: Date, context?: Record<string, any>) {
    super(`Poll ${pollId} expired on ${expirationDate.toISOString()}`, {
      pollId,
      expirationDate: expirationDate.toISOString(),
      ...context
    });
  }
}

export class PollInactiveError extends BusinessLogicError {
  constructor(pollId: string, context?: Record<string, any>) {
    super(`Poll ${pollId} is not active`, { pollId, ...context });
  }
}

export class DuplicateVoteError extends BusinessLogicError {
  constructor(pollId: string, userId: string, context?: Record<string, any>) {
    super(`User ${userId} has already voted on poll ${pollId}`, {
      pollId,
      userId,
      ...context
    });
  }
}

export class MultipleVotesNotAllowedError extends BusinessLogicError {
  constructor(pollId: string, context?: Record<string, any>) {
    super(`Poll ${pollId} does not allow multiple votes per user`, {
      pollId,
      ...context
    });
  }
}

// Database Errors
export class DatabaseError extends BaseError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;
  
  constructor(message: string, public readonly originalError?: Error, context?: Record<string, any>) {
    super(message, context);
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(originalError?: Error, context?: Record<string, any>) {
    super('Database connection failed', originalError, context);
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(query: string, originalError?: Error, context?: Record<string, any>) {
    super(`Database query failed: ${query}`, originalError, { query, ...context });
  }
}

// Rate Limiting Errors
export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly statusCode = 429;
  
  constructor(
    limit: number,
    windowMs: number,
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(`Rate limit exceeded: ${limit} requests per ${windowMs}ms`, {
      limit,
      windowMs,
      retryAfter,
      ...context
    });
  }
}

// Server Errors
export class InternalServerError extends BaseError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly statusCode = 500;
  
  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, context);
  }
}

export class ServiceUnavailableError extends BaseError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly statusCode = 503;
  
  constructor(service: string, context?: Record<string, any>) {
    super(`Service unavailable: ${service}`, { service, ...context });
  }
}

/**
 * Type guard to check if error is a custom error
 */
export function isCustomError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Type guard to check if error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isCustomError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

/**
 * Extract error code from unknown error
 */
export function getErrorCode(error: unknown): string {
  if (isCustomError(error)) {
    return error.code;
  }
  
  return 'UNKNOWN_ERROR';
}

/**
 * Extract status code from unknown error
 */
export function getErrorStatusCode(error: unknown): number {
  if (isCustomError(error)) {
    return error.statusCode;
  }
  
  return 500;
}
