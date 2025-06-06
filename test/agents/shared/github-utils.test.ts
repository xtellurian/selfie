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
    },
  })),
}));

describe('GitHubUtils', () => {
  let githubUtils: GitHubUtils;
  let mockOctokit: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    githubUtils = new GitHubUtils('fake-token', 'test-owner', 'test-repo');
    mockOctokit = (githubUtils as any).octokit;
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