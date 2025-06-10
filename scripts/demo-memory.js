#!/usr/bin/env node

/**
 * Selfie Memory System Demo
 * 
 * Demonstrates the basic functionality of the Selfie memory system
 * by creating entities, relations, and performing searches.
 */

import { SelfieMCPServer } from '../dist/mcp-server/index.js';

async function demoMemorySystem() {
  console.log('🧠 Selfie Memory System Demo\n');

  const server = new SelfieMCPServer();
  
  // Create sample entities
  console.log('📝 Creating memory entities...');
  
  const authComponentResult = await server.handlers.handleMethod('selfie.memory.create_entity', {
    name: 'AuthComponent',
    entityType: 'Component',
    observations: [
      'Handles user authentication using JWT tokens',
      'Validates user credentials against database',
      'Provides login and logout functionality',
      'Implements session management'
    ],
    metadata: { 
      file: 'src/components/AuthComponent.ts',
      lastModified: new Date().toISOString()
    }
  });
  
  const userServiceResult = await server.handlers.handleMethod('selfie.memory.create_entity', {
    name: 'UserService',
    entityType: 'Service',
    observations: [
      'Backend service for user management',
      'Stores user data in PostgreSQL database',
      'Provides CRUD operations for user accounts',
      'Handles password hashing and validation'
    ],
    metadata: { 
      file: 'src/services/UserService.ts',
      dependencies: ['bcrypt', 'pg']
    }
  });

  const databaseResult = await server.handlers.handleMethod('selfie.memory.create_entity', {
    name: 'UserDatabase',
    entityType: 'Database',
    observations: [
      'PostgreSQL database for user storage',
      'Contains users table with id, email, password_hash columns',
      'Uses indexing on email field for performance',
      'Implements foreign key constraints'
    ],
    metadata: { 
      schema: 'public',
      table: 'users'
    }
  });

  console.log('✅ Created entities: AuthComponent, UserService, UserDatabase\n');

  // Create relationships
  console.log('🔗 Creating relationships...');
  
  await server.handlers.handleMethod('selfie.memory.create_relation', {
    from: 'AuthComponent',
    to: 'UserService',
    relationType: 'depends_on',
    strength: 0.9,
    metadata: { reason: 'Authentication requires user validation' }
  });

  await server.handlers.handleMethod('selfie.memory.create_relation', {
    from: 'UserService',
    to: 'UserDatabase',
    relationType: 'depends_on',
    strength: 0.8,
    metadata: { reason: 'Service stores data in database' }
  });

  await server.handlers.handleMethod('selfie.memory.create_relation', {
    from: 'AuthComponent',
    to: 'UserDatabase',
    relationType: 'relates_to',
    strength: 0.6,
    metadata: { reason: 'Component indirectly uses database via service' }
  });

  console.log('✅ Created relationships between entities\n');

  // Demonstrate search functionality
  console.log('🔍 Searching memory...');
  
  // Search by entity type
  const componentSearch = await server.handlers.handleMethod('selfie.memory.search_entities', {
    entityType: 'Component'
  });
  console.log(`📊 Found ${componentSearch.totalResults} components:`);
  componentSearch.entities.forEach(entity => {
    console.log(`  - ${entity.name}: ${entity.observations.length} observations`);
  });
  console.log();

  // Search by observations
  const jwtSearch = await server.handlers.handleMethod('selfie.memory.search_entities', {
    observations: 'JWT'
  });
  console.log(`📊 Found ${jwtSearch.totalResults} entities mentioning JWT:`);
  jwtSearch.entities.forEach(entity => {
    console.log(`  - ${entity.name} (${entity.entityType})`);
  });
  console.log();

  // Search by name pattern
  const userSearch = await server.handlers.handleMethod('selfie.memory.search_entities', {
    entityName: 'User'
  });
  console.log(`📊 Found ${userSearch.totalResults} entities with 'User' in name:`);
  userSearch.entities.forEach(entity => {
    console.log(`  - ${entity.name} (${entity.entityType})`);
  });
  console.log();

  // Get specific entity with relations
  console.log('🎯 Getting AuthComponent with relationships...');
  const authDetails = await server.handlers.handleMethod('selfie.memory.get_entity', {
    name: 'AuthComponent'
  });
  
  if (authDetails.entity) {
    console.log(`📋 Entity: ${authDetails.entity.name}`);
    console.log(`   Type: ${authDetails.entity.entityType}`);
    console.log(`   Observations: ${authDetails.entity.observations.length}`);
    console.log(`   Version: ${authDetails.entity.version}`);
    console.log(`   Relations: ${authDetails.relations.length}`);
    authDetails.relations.forEach(rel => {
      console.log(`     - ${rel.relationType} → ${rel.to} (strength: ${rel.strength})`);
    });
  }
  console.log();

  // Update entity with new observations
  console.log('📝 Updating AuthComponent with new observations...');
  await server.handlers.handleMethod('selfie.memory.update_entity', {
    name: 'AuthComponent',
    observations: [
      'Added support for OAuth 2.0 authentication',
      'Implements rate limiting for login attempts'
    ],
    metadata: { 
      lastUpdated: new Date().toISOString(),
      updatedBy: 'memory-demo'
    }
  });

  const updatedAuth = await server.handlers.handleMethod('selfie.memory.get_entity', {
    name: 'AuthComponent'
  });
  console.log(`✅ AuthComponent now has ${updatedAuth.entity.observations.length} observations (v${updatedAuth.entity.version})\n`);

  // Show final statistics
  const allEntities = await server.handlers.handleMethod('selfie.memory.search_entities', {});
  console.log('📈 Memory System Statistics:');
  console.log(`   Total entities: ${allEntities.totalResults}`);
  console.log(`   Total relations: ${allEntities.relations.length}`);
  
  const typeStats = {};
  allEntities.entities.forEach(entity => {
    typeStats[entity.entityType] = (typeStats[entity.entityType] || 0) + 1;
  });
  console.log('   Entity types:');
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`     - ${type}: ${count}`);
  });

  console.log('\n🎉 Memory system demo completed successfully!');
}

// Run the demo
demoMemorySystem()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });