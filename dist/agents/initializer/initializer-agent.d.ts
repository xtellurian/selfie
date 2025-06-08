import { AgentBase, AgentOptions } from '../shared/agent-base.js';
export interface InitializerAgentOptions extends AgentOptions {
    githubToken: string;
    owner: string;
    repo: string;
    pollIntervalMs?: number;
}
export declare class InitializerAgent extends AgentBase {
    private githubUtils;
    private pollIntervalMs;
    private pollingTimer?;
    private containerManager;
    constructor(options: InitializerAgentOptions);
    protected initialize(): Promise<void>;
    protected run(): Promise<void>;
    protected cleanup(): Promise<void>;
    private scanForNewTasks;
    private shouldProcessIssue;
    private spawnDeveloperAgent;
    private runDeveloperAgentContainer;
}
