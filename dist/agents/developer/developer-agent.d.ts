#!/usr/bin/env node
/**
 * Developer Agent
 *
 * Autonomous agent that takes GitHub issue specifications and implements
 * them by writing code, tests, and creating pull requests using Claude CLI.
 */
export interface DeveloperAgentConfig {
    issueNumber: number;
    githubToken: string;
    githubOwner: string;
    githubRepo: string;
    workingDirectory: string;
    claudePath?: string;
    mcpServerCommand?: string;
    mcpServerArgs?: string[];
}
export interface IssueSpec {
    title: string;
    body: string;
    labels: string[];
    assignee?: string;
    milestone?: string;
}
export interface ImplementationPlan {
    files: {
        path: string;
        description: string;
        type: 'implementation' | 'test' | 'documentation';
    }[];
    branchName: string;
    commitMessage: string;
    prTitle: string;
    prDescription: string;
}
export declare class DeveloperAgent {
    private config;
    private octokit;
    private instanceId;
    private mcpClient;
    private currentTaskId;
    constructor(config: DeveloperAgentConfig);
    private validateEnvironment;
    /**
     * Main entry point - develop a solution for the given issue
     */
    develop(): Promise<string>;
    private registerWithMCP;
    private claimIssue;
    private fetchIssue;
    private generateImplementationPlan;
    private createFeatureBranch;
    private implementFile;
    private gatherFileContext;
    private runTests;
    private commitChanges;
    private createPullRequest;
    private completeTask;
    private handleError;
}
