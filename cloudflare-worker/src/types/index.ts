/**
 * Central types export for Selfie Frontend Worker
 * 
 * This file re-exports all types from their respective modules
 * to provide a clean import experience throughout the application.
 */

// Environment and Worker types
export type {
  Env,
  RequestContext,
  WorkerHandler,
} from './env.js';

// API types
export type {
  ApiResponse,
  HealthResponse,
  AgentStatus,
  AgentsStatusResponse,
  McpConnectionStatus,
  SystemMetrics,
  ErrorResponse,
} from './api.js';

// Component types
export type {
  BaseComponent,
  ComponentState,
  NavigationState,
  PageComponentProps,
  AgentCardData,
  StatusCardConfig,
  CustomElementRegistry,
  EventHandler,
  ComponentLifecycle,
} from './components.js';

/**
 * Utility types
 */

/**
 * Make all properties in T readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Make all properties in T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the return type of an async function
 */
export type AsyncReturnType<T extends (...args: any[]) => Promise<any>> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? R
  : never;

/**
 * JSON serializable types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Route handler function type
 */
export type RouteHandler = (request: Request, params: Record<string, string>) => Promise<Response>;

/**
 * Middleware function type
 */
export type Middleware = (
  request: Request,
  next: () => Promise<Response>
) => Promise<Response>;