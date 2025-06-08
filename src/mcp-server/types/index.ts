/**
 * Selfie MCP Server Types
 * 
 * Type definitions for the Selfie Model Context Protocol server
 * that enables communication between Selfie instances.
 */

export interface SelfieInstance {
  id: string;
  type: 'initializer' | 'developer' | 'reviewer' | 'tester';
  status: 'idle' | 'busy' | 'offline';
  capabilities: string[];
  lastSeen: Date;
  metadata?: Record<string, unknown>;
}

export interface TaskAssignment {
  id: string;
  type: 'develop' | 'review' | 'test';
  issueNumber?: number;
  pullRequestNumber?: number;
  assignedTo: string; // Selfie instance ID
  assignedBy: string; // Selfie instance ID
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface DevelopmentTask extends TaskAssignment {
  type: 'develop';
  issueNumber: number;
  specification: {
    title: string;
    description: string;
    requirements: string[];
    acceptanceCriteria: string[];
    priority: 'high' | 'medium' | 'low';
  };
  implementation?: {
    branchName: string;
    pullRequestNumber?: number;
    filesChanged: string[];
    testsAdded: string[];
  };
}

export interface ReviewTask extends TaskAssignment {
  type: 'review';
  pullRequestNumber: number;
  reviewCriteria: {
    codeQuality: boolean;
    testing: boolean;
    security: boolean;
    documentation: boolean;
  };
  result?: {
    approved: boolean;
    comments: string[];
    suggestions: string[];
  };
}

export interface TestTask extends TaskAssignment {
  type: 'test';
  target: {
    type: 'file' | 'directory' | 'feature';
    path: string;
    description?: string;
  };
  testTypes: ('unit' | 'integration' | 'e2e')[];
  result?: {
    testsCreated: string[];
    coverageImprovement: number;
    issuesFound: string[];
  };
}

export interface MCPRequest {
  id: string;
  method: string;
  params?: Record<string, unknown>;
  timestamp: Date;
}

export interface MCPResponse {
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  timestamp: Date;
}

export interface SelfieCoordinationMethods {
  // Instance registration and management
  'selfie.register': {
    params: {
      instance: Omit<SelfieInstance, 'lastSeen'>;
    };
    result: {
      registered: boolean;
      instanceId: string;
    };
  };

  'selfie.heartbeat': {
    params: {
      instanceId: string;
      status: SelfieInstance['status'];
      metadata?: Record<string, unknown>;
    };
    result: {
      acknowledged: boolean;
    };
  };

  'selfie.unregister': {
    params: {
      instanceId: string;
    };
    result: {
      unregistered: boolean;
    };
  };

  'selfie.list_instances': {
    params: {
      type?: SelfieInstance['type'];
      status?: SelfieInstance['status'];
    };
    result: {
      instances: SelfieInstance[];
    };
  };

  // Task coordination
  'selfie.assign_task': {
    params: {
      task: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt'>;
    };
    result: {
      taskId: string;
      assigned: boolean;
    };
  };

  'selfie.update_task_status': {
    params: {
      taskId: string;
      status: TaskAssignment['status'];
      metadata?: Record<string, unknown>;
    };
    result: {
      updated: boolean;
    };
  };

  'selfie.get_task': {
    params: {
      taskId: string;
    };
    result: {
      task: TaskAssignment | null;
    };
  };

  'selfie.list_tasks': {
    params: {
      assignedTo?: string;
      assignedBy?: string;
      status?: TaskAssignment['status'];
      type?: TaskAssignment['type'];
    };
    result: {
      tasks: TaskAssignment[];
    };
  };

  // Development coordination
  'selfie.request_developer': {
    params: {
      issueNumber: number;
      priority?: 'high' | 'medium' | 'low';
      requirements?: string[];
    };
    result: {
      taskId: string;
      assignedTo: string | null;
      estimated_start?: Date;
    };
  };

  // Resource management
  'selfie.claim_resource': {
    params: {
      resourceType: 'branch' | 'file' | 'issue' | 'pr';
      resourceId: string;
      instanceId: string;
      operation: string;
    };
    result: {
      claimed: boolean;
      conflictsWith?: string[];
    };
  };

  'selfie.release_resource': {
    params: {
      resourceType: 'branch' | 'file' | 'issue' | 'pr';
      resourceId: string;
      instanceId: string;
    };
    result: {
      released: boolean;
    };
  };
}

export type SelfieMethodName = keyof SelfieCoordinationMethods;

export interface ResourceClaim {
  id: string;
  resourceType: 'branch' | 'file' | 'issue' | 'pr';
  resourceId: string;
  claimedBy: string; // Selfie instance ID
  operation: string;
  claimedAt: Date;
  expiresAt?: Date;
}

export interface ServerState {
  instances: Map<string, SelfieInstance>;
  tasks: Map<string, TaskAssignment>;
  resources: Map<string, ResourceClaim>;
  startedAt: Date;
}