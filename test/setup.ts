/**
 * Jest test setup file
 * 
 * Global configuration for all tests
 */

// Set NODE_ENV to test for all test runs
process.env.NODE_ENV = 'test';

// Increase Jest timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(() => {
  // Any global setup needed
});

// Global test cleanup
afterAll(() => {
  // Any global cleanup needed
});