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

  parseIssueLabels(issue: GitHubIssue): string[] {
    return issue.labels.map(label => 
      typeof label === 'string' ? label : label.name
    );
  }

  hasLabel(issue: GitHubIssue, labelName: string): boolean {
    const labels = this.parseIssueLabels(issue);
    return labels.includes(labelName);
  }
}