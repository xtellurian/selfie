/**
 * Selfie MCP Server Handlers
 *
 * Request handlers for the Selfie Model Context Protocol server.
 */
import { SelfieInstance, TaskAssignment, ResourceClaim, SelfieMethodName, MemoryMethodName } from '../types/index.js';
export declare class SelfieHandlers {
    private state;
    private memoryHandlers;
    constructor();
    /**
     * Handle MCP method calls (including memory methods)
     */
    handleMethod(method: SelfieMethodName | MemoryMethodName, params: unknown): Promise<unknown>;
    /**
     * Register a new Selfie instance
     */
    private handleRegister;
    /**
     * Process heartbeat from a Selfie instance
     */
    private handleHeartbeat;
    /**
     * Unregister a Selfie instance
     */
    private handleUnregister;
    /**
     * List registered Selfie instances
     */
    private handleListInstances;
    /**
     * Assign a task to a Selfie instance
     */
    private handleAssignTask;
    /**
     * Update task status
     */
    private handleUpdateTaskStatus;
    /**
     * Get a specific task
     */
    private handleGetTask;
    /**
     * List tasks with optional filters
     */
    private handleListTasks;
    /**
     * Request a developer instance for an issue
     */
    private handleRequestDeveloper;
    /**
     * Claim a resource
     */
    private handleClaimResource;
    /**
     * Release a resource
     */
    private handleReleaseResource;
    /**
     * Get server statistics
     */
    getStats(): {
        uptime: number;
        instances: number;
        tasks: number;
        resources: number;
        startedAt: Date;
    };
    /**
     * Get server state (for debugging)
     */
    getState(): {
        instances: [string, SelfieInstance][];
        tasks: [string, TaskAssignment][];
        resources: [string, ResourceClaim][];
    };
}
