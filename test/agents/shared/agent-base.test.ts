import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AgentBase } from '../../../src/agents/shared/agent-base.js';

class TestAgent extends AgentBase {
  public runCalled = false;
  public initializeCalled = false;
  public cleanupCalled = false;
  public runMethod?: jest.Mock;

  protected async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  protected async run(): Promise<void> {
    this.runCalled = true;
    if (this.runMethod) {
      await this.runMethod();
    }
  }

  protected async cleanup(): Promise<void> {
    this.cleanupCalled = true;
  }
}

describe('AgentBase', () => {
  let agent: TestAgent;
  let mockLogger: Console;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
    } as unknown as Console;

    agent = new TestAgent('TestAgent', { logger: mockLogger });
  });

  describe('constructor', () => {
    it('should initialize with correct name and options', () => {
      expect(agent.name).toBe('TestAgent');
      expect(agent.isRunning).toBe(false);
    });

    it('should use console as default logger', () => {
      const agentWithoutLogger = new TestAgent('Test');
      expect(agentWithoutLogger['logger']).toBe(console);
    });
  });

  describe('start', () => {
    it('should start agent successfully', async () => {
      await agent.start();

      expect(agent.isRunning).toBe(true);
      expect(agent.initializeCalled).toBe(true);
      expect(agent.runCalled).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Starting agent: TestAgent');
    });

    it('should not start if already running', async () => {
      agent.isRunning = true;

      await agent.start();

      expect(agent.initializeCalled).toBe(false);
      expect(agent.runCalled).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Agent TestAgent is already running');
    });

    it('should handle errors during start', async () => {
      const error = new Error('Test error');
      agent.runMethod = jest.fn().mockRejectedValue(error);

      await expect(agent.start()).rejects.toThrow('Test error');
      expect(mockLogger.error).toHaveBeenCalledWith('Agent TestAgent failed:', error);
    });
  });

  describe('stop', () => {
    it('should stop agent successfully', async () => {
      agent.isRunning = true;

      await agent.stop();

      expect(agent.isRunning).toBe(false);
      expect(agent.cleanupCalled).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Stopping agent: TestAgent');
    });

    it('should not stop if not running', async () => {
      await agent.stop();

      expect(agent.cleanupCalled).toBe(false);
    });
  });

  describe('events', () => {
    it('should emit started event', async () => {
      const startedSpy = jest.fn();
      (agent as any).on('started', startedSpy);

      await agent.start();

      expect(startedSpy).toHaveBeenCalled();
    });

    it('should emit stopped event', async () => {
      const stoppedSpy = jest.fn();
      (agent as any).on('stopped', stoppedSpy);
      agent.isRunning = true;

      await agent.stop();

      expect(stoppedSpy).toHaveBeenCalled();
    });

    it('should emit error event on failure', async () => {
      const errorSpy = jest.fn();
      const error = new Error('Test error');
      (agent as any).on('error', errorSpy);
      agent.runMethod = jest.fn().mockRejectedValue(error);

      await expect(agent.start()).rejects.toThrow(error);
      expect(errorSpy).toHaveBeenCalledWith(error);
    });
  });
});