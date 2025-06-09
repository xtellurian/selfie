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
 * Logs a hello message to the console with the provided name
 * @param name - The name to include in the hello message
 */
export function hello(name: string): void {
  console.log(`hello ${name}`);
}

// Default export for convenience
export default {
  helloWorld,
  getVersion,
  getSystemInfo,
  hello
};