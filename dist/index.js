/**
 * Selfie - Agentic Build System
 * Minimal TypeScript library
 */
export function helloWorld() {
    return 'Hello, World! Selfie agentic build system is running.';
}
export function getVersion() {
    return '1.0.0';
}
export function getSystemInfo() {
    return {
        name: 'Selfie',
        version: '1.0.0',
        description: 'Agentic build system that builds itself'
    };
}
// Default export for convenience
export default {
    helloWorld,
    getVersion,
    getSystemInfo
};
