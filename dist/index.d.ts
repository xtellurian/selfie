/**
 * Selfie - Agentic Build System
 * Minimal TypeScript library
 */
export declare function helloWorld(): string;
export declare function getVersion(): string;
export declare function getSystemInfo(): {
    name: string;
    version: string;
    description: string;
};
declare const _default: {
    helloWorld: typeof helloWorld;
    getVersion: typeof getVersion;
    getSystemInfo: typeof getSystemInfo;
};
export default _default;
