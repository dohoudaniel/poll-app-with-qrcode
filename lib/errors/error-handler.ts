/**
 * Centralized error handling utilities
 */

import { NextResponse } from 'next/server';
import { Logger } from '../utils/logger';
import {
  BaseError,
  isCustomError,
  getErrorMessage,
  getErrorCode,
  getErrorStatusCode,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  UnauthorizedError,
  NotFoundError,
  RateLimitError,
  InternalServerError,
} from './custom-errors';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
  };
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: unknown,
  requestId?: string,
  includeStack = false
): ErrorResponse {
  const code = getErrorCode(error);
  const message = getErrorMessage(error);
  
  let details: any = undefined;
  
  if (isCustomError(error)) {
    details = {
      context: error.context,
      ...(includeStack && { stack: error.stack }),
    };
    
    // Add validation errors if present
    if (error instanceof ValidationError) {
      details.validationErrors = error.errors;
    }
  }
  
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleApiError(
  error: unknown,
  requestId?: string,
  includeStack = false
): NextResponse<ErrorResponse> {
  const statusCode = getErrorStatusCode(error);
  const errorResponse = createErrorResponse(error, requestId, includeStack);
  
  // Log the error
  Logger.error('API Error', error instanceof Error ? error : new Error(String(error)), {
    statusCode,
    requestId,
    code: errorResponse.error.code,
  });
  
  // Add retry-after header for rate limit errors
  const headers: Record<string, string> = {};
  if (error instanceof RateLimitError && error.context?.retryAfter) {
    headers['Retry-After'] = String(error.context.retryAfter);
  }
  
  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers,
  });
}

/**
 * Handle server action errors
 */
export function handleServerActionError(error: unknown): {
  success: false;
  error: string;
  code?: string;
} {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  
  // Log the error
  Logger.error('Server Action Error', error instanceof Error ? error : new Error(String(error)), {
    code,
  });
  
  return {
    success: false,
    error: message,
    code: code !== 'UNKNOWN_ERROR' ? code : undefined,
  };
}

/**
 * Async error wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse<ErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Async error wrapper for server actions
 */
export function withServerActionErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | { success: false; error: string; code?: string }> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleServerActionError(error);
    }
  };
}

/**
 * Convert Supabase error to custom error
 */
export function convertSupabaseError(error: any): BaseError {
  if (!error) {
    return new InternalServerError('Unknown database error');
  }
  
  const message = error.message || 'Database operation failed';
  const code = error.code;
  
  // Map common Supabase error codes to custom errors
  switch (code) {
    case 'PGRST116': // Not found
      return new NotFoundError('Resource');
    case 'PGRST301': // Unauthorized
      return new UnauthorizedError('database operation');
    case '23505': // Unique violation
      return new ValidationError('Duplicate entry detected');
    case '23503': // Foreign key violation
      return new ValidationError('Referenced resource does not exist');
    case '23502': // Not null violation
      return new ValidationError('Required field is missing');
    default:
      return new DatabaseError(message, error);
  }
}

/**
 * Error boundary for React components
 */
export class ErrorBoundary {
  static getDerivedStateFromError(error: Error) {
    Logger.error('React Error Boundary', error);
    return { hasError: true, error };
  }
  
  static componentDidCatch(error: Error, errorInfo: any) {
    Logger.error('React Error Boundary - Component Stack', error, {
      componentStack: errorInfo.componentStack,
    });
  }
}

/**
 * Global error handler for unhandled promise rejections
 */
export function setupGlobalErrorHandlers() {
  if (typeof window !== 'undefined') {
    // Client-side error handling
    window.addEventListener('unhandledrejection', (event) => {
      Logger.error('Unhandled Promise Rejection', new Error(event.reason), {
        reason: event.reason,
      });
    });
    
    window.addEventListener('error', (event) => {
      Logger.error('Global Error', event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  } else {
    // Server-side error handling
    process.on('unhandledRejection', (reason, promise) => {
      Logger.error('Unhandled Promise Rejection', new Error(String(reason)), {
        reason,
        promise: promise.toString(),
      });
    });
    
    process.on('uncaughtException', (error) => {
      Logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  }
}

/**
 * Validate and throw appropriate errors
 */
export function validateAndThrow(condition: boolean, error: BaseError): void {
  if (!condition) {
    throw error;
  }
}

/**
 * Assert that a value is not null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  error: BaseError
): asserts value is T {
  if (value == null) {
    throw error;
  }
}
