/**
 * Authentication middleware utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth-service';
import { ApiResponse } from '../api/response-utils';
import { Logger } from '../utils/logger';
import type { AuthUser } from './auth-service';

export interface AuthenticatedRequest extends NextRequest {
  user: AuthUser;
  requestId: string;
}

export type AuthenticatedHandler = (
  request: AuthenticatedRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

export type OptionalAuthHandler = (
  request: NextRequest & { user?: AuthUser; requestId: string },
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Middleware to require authentication
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    
    try {
      // Validate authentication
      const user = await AuthService.requireAuth(request);
      
      // Create authenticated request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;
      authenticatedRequest.requestId = requestId;
      
      Logger.debug('Authenticated request', {
        requestId,
        userId: user.id,
        method: request.method,
        url: request.url,
      });
      
      // Call the handler
      return await handler(authenticatedRequest, context);
    } catch (error) {
      Logger.warn('Authentication failed', {
        requestId,
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : String(error),
      });
      
      return ApiResponse.unauthorized(
        error instanceof Error ? error.message : 'Authentication required',
        requestId
      );
    }
  };
}

/**
 * Middleware for optional authentication
 */
export function withOptionalAuth(handler: OptionalAuthHandler) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    
    try {
      // Try to validate authentication (don't throw if fails)
      const user = await AuthService.validateSession(request);
      
      // Create request with optional user
      const optionalAuthRequest = request as NextRequest & { 
        user?: AuthUser; 
        requestId: string; 
      };
      optionalAuthRequest.user = user || undefined;
      optionalAuthRequest.requestId = requestId;
      
      Logger.debug('Optional auth request', {
        requestId,
        userId: user?.id,
        authenticated: !!user,
        method: request.method,
        url: request.url,
      });
      
      // Call the handler
      return await handler(optionalAuthRequest, context);
    } catch (error) {
      Logger.error('Optional auth middleware error', error as Error, {
        requestId,
        method: request.method,
        url: request.url,
      });
      
      return ApiResponse.internalError('Internal server error', requestId);
    }
  };
}

/**
 * Middleware to require resource ownership
 */
export function withOwnership(
  resourceType: string,
  getResourceId: (request: NextRequest, context?: any) => string
) {
  return function (handler: AuthenticatedHandler) {
    return withAuth(async (request: AuthenticatedRequest, context?: any) => {
      try {
        const resourceId = getResourceId(request, context);
        
        // Check ownership
        await AuthService.requireOwnership(
          request.user.id,
          resourceType,
          resourceId
        );
        
        Logger.debug('Ownership verified', {
          requestId: request.requestId,
          userId: request.user.id,
          resourceType,
          resourceId,
        });
        
        // Call the handler
        return await handler(request, context);
      } catch (error) {
        Logger.warn('Ownership check failed', {
          requestId: request.requestId,
          userId: request.user.id,
          resourceType,
          error: error instanceof Error ? error.message : String(error),
        });
        
        return ApiResponse.forbidden(
          error instanceof Error ? error.message : 'Access forbidden',
          request.requestId
        );
      }
    });
  };
}

/**
 * Middleware to add request ID
 */
export function withRequestId(handler: (request: NextRequest & { requestId: string }, context?: any) => Promise<NextResponse> | NextResponse) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    
    // Add request ID to request
    const requestWithId = request as NextRequest & { requestId: string };
    requestWithId.requestId = requestId;
    
    Logger.debug('Request started', {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
    });
    
    const startTime = Date.now();
    
    try {
      const response = await handler(requestWithId, context);
      
      const duration = Date.now() - startTime;
      Logger.apiRequest(
        request.method,
        request.url,
        response.status,
        duration,
        { requestId }
      );
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      Logger.error('Request failed', error as Error, {
        requestId,
        method: request.method,
        url: request.url,
        duration,
      });
      
      return ApiResponse.internalError('Internal server error', requestId);
    }
  };
}

/**
 * Middleware to validate request method
 */
export function withMethods(allowedMethods: string[]) {
  return function (handler: (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      if (!allowedMethods.includes(request.method)) {
        Logger.warn('Method not allowed', {
          method: request.method,
          url: request.url,
          allowedMethods,
        });
        
        return new NextResponse('Method Not Allowed', {
          status: 405,
          headers: {
            'Allow': allowedMethods.join(', '),
          },
        });
      }
      
      return await handler(request, context);
    };
  };
}

/**
 * Middleware to parse JSON body
 */
export function withJsonBody<T = any>(handler: (request: NextRequest & { body: T }, context?: any) => Promise<NextResponse> | NextResponse) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const body = await request.json() as T;
      
      // Add parsed body to request
      const requestWithBody = request as NextRequest & { body: T };
      requestWithBody.body = body;
      
      return await handler(requestWithBody, context);
    } catch (error) {
      Logger.warn('Invalid JSON body', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : String(error),
      });
      
      return ApiResponse.badRequest('Invalid JSON body');
    }
  };
}

/**
 * Middleware to validate content type
 */
export function withContentType(expectedType: string) {
  return function (handler: (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
      const contentType = request.headers.get('content-type');
      
      if (!contentType || !contentType.includes(expectedType)) {
        Logger.warn('Invalid content type', {
          method: request.method,
          url: request.url,
          contentType,
          expectedType,
        });
        
        return ApiResponse.badRequest(`Content-Type must be ${expectedType}`);
      }
      
      return await handler(request, context);
    };
  };
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * Common middleware combinations
 */
export const withAuthAndRequestId = compose(withRequestId, withAuth);
export const withOptionalAuthAndRequestId = compose(withRequestId, withOptionalAuth);
export const withJsonAuth = compose(
  withRequestId,
  withMethods(['POST', 'PUT', 'PATCH']),
  withContentType('application/json'),
  withJsonBody,
  withAuth
);

/**
 * Helper to extract path parameters
 */
export function getPathParam(request: NextRequest, paramName: string): string | null {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  
  // This is a simple implementation - in a real app you might want to use
  // a more sophisticated path parameter extraction
  const paramIndex = pathSegments.findIndex(segment => segment.startsWith(':' + paramName));
  if (paramIndex !== -1 && paramIndex + 1 < pathSegments.length) {
    return pathSegments[paramIndex + 1];
  }
  
  return null;
}

/**
 * Helper to extract query parameters
 */
export function getQueryParam(request: NextRequest, paramName: string): string | null {
  const url = new URL(request.url);
  return url.searchParams.get(paramName);
}
