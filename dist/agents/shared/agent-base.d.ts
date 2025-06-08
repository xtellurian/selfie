import { EventEmitter } from 'events';
export interface AgentOptions {
    logger?: typeof console;
    [key: string]: unknown;
}
export declare abstract class AgentBase extends EventEmitter {
    readonly name: string;
    isRunning: boolean;
    protected options: AgentOptions;
    protected logger: typeof console;
    constructor(name: string, options?: AgentOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    protected initialize(): Promise<void>;
    protected abstract run(): Promise<void>;
    protected cleanup(): Promise<void>;
    protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: unknown[]): void;
}
