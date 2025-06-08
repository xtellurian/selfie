/**
 * Selfie MCP Server Utilities
 * 
 * Utility functions for the Selfie MCP server implementation.
 */

import { v4 as uuidv4 } from 'uuid';
import { SelfieInstance, TaskAssignment, ResourceClaim } from '../types/index.js';

/**
 * Generate a unique ID for instances, tasks, and other entities
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a unique instance ID based on type and optional suffix
 */
export function generateInstanceId(type: SelfieInstance['type'], suffix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const parts = [type, timestamp, random];
  
  if (suffix) {
    parts.push(suffix);
  }
  
  return parts.join('-');
}

/**
 * Validate that an instance object has all required fields
 */
export function validateInstance(instance: Partial<SelfieInstance>): instance is SelfieInstance {
  return !!(
    instance.id &&
    instance.type &&
    instance.status &&
    Array.isArray(instance.capabilities) &&
    instance.lastSeen instanceof Date
  );
}

/**
 * Validate that a task object has all required fields
 */
export function validateTask(task: Partial<TaskAssignment>): task is TaskAssignment {
  return !!(
    task.id &&
    task.type &&
    task.assignedTo &&
    task.assignedBy &&
    task.status &&
    task.createdAt instanceof Date &&
    task.updatedAt instanceof Date
  );
}

/**
 * Check if an instance is considered active (heartbeat within threshold)
 */
export function isInstanceActive(instance: SelfieInstance, timeoutMs: number = 60000): boolean {
  const now = Date.now();
  const lastSeen = instance.lastSeen.getTime();
  return (now - lastSeen) < timeoutMs;
}

/**
 * Find available instances for a given task type
 */
export function findAvailableInstances(
  instances: Map<string, SelfieInstance>,
  taskType: TaskAssignment['type'],
  excludeIds: string[] = []
): SelfieInstance[] {
  const available: SelfieInstance[] = [];
  
  for (const [id, instance] of instances) {
    if (excludeIds.includes(id)) {
      continue;
    }
    
    if (!isInstanceActive(instance)) {
      continue;
    }
    
    if (instance.status !== 'idle') {
      continue;
    }
    
    // Check if instance has capability for this task type
    const requiredCapability = getRequiredCapability(taskType);
    if (!instance.capabilities.includes(requiredCapability)) {
      continue;
    }
    
    available.push(instance);
  }
  
  return available;
}

/**
 * Get the required capability for a task type
 */
function getRequiredCapability(taskType: TaskAssignment['type']): string {
  switch (taskType) {
    case 'develop':
      return 'development';
    case 'review':
      return 'code-review';
    case 'test':
      return 'testing';
    default:
      return 'general';
  }
}

/**
 * Check if there are resource conflicts for a given resource
 */
export function checkResourceConflicts(
  resources: Map<string, ResourceClaim>,
  resourceType: ResourceClaim['resourceType'],
  resourceId: string,
  operation: string,
  requestingInstanceId: string
): string[] {
  const conflicts: string[] = [];
  const resourceKey = `${resourceType}:${resourceId}`;
  
  for (const [key, claim] of resources) {
    // Skip if different resource
    if (!key.startsWith(resourceKey)) {
      continue;
    }
    
    // Skip if same instance (allow multiple operations by same instance)
    if (claim.claimedBy === requestingInstanceId) {
      continue;
    }
    
    // Skip if claim has expired
    if (claim.expiresAt && claim.expiresAt < new Date()) {
      continue;
    }
    
    // Check for operation conflicts
    if (hasOperationConflict(claim.operation, operation)) {
      conflicts.push(claim.claimedBy);
    }
  }
  
  return conflicts;
}

/**
 * Determine if two operations conflict with each other
 */
function hasOperationConflict(existingOperation: string, newOperation: string): boolean {
  // Define operation conflict matrix
  const conflicts: Record<string, string[]> = {
    'write': ['write', 'delete'],
    'delete': ['write', 'read', 'delete'],
    'read': ['delete'],
    'merge': ['write', 'delete', 'merge'],
    'branch': ['delete'],
  };
  
  const conflictingOps = conflicts[existingOperation] || [];
  return conflictingOps.includes(newOperation);
}

/**
 * Clean up expired resource claims
 */
export function cleanupExpiredResources(resources: Map<string, ResourceClaim>): number {
  const now = new Date();
  let cleaned = 0;
  
  for (const [key, claim] of resources) {
    if (claim.expiresAt && claim.expiresAt < now) {
      resources.delete(key);
      cleaned++;
    }
  }
  
  return cleaned;
}

/**
 * Create a resource key for the resources map
 */
export function createResourceKey(
  resourceType: ResourceClaim['resourceType'],
  resourceId: string,
  instanceId: string
): string {
  return `${resourceType}:${resourceId}:${instanceId}`;
}

/**
 * Validate MCP method parameters against expected schema
 */
export function validateMethodParams(
  method: string,
  params: unknown
): { valid: boolean; error?: string } {
  // Basic validation - in a full implementation, this would use JSON Schema
  if (!params || typeof params !== 'object') {
    return { valid: false, error: 'Parameters must be an object' };
  }
  
  // Method-specific validation
  switch (method) {
    case 'selfie.register':
      return validateRegisterParams(params as Record<string, unknown>);
    case 'selfie.heartbeat':
      return validateHeartbeatParams(params as Record<string, unknown>);
    case 'selfie.assign_task':
      return validateAssignTaskParams(params as Record<string, unknown>);
    default:
      return { valid: true }; // Allow unknown methods for extensibility
  }
}

function validateRegisterParams(params: Record<string, unknown>): { valid: boolean; error?: string } {
  const { instance } = params;
  
  if (!instance || typeof instance !== 'object') {
    return { valid: false, error: 'instance parameter is required and must be an object' };
  }
  
  const inst = instance as Record<string, unknown>;
  
  if (!inst.id || typeof inst.id !== 'string') {
    return { valid: false, error: 'instance.id is required and must be a string' };
  }
  
  if (!inst.type || !['initializer', 'developer', 'reviewer', 'tester'].includes(inst.type as string)) {
    return { valid: false, error: 'instance.type must be one of: initializer, developer, reviewer, tester' };
  }
  
  if (!inst.capabilities || !Array.isArray(inst.capabilities)) {
    return { valid: false, error: 'instance.capabilities is required and must be an array' };
  }
  
  return { valid: true };
}

function validateHeartbeatParams(params: Record<string, unknown>): { valid: boolean; error?: string } {
  if (!params.instanceId || typeof params.instanceId !== 'string') {
    return { valid: false, error: 'instanceId is required and must be a string' };
  }
  
  if (!params.status || !['idle', 'busy', 'offline'].includes(params.status as string)) {
    return { valid: false, error: 'status must be one of: idle, busy, offline' };
  }
  
  return { valid: true };
}

function validateAssignTaskParams(params: Record<string, unknown>): { valid: boolean; error?: string } {
  const { task } = params;
  
  if (!task || typeof task !== 'object') {
    return { valid: false, error: 'task parameter is required and must be an object' };
  }
  
  const t = task as Record<string, unknown>;
  
  if (!t.type || !['develop', 'review', 'test'].includes(t.type as string)) {
    return { valid: false, error: 'task.type must be one of: develop, review, test' };
  }
  
  if (!t.assignedTo || typeof t.assignedTo !== 'string') {
    return { valid: false, error: 'task.assignedTo is required and must be a string' };
  }
  
  if (!t.assignedBy || typeof t.assignedBy !== 'string') {
    return { valid: false, error: 'task.assignedBy is required and must be a string' };
  }
  
  return { valid: true };
}