import { EventEmitter } from 'events';

export interface AgentOptions {
  logger?: typeof console;
  [key: string]: unknown;
}

export abstract class AgentBase extends EventEmitter {
  public readonly name: string;
  public isRunning: boolean = false;
  protected options: AgentOptions;
  protected logger: typeof console;

  constructor(name: string, options: AgentOptions = {}) {
    super();
    this.name = name;
    this.options = options;
    this.logger = options.logger || console;
  }

  async start(): Promise<void> {
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
    } catch (error) {
      this.isRunning = false;
      this.logger.error(`Agent ${this.name} failed:`, error);
      this.emit('error', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info(`Stopping agent: ${this.name}`);
    this.isRunning = false;
    await this.cleanup();
    this.emit('stopped');
  }

  protected async initialize(): Promise<void> {
    // Override in subclasses
  }

  protected abstract run(): Promise<void>;

  protected async cleanup(): Promise<void> {
    // Override in subclasses
  }

  protected log(level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: unknown[]): void {
    this.logger[level](`[${this.name}] ${message}`, ...args);
  }
}