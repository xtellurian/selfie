import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GitHubUtils } from '../../../src/agents/shared/github-utils.js';

// Mock @octokit/rest
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    issues: {
      listForRepo: jest.fn(),
      get: jest.fn(),
      createComment: jest.fn(),
    },
    pulls: {
      create: jest.fn(),
      list: jest.fn(),
    },
    repos: {
      getBranch: jest.fn(),
      get: jest.fn(),
    },
    git: {
      createRef: jest.fn(),
      deleteRef: jest.fn(),
    },
  })),
}));

describe('GitHubUtils', () => {
  let githubUtils: GitHubUtils;
  let mockOctokit: any;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console.error to suppress expected error logs in tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    githubUtils = new GitHubUtils('fake-token', 'test-owner', 'test-repo');
    mockOctokit = (githubUtils as any).octokit;
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with correct parameters', () => {
      expect(githubUtils).toBeInstanceOf(GitHubUtils);
      expect((githubUtils as any).owner).toBe('test-owner');
      expect((githubUtils as any).repo).toBe('test-repo');
    });
  });

  describe('getIssues', () => {
    it('should fetch issues with default parameters', async () => {
      const mockIssues = [
        { number: 1, title: 'Test Issue', labels: [] },
      ];
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues });

      const result = await githubUtils.getIssues();

      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        labels: '',
        state: 'open',
      });
      expect(result).toEqual(mockIssues);
    });

    it('should fetch issues with custom labels and state', async () => {
      const mockIssues = [
        { number: 2, title: 'Bug Issue', labels: [{ name: 'bug' }] },
      ];
      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues });

      const result = await githubUtils.getIssues(['bug', 'priority:high'], 'closed');

      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        labels: 'bug,priority:high',
        state: 'closed',
      });
      expect(result).toEqual(mockIssues);
    });

    it('should handle errors', async () => {
      const error = new Error('API Error');
      mockOctokit.issues.listForRepo.mockRejectedValue(error);

      await expect(githubUtils.getIssues()).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching issues:', error);
    });
  });

  describe('getIssue', () => {
    it('should fetch single issue', async () => {
      const mockIssue = { number: 1, title: 'Test Issue', labels: [] };
      mockOctokit.issues.get.mockResolvedValue({ data: mockIssue });

      const result = await githubUtils.getIssue(1);

      expect(mockOctokit.issues.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
      });
      expect(result).toEqual(mockIssue);
    });

    it('should handle errors', async () => {
      const error = new Error('Issue not found');
      mockOctokit.issues.get.mockRejectedValue(error);

      await expect(githubUtils.getIssue(1)).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching issue #1:', error);
    });
  });

  describe('createIssueComment', () => {
    it('should create comment successfully', async () => {
      const mockComment = { id: 123, html_url: 'https://github.com/test/comment' };
      mockOctokit.issues.createComment.mockResolvedValue({ data: mockComment });

      const result = await githubUtils.createIssueComment(1, 'Test comment');

      expect(mockOctokit.issues.createComment).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        issue_number: 1,
        body: 'Test comment',
      });
      expect(result).toEqual({ id: 123, html_url: 'https://github.com/test/comment' });
    });

    it('should handle errors', async () => {
      const error = new Error('Comment creation failed');
      mockOctokit.issues.createComment.mockRejectedValue(error);

      await expect(githubUtils.createIssueComment(1, 'Test comment')).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating comment on issue #1:', error);
    });
  });

  describe('createPullRequest', () => {
    it('should create pull request successfully', async () => {
      const mockPR = {
        number: 10,
        title: 'Test PR',
        html_url: 'https://github.com/test/pr',
      };
      mockOctokit.pulls.create.mockResolvedValue({ data: mockPR });

      const result = await githubUtils.createPullRequest(
        'Test PR',
        'feature-branch',
        'main',
        'PR description'
      );

      expect(mockOctokit.pulls.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Test PR',
        head: 'feature-branch',
        base: 'main',
        body: 'PR description',
      });
      expect(result).toEqual(mockPR);
    });

    it('should handle errors', async () => {
      const error = new Error('PR creation failed');
      mockOctokit.pulls.create.mockRejectedValue(error);

      await expect(githubUtils.createPullRequest(
        'Test PR',
        'feature-branch',
        'main',
        'PR description'
      )).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating pull request:', error);
    });
  });

  describe('parseIssueLabels', () => {
    it('should parse string labels', () => {
      const issue = {
        labels: ['bug', 'enhancement'],
      } as any;

      const result = githubUtils.parseIssueLabels(issue);
      expect(result).toEqual(['bug', 'enhancement']);
    });

    it('should parse object labels', () => {
      const issue = {
        labels: [{ name: 'bug' }, { name: 'enhancement' }],
      } as any;

      const result = githubUtils.parseIssueLabels(issue);
      expect(result).toEqual(['bug', 'enhancement']);
    });

    it('should parse mixed labels', () => {
      const issue = {
        labels: ['bug', { name: 'enhancement' }],
      } as any;

      const result = githubUtils.parseIssueLabels(issue);
      expect(result).toEqual(['bug', 'enhancement']);
    });
  });

  describe('createBranch', () => {
    it('should create branch from main by default', async () => {
      const notFoundError = { status: 404 };
      const sourceBranch = { data: { commit: { sha: 'abc123' } } };
      
      // First call checks if target branch exists (should return 404)
      // Second call gets the source branch
      mockOctokit.repos.getBranch
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce(sourceBranch);
      mockOctokit.git.createRef.mockResolvedValue({});

      await githubUtils.createBranch('feature-branch');

      // First call should check if target branch exists
      expect(mockOctokit.repos.getBranch).toHaveBeenNthCalledWith(1, {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'feature-branch',
      });
      // Second call should get source branch
      expect(mockOctokit.repos.getBranch).toHaveBeenNthCalledWith(2, {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main',
      });
      expect(mockOctokit.git.createRef).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'refs/heads/feature-branch',
        sha: 'abc123',
      });
    });

    it('should create branch from specified source branch', async () => {
      const notFoundError = { status: 404 };
      const sourceBranch = { data: { commit: { sha: 'def456' } } };
      
      // First call checks if target branch exists (should return 404)
      // Second call gets the source branch
      mockOctokit.repos.getBranch
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce(sourceBranch);
      mockOctokit.git.createRef.mockResolvedValue({});

      await githubUtils.createBranch('feature-branch', 'develop');

      // First call should check if target branch exists
      expect(mockOctokit.repos.getBranch).toHaveBeenNthCalledWith(1, {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'feature-branch',
      });
      // Second call should get source branch
      expect(mockOctokit.repos.getBranch).toHaveBeenNthCalledWith(2, {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'develop',
      });
    });

    it('should handle existing branch gracefully', async () => {
      const mockExistingBranch = { data: { commit: { sha: 'existing123' } } };
      mockOctokit.repos.getBranch.mockResolvedValue(mockExistingBranch);

      // Should not throw when branch already exists
      await expect(githubUtils.createBranch('existing-branch')).resolves.not.toThrow();
      
      // Should only call getBranch once (to check if branch exists)
      expect(mockOctokit.repos.getBranch).toHaveBeenCalledTimes(1);
      expect(mockOctokit.repos.getBranch).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'existing-branch',
      });
      
      // Should not call createRef since branch exists
      expect(mockOctokit.git.createRef).not.toHaveBeenCalled();
    });

    it('should handle reference already exists error gracefully', async () => {
      const notFoundError = { status: 404 };
      const sourceBranch = { data: { commit: { sha: 'abc123' } } };
      const alreadyExistsError = { 
        status: 422, 
        message: 'Reference already exists'
      };

      // First call to check if branch exists returns 404 (doesn't exist)
      // Second call to get source branch succeeds
      // Third call to create ref fails with "already exists"
      mockOctokit.repos.getBranch
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce(sourceBranch);
      mockOctokit.git.createRef.mockRejectedValue(alreadyExistsError);

      // Should not throw when reference already exists
      await expect(githubUtils.createBranch('feature-branch')).resolves.not.toThrow();
    });

    it('should handle errors', async () => {
      const error = new Error('Branch creation failed');
      mockOctokit.repos.getBranch.mockRejectedValue(error);

      await expect(githubUtils.createBranch('feature-branch')).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating branch feature-branch:', error);
    });
  });

  describe('createPullRequestWithBranch', () => {
    it('should create branch and then pull request', async () => {
      const notFoundError = { status: 404 };
      const sourceBranch = { data: { commit: { sha: 'abc123' } } };
      const mockPR = {
        number: 10,
        title: 'Test PR',
        html_url: 'https://github.com/test/pr',
      };
      
      // First call checks if target branch exists (should return 404)
      // Second call gets the source branch
      mockOctokit.repos.getBranch
        .mockRejectedValueOnce(notFoundError)
        .mockResolvedValueOnce(sourceBranch);
      mockOctokit.git.createRef.mockResolvedValue({});
      mockOctokit.pulls.create.mockResolvedValue({ data: mockPR });

      const result = await githubUtils.createPullRequestWithBranch(
        'Test PR',
        'feature-branch',
        'main',
        'PR description'
      );

      // First call should check if target branch exists
      expect(mockOctokit.repos.getBranch).toHaveBeenNthCalledWith(1, {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'feature-branch',
      });
      // Second call should get source branch
      expect(mockOctokit.repos.getBranch).toHaveBeenNthCalledWith(2, {
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'main',
      });
      expect(mockOctokit.git.createRef).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'refs/heads/feature-branch',
        sha: 'abc123',
      });
      expect(mockOctokit.pulls.create).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        title: 'Test PR',
        head: 'feature-branch',
        base: 'main',
        body: 'PR description',
      });
      expect(result).toEqual(mockPR);
    });

    it('should handle existing PR gracefully', async () => {
      const mockBranch = { data: { commit: { sha: 'abc123' } } };
      const existingPR = {
        number: 5,
        title: 'Existing PR',
        html_url: 'https://github.com/test/existing-pr',
      };
      const prExistsError = { 
        status: 422, 
        message: 'A pull request already exists'
      };

      // Branch doesn't exist, so it gets created
      mockOctokit.repos.getBranch
        .mockRejectedValueOnce({ status: 404 })  // Branch check fails
        .mockResolvedValueOnce(mockBranch);       // Source branch exists
      mockOctokit.git.createRef.mockResolvedValue({});
      
      // PR creation fails because it already exists
      mockOctokit.pulls.create.mockRejectedValue(prExistsError);
      
      // Finding existing PR succeeds
      mockOctokit.pulls.list.mockResolvedValue({ data: [existingPR] });

      const result = await githubUtils.createPullRequestWithBranch(
        'Test PR',
        'feature-branch',
        'main',
        'PR description'
      );

      expect(result).toEqual(existingPR);
      expect(mockOctokit.pulls.list).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        head: 'test-owner:feature-branch',
        base: 'main',
        state: 'open'
      });
    });

    it('should handle errors', async () => {
      const error = new Error('PR with branch creation failed');
      mockOctokit.repos.getBranch.mockRejectedValue(error);

      await expect(githubUtils.createPullRequestWithBranch(
        'Test PR',
        'feature-branch',
        'main',
        'PR description'
      )).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating pull request with branch:', error);
    });
  });

  describe('getCurrentBranch', () => {
    it('should return default branch', async () => {
      const mockRepo = { data: { default_branch: 'main' } };
      mockOctokit.repos.get.mockResolvedValue(mockRepo);

      const result = await githubUtils.getCurrentBranch();

      expect(mockOctokit.repos.get).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
      });
      expect(result).toBe('main');
    });

    it('should handle errors', async () => {
      const error = new Error('Repo not found');
      mockOctokit.repos.get.mockRejectedValue(error);

      await expect(githubUtils.getCurrentBranch()).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error getting current branch:', error);
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch successfully', async () => {
      mockOctokit.git.deleteRef.mockResolvedValue({});

      await githubUtils.deleteBranch('feature-branch');

      expect(mockOctokit.git.deleteRef).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        ref: 'heads/feature-branch',
      });
    });

    it('should handle errors', async () => {
      const error = new Error('Delete failed');
      mockOctokit.git.deleteRef.mockRejectedValue(error);

      await expect(githubUtils.deleteBranch('feature-branch')).rejects.toThrow(error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting branch feature-branch:', error);
    });
  });

  describe('branchExists', () => {
    it('should return true when branch exists', async () => {
      const mockBranch = { data: { name: 'feature-branch' } };
      mockOctokit.repos.getBranch.mockResolvedValue(mockBranch);

      const result = await githubUtils.branchExists('feature-branch');

      expect(mockOctokit.repos.getBranch).toHaveBeenCalledWith({
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'feature-branch',
      });
      expect(result).toBe(true);
    });

    it('should return false when branch does not exist', async () => {
      const notFoundError = { status: 404 };
      mockOctokit.repos.getBranch.mockRejectedValue(notFoundError);

      const result = await githubUtils.branchExists('feature-branch');

      expect(result).toBe(false);
    });

    it('should throw on other errors', async () => {
      const error = new Error('API Error');
      mockOctokit.repos.getBranch.mockRejectedValue(error);

      await expect(githubUtils.branchExists('feature-branch')).rejects.toThrow(error);
    });
  });

  describe('hasLabel', () => {
    it('should return true when label exists', () => {
      const issue = {
        labels: [{ name: 'bug' }, { name: 'priority:high' }],
      } as any;

      expect(githubUtils.hasLabel(issue, 'bug')).toBe(true);
      expect(githubUtils.hasLabel(issue, 'priority:high')).toBe(true);
    });

    it('should return false when label does not exist', () => {
      const issue = {
        labels: [{ name: 'bug' }],
      } as any;

      expect(githubUtils.hasLabel(issue, 'enhancement')).toBe(false);
    });
  });
});