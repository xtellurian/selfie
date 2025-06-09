/**
 * Selfie - Agentic Build System
 * Minimal TypeScript library
 */

export function helloWorld(): string {
  return 'Hello, World! Selfie agentic build system is running.';
}

export function getVersion(): string {
  return '1.0.0';
}

export function getSystemInfo(): { name: string; version: string; description: string } {
  return {
    name: 'Selfie',
    version: '1.0.0',
    description: 'Agentic build system that builds itself'
  };
}

/**
 * Adds two numbers together
 * @param a - First number to add
 * @param b - Second number to add
 * @returns The sum of a and b
 * @throws {TypeError} When either parameter is not a number
 */
export function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both parameters must be numbers');
  }
  
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new RangeError('Parameters must be finite numbers');
  }
  
  return a + b;
}

// Default export for convenience
export default {
  helloWorld,
  getVersion,
  getSystemInfo,
  add
};