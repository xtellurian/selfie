/**
 * Memory System Handlers
 *
 * Handlers for memory-related operations in the Selfie MCP server.
 */
import { MemoryEntity, MemoryRelation, MemoryMethodName } from '../types/memory.js';
export declare class MemoryHandlers {
    private entities;
    private relations;
    constructor(entities: Map<string, MemoryEntity>, relations: Map<string, MemoryRelation>);
    /**
     * Handle memory method calls
     */
    handleMethod(method: MemoryMethodName, params: unknown): Promise<unknown>;
    /**
     * Create a new memory entity
     */
    private handleCreateEntity;
    /**
     * Update an existing memory entity
     */
    private handleUpdateEntity;
    /**
     * Create a relation between entities
     */
    private handleCreateRelation;
    /**
     * Search entities based on query parameters
     */
    private handleSearchEntities;
    /**
     * Get a specific entity with its relations
     */
    private handleGetEntity;
    /**
     * Delete an entity and its relations
     */
    private handleDeleteEntity;
}
