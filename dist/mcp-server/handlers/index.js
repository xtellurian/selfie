/**
 * Selfie MCP Server Handlers
 *
 * Request handlers for the Selfie Model Context Protocol server.
 */
import { MemoryHandlers } from './memory.js';
import { generateId, validateInstance, validateTask, findAvailableInstances, checkResourceConflicts, createResourceKey, cleanupExpiredResources, validateMethodParams } from '../utils/index.js';
export class SelfieHandlers {
    state;
    memoryHandlers;
    constructor() {
        this.state = {
            instances: new Map(),
            tasks: new Map(),
            resources: new Map(),
            memory: {
                entities: new Map(),
                relations: new Map()
            },
            startedAt: new Date()
        };
        this.memoryHandlers = new MemoryHandlers(this.state.memory.entities, this.state.memory.relations);
        // Clean up expired resources every 5 minutes
        // Skip interval setup in test environment to prevent Jest hanging
        if (process.env.NODE_ENV !== 'test') {
            setInterval(() => {
                const cleaned = cleanupExpiredResources(this.state.resources);
                if (cleaned > 0) {
                    console.log(`Cleaned up ${cleaned} expired resource claims`);
                }
            }, 5 * 60 * 1000);
        }
    }
    /**
     * Handle MCP method calls (including memory methods)
     */
    async handleMethod(method, params) {
        // Validate parameters
        const validation = validateMethodParams(method, params);
        if (!validation.valid) {
            throw new Error(`Invalid parameters: ${validation.error}`);
        }
        const typedParams = params;
        // Handle memory methods
        if (method.startsWith('selfie.memory.')) {
            return this.memoryHandlers.handleMethod(method, params);
        }
        // Handle coordination methods
        switch (method) {
            case 'selfie.register':
                return this.handleRegister(typedParams);
            case 'selfie.heartbeat':
                return this.handleHeartbeat(typedParams);
            case 'selfie.unregister':
                return this.handleUnregister(typedParams);
            case 'selfie.list_instances':
                return this.handleListInstances(typedParams);
            case 'selfie.assign_task':
                return this.handleAssignTask(typedParams);
            case 'selfie.update_task_status':
                return this.handleUpdateTaskStatus(typedParams);
            case 'selfie.get_task':
                return this.handleGetTask(typedParams);
            case 'selfie.list_tasks':
                return this.handleListTasks(typedParams);
            case 'selfie.request_developer':
                return this.handleRequestDeveloper(typedParams);
            case 'selfie.claim_resource':
                return this.handleClaimResource(typedParams);
            case 'selfie.release_resource':
                return this.handleReleaseResource(typedParams);
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }
    /**
     * Register a new Selfie instance
     */
    async handleRegister(params) {
        const { instance: instanceData } = params;
        const inst = instanceData;
        const instance = {
            ...inst,
            lastSeen: new Date()
        };
        if (!validateInstance(instance)) {
            throw new Error('Invalid instance data');
        }
        // Check if instance ID is already registered
        if (this.state.instances.has(instance.id)) {
            console.log(`Instance ${instance.id} re-registering`);
        }
        else {
            console.log(`New instance registered: ${instance.id} (${instance.type})`);
        }
        this.state.instances.set(instance.id, instance);
        return {
            registered: true,
            instanceId: instance.id
        };
    }
    /**
     * Process heartbeat from a Selfie instance
     */
    async handleHeartbeat(params) {
        const { instanceId, status, metadata } = params;
        const instance = this.state.instances.get(instanceId);
        if (!instance) {
            throw new Error(`Instance not found: ${instanceId}`);
        }
        // Update instance status and last seen
        instance.status = status;
        instance.lastSeen = new Date();
        if (metadata) {
            instance.metadata = { ...instance.metadata, ...metadata };
        }
        return {
            acknowledged: true
        };
    }
    /**
     * Unregister a Selfie instance
     */
    async handleUnregister(params) {
        const { instanceId } = params;
        const existed = this.state.instances.delete(instanceId);
        if (existed) {
            console.log(`Instance unregistered: ${instanceId}`);
            // Clean up any resources claimed by this instance
            for (const [key, claim] of this.state.resources) {
                if (claim.claimedBy === instanceId) {
                    this.state.resources.delete(key);
                }
            }
        }
        return {
            unregistered: existed
        };
    }
    /**
     * List registered Selfie instances
     */
    async handleListInstances(params) {
        const { type, status } = params;
        let instances = Array.from(this.state.instances.values());
        if (type) {
            instances = instances.filter(inst => inst.type === type);
        }
        if (status) {
            instances = instances.filter(inst => inst.status === status);
        }
        return {
            instances
        };
    }
    /**
     * Assign a task to a Selfie instance
     */
    async handleAssignTask(params) {
        const { task: taskData } = params;
        const taskInput = taskData;
        const task = {
            ...taskInput,
            id: generateId(),
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        if (!validateTask(task)) {
            throw new Error('Invalid task data');
        }
        // Verify assigned instance exists
        const assignedInstance = this.state.instances.get(task.assignedTo);
        if (!assignedInstance) {
            throw new Error(`Assigned instance not found: ${task.assignedTo}`);
        }
        this.state.tasks.set(task.id, task);
        console.log(`Task assigned: ${task.id} (${task.type}) to ${task.assignedTo}`);
        return {
            taskId: task.id,
            assigned: true
        };
    }
    /**
     * Update task status
     */
    async handleUpdateTaskStatus(params) {
        const { taskId, status, metadata } = params;
        const task = this.state.tasks.get(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        task.status = status;
        task.updatedAt = new Date();
        if (metadata) {
            task.metadata = { ...task.metadata, ...metadata };
        }
        console.log(`Task status updated: ${task.id} -> ${status}`);
        return {
            updated: true
        };
    }
    /**
     * Get a specific task
     */
    async handleGetTask(params) {
        const { taskId } = params;
        const task = this.state.tasks.get(taskId) || null;
        return {
            task
        };
    }
    /**
     * List tasks with optional filters
     */
    async handleListTasks(params) {
        const { assignedTo, assignedBy, status, type } = params;
        let tasks = Array.from(this.state.tasks.values());
        if (assignedTo) {
            tasks = tasks.filter(task => task.assignedTo === assignedTo);
        }
        if (assignedBy) {
            tasks = tasks.filter(task => task.assignedBy === assignedBy);
        }
        if (status) {
            tasks = tasks.filter(task => task.status === status);
        }
        if (type) {
            tasks = tasks.filter(task => task.type === type);
        }
        return {
            tasks
        };
    }
    /**
     * Request a developer instance for an issue
     */
    async handleRequestDeveloper(params) {
        const { issueNumber, priority = 'medium', requirements = [] } = params;
        // Find available developer instances
        const availableDevelopers = findAvailableInstances(this.state.instances, 'develop');
        if (availableDevelopers.length === 0) {
            return {
                taskId: '',
                assignedTo: null
            };
        }
        // Select the first available developer (could implement more sophisticated selection)
        const selectedDeveloper = availableDevelopers[0];
        // Create development task
        const task = {
            id: generateId(),
            type: 'develop',
            issueNumber: issueNumber,
            assignedTo: selectedDeveloper.id,
            assignedBy: 'system', // Could be passed as parameter
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            specification: {
                title: `Issue #${issueNumber}`,
                description: 'Development task from MCP request',
                requirements: requirements,
                acceptanceCriteria: [],
                priority: priority
            }
        };
        this.state.tasks.set(task.id, task);
        console.log(`Developer requested for issue #${issueNumber}, assigned to ${selectedDeveloper.id}`);
        return {
            taskId: task.id,
            assignedTo: selectedDeveloper.id,
            estimated_start: new Date()
        };
    }
    /**
     * Claim a resource
     */
    async handleClaimResource(params) {
        const { resourceType, resourceId, instanceId, operation } = params;
        // Check for conflicts
        const conflicts = checkResourceConflicts(this.state.resources, resourceType, resourceId, operation, instanceId);
        if (conflicts.length > 0) {
            return {
                claimed: false,
                conflictsWith: conflicts
            };
        }
        // Create resource claim
        const claim = {
            id: generateId(),
            resourceType: resourceType,
            resourceId: resourceId,
            claimedBy: instanceId,
            operation: operation,
            claimedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minute default expiry
        };
        const key = createResourceKey(claim.resourceType, claim.resourceId, claim.claimedBy);
        this.state.resources.set(key, claim);
        console.log(`Resource claimed: ${resourceType}:${resourceId} by ${instanceId} for ${operation}`);
        return {
            claimed: true
        };
    }
    /**
     * Release a resource
     */
    async handleReleaseResource(params) {
        const { resourceType, resourceId, instanceId } = params;
        const key = createResourceKey(resourceType, resourceId, instanceId);
        const existed = this.state.resources.delete(key);
        if (existed) {
            console.log(`Resource released: ${resourceType}:${resourceId} by ${instanceId}`);
        }
        return {
            released: existed
        };
    }
    /**
     * Get server statistics
     */
    getStats() {
        return {
            uptime: Date.now() - this.state.startedAt.getTime(),
            instances: this.state.instances.size,
            tasks: this.state.tasks.size,
            resources: this.state.resources.size,
            startedAt: this.state.startedAt
        };
    }
    /**
     * Get server state (for debugging)
     */
    getState() {
        return {
            instances: Array.from(this.state.instances.entries()),
            tasks: Array.from(this.state.tasks.entries()),
            resources: Array.from(this.state.resources.entries())
        };
    }
}
