import { AgentBase } from '../shared/agent-base.js';
import { GitHubUtils } from '../shared/github-utils.js';
import { ContainerManager } from '../shared/container-manager.js';
export class InitializerAgent extends AgentBase {
    githubUtils;
    pollIntervalMs;
    pollingTimer;
    containerManager;
    constructor(options) {
        super('InitializerAgent', options);
        this.githubUtils = new GitHubUtils(options.githubToken, options.owner, options.repo);
        this.pollIntervalMs = options.pollIntervalMs || 30000; // 30 seconds default
        this.containerManager = new ContainerManager(this.logger);
    }
    async initialize() {
        this.log('info', 'Initializing GitHub issue monitoring...');
        // Test GitHub connection
        try {
            await this.githubUtils.getIssues([], 'open');
            this.log('info', 'GitHub connection successful');
        }
        catch (error) {
            this.log('error', 'Failed to connect to GitHub:', error);
            throw error;
        }
    }
    async run() {
        this.log('info', `Starting issue polling every ${this.pollIntervalMs}ms`);
        // Initial scan
        await this.scanForNewTasks();
        // Set up polling
        this.pollingTimer = setInterval(async () => {
            try {
                await this.scanForNewTasks();
            }
            catch (error) {
                this.log('error', 'Error during polling:', error);
            }
        }, this.pollIntervalMs);
    }
    async cleanup() {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = undefined;
        }
        // Kill all active containers
        await this.containerManager.killAllContainers();
        this.log('info', 'Cleanup completed');
    }
    async scanForNewTasks() {
        try {
            const issues = await this.githubUtils.getIssues(['agent:developer'], 'open');
            for (const issue of issues) {
                if (this.shouldProcessIssue(issue)) {
                    await this.spawnDeveloperAgent(issue);
                }
            }
        }
        catch (error) {
            this.log('error', 'Failed to scan for new tasks:', error);
        }
    }
    shouldProcessIssue(issue) {
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
    async spawnDeveloperAgent(issue) {
        try {
            this.log('info', `Spawning developer agent container for issue #${issue.number}: ${issue.title}`);
            // Mark issue as in progress
            await this.githubUtils.createIssueComment(issue.number, '🤖 Developer agent container has been assigned to this task and will begin implementation shortly.');
            // Prepare container options
            const containerName = `selfie-developer-${issue.number}-${Date.now()}`;
            const imageName = 'selfie-developer-agent';
            // Ensure the Docker image is built
            const imageBuilt = await this.containerManager.buildImage(imageName, './Dockerfile', '.');
            if (!imageBuilt) {
                throw new Error('Failed to build developer agent Docker image');
            }
            const containerOptions = {
                imageName,
                containerName,
                environment: {
                    GITHUB_TOKEN: this.options.githubToken,
                    GITHUB_OWNER: this.options.owner,
                    GITHUB_REPO: this.options.repo,
                    ISSUE_NUMBER: issue.number.toString(),
                    AGENT_TYPE: 'developer',
                    NODE_ENV: 'production'
                },
                timeoutMs: 10 * 60 * 1000, // 10 minutes timeout
                workDir: '/app',
                volumes: [
                    // Mount a temporary directory for git operations
                    `selfie-workspace-${issue.number}:/workspace`,
                ]
            };
            // Run developer agent in container asynchronously
            this.runDeveloperAgentContainer(containerOptions, issue.number).catch((error) => {
                this.log('error', `Developer agent container failed for issue #${issue.number}:`, error);
            });
        }
        catch (error) {
            this.log('error', `Failed to spawn developer agent container for issue #${issue.number}:`, error);
            // Report error back to issue
            await this.githubUtils.createIssueComment(issue.number, `❌ Failed to start developer agent container: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async runDeveloperAgentContainer(containerOptions, issueNumber) {
        try {
            this.log('info', `Starting developer agent container: ${containerOptions.containerName}`);
            const result = await this.containerManager.runContainer(containerOptions);
            if (result.timedOut) {
                this.log('warn', `Developer agent container timed out for issue #${issueNumber}`);
                await this.githubUtils.createIssueComment(issueNumber, '⏰ Developer agent container timed out. The task may be too complex or require manual intervention.');
            }
            else if (result.exitCode === 0) {
                this.log('info', `Developer agent container completed successfully for issue #${issueNumber}`);
            }
            else {
                this.log('error', `Developer agent container failed for issue #${issueNumber}. Exit code: ${result.exitCode}`);
                this.log('error', `Container stderr: ${result.stderr}`);
                await this.githubUtils.createIssueComment(issueNumber, `❌ Developer agent container failed with exit code ${result.exitCode}.\n\nError output:\n\`\`\`\n${result.stderr}\n\`\`\``);
            }
        }
        catch (error) {
            this.log('error', `Error running developer agent container for issue #${issueNumber}:`, error);
            await this.githubUtils.createIssueComment(issueNumber, `❌ Developer agent container error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
