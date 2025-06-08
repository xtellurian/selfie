#!/usr/bin/env node
/**
 * Selfie MCP Server
 *
 * Model Context Protocol server for coordinating Selfie instances.
 * Enables communication and task distribution between multiple Selfie instances.
 */
declare class SelfieMCPServer {
    private server;
    private handlers;
    constructor();
    private setupHandlers;
    private handleToolCall;
    private handleGetStats;
    private handleGetState;
    private getTools;
    start(): Promise<void>;
}
export { SelfieMCPServer };
