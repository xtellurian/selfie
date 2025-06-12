/**
 * Response utility functions for consistent API responses
 */

import type { ApiResponse, ErrorResponse } from '@/types/api.js';
import type { JsonValue } from '@/types/index.js';

/**
 * Create a successful JSON response
 */
export function createSuccessResponse<T extends JsonValue>(
  data: T,
  options: {
    status?: number;
    headers?: Record<string, string>;
    cache?: string;
  } = {}
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.cache) {
    headers['Cache-Control'] = options.cache;
  }

  return Response.json(response, {
    status: options.status || 200,
    headers,
  });
}

/**
 * Create an error response
 */
export function createErrorResponse(
  error: string,
  options: {
    status?: number;
    code?: string;
    details?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): Response {
  const errorResponse: ErrorResponse = {
    error,
    code: options.code,
    details: options.details,
    timestamp: new Date().toISOString(),
  };

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  return Response.json(errorResponse, {
    status: options.status || 400,
    headers,
  });
}

/**
 * Create a not found response
 */
export function createNotFoundResponse(resource: string): Response {
  return createErrorResponse(`${resource} not found`, {
    status: 404,
    code: 'NOT_FOUND',
  });
}

/**
 * Create a method not allowed response
 */
export function createMethodNotAllowedResponse(
  method: string,
  allowedMethods: readonly string[]
): Response {
  return createErrorResponse(`Method ${method} not allowed`, {
    status: 405,
    code: 'METHOD_NOT_ALLOWED',
    details: {
      allowedMethods,
    },
    headers: {
      'Allow': allowedMethods.join(', '),
    },
  });
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(
  retryAfter: number = 60
): Response {
  return createErrorResponse('Rate limit exceeded', {
    status: 429,
    code: 'RATE_LIMIT_EXCEEDED',
    details: {
      retryAfter,
    },
    headers: {
      'Retry-After': retryAfter.toString(),
    },
  });
}

/**
 * Create an internal server error response
 */
export function createInternalErrorResponse(
  error?: unknown,
  includeDetails: boolean = false
): Response {
  const details = includeDetails && error instanceof Error 
    ? { message: error.message, stack: error.stack }
    : undefined;

  return createErrorResponse('Internal server error', {
    status: 500,
    code: 'INTERNAL_ERROR',
    details,
  });
}

/**
 * Add CORS headers to a response
 */
export function addCorsHeaders(
  response: Response,
  options: {
    origin?: string;
    methods?: readonly string[];
    headers?: readonly string[];
    credentials?: boolean;
    maxAge?: number;
  } = {}
): Response {
  const corsHeaders = new Headers(response.headers);
  
  corsHeaders.set('Access-Control-Allow-Origin', options.origin || '*');
  
  if (options.methods) {
    corsHeaders.set('Access-Control-Allow-Methods', options.methods.join(', '));
  }
  
  if (options.headers) {
    corsHeaders.set('Access-Control-Allow-Headers', options.headers.join(', '));
  }
  
  if (options.credentials) {
    corsHeaders.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (options.maxAge) {
    corsHeaders.set('Access-Control-Max-Age', options.maxAge.toString());
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: corsHeaders,
  });
}