import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { InitializerAgent } from '../../../src/agents/initializer/initializer-agent.js';

// Mock the shared utilities
jest.mock('../../../src/agents/shared/github-utils.js');

describe('InitializerAgent', () => {
  let agent: InitializerAgent;
  let mockLogger: Console;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
    } as unknown as Console;

    agent = new InitializerAgent({
      githubToken: 'fake-token',
      owner: 'test-owner',
      repo: 'test-repo',
      pollIntervalMs: 1000, // Short interval for testing
      logger: mockLogger,
    });
    
    // Mock the parseIssueLabels method
    jest.spyOn(agent['githubUtils'], 'parseIssueLabels').mockImplementation((issue: any) => {
      return issue.labels.map((label: any) => typeof label === 'string' ? label : label.name);
    });
  });

  describe('constructor', () => {
    it('should initialize with correct name and options', () => {
      expect(agent.name).toBe('InitializerAgent');
      expect(agent.isRunning).toBe(false);
    });

    it('should use default poll interval', () => {
      const defaultAgent = new InitializerAgent({
        githubToken: 'fake-token',
        owner: 'test-owner',
        repo: 'test-repo',
      });
      
      expect((defaultAgent as any).pollIntervalMs).toBe(30000);
    });
  });

  describe('shouldProcessIssue', () => {
    it('should process issue with agent:developer label', () => {
      const issue = {
        number: 1,
        labels: [{ name: 'agent:developer' }],
      } as any;

      const result = (agent as any).shouldProcessIssue(issue);
      expect(result).toBe(true);
    });

    it('should not process issue without agent:developer label', () => {
      const issue = {
        number: 1,
        labels: [{ name: 'bug' }],
      } as any;

      const result = (agent as any).shouldProcessIssue(issue);
      expect(result).toBe(false);
    });

    it('should not process issue already in progress', () => {
      const issue = {
        number: 1,
        labels: [
          { name: 'agent:developer' },
          { name: 'status:in-progress' }
        ],
      } as any;

      const result = (agent as any).shouldProcessIssue(issue);
      expect(result).toBe(false);
    });

    it('should not process completed issue', () => {
      const issue = {
        number: 1,
        labels: [
          { name: 'agent:developer' },
          { name: 'status:completed' }
        ],
      } as any;

      const result = (agent as any).shouldProcessIssue(issue);
      expect(result).toBe(false);
    });
  });
});