/**
 * API Router for handling different endpoints
 */

import type { Env } from '@/types/env.js';
import type { ApiResponse, ErrorResponse } from '@/types/api.js';
import { handleHealthCheck } from './health.js';
import { handleAgentsStatus } from './agents.js';
import { handleChatCompletion, handleChatStream, handleChatWithFunctions, handleModels } from './chat.js';

/**
 * Route API requests to appropriate handlers
 */
export async function handleApiRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method;

  try {
    // Health endpoint
    if (pathname === '/api/health' && method === 'GET') {
      return handleHealthCheck(request, env);
    }

    // Agents status endpoint
    if (pathname === '/api/agents/status' && method === 'GET') {
      return handleAgentsStatus(request, env);
    }

    // Agents list endpoint (alias for status)
    if (pathname === '/api/agents' && method === 'GET') {
      return handleAgentsStatus(request, env);
    }

    // Chat endpoints
    if (pathname === '/api/chat/completions') {
      if (method === 'POST') {
        return handleChatCompletion(request, env);
      }
      if (method === 'OPTIONS') {
        return handleCorsOptions();
      }
    }

    if (pathname === '/api/chat/stream' && method === 'POST') {
      return handleChatStream(request, env);
    }

    if (pathname === '/api/chat/functions' && method === 'POST') {
      return handleChatWithFunctions(request, env);
    }

    if (pathname === '/api/models' && method === 'GET') {
      return handleModels(request, env);
    }

    // System info endpoint
    if (pathname === '/api/system' && method === 'GET') {
      return handleSystemInfo(request, env);
    }

    // Catch-all for unknown endpoints
    return handleNotFound(pathname, method);
  } catch (error) {
    return handleInternalError(error);
  }
}

/**
 * Handle system information requests
 */
async function handleSystemInfo(
  _request: Request,
  env: Env
): Promise<Response> {
  const systemInfo = {
    service: 'Selfie Frontend Worker',
    version: '2.0.0',
    environment: env.ENVIRONMENT || 'unknown',
    timestamp: new Date().toISOString(),
    features: [
      'health-monitoring',
      'agent-status',
      'static-assets',
      'spa-routing',
    ],
    endpoints: [
      '/api/health',
      '/api/agents/status',
      '/api/agents',
      '/api/chat/completions',
      '/api/chat/stream',
      '/api/chat/functions',
      '/api/models',
      '/api/system',
    ],
  };

  const response: ApiResponse<typeof systemInfo> = {
    success: true,
    data: systemInfo,
    timestamp: new Date().toISOString(),
  };

  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    },
  });
}

/**
 * Handle 404 Not Found responses
 */
function handleNotFound(pathname: string, method: string): Response {
  const errorResponse: ErrorResponse = {
    error: `API endpoint not found: ${method} ${pathname}`,
    code: 'ENDPOINT_NOT_FOUND',
    details: {
      availableEndpoints: [
        'GET /api/health',
        'GET /api/agents/status',
        'GET /api/agents',
        'POST /api/chat/completions',
        'POST /api/chat/stream',
        'POST /api/chat/functions',
        'GET /api/models',
        'GET /api/system',
      ],
      requestedPath: pathname,
      requestedMethod: method,
    },
    timestamp: new Date().toISOString(),
  };

  return Response.json(errorResponse, {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle internal server errors
 */
/**
 * Handle CORS preflight requests
 */
function handleCorsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Handle internal server errors
 */
function handleInternalError(error: unknown): Response {
  console.error('Internal API error:', error);

  const errorResponse: ErrorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    details: {
      message: error instanceof Error ? error.message : 'Unknown error',
    },
    timestamp: new Date().toISOString(),
  };

  return Response.json(errorResponse, {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}