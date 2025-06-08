export interface GitHubIssue {
    number: number;
    title: string;
    body: string | null;
    labels: Array<{
        name: string;
    } | string>;
    state: 'open' | 'closed';
    assignee?: {
        login: string;
    } | null;
    created_at: string;
    updated_at: string;
}
export interface GitHubPullRequest {
    number: number;
    title: string;
    body: string | null;
    head: {
        ref: string;
    };
    base: {
        ref: string;
    };
    state: 'open' | 'closed' | 'merged';
    html_url: string;
}
export declare class GitHubUtils {
    private octokit;
    private owner;
    private repo;
    constructor(token: string, owner: string, repo: string);
    getIssues(labels?: string[], state?: 'open' | 'closed' | 'all'): Promise<GitHubIssue[]>;
    getIssue(issueNumber: number): Promise<GitHubIssue>;
    createIssueComment(issueNumber: number, body: string): Promise<{
        id: number;
        html_url: string;
    }>;
    createBranch(branchName: string, fromBranch?: string): Promise<void>;
    createPullRequest(title: string, head: string, base: string, body: string): Promise<GitHubPullRequest>;
    createPullRequestWithBranch(title: string, branchName: string, base: string, body: string): Promise<GitHubPullRequest>;
    private findExistingPullRequest;
    parseIssueLabels(issue: GitHubIssue): string[];
    hasLabel(issue: GitHubIssue, labelName: string): boolean;
    getCurrentBranch(): Promise<string>;
    deleteBranch(branchName: string): Promise<void>;
    branchExists(branchName: string): Promise<boolean>;
}
