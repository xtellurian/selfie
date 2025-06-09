/**
 * Selfie MCP Client
 *
 * Simplified client for communicating with the Selfie MCP server from agent instances.
 * This is a basic implementation that can be enhanced with full MCP SDK integration later.
 */
import { SelfieInstance, TaskAssignment } from '../mcp-server/types/index.js';
export interface MCPClientConfig {
    serverCommand: string;
    serverArgs?: string[];
    workingDirectory?: string;
}
export declare class SelfieMCPClient {
    private config;
    private connected;
    constructor(config: MCPClientConfig);
    /**
     * Connect to the MCP server (simplified implementation)
     */
    connect(): Promise<void>;
    /**
     * Disconnect from the MCP server
     */
    disconnect(): Promise<void>;
    /**
     * Register this instance with the MCP server
     */
    register(instance: Omit<SelfieInstance, 'lastSeen'>): Promise<{
        registered: boolean;
        instanceId: string;
    }>;
    /**
     * Send heartbeat to keep registration active
     */
    heartbeat(instanceId: string, status: SelfieInstance['status'], _metadata?: Record<string, unknown>): Promise<{
        acknowledged: boolean;
    }>;
    /**
     * Unregister this instance
     */
    unregister(instanceId: string): Promise<{
        unregistered: boolean;
    }>;
    /**
     * Claim a resource
     */
    claimResource(resourceType: 'branch' | 'file' | 'issue' | 'pr', resourceId: string, instanceId: string, operation: string): Promise<{
        claimed: boolean;
        conflictsWith?: string[];
    }>;
    /**
     * Release a resource
     */
    releaseResource(resourceType: 'branch' | 'file' | 'issue' | 'pr', resourceId: string, instanceId: string): Promise<{
        released: boolean;
    }>;
    /**
     * Update task status
     */
    updateTaskStatus(taskId: string, status: TaskAssignment['status'], _metadata?: Record<string, unknown>): Promise<{
        updated: boolean;
    }>;
}
