/**
 * Memory System Handlers
 *
 * Handlers for memory-related operations in the Selfie MCP server.
 */
import { generateId } from '../utils/index.js';
export class MemoryHandlers {
    entities;
    relations;
    constructor(entities, relations) {
        this.entities = entities;
        this.relations = relations;
    }
    /**
     * Handle memory method calls
     */
    async handleMethod(method, params) {
        const typedParams = params;
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
    async handleCreateEntity(params) {
        const { name, entityType, observations, metadata = {} } = params;
        if (!name || !entityType || !Array.isArray(observations)) {
            throw new Error('Invalid parameters: name, entityType, and observations are required');
        }
        // Check if entity already exists
        if (this.entities.has(name)) {
            throw new Error(`Entity already exists: ${name}`);
        }
        const entity = {
            name: name,
            entityType: entityType,
            observations: observations,
            metadata: metadata,
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
    async handleUpdateEntity(params) {
        const { name, observations, metadata } = params;
        if (!name) {
            throw new Error('Invalid parameters: name is required');
        }
        const entity = this.entities.get(name);
        if (!entity) {
            throw new Error(`Entity not found: ${name}`);
        }
        // Update observations if provided
        if (Array.isArray(observations)) {
            // Add new observations, avoiding duplicates
            const newObservations = observations;
            for (const obs of newObservations) {
                if (!entity.observations.includes(obs)) {
                    entity.observations.push(obs);
                }
            }
        }
        // Update metadata if provided
        if (metadata) {
            entity.metadata = { ...entity.metadata, ...metadata };
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
    async handleCreateRelation(params) {
        const { from, to, relationType, strength = 0.5, metadata = {} } = params;
        if (!from || !to || !relationType) {
            throw new Error('Invalid parameters: from, to, and relationType are required');
        }
        // Verify both entities exist
        if (!this.entities.has(from)) {
            throw new Error(`Source entity not found: ${from}`);
        }
        if (!this.entities.has(to)) {
            throw new Error(`Target entity not found: ${to}`);
        }
        const relation = {
            id: generateId(),
            from: from,
            to: to,
            relationType: relationType,
            strength: Math.max(0, Math.min(1, strength)), // Clamp to 0-1
            metadata: metadata,
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
    async handleSearchEntities(params) {
        const { entityName, entityType, observations, limit = 50 } = params;
        const query = { entityName, entityType, observations, limit };
        let results = Array.from(this.entities.values());
        // Filter by entity name (partial match)
        if (query.entityName) {
            const searchName = query.entityName.toLowerCase();
            results = results.filter(entity => entity.name.toLowerCase().includes(searchName));
        }
        // Filter by entity type
        if (query.entityType) {
            results = results.filter(entity => entity.entityType === query.entityType);
        }
        // Filter by observations (partial match in any observation)
        if (query.observations) {
            const searchText = query.observations.toLowerCase();
            results = results.filter(entity => entity.observations.some(obs => obs.toLowerCase().includes(searchText)));
        }
        // Apply limit
        if (query.limit && query.limit > 0) {
            results = results.slice(0, query.limit);
        }
        // Get related relations for found entities
        const entityNames = new Set(results.map(e => e.name));
        const relatedRelations = Array.from(this.relations.values()).filter(rel => entityNames.has(rel.from) || entityNames.has(rel.to));
        return {
            entities: results,
            relations: relatedRelations,
            totalResults: results.length
        };
    }
    /**
     * Get a specific entity with its relations
     */
    async handleGetEntity(params) {
        const { name } = params;
        if (!name) {
            throw new Error('Invalid parameters: name is required');
        }
        const entity = this.entities.get(name) || null;
        // Get all relations involving this entity
        const relations = Array.from(this.relations.values()).filter(rel => rel.from === name || rel.to === name);
        return {
            entity,
            relations
        };
    }
    /**
     * Delete an entity and its relations
     */
    async handleDeleteEntity(params) {
        const { name } = params;
        if (!name) {
            throw new Error('Invalid parameters: name is required');
        }
        const existed = this.entities.delete(name);
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
