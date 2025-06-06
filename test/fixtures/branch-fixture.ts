import { GitHubUtils } from '../../src/agents/shared/github-utils.js';

export class BranchFixture {
  private githubUtils: GitHubUtils;
  private testBranches: string[] = [];
  private originalBranch: string | null = null;

  constructor(githubUtils: GitHubUtils) {
    this.githubUtils = githubUtils;
  }

  async setup(): Promise<string> {
    // Get the current/default branch
    this.originalBranch = await this.githubUtils.getCurrentBranch();
    
    // If we're on main, create a test base branch
    if (this.originalBranch === 'main') {
      const testBaseBranch = `test-base-${Date.now()}`;
      await this.githubUtils.createBranch(testBaseBranch, 'main');
      this.testBranches.push(testBaseBranch);
      return testBaseBranch;
    }
    
    // If we're not on main, we can use the current branch as base
    return this.originalBranch;
  }

  async createTestBranch(branchName: string, fromBranch?: string): Promise<void> {
    const baseBranch = fromBranch || this.originalBranch || 'main';
    await this.githubUtils.createBranch(branchName, baseBranch);
    this.testBranches.push(branchName);
  }

  async cleanup(): Promise<void> {
    // Clean up all test branches
    for (const branch of this.testBranches) {
      try {
        const exists = await this.githubUtils.branchExists(branch);
        if (exists) {
          await this.githubUtils.deleteBranch(branch);
        }
      } catch (error) {
        console.warn(`Failed to cleanup test branch ${branch}:`, error);
      }
    }
    this.testBranches = [];
  }

  getTestBranches(): string[] {
    return [...this.testBranches];
  }

  getOriginalBranch(): string | null {
    return this.originalBranch;
  }
}