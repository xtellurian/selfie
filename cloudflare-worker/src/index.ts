/**
 * Selfie Frontend Cloudflare Worker
 * 
 * A TypeScript-based Cloudflare Worker that serves the Selfie Frontend
 * with a robust API layer for MCP server integration.
 */

import type { Env, WorkerHandler, RequestContext } from '@/types/env.js';
import { handleApiRequest } from '@/api/router.js';
import { addCorsHeaders } from '@/utils/response.js';

/**
 * Main Worker export with proper typing
 */
const worker: WorkerHandler = {
  async fetch(request: Request, env: Env, _ctx: RequestContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return handleCorsPreflightRequest(request);
      }

      // Handle API routes
      if (url.pathname.startsWith('/api/')) {
        const response = await handleApiRequest(request, env);
        return addCorsHeaders(response);
      }

      // Serve static assets and handle SPA routing
      const response = await env.ASSETS.fetch(request);
      
      // Add security headers to static assets
      return addSecurityHeaders(response);
    } catch (error) {
      // Log error for monitoring
      console.error('Worker error:', error);
      
      // Return a generic error response
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  },
};

/**
 * Handle CORS preflight requests
 */
function handleCorsPreflightRequest(_request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

/**
 * Add security headers to responses
 */
function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy for static assets
  if (response.headers.get('Content-Type')?.includes('text/html')) {
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'"
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default worker;