import { AgentBase, AgentOptions } from '../shared/agent-base.js';
import { GitHubUtils, GitHubIssue } from '../shared/github-utils.js';

export interface InitializerAgentOptions extends AgentOptions {
  githubToken: string;
  owner: string;
  repo: string;
  pollIntervalMs?: number;
}

export class InitializerAgent extends AgentBase {
  private githubUtils: GitHubUtils;
  private pollIntervalMs: number;
  private pollingTimer?: ReturnType<typeof setInterval>;

  constructor(options: InitializerAgentOptions) {
    super('InitializerAgent', options);
    
    this.githubUtils = new GitHubUtils(
      options.githubToken,
      options.owner,
      options.repo
    );
    
    this.pollIntervalMs = options.pollIntervalMs || 30000; // 30 seconds default
  }

  protected async initialize(): Promise<void> {
    this.log('info', 'Initializing GitHub issue monitoring...');
    
    // Test GitHub connection
    try {
      await this.githubUtils.getIssues([], 'open');
      this.log('info', 'GitHub connection successful');
    } catch (error) {
      this.log('error', 'Failed to connect to GitHub:', error);
      throw error;
    }
  }

  protected async run(): Promise<void> {
    this.log('info', `Starting issue polling every ${this.pollIntervalMs}ms`);
    
    // Initial scan
    await this.scanForNewTasks();
    
    // Set up polling
    this.pollingTimer = setInterval(async () => {
      try {
        await this.scanForNewTasks();
      } catch (error) {
        this.log('error', 'Error during polling:', error);
      }
    }, this.pollIntervalMs);
  }

  protected async cleanup(): Promise<void> {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = undefined;
    }
    this.log('info', 'Cleanup completed');
  }

  private async scanForNewTasks(): Promise<void> {
    try {
      const issues = await this.githubUtils.getIssues(['agent:developer'], 'open');
      
      for (const issue of issues) {
        if (this.shouldProcessIssue(issue)) {
          await this.spawnDeveloperAgent(issue);
        }
      }
    } catch (error) {
      this.log('error', 'Failed to scan for new tasks:', error);
    }
  }

  private shouldProcessIssue(issue: GitHubIssue): boolean {
    // Check if issue has the right labels and isn't already being processed
    const labels = this.githubUtils.parseIssueLabels(issue);
    
    // Ensure labels is an array
    if (!Array.isArray(labels)) {
      return false;
    }
    
    // Must have agent:developer label
    if (!labels.includes('agent:developer')) {
      return false;
    }
    
    // Don't process if already assigned to an agent
    if (labels.includes('status:in-progress') || labels.includes('status:completed')) {
      return false;
    }
    
    return true;
  }

  private async spawnDeveloperAgent(issue: GitHubIssue): Promise<void> {
    try {
      this.log('info', `Spawning developer agent for issue #${issue.number}: ${issue.title}`);
      
      // Mark issue as in progress
      await this.githubUtils.createIssueComment(
        issue.number,
        '🤖 Developer agent has been assigned to this task and will begin implementation shortly.'
      );
      
      // Create and start developer agent (dynamic import to avoid circular dependency)
      const { DeveloperAgent } = await import('../developer/developer-agent.js');
      const developerAgent = new DeveloperAgent({
        githubToken: (this.options as InitializerAgentOptions).githubToken,
        owner: (this.options as InitializerAgentOptions).owner,
        repo: (this.options as InitializerAgentOptions).repo,
        issueNumber: issue.number,
        logger: this.logger,
      });
      
      // Run developer agent in background
      developerAgent.start().catch((error: unknown) => {
        this.log('error', `Developer agent failed for issue #${issue.number}:`, error);
      });
      
    } catch (error) {
      this.log('error', `Failed to spawn developer agent for issue #${issue.number}:`, error);
    }
  }
}