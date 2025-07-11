#!/usr/bin/env node
/**
 * Selfie MCP Server
 *
 * Model Context Protocol server for coordinating Selfie instances.
 * Enables communication and task distribution between multiple Selfie instances.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SelfieHandlers } from './handlers/index.js';
class SelfieMCPServer {
    server;
    handlers;
    constructor() {
        this.handlers = new SelfieHandlers();
        this.server = new Server({
            name: 'selfie-mcp-server',
            version: '1.0.0',
            description: 'Model Context Protocol server for Selfie agentic build system coordination'
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
    }
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: this.getTools()
            };
        });
        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'selfie_register':
                        return await this.handleToolCall('selfie.register', args);
                    case 'selfie_heartbeat':
                        return await this.handleToolCall('selfie.heartbeat', args);
                    case 'selfie_unregister':
                        return await this.handleToolCall('selfie.unregister', args);
                    case 'selfie_list_instances':
                        return await this.handleToolCall('selfie.list_instances', args);
                    case 'selfie_assign_task':
                        return await this.handleToolCall('selfie.assign_task', args);
                    case 'selfie_update_task_status':
                        return await this.handleToolCall('selfie.update_task_status', args);
                    case 'selfie_get_task':
                        return await this.handleToolCall('selfie.get_task', args);
                    case 'selfie_list_tasks':
                        return await this.handleToolCall('selfie.list_tasks', args);
                    case 'selfie_request_developer':
                        return await this.handleToolCall('selfie.request_developer', args);
                    case 'selfie_claim_resource':
                        return await this.handleToolCall('selfie.claim_resource', args);
                    case 'selfie_release_resource':
                        return await this.handleToolCall('selfie.release_resource', args);
                    case 'selfie_get_stats':
                        return this.handleGetStats();
                    case 'selfie_get_state':
                        return this.handleGetState();
                    case 'selfie_memory_create_entity':
                        return await this.handleToolCall('selfie.memory.create_entity', args);
                    case 'selfie_memory_update_entity':
                        return await this.handleToolCall('selfie.memory.update_entity', args);
                    case 'selfie_memory_create_relation':
                        return await this.handleToolCall('selfie.memory.create_relation', args);
                    case 'selfie_memory_search_entities':
                        return await this.handleToolCall('selfie.memory.search_entities', args);
                    case 'selfie_memory_get_entity':
                        return await this.handleToolCall('selfie.memory.get_entity', args);
                    case 'selfie_memory_delete_entity':
                        return await this.handleToolCall('selfie.memory.delete_entity', args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [{
                            type: 'text',
                            text: `Error: ${errorMessage}`
                        }],
                    isError: true
                };
            }
        });
    }
    async handleToolCall(method, args) {
        const result = await this.handlers.handleMethod(method, args);
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    handleGetStats() {
        const stats = this.handlers.getStats();
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(stats, null, 2)
                }]
        };
    }
    handleGetState() {
        const state = this.handlers.getState();
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(state, null, 2)
                }]
        };
    }
    getTools() {
        return [
            {
                name: 'selfie_register',
                description: 'Register a new Selfie instance with the coordination server',
                inputSchema: {
                    type: 'object',
                    properties: {
                        instance: {
                            type: 'object',
                            properties: {
                                id: { type: 'string', description: 'Unique instance identifier' },
                                type: {
                                    type: 'string',
                                    enum: ['initializer', 'developer', 'reviewer', 'tester'],
                                    description: 'Type of Selfie instance'
                                },
                                status: {
                                    type: 'string',
                                    enum: ['idle', 'busy', 'offline'],
                                    description: 'Current status of the instance'
                                },
                                capabilities: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'List of capabilities this instance supports'
                                },
                                metadata: {
                                    type: 'object',
                                    description: 'Additional metadata about the instance'
                                }
                            },
                            required: ['id', 'type', 'status', 'capabilities']
                        }
                    },
                    required: ['instance']
                }
            },
            {
                name: 'selfie_heartbeat',
                description: 'Send heartbeat to keep instance registration active',
                inputSchema: {
                    type: 'object',
                    properties: {
                        instanceId: { type: 'string', description: 'Instance identifier' },
                        status: {
                            type: 'string',
                            enum: ['idle', 'busy', 'offline'],
                            description: 'Current status'
                        },
                        metadata: {
                            type: 'object',
                            description: 'Optional metadata update'
                        }
                    },
                    required: ['instanceId', 'status']
                }
            },
            {
                name: 'selfie_unregister',
                description: 'Unregister a Selfie instance',
                inputSchema: {
                    type: 'object',
                    properties: {
                        instanceId: { type: 'string', description: 'Instance identifier to unregister' }
                    },
                    required: ['instanceId']
                }
            },
            {
                name: 'selfie_list_instances',
                description: 'List registered Selfie instances',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['initializer', 'developer', 'reviewer', 'tester'],
                            description: 'Filter by instance type'
                        },
                        status: {
                            type: 'string',
                            enum: ['idle', 'busy', 'offline'],
                            description: 'Filter by status'
                        }
                    }
                }
            },
            {
                name: 'selfie_assign_task',
                description: 'Assign a task to a Selfie instance',
                inputSchema: {
                    type: 'object',
                    properties: {
                        task: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['develop', 'review', 'test'],
                                    description: 'Type of task'
                                },
                                assignedTo: { type: 'string', description: 'Instance ID to assign to' },
                                assignedBy: { type: 'string', description: 'Instance ID assigning the task' },
                                issueNumber: { type: 'number', description: 'GitHub issue number (for develop tasks)' },
                                pullRequestNumber: { type: 'number', description: 'GitHub PR number (for review tasks)' },
                                metadata: { type: 'object', description: 'Additional task metadata' }
                            },
                            required: ['type', 'assignedTo', 'assignedBy']
                        }
                    },
                    required: ['task']
                }
            },
            {
                name: 'selfie_update_task_status',
                description: 'Update the status of a task',
                inputSchema: {
                    type: 'object',
                    properties: {
                        taskId: { type: 'string', description: 'Task identifier' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'in_progress', 'completed', 'failed'],
                            description: 'New task status'
                        },
                        metadata: { type: 'object', description: 'Additional status metadata' }
                    },
                    required: ['taskId', 'status']
                }
            },
            {
                name: 'selfie_get_task',
                description: 'Get details of a specific task',
                inputSchema: {
                    type: 'object',
                    properties: {
                        taskId: { type: 'string', description: 'Task identifier' }
                    },
                    required: ['taskId']
                }
            },
            {
                name: 'selfie_list_tasks',
                description: 'List tasks with optional filters',
                inputSchema: {
                    type: 'object',
                    properties: {
                        assignedTo: { type: 'string', description: 'Filter by assigned instance' },
                        assignedBy: { type: 'string', description: 'Filter by assigning instance' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'in_progress', 'completed', 'failed'],
                            description: 'Filter by status'
                        },
                        type: {
                            type: 'string',
                            enum: ['develop', 'review', 'test'],
                            description: 'Filter by task type'
                        }
                    }
                }
            },
            {
                name: 'selfie_request_developer',
                description: 'Request a developer instance for an issue',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issueNumber: { type: 'number', description: 'GitHub issue number' },
                        priority: {
                            type: 'string',
                            enum: ['high', 'medium', 'low'],
                            description: 'Task priority'
                        },
                        requirements: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of requirements'
                        }
                    },
                    required: ['issueNumber']
                }
            },
            {
                name: 'selfie_claim_resource',
                description: 'Claim a resource to prevent conflicts',
                inputSchema: {
                    type: 'object',
                    properties: {
                        resourceType: {
                            type: 'string',
                            enum: ['branch', 'file', 'issue', 'pr'],
                            description: 'Type of resource'
                        },
                        resourceId: { type: 'string', description: 'Resource identifier' },
                        instanceId: { type: 'string', description: 'Instance claiming the resource' },
                        operation: { type: 'string', description: 'Operation being performed' }
                    },
                    required: ['resourceType', 'resourceId', 'instanceId', 'operation']
                }
            },
            {
                name: 'selfie_release_resource',
                description: 'Release a claimed resource',
                inputSchema: {
                    type: 'object',
                    properties: {
                        resourceType: {
                            type: 'string',
                            enum: ['branch', 'file', 'issue', 'pr'],
                            description: 'Type of resource'
                        },
                        resourceId: { type: 'string', description: 'Resource identifier' },
                        instanceId: { type: 'string', description: 'Instance releasing the resource' }
                    },
                    required: ['resourceType', 'resourceId', 'instanceId']
                }
            },
            {
                name: 'selfie_get_stats',
                description: 'Get server statistics and health information',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'selfie_get_state',
                description: 'Get current server state for debugging',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'selfie_memory_create_entity',
                description: 'Create a new memory entity for knowledge storage',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Unique entity name' },
                        entityType: { type: 'string', description: 'Type of entity (e.g., "Component", "Pattern", "Decision")' },
                        observations: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'List of factual observations about this entity'
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional metadata about the entity'
                        }
                    },
                    required: ['name', 'entityType', 'observations']
                }
            },
            {
                name: 'selfie_memory_update_entity',
                description: 'Update an existing memory entity with new observations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Entity name to update' },
                        observations: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'New observations to add'
                        },
                        metadata: {
                            type: 'object',
                            description: 'Metadata updates'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'selfie_memory_create_relation',
                description: 'Create a relationship between two memory entities',
                inputSchema: {
                    type: 'object',
                    properties: {
                        from: { type: 'string', description: 'Source entity name' },
                        to: { type: 'string', description: 'Target entity name' },
                        relationType: {
                            type: 'string',
                            enum: ['relates_to', 'caused_by', 'enables', 'contradicts', 'supports', 'implements', 'depends_on'],
                            description: 'Type of relationship'
                        },
                        strength: {
                            type: 'number',
                            minimum: 0,
                            maximum: 1,
                            description: 'Relationship strength (0-1)'
                        },
                        metadata: {
                            type: 'object',
                            description: 'Additional relationship metadata'
                        }
                    },
                    required: ['from', 'to', 'relationType']
                }
            },
            {
                name: 'selfie_memory_search_entities',
                description: 'Search memory entities by name, type, or observations',
                inputSchema: {
                    type: 'object',
                    properties: {
                        entityName: { type: 'string', description: 'Search by entity name (partial match)' },
                        entityType: { type: 'string', description: 'Filter by entity type' },
                        observations: { type: 'string', description: 'Search within observations' },
                        limit: { type: 'number', description: 'Maximum results to return' }
                    }
                }
            },
            {
                name: 'selfie_memory_get_entity',
                description: 'Get a specific memory entity with its relationships',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Entity name to retrieve' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'selfie_memory_delete_entity',
                description: 'Delete a memory entity and its relationships',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Entity name to delete' }
                    },
                    required: ['name']
                }
            }
        ];
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Selfie MCP Server started on stdio');
    }
}
// Start the server if this file is run directly
// Note: import.meta check removed for Jest compatibility
const isMainModule = process.argv[1] && process.argv[1].endsWith('mcp-server/index.js');
if (isMainModule) {
    const server = new SelfieMCPServer();
    server.start().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}
export { SelfieMCPServer };
