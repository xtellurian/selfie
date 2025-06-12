/**
 * Agents Status API Handler
 */

import type { AgentStatus, AgentsStatusResponse, ApiResponse } from '@/types/api.js';
import type { Env } from '@/types/env.js';

/**
 * Mock agent data for demonstration
 * In production, this would connect to the actual MCP server
 */
const MOCK_AGENTS: readonly AgentStatus[] = [
  {
    name: 'initializer',
    status: 'monitoring',
    lastSeen: new Date().toISOString(),
    capabilities: ['issue-monitoring', 'task-creation', 'agent-coordination'],
    currentTask: 'Monitoring GitHub issues',
    metadata: {
      issuesWatched: 15,
      lastIssueCheck: new Date(Date.now() - 30000).toISOString(),
    },
  },
  {
    name: 'developer',
    status: 'available',
    lastSeen: new Date().toISOString(),
    capabilities: ['code-generation', 'pull-request-creation', 'testing'],
    metadata: {
      completedTasks: 42,
      activeProjects: 3,
    },
  },
  {
    name: 'reviewer',
    status: 'idle',
    lastSeen: new Date(Date.now() - 120000).toISOString(),
    capabilities: ['code-review', 'quality-assurance', 'security-analysis'],
    metadata: {
      reviewsCompleted: 28,
      averageReviewTime: '15 minutes',
    },
  },
  {
    name: 'tester',
    status: 'idle',
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    capabilities: ['test-generation', 'test-execution', 'coverage-analysis'],
    metadata: {
      testsGenerated: 156,
      lastTestRun: new Date(Date.now() - 1800000).toISOString(),
    },
  },
] as const;

/**
 * Handle agents status requests
 */
export async function handleAgentsStatus(
  _request: Request,
  env: Env
): Promise<Response> {
  try {
    // In production, this would fetch from the actual MCP server
    const agents = await fetchAgentStatus(env);
    
    const agentsData: AgentsStatusResponse = {
      agents,
      totalAgents: agents.length,
      activeConnections: calculateActiveConnections(agents),
      lastUpdate: new Date().toISOString(),
    };

    const response: ApiResponse<AgentsStatusResponse> = {
      success: true,
      data: agentsData,
      timestamp: new Date().toISOString(),
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30', // Cache for 30 seconds
        'X-Total-Agents': agents.length.toString(),
        'X-Active-Connections': calculateActiveConnections(agents).toString(),
      },
    });
  } catch (error) {
    return handleAgentsError(error);
  }
}

/**
 * Fetch agent status from MCP server or return mock data
 */
async function fetchAgentStatus(env: Env): Promise<readonly AgentStatus[]> {
  // If MCP server URL is configured, try to fetch real data
  if (env.MCP_SERVER_URL) {
    try {
      const response = await fetch(`${env.MCP_SERVER_URL}/agents/status`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Selfie-Frontend-Worker/2.0.0',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json() as { agents: AgentStatus[] };
        return data.agents || [];
      }
    } catch (error) {
      console.warn('Failed to fetch from MCP server, using mock data:', error);
    }
  }

  // Fallback to mock data
  return MOCK_AGENTS;
}

/**
 * Calculate number of active connections based on agent status
 */
function calculateActiveConnections(agents: readonly AgentStatus[]): number {
  return agents.filter(agent => 
    agent.status !== 'idle' && agent.status !== 'offline'
  ).length;
}

/**
 * Handle agents API errors
 */
function handleAgentsError(error: unknown): Response {
  const errorResponse: ApiResponse<never> = {
    success: false,
    error: error instanceof Error ? error.message : 'Failed to fetch agent status',
    timestamp: new Date().toISOString(),
  };

  return Response.json(errorResponse, {
    status: 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}