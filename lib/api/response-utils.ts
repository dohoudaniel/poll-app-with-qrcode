/**
 * Consistent API response utilities
 */

import { NextResponse } from 'next/server';
import { Logger } from '../utils/logger';
import { createSuccessResponse, createErrorResponse, handleApiError } from '../errors/error-handler';
import type { ApiResponse } from '../errors/error-handler';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * API Response utility class
 */
export class ApiResponse {
  /**
   * Create a success response
   */
  static success<T>(
    data: T,
    message?: string,
    requestId?: string
  ): NextResponse<ApiResponse<T>> {
    const response = createSuccessResponse(data, message, requestId);
    
    Logger.debug('API Success Response', {
      requestId,
      message,
      dataType: typeof data,
    });
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create a created response (201)
   */
  static created<T>(
    data: T,
    message?: string,
    requestId?: string
  ): NextResponse<ApiResponse<T>> {
    const response = createSuccessResponse(data, message, requestId);
    
    Logger.info('API Created Response', {
      requestId,
      message,
      dataType: typeof data,
    });
    
    return NextResponse.json(response, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create a no content response (204)
   */
  static noContent(requestId?: string): NextResponse {
    Logger.debug('API No Content Response', { requestId });
    
    return new NextResponse(null, {
      status: 204,
      headers: {
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    meta: PaginationMeta,
    message?: string,
    requestId?: string
  ): NextResponse<PaginatedResponse<T>> {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      meta,
      message,
      timestamp: new Date().toISOString(),
      requestId,
    };
    
    Logger.debug('API Paginated Response', {
      requestId,
      message,
      itemCount: data.length,
      page: meta.page,
      totalPages: meta.totalPages,
    });
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Total-Count': meta.total.toString(),
        'X-Page': meta.page.toString(),
        'X-Total-Pages': meta.totalPages.toString(),
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create an error response
   */
  static error(
    error: unknown,
    requestId?: string,
    includeStack = false
  ): NextResponse {
    return handleApiError(error, requestId, includeStack);
  }
  
  /**
   * Create a bad request response (400)
   */
  static badRequest(
    message: string,
    details?: any,
    requestId?: string
  ): NextResponse {
    const errorResponse = createErrorResponse(
      new Error(message),
      requestId
    );
    
    if (details) {
      errorResponse.error.details = details;
    }
    
    Logger.warn('API Bad Request Response', {
      requestId,
      message,
      details,
    });
    
    return NextResponse.json(errorResponse, {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create an unauthorized response (401)
   */
  static unauthorized(
    message: string = 'Authentication required',
    requestId?: string
  ): NextResponse {
    const errorResponse = createErrorResponse(
      new Error(message),
      requestId
    );
    
    Logger.warn('API Unauthorized Response', {
      requestId,
      message,
    });
    
    return NextResponse.json(errorResponse, {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create a forbidden response (403)
   */
  static forbidden(
    message: string = 'Access forbidden',
    requestId?: string
  ): NextResponse {
    const errorResponse = createErrorResponse(
      new Error(message),
      requestId
    );
    
    Logger.warn('API Forbidden Response', {
      requestId,
      message,
    });
    
    return NextResponse.json(errorResponse, {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create a not found response (404)
   */
  static notFound(
    message: string = 'Resource not found',
    requestId?: string
  ): NextResponse {
    const errorResponse = createErrorResponse(
      new Error(message),
      requestId
    );
    
    Logger.info('API Not Found Response', {
      requestId,
      message,
    });
    
    return NextResponse.json(errorResponse, {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create a conflict response (409)
   */
  static conflict(
    message: string,
    details?: any,
    requestId?: string
  ): NextResponse {
    const errorResponse = createErrorResponse(
      new Error(message),
      requestId
    );
    
    if (details) {
      errorResponse.error.details = details;
    }
    
    Logger.warn('API Conflict Response', {
      requestId,
      message,
      details,
    });
    
    return NextResponse.json(errorResponse, {
      status: 409,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
  
  /**
   * Create a rate limit response (429)
   */
  static rateLimited(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    requestId?: string
  ): NextResponse {
    const errorResponse = createErrorResponse(
      new Error(message),
      requestId
    );
    
    Logger.warn('API Rate Limited Response', {
      requestId,
      message,
      retryAfter,
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(requestId && { 'X-Request-ID': requestId }),
    };
    
    if (retryAfter) {
      headers['Retry-After'] = retryAfter.toString();
    }
    
    return NextResponse.json(errorResponse, {
      status: 429,
      headers,
    });
  }
  
  /**
   * Create an internal server error response (500)
   */
  static internalError(
    message: string = 'Internal server error',
    requestId?: string
  ): NextResponse {
    const errorResponse = createErrorResponse(
      new Error(message),
      requestId
    );
    
    Logger.error('API Internal Error Response', new Error(message), {
      requestId,
    });
    
    return NextResponse.json(errorResponse, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...(requestId && { 'X-Request-ID': requestId }),
      },
    });
  }
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  
  return { page, limit };
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Middleware to add request ID to responses
 */
export function withRequestId() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (request: Request, ...args: any[]) {
      const requestId = crypto.randomUUID();
      
      // Add request ID to the request context
      (request as any).requestId = requestId;
      
      return method.call(this, request, ...args);
    };
  };
}
