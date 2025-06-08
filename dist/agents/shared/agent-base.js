import { EventEmitter } from 'events';
export class AgentBase extends EventEmitter {
    name;
    isRunning = false;
    options;
    logger;
    constructor(name, options = {}) {
        super();
        this.name = name;
        this.options = options;
        this.logger = options.logger || console;
    }
    async start() {
        if (this.isRunning) {
            this.logger.warn(`Agent ${this.name} is already running`);
            return;
        }
        this.logger.info(`Starting agent: ${this.name}`);
        this.isRunning = true;
        this.emit('started');
        try {
            await this.initialize();
            await this.run();
        }
        catch (error) {
            this.isRunning = false;
            this.logger.error(`Agent ${this.name} failed:`, error);
            this.emit('error', error);
            throw error;
        }
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.logger.info(`Stopping agent: ${this.name}`);
        this.isRunning = false;
        await this.cleanup();
        this.emit('stopped');
    }
    async initialize() {
        // Override in subclasses
    }
    async cleanup() {
        // Override in subclasses
    }
    log(level, message, ...args) {
        this.logger[level](`[${this.name}] ${message}`, ...args);
    }
}
