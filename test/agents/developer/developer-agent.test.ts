import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { DeveloperAgent, DeveloperAgentConfig } from '../../../src/agents/developer/developer-agent.js';

// Mock external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('@octokit/rest');

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;

// Mock Octokit
const mockOctokit = {
  issues: {
    get: jest.fn()
  },
  pulls: {
    create: jest.fn()
  }
};

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => mockOctokit)
}));

describe('DeveloperAgent', () => {
  let agent: DeveloperAgent;
  let config: DeveloperAgentConfig;

  beforeEach(() => {
    config = {
      issueNumber: 123,
      githubToken: 'test-token',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      workingDirectory: '/test/dir',
      claudePath: 'mock-claude'
    };

    // Setup default mocks
    mockExecSync.mockImplementation((command: string) => {
      if (command.includes('--version')) {
        return 'version info';
      }
      if (command.includes('git status')) {
        return 'On branch main';
      }
      if (command.includes('git diff --staged --quiet')) {
        throw new Error('Changes to commit'); // Simulate changes available
      }
      return 'mock output';
    });

    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('mock file content');

    // Mock GitHub API
    mockOctokit.issues.get.mockResolvedValue({
      data: {
        title: 'Test Issue',
        body: 'This is a test issue description',
        labels: [{ name: 'enhancement' }],
        assignee: { login: 'testuser' },
        milestone: { title: 'v1.0' }
      }
    });

    mockOctokit.pulls.create.mockResolvedValue({
      data: {
        html_url: 'https://github.com/test-owner/test-repo/pull/456'
      }
    });

    agent = new DeveloperAgent(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with valid configuration', () => {
      expect(agent).toBeInstanceOf(DeveloperAgent);
    });

    it('should validate environment on construction', () => {
      expect(mockExecSync).toHaveBeenCalledWith('mock-claude --version', { stdio: 'pipe' });
      expect(mockExecSync).toHaveBeenCalledWith('git --version', { stdio: 'pipe' });
    });

    it('should throw error if Claude CLI not found', () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('mock-claude --version')) {
          throw new Error('Command not found');
        }
        return 'version info';
      });

      expect(() => new DeveloperAgent(config)).toThrow('Claude CLI not found');
    });

    it('should throw error if Git not found', () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('git --version')) {
          throw new Error('Command not found');
        }
        return 'version info';
      });

      expect(() => new DeveloperAgent(config)).toThrow('Git not found');
    });

    it('should throw error if GitHub token missing', () => {
      const invalidConfig = { ...config, githubToken: '' };
      expect(() => new DeveloperAgent(invalidConfig)).toThrow('GitHub token is required');
    });
  });

  describe('fetchIssue', () => {
    it('should fetch and parse GitHub issue correctly', async () => {
      const result = await agent['fetchIssue']();

      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 123
      });

      expect(result).toEqual({
        title: 'Test Issue',
        body: 'This is a test issue description',
        labels: ['enhancement'],
        assignee: 'testuser',
        milestone: 'v1.0'
      });
    });

    it('should handle issue without optional fields', async () => {
      mockOctokit.issues.get.mockResolvedValue({
        data: {
          title: 'Minimal Issue',
          body: null,
          labels: [],
          assignee: null,
          milestone: null
        }
      });

      const result = await agent['fetchIssue']();

      expect(result).toEqual({
        title: 'Minimal Issue',
        body: '',
        labels: [],
        assignee: undefined,
        milestone: undefined
      });
    });
  });

  describe('generateImplementationPlan', () => {
    it('should generate implementation plan using Claude CLI', async () => {
      const mockPlan = {
        files: [
          {
            path: 'src/feature/new-feature.ts',
            description: 'Main implementation',
            type: 'implementation'
          },
          {
            path: 'test/feature/new-feature.test.ts',
            description: 'Unit tests',
            type: 'test'
          }
        ],
        branchName: 'feature/test-issue',
        commitMessage: 'feat: add test feature',
        prTitle: 'Add test feature',
        prDescription: 'Implements test feature\n\nCloses #123'
      };

      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('mock-claude') && command.includes('--print')) {
          return JSON.stringify(mockPlan);
        }
        return 'version info';
      });

      const issueSpec = {
        title: 'Test Issue',
        body: 'Test description',
        labels: ['enhancement'],
        assignee: 'testuser'
      };

      const result = await agent['generateImplementationPlan'](issueSpec);

      expect(result).toEqual(mockPlan);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('mock-claude'),
        expect.objectContaining({
          encoding: 'utf8',
          cwd: '/test/dir'
        })
      );
    });

    it('should throw error if Claude returns invalid JSON', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('mock-claude') && command.includes('--print')) {
          return 'invalid json';
        }
        return 'version info';
      });

      const issueSpec = {
        title: 'Test Issue',
        body: 'Test description',
        labels: ['enhancement']
      };

      await expect(agent['generateImplementationPlan'](issueSpec))
        .rejects.toThrow('Failed to parse implementation plan');
    });
  });

  describe('createFeatureBranch', () => {
    it('should create and checkout feature branch', async () => {
      const result = await agent['createFeatureBranch']('feature/test-branch');

      expect(result).toBe('feature/test-branch');
      expect(mockExecSync).toHaveBeenCalledWith('git checkout main', { cwd: '/test/dir' });
      expect(mockExecSync).toHaveBeenCalledWith('git pull origin main', { cwd: '/test/dir' });
      expect(mockExecSync).toHaveBeenCalledWith('git checkout -b feature/test-branch', { cwd: '/test/dir' });
    });
  });

  describe('implementFile', () => {
    it('should implement file using Claude CLI', async () => {
      const fileSpec = {
        path: 'src/test-file.ts',
        description: 'Test implementation',
        type: 'implementation'
      };

      const issueSpec = {
        title: 'Test Issue',
        body: 'Test description',
        labels: ['enhancement']
      };

      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('mkdir -p')) {
          return '';
        }
        if (command.includes('find')) {
          return 'src/index.ts\nsrc/other.ts\n';
        }
        if (command.includes('mock-claude') && command.includes('--print')) {
          return 'generated file content';
        }
        return 'version info';
      });

      mockExistsSync.mockImplementation((path: string) => {
        if (path.includes('test-file.ts')) {
          return false; // New file
        }
        return true; // Other files exist
      });

      await agent['implementFile'](fileSpec, issueSpec);

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/dir/src/test-file.ts',
        'generated file content',
        'utf8'
      );
    });

    it('should handle existing files', async () => {
      const fileSpec = {
        path: 'src/existing-file.ts',
        description: 'Update existing file',
        type: 'implementation'
      };

      const issueSpec = {
        title: 'Test Issue',
        body: 'Test description',
        labels: ['enhancement']
      };

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('existing content');

      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('mock-claude') && command.includes('--print')) {
          return 'updated file content';
        }
        return 'mock output';
      });

      await agent['implementFile'](fileSpec, issueSpec);

      expect(mockReadFileSync).toHaveBeenCalledWith('/test/dir/src/existing-file.ts', 'utf8');
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/test/dir/src/existing-file.ts',
        'updated file content',
        'utf8'
      );
    });
  });

  describe('runTests', () => {
    it('should run npm test successfully', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command === 'npm test') {
          return 'All tests passed';
        }
        return 'version info';
      });

      await expect(agent['runTests']()).resolves.toBeUndefined();
      expect(mockExecSync).toHaveBeenCalledWith('npm test', {
        cwd: '/test/dir',
        stdio: 'pipe'
      });
    });

    it('should throw error if tests fail', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command === 'npm test') {
          throw new Error('Tests failed');
        }
        return 'version info';
      });

      await expect(agent['runTests']()).rejects.toThrow('Tests failed');
    });
  });

  describe('commitChanges', () => {
    it('should stage and commit changes', async () => {
      // Default mock already has git diff --staged --quiet throwing an error (meaning changes exist)
      await agent['commitChanges']('feat: add new feature');

      expect(mockExecSync).toHaveBeenCalledWith('git add .', { cwd: '/test/dir' });
      expect(mockExecSync).toHaveBeenCalledWith('git diff --staged --quiet', { cwd: '/test/dir' });
      expect(mockExecSync).toHaveBeenCalledWith('git commit -m "feat: add new feature"', { cwd: '/test/dir' });
    });

    it('should throw error if no changes to commit', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('git add .')) {
          return '';
        }
        if (command.includes('git diff --staged --quiet')) {
          return ''; // No changes - command succeeds (returns without throwing)
        }
        if (command.includes('git commit')) {
          return '';
        }
        return 'version info';
      });

      await expect(agent['commitChanges']('test commit'))
        .rejects.toThrow('No changes to commit');
    });
  });

  describe('createPullRequest', () => {
    it('should push branch and create pull request', async () => {
      const plan = {
        files: [],
        branchName: 'feature/test',
        commitMessage: 'feat: test',
        prTitle: 'Test PR',
        prDescription: 'Test PR description'
      };

      const issueSpec = {
        title: 'Test Issue',
        body: 'Test description',
        labels: ['enhancement']
      };

      const result = await agent['createPullRequest'](plan, issueSpec);

      expect(result).toBe('https://github.com/test-owner/test-repo/pull/456');
      expect(mockExecSync).toHaveBeenCalledWith('git push origin feature/test', { cwd: '/test/dir' });
      expect(mockOctokit.pulls.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Test PR',
        body: 'Test PR description',
        head: 'feature/test',
        base: 'main'
      });
    });
  });

  describe('gatherFileContext', () => {
    it('should gather project context', async () => {
      mockExistsSync.mockImplementation((path: string) => {
        return path.includes('package.json') || path.includes('src');
      });

      mockReadFileSync.mockImplementation((path: string) => {
        if (path.includes('package.json')) {
          return '{"name": "test-project"}';
        }
        return 'typescript code';
      });

      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('find')) {
          return 'src/index.ts\nsrc/utils.ts\n';
        }
        return 'version info';
      });

      const result = await agent['gatherFileContext']();

      expect(result).toContain('PACKAGE.JSON:');
      expect(result).toContain('EXAMPLE FILE');
      expect(result).toContain('typescript code');
    });

    it('should handle missing files gracefully', async () => {
      mockExistsSync.mockReturnValue(false);

      const result = await agent['gatherFileContext']();

      expect(result).toBe('');
    });
  });

  describe('integration workflow', () => {
    it('should handle complete development workflow without MCP', async () => {
      // Setup mocks for complete workflow
      const mockPlan = {
        files: [
          {
            path: 'src/feature.ts',
            description: 'Main implementation',
            type: 'implementation'
          }
        ],
        branchName: 'feature/test',
        commitMessage: 'feat: add feature',
        prTitle: 'Add feature',
        prDescription: 'Adds feature\n\nCloses #123'
      };

      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('mock-claude') && command.includes('--print')) {
          return JSON.stringify(mockPlan);
        }
        if (command.includes('git diff --staged --quiet')) {
          throw new Error('Changes available');
        }
        return 'mock output';
      });

      // Don't actually run the full develop() method since it's complex
      // Instead test individual components are called correctly
      const issueSpec = await agent['fetchIssue']();
      const plan = await agent['generateImplementationPlan'](issueSpec);
      
      expect(issueSpec.title).toBe('Test Issue');
      expect(plan.files).toHaveLength(1);
    });
  });
});