import { AgentBase, AgentOptions } from '../shared/agent-base.js';
export interface DeveloperAgentOptions extends AgentOptions {
    githubToken: string;
    owner: string;
    repo: string;
    issueNumber: number;
}
export declare class DeveloperAgent extends AgentBase {
    private githubUtils;
    private issueNumber;
    private issue?;
    constructor(options: DeveloperAgentOptions);
    protected initialize(): Promise<void>;
    protected run(): Promise<void>;
    private parseIssueSpecification;
    private extractRequirements;
    private extractPriority;
    private analyzeImplementation;
    private identifyRequiredFiles;
    private generateImplementationSteps;
    private createImplementationBranch;
    private isContainerEnvironment;
    private setupContainerGitWorkspace;
    private createGitBranch;
    private implementFeatures;
    private createPullRequest;
    private generatePullRequestBody;
    private markIssueCompleted;
    private reportUncompletableSpec;
    private reportError;
}
