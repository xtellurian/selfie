/**
 * API Response Types for Selfie Frontend
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly timestamp: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly timestamp: string;
  readonly service: string;
  readonly version: string;
  readonly uptime?: number;
}

/**
 * Agent status information
 */
export interface AgentStatus {
  readonly name: string;
  readonly status: 'monitoring' | 'available' | 'busy' | 'idle' | 'offline';
  readonly lastSeen: string;
  readonly capabilities?: readonly string[];
  readonly currentTask?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Agents status response
 */
export interface AgentsStatusResponse {
  readonly agents: readonly AgentStatus[];
  readonly totalAgents: number;
  readonly activeConnections: number;
  readonly lastUpdate: string;
}

/**
 * MCP Connection status
 */
export interface McpConnectionStatus {
  readonly id: string;
  readonly status: 'connected' | 'disconnected' | 'error';
  readonly serverUrl: string;
  readonly lastPing: string;
  readonly capabilities: readonly string[];
}

/**
 * System metrics
 */
export interface SystemMetrics {
  readonly cpu: number;
  readonly memory: number;
  readonly activeRequests: number;
  readonly uptime: number;
  readonly errorRate: number;
}

/**
 * Error response format
 */
export interface ErrorResponse {
  readonly error: string;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
}