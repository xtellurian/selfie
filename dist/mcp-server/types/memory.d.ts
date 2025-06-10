/**
 * Memory System Types
 *
 * Type definitions for the Selfie memory system that enables
 * persistent knowledge storage and retrieval.
 */
export interface MemoryEntity {
    name: string;
    entityType: string;
    observations: string[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}
export interface MemoryRelation {
    id: string;
    from: string;
    to: string;
    relationType: 'relates_to' | 'caused_by' | 'enables' | 'contradicts' | 'supports' | 'implements' | 'depends_on';
    strength: number;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
export interface MemoryQuery {
    entityName?: string;
    entityType?: string;
    observations?: string;
    limit?: number;
}
export interface MemoryQueryResult {
    entities: MemoryEntity[];
    relations: MemoryRelation[];
    totalResults: number;
}
export interface MemoryMethods {
    'selfie.memory.create_entity': {
        params: {
            name: string;
            entityType: string;
            observations: string[];
            metadata?: Record<string, unknown>;
        };
        result: {
            created: boolean;
            entity: MemoryEntity;
        };
    };
    'selfie.memory.update_entity': {
        params: {
            name: string;
            observations?: string[];
            metadata?: Record<string, unknown>;
        };
        result: {
            updated: boolean;
            entity: MemoryEntity;
        };
    };
    'selfie.memory.create_relation': {
        params: {
            from: string;
            to: string;
            relationType: MemoryRelation['relationType'];
            strength?: number;
            metadata?: Record<string, unknown>;
        };
        result: {
            created: boolean;
            relation: MemoryRelation;
        };
    };
    'selfie.memory.search_entities': {
        params: MemoryQuery;
        result: MemoryQueryResult;
    };
    'selfie.memory.get_entity': {
        params: {
            name: string;
        };
        result: {
            entity: MemoryEntity | null;
            relations: MemoryRelation[];
        };
    };
    'selfie.memory.delete_entity': {
        params: {
            name: string;
        };
        result: {
            deleted: boolean;
        };
    };
}
export type MemoryMethodName = keyof MemoryMethods;
