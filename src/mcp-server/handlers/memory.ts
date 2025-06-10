/**
 * Memory System Handlers
 * 
 * Handlers for memory-related operations in the Selfie MCP server.
 */

import {
  MemoryEntity,
  MemoryRelation,
  MemoryQuery,
  MemoryQueryResult,
  MemoryMethods,
  MemoryMethodName
} from '../types/memory.js';
import { generateId } from '../utils/index.js';

export class MemoryHandlers {
  private entities: Map<string, MemoryEntity>;
  private relations: Map<string, MemoryRelation>;

  constructor(
    entities: Map<string, MemoryEntity>,
    relations: Map<string, MemoryRelation>
  ) {
    this.entities = entities;
    this.relations = relations;
  }

  /**
   * Handle memory method calls
   */
  async handleMethod(method: MemoryMethodName, params: unknown): Promise<unknown> {
    const typedParams = params as Record<string, unknown>;

    switch (method) {
      case 'selfie.memory.create_entity':
        return this.handleCreateEntity(typedParams);
      case 'selfie.memory.update_entity':
        return this.handleUpdateEntity(typedParams);
      case 'selfie.memory.create_relation':
        return this.handleCreateRelation(typedParams);
      case 'selfie.memory.search_entities':
        return this.handleSearchEntities(typedParams);
      case 'selfie.memory.get_entity':
        return this.handleGetEntity(typedParams);
      case 'selfie.memory.delete_entity':
        return this.handleDeleteEntity(typedParams);
      default:
        throw new Error(`Unknown memory method: ${method}`);
    }
  }

  /**
   * Create a new memory entity
   */
  private async handleCreateEntity(params: Record<string, unknown>): Promise<MemoryMethods['selfie.memory.create_entity']['result']> {
    const { name, entityType, observations, metadata = {} } = params;

    if (!name || !entityType || !Array.isArray(observations)) {
      throw new Error('Invalid parameters: name, entityType, and observations are required');
    }

    // Check if entity already exists
    if (this.entities.has(name as string)) {
      throw new Error(`Entity already exists: ${name}`);
    }

    const entity: MemoryEntity = {
      name: name as string,
      entityType: entityType as string,
      observations: observations as string[],
      metadata: metadata as Record<string, unknown>,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    this.entities.set(entity.name, entity);
    console.log(`Memory entity created: ${entity.name} (${entity.entityType})`);

    return {
      created: true,
      entity
    };
  }

  /**
   * Update an existing memory entity
   */
  private async handleUpdateEntity(params: Record<string, unknown>): Promise<MemoryMethods['selfie.memory.update_entity']['result']> {
    const { name, observations, metadata } = params;

    if (!name) {
      throw new Error('Invalid parameters: name is required');
    }

    const entity = this.entities.get(name as string);
    if (!entity) {
      throw new Error(`Entity not found: ${name}`);
    }

    // Update observations if provided
    if (Array.isArray(observations)) {
      // Add new observations, avoiding duplicates
      const newObservations = observations as string[];
      for (const obs of newObservations) {
        if (!entity.observations.includes(obs)) {
          entity.observations.push(obs);
        }
      }
    }

    // Update metadata if provided
    if (metadata) {
      entity.metadata = { ...entity.metadata, ...metadata as Record<string, unknown> };
    }

    entity.updatedAt = new Date();
    entity.version += 1;

    console.log(`Memory entity updated: ${entity.name} (v${entity.version})`);

    return {
      updated: true,
      entity
    };
  }

  /**
   * Create a relation between entities
   */
  private async handleCreateRelation(params: Record<string, unknown>): Promise<MemoryMethods['selfie.memory.create_relation']['result']> {
    const { from, to, relationType, strength = 0.5, metadata = {} } = params;

    if (!from || !to || !relationType) {
      throw new Error('Invalid parameters: from, to, and relationType are required');
    }

    // Verify both entities exist
    if (!this.entities.has(from as string)) {
      throw new Error(`Source entity not found: ${from}`);
    }
    if (!this.entities.has(to as string)) {
      throw new Error(`Target entity not found: ${to}`);
    }

    const relation: MemoryRelation = {
      id: generateId(),
      from: from as string,
      to: to as string,
      relationType: relationType as MemoryRelation['relationType'],
      strength: Math.max(0, Math.min(1, strength as number)), // Clamp to 0-1
      metadata: metadata as Record<string, unknown>,
      createdAt: new Date()
    };

    this.relations.set(relation.id, relation);
    console.log(`Memory relation created: ${from} -[${relationType}]-> ${to}`);

    return {
      created: true,
      relation
    };
  }

  /**
   * Search entities based on query parameters
   */
  private async handleSearchEntities(params: Record<string, unknown>): Promise<MemoryMethods['selfie.memory.search_entities']['result']> {
    const { entityName, entityType, observations, limit = 50 } = params;
    const query: MemoryQuery = { entityName, entityType, observations, limit } as MemoryQuery;

    let results = Array.from(this.entities.values());

    // Filter by entity name (partial match)
    if (query.entityName) {
      const searchName = query.entityName.toLowerCase();
      results = results.filter(entity => 
        entity.name.toLowerCase().includes(searchName)
      );
    }

    // Filter by entity type
    if (query.entityType) {
      results = results.filter(entity => 
        entity.entityType === query.entityType
      );
    }

    // Filter by observations (partial match in any observation)
    if (query.observations) {
      const searchText = query.observations.toLowerCase();
      results = results.filter(entity =>
        entity.observations.some(obs => 
          obs.toLowerCase().includes(searchText)
        )
      );
    }

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    // Get related relations for found entities
    const entityNames = new Set(results.map(e => e.name));
    const relatedRelations = Array.from(this.relations.values()).filter(rel =>
      entityNames.has(rel.from) || entityNames.has(rel.to)
    );

    return {
      entities: results,
      relations: relatedRelations,
      totalResults: results.length
    };
  }

  /**
   * Get a specific entity with its relations
   */
  private async handleGetEntity(params: Record<string, unknown>): Promise<MemoryMethods['selfie.memory.get_entity']['result']> {
    const { name } = params;

    if (!name) {
      throw new Error('Invalid parameters: name is required');
    }

    const entity = this.entities.get(name as string) || null;
    
    // Get all relations involving this entity
    const relations = Array.from(this.relations.values()).filter(rel =>
      rel.from === name || rel.to === name
    );

    return {
      entity,
      relations
    };
  }

  /**
   * Delete an entity and its relations
   */
  private async handleDeleteEntity(params: Record<string, unknown>): Promise<MemoryMethods['selfie.memory.delete_entity']['result']> {
    const { name } = params;

    if (!name) {
      throw new Error('Invalid parameters: name is required');
    }

    const existed = this.entities.delete(name as string);

    if (existed) {
      // Remove all relations involving this entity
      for (const [relationId, relation] of this.relations) {
        if (relation.from === name || relation.to === name) {
          this.relations.delete(relationId);
        }
      }
      console.log(`Memory entity deleted: ${name}`);
    }

    return {
      deleted: existed
    };
  }
}