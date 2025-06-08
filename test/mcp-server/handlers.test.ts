import { describe, it, expect, beforeEach } from '@jest/globals';
import { SelfieHandlers } from '../../src/mcp-server/handlers/index.js';
import { SelfieInstance } from '../../src/mcp-server/types/index.js';

describe('SelfieHandlers', () => {
  let handlers: SelfieHandlers;

  beforeEach(() => {
    handlers = new SelfieHandlers();
  });

  describe('instance registration', () => {
    it('should register a new instance', async () => {
      const instance: Omit<SelfieInstance, 'lastSeen'> = {
        id: 'test-instance-1',
        type: 'developer',
        status: 'idle',
        capabilities: ['development', 'typescript'],
        metadata: { version: '1.0.0' }
      };

      const result = await handlers.handleMethod('selfie.register', { instance });

      expect(result).toEqual({
        registered: true,
        instanceId: 'test-instance-1'
      });
    });

    it('should handle heartbeat for registered instance', async () => {
      // First register an instance
      const instance: Omit<SelfieInstance, 'lastSeen'> = {
        id: 'test-instance-2',
        type: 'initializer',
        status: 'idle',
        capabilities: ['coordination']
      };

      await handlers.handleMethod('selfie.register', { instance });

      // Then send heartbeat
      const result = await handlers.handleMethod('selfie.heartbeat', {
        instanceId: 'test-instance-2',
        status: 'busy'
      });

      expect(result).toEqual({
        acknowledged: true
      });
    });

    it('should list registered instances', async () => {
      // Register multiple instances
      const instances = [
        {
          id: 'dev-1',
          type: 'developer',
          status: 'idle',
          capabilities: ['development']
        },
        {
          id: 'init-1',
          type: 'initializer',
          status: 'busy',
          capabilities: ['coordination']
        }
      ];

      for (const instance of instances) {
        await handlers.handleMethod('selfie.register', { instance });
      }

      // List all instances
      const allResult = await handlers.handleMethod('selfie.list_instances', {});
      expect(allResult).toHaveProperty('instances');
      expect((allResult as any).instances).toHaveLength(2);

      // List by type
      const devResult = await handlers.handleMethod('selfie.list_instances', {
        type: 'developer'
      });
      expect((devResult as any).instances).toHaveLength(1);
      expect((devResult as any).instances[0].id).toBe('dev-1');
    });

    it('should unregister an instance', async () => {
      // Register an instance
      const instance: Omit<SelfieInstance, 'lastSeen'> = {
        id: 'temp-instance',
        type: 'tester',
        status: 'idle',
        capabilities: ['testing']
      };

      await handlers.handleMethod('selfie.register', { instance });

      // Unregister it
      const result = await handlers.handleMethod('selfie.unregister', {
        instanceId: 'temp-instance'
      });

      expect(result).toEqual({
        unregistered: true
      });

      // Verify it's no longer listed
      const listResult = await handlers.handleMethod('selfie.list_instances', {});
      expect((listResult as any).instances).toHaveLength(0);
    });
  });

  describe('task management', () => {
    beforeEach(async () => {
      // Register a developer instance for task assignment
      const instance: Omit<SelfieInstance, 'lastSeen'> = {
        id: 'dev-worker-1',
        type: 'developer',
        status: 'idle',
        capabilities: ['development']
      };
      await handlers.handleMethod('selfie.register', { instance });
    });

    it('should assign a task', async () => {
      const task = {
        type: 'develop',
        assignedTo: 'dev-worker-1',
        assignedBy: 'coordinator-1',
        issueNumber: 123,
        metadata: { priority: 'high' }
      };

      const result = await handlers.handleMethod('selfie.assign_task', { task });

      expect(result).toHaveProperty('taskId');
      expect(result).toHaveProperty('assigned', true);
      expect(typeof (result as any).taskId).toBe('string');
    });

    it('should update task status', async () => {
      // First assign a task
      const task = {
        type: 'develop',
        assignedTo: 'dev-worker-1',
        assignedBy: 'coordinator-1'
      };

      const assignResult = await handlers.handleMethod('selfie.assign_task', { task });
      const taskId = (assignResult as any).taskId;

      // Update its status
      const updateResult = await handlers.handleMethod('selfie.update_task_status', {
        taskId,
        status: 'in_progress',
        metadata: { startedAt: new Date().toISOString() }
      });

      expect(updateResult).toEqual({
        updated: true
      });
    });

    it('should get a specific task', async () => {
      // Assign a task
      const task = {
        type: 'review',
        assignedTo: 'dev-worker-1',
        assignedBy: 'coordinator-1',
        pullRequestNumber: 456
      };

      const assignResult = await handlers.handleMethod('selfie.assign_task', { task });
      const taskId = (assignResult as any).taskId;

      // Get the task
      const getResult = await handlers.handleMethod('selfie.get_task', { taskId });

      expect(getResult).toHaveProperty('task');
      expect((getResult as any).task).toHaveProperty('id', taskId);
      expect((getResult as any).task).toHaveProperty('type', 'review');
    });

    it('should list tasks with filters', async () => {
      // Assign multiple tasks
      const tasks = [
        {
          type: 'develop',
          assignedTo: 'dev-worker-1',
          assignedBy: 'coordinator-1'
        },
        {
          type: 'test',
          assignedTo: 'dev-worker-1',
          assignedBy: 'coordinator-1'
        }
      ];

      for (const task of tasks) {
        await handlers.handleMethod('selfie.assign_task', { task });
      }

      // List all tasks
      const allResult = await handlers.handleMethod('selfie.list_tasks', {});
      expect((allResult as any).tasks).toHaveLength(2);

      // List by type
      const devResult = await handlers.handleMethod('selfie.list_tasks', {
        type: 'develop'
      });
      expect((devResult as any).tasks).toHaveLength(1);
      expect((devResult as any).tasks[0].type).toBe('develop');

      // List by assignee
      const assignedResult = await handlers.handleMethod('selfie.list_tasks', {
        assignedTo: 'dev-worker-1'
      });
      expect((assignedResult as any).tasks).toHaveLength(2);
    });

    it('should request a developer for an issue', async () => {
      const result = await handlers.handleMethod('selfie.request_developer', {
        issueNumber: 789,
        priority: 'medium',
        requirements: ['typescript', 'testing']
      });

      expect(result).toHaveProperty('taskId');
      expect(result).toHaveProperty('assignedTo', 'dev-worker-1');
      expect((result as any).taskId).toBeTruthy();
    });
  });

  describe('resource management', () => {
    beforeEach(async () => {
      // Register an instance for resource claims
      const instance: Omit<SelfieInstance, 'lastSeen'> = {
        id: 'resource-user-1',
        type: 'developer',
        status: 'idle',
        capabilities: ['development']
      };
      await handlers.handleMethod('selfie.register', { instance });
    });

    it('should claim a resource', async () => {
      const result = await handlers.handleMethod('selfie.claim_resource', {
        resourceType: 'branch',
        resourceId: 'feature/new-feature',
        instanceId: 'resource-user-1',
        operation: 'write'
      });

      expect(result).toEqual({
        claimed: true
      });
    });

    it('should detect resource conflicts', async () => {
      // First claim
      await handlers.handleMethod('selfie.claim_resource', {
        resourceType: 'file',
        resourceId: 'src/important.ts',
        instanceId: 'resource-user-1',
        operation: 'write'
      });

      // Register another instance
      const instance2: Omit<SelfieInstance, 'lastSeen'> = {
        id: 'resource-user-2',
        type: 'developer',
        status: 'idle',
        capabilities: ['development']
      };
      await handlers.handleMethod('selfie.register', { instance: instance2 });

      // Try conflicting claim
      const result = await handlers.handleMethod('selfie.claim_resource', {
        resourceType: 'file',
        resourceId: 'src/important.ts',
        instanceId: 'resource-user-2',
        operation: 'write'
      });

      expect(result).toHaveProperty('claimed', false);
      expect(result).toHaveProperty('conflictsWith');
      expect((result as any).conflictsWith).toContain('resource-user-1');
    });

    it('should release a resource', async () => {
      // First claim a resource
      await handlers.handleMethod('selfie.claim_resource', {
        resourceType: 'issue',
        resourceId: '123',
        instanceId: 'resource-user-1',
        operation: 'develop'
      });

      // Then release it
      const result = await handlers.handleMethod('selfie.release_resource', {
        resourceType: 'issue',
        resourceId: '123',
        instanceId: 'resource-user-1'
      });

      expect(result).toEqual({
        released: true
      });
    });
  });

  describe('error handling', () => {
    it('should reject invalid instance registration', async () => {
      const invalidInstance = {
        id: 'invalid',
        type: 'unknown-type',
        status: 'idle'
        // missing capabilities
      };

      await expect(
        handlers.handleMethod('selfie.register', { instance: invalidInstance })
      ).rejects.toThrow();
    });

    it('should reject heartbeat from unregistered instance', async () => {
      await expect(
        handlers.handleMethod('selfie.heartbeat', {
          instanceId: 'nonexistent',
          status: 'idle'
        })
      ).rejects.toThrow('Instance not found: nonexistent');
    });

    it('should reject task assignment to nonexistent instance', async () => {
      const task = {
        type: 'develop',
        assignedTo: 'nonexistent-instance',
        assignedBy: 'coordinator-1'
      };

      await expect(
        handlers.handleMethod('selfie.assign_task', { task })
      ).rejects.toThrow('Assigned instance not found: nonexistent-instance');
    });

    it('should reject unknown methods', async () => {
      await expect(
        handlers.handleMethod('unknown.method' as any, {})
      ).rejects.toThrow('Unknown method: unknown.method');
    });
  });

  describe('server stats', () => {
    it('should return server statistics', () => {
      const stats = handlers.getStats();

      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('instances');
      expect(stats).toHaveProperty('tasks');
      expect(stats).toHaveProperty('resources');
      expect(stats).toHaveProperty('startedAt');

      expect(typeof stats.uptime).toBe('number');
      expect(typeof stats.instances).toBe('number');
      expect(stats.startedAt).toBeInstanceOf(Date);
    });

    it('should return server state', () => {
      const state = handlers.getState();

      expect(state).toHaveProperty('instances');
      expect(state).toHaveProperty('tasks');
      expect(state).toHaveProperty('resources');

      expect(Array.isArray(state.instances)).toBe(true);
      expect(Array.isArray(state.tasks)).toBe(true);
      expect(Array.isArray(state.resources)).toBe(true);
    });
  });
});