import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SelfieMCPServer } from '../../src/mcp-server/index.js';
import { SelfieInstance } from '../../src/mcp-server/types/index.js';

describe('Selfie MCP Server Integration Tests', () => {
  let server: SelfieMCPServer;

  beforeEach(() => {
    server = new SelfieMCPServer();
  });

  afterEach(() => {
    // Clean up server if needed
  });

  describe('multi-instance coordination', () => {
    it('should coordinate task assignment between multiple instances', async () => {
      // Register multiple developer instances
      const developers = [
        {
          id: 'dev-1',
          type: 'developer' as const,
          status: 'idle' as const,
          capabilities: ['development', 'typescript']
        },
        {
          id: 'dev-2',
          type: 'developer' as const,
          status: 'idle' as const,
          capabilities: ['development', 'testing']
        }
      ];

      // Register both developers
      for (const dev of developers) {
        const response = await server['handlers'].handleMethod('selfie.register', { instance: dev });
        expect(response).toEqual({
          registered: true,
          instanceId: dev.id
        });
      }

      // Request a developer for an issue
      const requestResult = await server['handlers'].handleMethod('selfie.request_developer', {
        issueNumber: 456,
        priority: 'high',
        requirements: ['typescript']
      });

      expect(requestResult).toHaveProperty('taskId');
      expect(requestResult).toHaveProperty('assignedTo');
      expect(['dev-1', 'dev-2']).toContain((requestResult as any).assignedTo);

      // Verify the task was created and assigned
      const taskId = (requestResult as any).taskId;
      const task = await server['handlers'].handleMethod('selfie.get_task', { taskId });
      
      expect(task).toHaveProperty('task');
      expect((task as any).task).toHaveProperty('type', 'develop');
      expect((task as any).task).toHaveProperty('issueNumber', 456);
    });

    it('should handle resource conflicts between instances', async () => {
      // Register two instances
      const instances = [
        {
          id: 'writer-1',
          type: 'developer' as const,
          status: 'idle' as const,
          capabilities: ['development']
        },
        {
          id: 'writer-2',
          type: 'developer' as const,
          status: 'idle' as const,
          capabilities: ['development']
        }
      ];

      for (const instance of instances) {
        await server['handlers'].handleMethod('selfie.register', { instance });
      }

      // First instance claims a file for writing
      const claim1 = await server['handlers'].handleMethod('selfie.claim_resource', {
        resourceType: 'file',
        resourceId: 'src/critical.ts',
        instanceId: 'writer-1',
        operation: 'write'
      });

      expect(claim1).toEqual({ claimed: true });

      // Second instance tries to claim the same file for writing (should conflict)
      const claim2 = await server['handlers'].handleMethod('selfie.claim_resource', {
        resourceType: 'file',
        resourceId: 'src/critical.ts',
        instanceId: 'writer-2',
        operation: 'write'
      });

      expect(claim2).toHaveProperty('claimed', false);
      expect(claim2).toHaveProperty('conflictsWith');
      expect((claim2 as any).conflictsWith).toContain('writer-1');

      // After first instance releases, second should be able to claim
      await server['handlers'].handleMethod('selfie.release_resource', {
        resourceType: 'file',
        resourceId: 'src/critical.ts',
        instanceId: 'writer-1'
      });

      const claim3 = await server['handlers'].handleMethod('selfie.claim_resource', {
        resourceType: 'file',
        resourceId: 'src/critical.ts',
        instanceId: 'writer-2',
        operation: 'write'
      });

      expect(claim3).toEqual({ claimed: true });
    });

    it('should maintain instance state through heartbeats', async () => {
      // Register an instance
      const instance = {
        id: 'heartbeat-test',
        type: 'developer' as const,
        status: 'idle' as const,
        capabilities: ['development'],
        metadata: { version: '1.0.0' }
      };

      await server['handlers'].handleMethod('selfie.register', { instance });

      // Send heartbeat with status change
      const heartbeat1 = await server['handlers'].handleMethod('selfie.heartbeat', {
        instanceId: 'heartbeat-test',
        status: 'busy',
        metadata: { currentTask: 'developing' }
      });

      expect(heartbeat1).toEqual({ acknowledged: true });

      // Verify status was updated
      const instances = await server['handlers'].handleMethod('selfie.list_instances', {
        status: 'busy'
      });

      expect((instances as any).instances).toHaveLength(1);
      expect((instances as any).instances[0].id).toBe('heartbeat-test');
      expect((instances as any).instances[0].status).toBe('busy');
    });

    it('should handle task lifecycle with status updates', async () => {
      // Register instances
      const developer = {
        id: 'lifecycle-dev',
        type: 'developer' as const,
        status: 'idle' as const,
        capabilities: ['development']
      };

      const coordinator = {
        id: 'lifecycle-coord',
        type: 'initializer' as const,
        status: 'idle' as const,
        capabilities: ['coordination']
      };

      await server['handlers'].handleMethod('selfie.register', { instance: developer });
      await server['handlers'].handleMethod('selfie.register', { instance: coordinator });

      // Assign a task
      const task = {
        type: 'develop' as const,
        assignedTo: 'lifecycle-dev',
        assignedBy: 'lifecycle-coord',
        issueNumber: 789
      };

      const assignResult = await server['handlers'].handleMethod('selfie.assign_task', { task });
      const taskId = (assignResult as any).taskId;

      // Update task status through lifecycle
      const statuses = ['in_progress', 'completed'] as const;
      
      for (const status of statuses) {
        const updateResult = await server['handlers'].handleMethod('selfie.update_task_status', {
          taskId,
          status,
          metadata: { updatedBy: 'lifecycle-dev', timestamp: new Date().toISOString() }
        });

        expect(updateResult).toEqual({ updated: true });

        // Verify status was updated
        const getResult = await server['handlers'].handleMethod('selfie.get_task', { taskId });
        expect((getResult as any).task.status).toBe(status);
      }
    });

    it('should coordinate multiple task types across instances', async () => {
      // Register different types of instances
      const instances = [
        {
          id: 'multi-dev',
          type: 'developer' as const,
          status: 'idle' as const,
          capabilities: ['development']
        },
        {
          id: 'multi-reviewer',
          type: 'reviewer' as const,
          status: 'idle' as const,
          capabilities: ['code-review']
        },
        {
          id: 'multi-tester',
          type: 'tester' as const,
          status: 'idle' as const,
          capabilities: ['testing']
        }
      ];

      for (const instance of instances) {
        await server['handlers'].handleMethod('selfie.register', { instance });
      }

      // Create tasks of different types
      const tasks = [
        {
          type: 'develop' as const,
          assignedTo: 'multi-dev',
          assignedBy: 'coordinator',
          issueNumber: 101
        },
        {
          type: 'review' as const,
          assignedTo: 'multi-reviewer',
          assignedBy: 'coordinator',
          pullRequestNumber: 202
        },
        {
          type: 'test' as const,
          assignedTo: 'multi-tester',
          assignedBy: 'coordinator'
        }
      ];

      const taskIds: string[] = [];

      // Assign all tasks
      for (const task of tasks) {
        const result = await server['handlers'].handleMethod('selfie.assign_task', { task });
        taskIds.push((result as any).taskId);
      }

      // Verify all tasks were created with correct types
      for (let i = 0; i < taskIds.length; i++) {
        const getResult = await server['handlers'].handleMethod('selfie.get_task', { 
          taskId: taskIds[i] 
        });
        expect((getResult as any).task.type).toBe(tasks[i].type);
        expect((getResult as any).task.assignedTo).toBe(tasks[i].assignedTo);
      }

      // Test filtering by type
      const devTasks = await server['handlers'].handleMethod('selfie.list_tasks', {
        type: 'develop'
      });
      expect((devTasks as any).tasks).toHaveLength(1);
      expect((devTasks as any).tasks[0].type).toBe('develop');
    });
  });

  describe('error handling and recovery', () => {
    it('should handle invalid method calls gracefully', async () => {
      await expect(
        server['handlers'].handleMethod('invalid.method' as any, {})
      ).rejects.toThrow('Unknown method: invalid.method');
    });

    it('should validate parameters for all methods', async () => {
      // Test registration with invalid instance
      await expect(
        server['handlers'].handleMethod('selfie.register', { 
          instance: { invalid: 'data' } 
        })
      ).rejects.toThrow();

      // Test heartbeat with missing parameters
      await expect(
        server['handlers'].handleMethod('selfie.heartbeat', {})
      ).rejects.toThrow();

      // Test task assignment with invalid task
      await expect(
        server['handlers'].handleMethod('selfie.assign_task', {
          task: { incomplete: 'task' }
        })
      ).rejects.toThrow();
    });

    it('should clean up resources when instances unregister', async () => {
      // Register instance and claim resources
      const instance = {
        id: 'cleanup-test',
        type: 'developer' as const,
        status: 'idle' as const,
        capabilities: ['development']
      };

      await server['handlers'].handleMethod('selfie.register', { instance });

      // Claim multiple resources
      const resources = [
        { resourceType: 'file', resourceId: 'file1.ts' },
        { resourceType: 'branch', resourceId: 'feature/test' },
        { resourceType: 'issue', resourceId: '123' }
      ];

      for (const resource of resources) {
        await server['handlers'].handleMethod('selfie.claim_resource', {
          ...resource,
          instanceId: 'cleanup-test',
          operation: 'work'
        });
      }

      // Unregister the instance
      const unregisterResult = await server['handlers'].handleMethod('selfie.unregister', {
        instanceId: 'cleanup-test'
      });

      expect(unregisterResult).toEqual({ unregistered: true });

      // Verify instance is no longer listed
      const instances = await server['handlers'].handleMethod('selfie.list_instances', {});
      expect((instances as any).instances).toHaveLength(0);

      // Verify resources were cleaned up by trying to claim them again
      const newInstance = {
        id: 'new-claimer',
        type: 'developer' as const,
        status: 'idle' as const,
        capabilities: ['development']
      };

      await server['handlers'].handleMethod('selfie.register', { instance: newInstance });

      // Should be able to claim the resources now
      for (const resource of resources) {
        const claimResult = await server['handlers'].handleMethod('selfie.claim_resource', {
          ...resource,
          instanceId: 'new-claimer',
          operation: 'work'
        });
        expect(claimResult).toEqual({ claimed: true });
      }
    });
  });

  describe('server state and statistics', () => {
    it('should provide accurate server statistics', async () => {
      const stats = server['handlers'].getStats();

      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('instances', 0);
      expect(stats).toHaveProperty('tasks', 0);
      expect(stats).toHaveProperty('resources', 0);
      expect(stats).toHaveProperty('startedAt');
      expect(stats.startedAt).toBeInstanceOf(Date);

      // Register some instances and create tasks
      const instance = {
        id: 'stats-test',
        type: 'developer' as const,
        status: 'idle' as const,
        capabilities: ['development']
      };

      await server['handlers'].handleMethod('selfie.register', { instance });

      const task = {
        type: 'develop' as const,
        assignedTo: 'stats-test',
        assignedBy: 'coordinator'
      };

      await server['handlers'].handleMethod('selfie.assign_task', { task });

      // Check updated stats
      const updatedStats = server['handlers'].getStats();
      expect(updatedStats.instances).toBe(1);
      expect(updatedStats.tasks).toBe(1);
    });

    it('should provide detailed server state for debugging', () => {
      const state = server['handlers'].getState();

      expect(state).toHaveProperty('instances');
      expect(state).toHaveProperty('tasks');
      expect(state).toHaveProperty('resources');

      expect(Array.isArray(state.instances)).toBe(true);
      expect(Array.isArray(state.tasks)).toBe(true);
      expect(Array.isArray(state.resources)).toBe(true);
    });
  });
});