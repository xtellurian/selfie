/**
 * Health Check API Handler
 */

import type { HealthResponse, ApiResponse } from '@/types/api.js';
import type { Env } from '@/types/env.js';

/**
 * Handle health check requests
 */
export async function handleHealthCheck(
  _request: Request,
  env: Env
): Promise<Response> {
  try {
    const startTime = Date.now();
    
    const healthData: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Selfie Frontend Worker',
      version: '2.0.0',
      uptime: startTime,
    };

    // Add environment-specific information
    if (env.ENVIRONMENT) {
      Object.assign(healthData, {
        environment: env.ENVIRONMENT,
      });
    }

    const response: ApiResponse<HealthResponse> = {
      success: true,
      data: healthData,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Service-Name': 'selfie-frontend-worker',
        'X-Service-Version': '2.0.0',
      },
    });
  } catch (error) {
    return handleHealthError(error);
  }
}

/**
 * Handle health check errors
 */
function handleHealthError(error: unknown): Response {
  const errorResponse: ApiResponse<never> = {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown health check error',
    timestamp: new Date().toISOString(),
  };

  return Response.json(errorResponse, {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}