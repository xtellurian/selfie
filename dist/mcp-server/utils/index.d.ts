/**
 * Selfie MCP Server Utilities
 *
 * Utility functions for the Selfie MCP server implementation.
 */
import { SelfieInstance, TaskAssignment, ResourceClaim } from '../types/index.js';
/**
 * Generate a unique ID for instances, tasks, and other entities
 */
export declare function generateId(): string;
/**
 * Generate a unique instance ID based on type and optional suffix
 */
export declare function generateInstanceId(type: SelfieInstance['type'], suffix?: string): string;
/**
 * Validate that an instance object has all required fields
 */
export declare function validateInstance(instance: Partial<SelfieInstance>): instance is SelfieInstance;
/**
 * Validate that a task object has all required fields
 */
export declare function validateTask(task: Partial<TaskAssignment>): task is TaskAssignment;
/**
 * Check if an instance is considered active (heartbeat within threshold)
 */
export declare function isInstanceActive(instance: SelfieInstance, timeoutMs?: number): boolean;
/**
 * Find available instances for a given task type
 */
export declare function findAvailableInstances(instances: Map<string, SelfieInstance>, taskType: TaskAssignment['type'], excludeIds?: string[]): SelfieInstance[];
/**
 * Check if there are resource conflicts for a given resource
 */
export declare function checkResourceConflicts(resources: Map<string, ResourceClaim>, resourceType: ResourceClaim['resourceType'], resourceId: string, operation: string, requestingInstanceId: string): string[];
/**
 * Clean up expired resource claims
 */
export declare function cleanupExpiredResources(resources: Map<string, ResourceClaim>): number;
/**
 * Create a resource key for the resources map
 */
export declare function createResourceKey(resourceType: ResourceClaim['resourceType'], resourceId: string, instanceId: string): string;
/**
 * Validate MCP method parameters against expected schema
 */
export declare function validateMethodParams(method: string, params: unknown): {
    valid: boolean;
    error?: string;
};
