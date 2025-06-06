import { Octokit } from '@octokit/rest';

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: Array<{ name: string } | string>;
  state: 'open' | 'closed';
  assignee?: { login: string } | null;
  created_at: string;
  updated_at: string;
}

export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string | null;
  head: { ref: string };
  base: { ref: string };
  state: 'open' | 'closed' | 'merged';
  html_url: string;
}

export class GitHubUtils {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new Octokit({
      auth: token,
    });
    this.owner = owner;
    this.repo = repo;
  }

  async getIssues(labels: string[] = [], state: 'open' | 'closed' | 'all' = 'open'): Promise<GitHubIssue[]> {
    try {
      const response = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        labels: labels.join(','),
        state,
      });
      return response.data as GitHubIssue[];
    } catch (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }
  }

  async getIssue(issueNumber: number): Promise<GitHubIssue> {
    try {
      const response = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return response.data as GitHubIssue;
    } catch (error) {
      console.error(`Error fetching issue #${issueNumber}:`, error);
      throw error;
    }
  }

  async createIssueComment(issueNumber: number, body: string): Promise<{ id: number; html_url: string }> {
    try {
      const response = await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        body,
      });
      return { id: response.data.id, html_url: response.data.html_url };
    } catch (error) {
      console.error(`Error creating comment on issue #${issueNumber}:`, error);
      throw error;
    }
  }

  async createBranch(branchName: string, fromBranch: string = 'main'): Promise<void> {
    try {
      // First check if branch already exists
      try {
        await this.octokit.repos.getBranch({
          owner: this.owner,
          repo: this.repo,
          branch: branchName,
        });
        // Branch already exists, no need to create it
        return;
      } catch (error: unknown) {
        // Branch doesn't exist (404), proceed with creation
        if ((error as { status?: number }).status !== 404) {
          throw error;
        }
      }

      // Get the SHA of the source branch
      const sourceBranch = await this.octokit.repos.getBranch({
        owner: this.owner,
        repo: this.repo,
        branch: fromBranch,
      });

      // Create the new branch
      await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: sourceBranch.data.commit.sha,
      });
    } catch (error: unknown) {
      // If the branch reference already exists, it's not necessarily an error
      const errorObj = error as { status?: number; message?: string };
      if (errorObj.status === 422 && errorObj.message?.includes('Reference already exists')) {
        // Branch was created between our check and creation attempt, that's fine
        return;
      }
      console.error(`Error creating branch ${branchName}:`, error);
      throw error;
    }
  }

  async createPullRequest(
    title: string,
    head: string,
    base: string,
    body: string
  ): Promise<GitHubPullRequest> {
    try {
      const response = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title,
        head,
        base,
        body,
      });
      return response.data as GitHubPullRequest;
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw error;
    }
  }

  async createPullRequestWithBranch(
    title: string,
    branchName: string,
    base: string,
    body: string
  ): Promise<GitHubPullRequest> {
    try {
      // Create the branch first (handles existing branches gracefully)
      await this.createBranch(branchName, base);
      
      // Then create the pull request
      return await this.createPullRequest(title, branchName, base, body);
    } catch (error: unknown) {
      // Handle specific PR creation errors
      const errorObj = error as { status?: number; message?: string };
      if (errorObj.status === 422) {
        if (errorObj.message?.includes('pull request already exists')) {
          // PR already exists, try to find and return it
          try {
            const existingPR = await this.findExistingPullRequest(branchName, base);
            if (existingPR) {
              return existingPR;
            }
          } catch (findError) {
            // If we can't find existing PR, continue with original error
          }
        }
      }
      console.error('Error creating pull request with branch:', error);
      throw error;
    }
  }

  private async findExistingPullRequest(head: string, base: string): Promise<GitHubPullRequest | null> {
    try {
      const response = await this.octokit.pulls.list({
        owner: this.owner,
        repo: this.repo,
        head: `${this.owner}:${head}`,
        base,
        state: 'open'
      });
      
      return response.data.length > 0 ? response.data[0] as GitHubPullRequest : null;
    } catch (error) {
      console.error('Error finding existing pull request:', error);
      return null;
    }
  }

  parseIssueLabels(issue: GitHubIssue): string[] {
    return issue.labels.map(label => 
      typeof label === 'string' ? label : label.name
    );
  }

  hasLabel(issue: GitHubIssue, labelName: string): boolean {
    const labels = this.parseIssueLabels(issue);
    return labels.includes(labelName);
  }

  async getCurrentBranch(): Promise<string> {
    try {
      // Get the default branch of the repository
      const repo = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return repo.data.default_branch;
    } catch (error) {
      console.error('Error getting current branch:', error);
      throw error;
    }
  }

  async deleteBranch(branchName: string): Promise<void> {
    try {
      await this.octokit.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });
    } catch (error) {
      console.error(`Error deleting branch ${branchName}:`, error);
      throw error;
    }
  }

  async branchExists(branchName: string): Promise<boolean> {
    try {
      await this.octokit.repos.getBranch({
        owner: this.owner,
        repo: this.repo,
        branch: branchName,
      });
      return true;
    } catch (error: unknown) {
      const errorObj = error as { status?: number };
      if (errorObj.status === 404) {
        return false;
      }
      throw error;
    }
  }
}