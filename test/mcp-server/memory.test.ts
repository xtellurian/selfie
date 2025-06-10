/**
 * Memory System Tests
 * 
 * Tests for the Selfie memory system functionality
 */

import { MemoryHandlers } from '../../src/mcp-server/handlers/memory.js';
import { MemoryEntity, MemoryRelation } from '../../src/mcp-server/types/memory.js';

describe('Memory System', () => {
  let memoryHandlers: MemoryHandlers;
  let entities: Map<string, MemoryEntity>;
  let relations: Map<string, MemoryRelation>;

  beforeEach(() => {
    entities = new Map();
    relations = new Map();
    memoryHandlers = new MemoryHandlers(entities, relations);
  });

  describe('Entity Management', () => {
    test('should create a new entity', async () => {
      const params = {
        name: 'TestComponent',
        entityType: 'Component',
        observations: ['Handles user authentication', 'Uses JWT tokens'],
        metadata: { source: 'test' }
      };

      const result = await memoryHandlers.handleMethod('selfie.memory.create_entity', params);

      expect(result).toEqual({
        created: true,
        entity: expect.objectContaining({
          name: 'TestComponent',
          entityType: 'Component',
          observations: ['Handles user authentication', 'Uses JWT tokens'],
          metadata: { source: 'test' },
          version: 1
        })
      });

      expect(entities.has('TestComponent')).toBe(true);
    });

    test('should not create duplicate entities', async () => {
      const params = {
        name: 'TestComponent',
        entityType: 'Component',
        observations: ['Initial observation']
      };

      await memoryHandlers.handleMethod('selfie.memory.create_entity', params);

      await expect(
        memoryHandlers.handleMethod('selfie.memory.create_entity', params)
      ).rejects.toThrow('Entity already exists: TestComponent');
    });

    test('should update an existing entity', async () => {
      // Create entity first
      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'TestComponent',
        entityType: 'Component',
        observations: ['Initial observation']
      });

      // Update entity
      const updateParams = {
        name: 'TestComponent',
        observations: ['New observation', 'Another observation'],
        metadata: { updated: true }
      };

      const result = await memoryHandlers.handleMethod('selfie.memory.update_entity', updateParams);

      expect(result).toEqual({
        updated: true,
        entity: expect.objectContaining({
          name: 'TestComponent',
          observations: ['Initial observation', 'New observation', 'Another observation'],
          metadata: { updated: true },
          version: 2
        })
      });
    });

    test('should retrieve a specific entity', async () => {
      // Create entity
      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'TestComponent',
        entityType: 'Component',
        observations: ['Test observation']
      });

      const result = await memoryHandlers.handleMethod('selfie.memory.get_entity', {
        name: 'TestComponent'
      });

      expect(result).toEqual({
        entity: expect.objectContaining({
          name: 'TestComponent',
          entityType: 'Component',
          observations: ['Test observation']
        }),
        relations: []
      });
    });

    test('should delete an entity', async () => {
      // Create entity
      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'TestComponent',
        entityType: 'Component',
        observations: ['Test observation']
      });

      expect(entities.has('TestComponent')).toBe(true);

      const result = await memoryHandlers.handleMethod('selfie.memory.delete_entity', {
        name: 'TestComponent'
      });

      expect(result).toEqual({ deleted: true });
      expect(entities.has('TestComponent')).toBe(false);
    });
  });

  describe('Relationship Management', () => {
    beforeEach(async () => {
      // Create two entities for relationship tests
      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'AuthComponent',
        entityType: 'Component',
        observations: ['Handles authentication']
      });

      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'UserService',
        entityType: 'Service',
        observations: ['Manages user data']
      });
    });

    test('should create a relationship between entities', async () => {
      const params = {
        from: 'AuthComponent',
        to: 'UserService',
        relationType: 'depends_on',
        strength: 0.8,
        metadata: { reason: 'authentication requires user data' }
      };

      const result = await memoryHandlers.handleMethod('selfie.memory.create_relation', params);

      expect(result).toEqual({
        created: true,
        relation: expect.objectContaining({
          from: 'AuthComponent',
          to: 'UserService',
          relationType: 'depends_on',
          strength: 0.8,
          metadata: { reason: 'authentication requires user data' }
        })
      });

      expect(relations.size).toBe(1);
    });

    test('should not create relation with non-existent entities', async () => {
      const params = {
        from: 'NonExistent',
        to: 'UserService',
        relationType: 'depends_on'
      };

      await expect(
        memoryHandlers.handleMethod('selfie.memory.create_relation', params)
      ).rejects.toThrow('Source entity not found: NonExistent');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      // Create test entities
      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'AuthComponent',
        entityType: 'Component',
        observations: ['Handles user authentication', 'Uses JWT tokens']
      });

      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'AuthService',
        entityType: 'Service',
        observations: ['Backend authentication service', 'Validates credentials']
      });

      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'UserInterface',
        entityType: 'Component',
        observations: ['React-based user interface', 'Displays user data']
      });
    });

    test('should search entities by name', async () => {
      const result = await memoryHandlers.handleMethod('selfie.memory.search_entities', {
        entityName: 'Auth'
      });

      expect(result).toEqual({
        entities: expect.arrayContaining([
          expect.objectContaining({ name: 'AuthComponent' }),
          expect.objectContaining({ name: 'AuthService' })
        ]),
        relations: [],
        totalResults: 2
      });
    });

    test('should search entities by type', async () => {
      const result = await memoryHandlers.handleMethod('selfie.memory.search_entities', {
        entityType: 'Component'
      });

      expect(result).toEqual({
        entities: expect.arrayContaining([
          expect.objectContaining({ name: 'AuthComponent', entityType: 'Component' }),
          expect.objectContaining({ name: 'UserInterface', entityType: 'Component' })
        ]),
        relations: [],
        totalResults: 2
      });
    });

    test('should search entities by observations', async () => {
      const result = await memoryHandlers.handleMethod('selfie.memory.search_entities', {
        observations: 'JWT'
      });

      expect(result).toEqual({
        entities: expect.arrayContaining([
          expect.objectContaining({ name: 'AuthComponent' })
        ]),
        relations: [],
        totalResults: 1
      });
    });

    test('should limit search results', async () => {
      const result = await memoryHandlers.handleMethod('selfie.memory.search_entities', {
        limit: 2
      });

      expect(result.totalResults).toBe(2);
      expect(result.entities).toHaveLength(2);
    });
  });

  describe('Integration with Relations', () => {
    test('should include relations in search results', async () => {
      // Create entities
      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'ComponentA',
        entityType: 'Component',
        observations: ['First component']
      });

      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'ComponentB',
        entityType: 'Component',
        observations: ['Second component']
      });

      // Create relation
      await memoryHandlers.handleMethod('selfie.memory.create_relation', {
        from: 'ComponentA',
        to: 'ComponentB',
        relationType: 'depends_on'
      });

      // Search should include the relation
      const result = await memoryHandlers.handleMethod('selfie.memory.search_entities', {
        entityName: 'Component'
      });

      expect(result.relations).toHaveLength(1);
      expect(result.relations[0]).toEqual(
        expect.objectContaining({
          from: 'ComponentA',
          to: 'ComponentB',
          relationType: 'depends_on'
        })
      );
    });

    test('should delete entity relations when entity is deleted', async () => {
      // Create entities and relation
      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'ComponentA',
        entityType: 'Component',
        observations: ['First component']
      });

      await memoryHandlers.handleMethod('selfie.memory.create_entity', {
        name: 'ComponentB',
        entityType: 'Component',
        observations: ['Second component']
      });

      await memoryHandlers.handleMethod('selfie.memory.create_relation', {
        from: 'ComponentA',
        to: 'ComponentB',
        relationType: 'depends_on'
      });

      expect(relations.size).toBe(1);

      // Delete entity
      await memoryHandlers.handleMethod('selfie.memory.delete_entity', {
        name: 'ComponentA'
      });

      // Relation should be gone
      expect(relations.size).toBe(0);
    });
  });
});