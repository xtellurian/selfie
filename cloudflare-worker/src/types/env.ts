/**
 * Cloudflare Worker Environment Interface
 * Defines the bindings and environment variables available to the Worker
 */
export interface Env {
  /** Static assets binding for serving frontend files */
  readonly ASSETS: Fetcher;
  
  /** Cloudflare AI binding for Workers AI */
  readonly AI: any;
  
  /** Environment configuration */
  readonly ENVIRONMENT?: 'development' | 'staging' | 'production';
  readonly NODE_ENV?: string;
  
  /** Cloudflare AI credentials for local development */
  readonly CLOUDFLARE_API_TOKEN?: string;
  readonly CLOUDFLARE_ACCOUNT_ID?: string;
  
  /** MCP Server URL for agent coordination */
  readonly MCP_SERVER_URL?: string;
  
  /** GitHub token for API integration */
  readonly GITHUB_TOKEN?: string;
  
  /** Additional secrets and configuration */
  readonly [key: string]: unknown;
}

/**
 * Request context type for Cloudflare Workers
 */
export interface RequestContext {
  readonly waitUntil: (promise: Promise<unknown>) => void;
  readonly passThroughOnException: () => void;
}

/**
 * Cloudflare Worker Handler Interface
 */
export interface WorkerHandler {
  fetch(request: Request, env: Env, ctx: RequestContext): Promise<Response>;
}