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

export function multiply(a: number, b: number): number {
  return a * b;
}

// Default export for convenience
export default {
  helloWorld,
  getVersion,
  getSystemInfo,
  multiply
};