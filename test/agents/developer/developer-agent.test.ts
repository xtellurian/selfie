import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DeveloperAgent } from '../../../src/agents/developer/developer-agent.js';

// Mock the shared utilities
jest.mock('../../../src/agents/shared/github-utils.js');

describe('DeveloperAgent', () => {
  let agent: DeveloperAgent;
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

    agent = new DeveloperAgent({
      githubToken: 'fake-token',
      owner: 'test-owner',
      repo: 'test-repo',
      issueNumber: 123,
      logger: mockLogger,
    });
    
    // Mock the parseIssueLabels method
    jest.spyOn(agent['githubUtils'], 'parseIssueLabels').mockImplementation((issue: any) => {
      return issue.labels.map((label: any) => typeof label === 'string' ? label : label.name);
    });
  });

  describe('constructor', () => {
    it('should initialize with correct name and options', () => {
      expect(agent.name).toBe('DeveloperAgent-123');
      expect(agent.isRunning).toBe(false);
      expect((agent as any).issueNumber).toBe(123);
    });
  });

  describe('extractRequirements', () => {
    it('should extract bullet point requirements', () => {
      const body = `
Description of the feature:

- Add new functionality
- Update existing code
- Write tests
      `.trim();

      const result = (agent as any).extractRequirements(body);
      expect(result).toEqual([
        'Add new functionality',
        'Update existing code',
        'Write tests'
      ]);
    });

    it('should extract numbered requirements', () => {
      const body = `
Requirements:
1. Implement feature A
2. Add feature B
3. Test everything
      `.trim();

      const result = (agent as any).extractRequirements(body);
      expect(result).toEqual([
        'Implement feature A',
        'Add feature B',
        'Test everything'
      ]);
    });

    it('should extract asterisk requirements', () => {
      const body = `
Tasks:
* Do this
* Do that
* Do the other thing
      `.trim();

      const result = (agent as any).extractRequirements(body);
      expect(result).toEqual([
        'Do this',
        'Do that',
        'Do the other thing'
      ]);
    });

    it('should use full body if no list items found', () => {
      const body = 'Simple description without lists';

      const result = (agent as any).extractRequirements(body);
      expect(result).toEqual(['Simple description without lists']);
    });
  });

  describe('extractPriority', () => {
    it('should extract high priority', () => {
      const issue = {
        labels: [{ name: 'priority:high' }, { name: 'bug' }]
      } as any;

      const result = (agent as any).extractPriority(issue);
      expect(result).toBe('high');
    });

    it('should extract low priority', () => {
      const issue = {
        labels: [{ name: 'priority:low' }, { name: 'enhancement' }]
      } as any;

      const result = (agent as any).extractPriority(issue);
      expect(result).toBe('low');
    });

    it('should default to medium priority', () => {
      const issue = {
        labels: [{ name: 'bug' }]
      } as any;

      const result = (agent as any).extractPriority(issue);
      expect(result).toBe('medium');
    });
  });

  describe('identifyRequiredFiles', () => {
    it('should identify agent files', () => {
      const spec = {
        description: 'Create a new agent class',
        requirements: [],
        title: 'New Agent',
        priority: 'medium' as const,
      };

      const result = (agent as any).identifyRequiredFiles(spec);
      expect(result).toContain('src/agents/new-agent.ts');
    });

    it('should identify test files', () => {
      const spec = {
        description: 'Add tests for the feature',
        requirements: [],
        title: 'Add Tests',
        priority: 'medium' as const,
      };

      const result = (agent as any).identifyRequiredFiles(spec);
      expect(result).toContain('test/new-feature.test.ts');
    });

    it('should identify utility files', () => {
      const spec = {
        description: 'Create helper utilities',
        requirements: [],
        title: 'Helper Utils',
        priority: 'medium' as const,
      };

      const result = (agent as any).identifyRequiredFiles(spec);
      expect(result).toContain('src/agents/shared/new-utils.ts');
    });
  });

  describe('generatePullRequestBody', () => {
    it('should generate proper PR body', () => {
      const plan = {
        isCompletable: true,
        estimatedComplexity: 'medium' as const,
        requiredFiles: ['src/test.ts', 'test/test.test.ts'],
        steps: ['Step 1', 'Step 2'],
      };

      const result = (agent as any).generatePullRequestBody(plan);
      
      expect(result).toContain('issue #123');
      expect(result).toContain('- Step 1');
      expect(result).toContain('- Step 2');
      expect(result).toContain('- src/test.ts');
      expect(result).toContain('- test/test.test.ts');
      expect(result).toContain('medium');
      expect(result).toContain('🤖 Generated by DeveloperAgent');
    });
  });
});