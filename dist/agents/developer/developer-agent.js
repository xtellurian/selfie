import { AgentBase } from '../shared/agent-base.js';
import { GitHubUtils } from '../shared/github-utils.js';
export class DeveloperAgent extends AgentBase {
    githubUtils;
    issueNumber;
    issue;
    constructor(options) {
        super(`DeveloperAgent-${options.issueNumber}`, options);
        this.githubUtils = new GitHubUtils(options.githubToken, options.owner, options.repo);
        this.issueNumber = options.issueNumber;
    }
    async initialize() {
        this.log('info', `Initializing developer agent for issue #${this.issueNumber}`);
        try {
            this.issue = await this.githubUtils.getIssue(this.issueNumber);
            this.log('info', `Loaded issue: ${this.issue.title}`);
        }
        catch (error) {
            this.log('error', 'Failed to load issue:', error);
            throw error;
        }
    }
    async run() {
        if (!this.issue) {
            throw new Error('Issue not loaded during initialization');
        }
        try {
            // Parse the issue specification
            const specification = this.parseIssueSpecification(this.issue);
            // Analyze the implementation requirements
            const implementationPlan = await this.analyzeImplementation(specification);
            // Check if the specification is completable
            if (!implementationPlan.isCompletable) {
                await this.reportUncompletableSpec(implementationPlan.reason || 'Specification cannot be completed');
                return;
            }
            // Create implementation branch
            const branchName = await this.createImplementationBranch();
            // Implement the features
            await this.implementFeatures(implementationPlan);
            // Create pull request
            await this.createPullRequest(branchName, implementationPlan);
            // Mark as completed
            await this.markIssueCompleted();
        }
        catch (error) {
            this.log('error', 'Development process failed:', error);
            await this.reportError(error);
            throw error;
        }
    }
    parseIssueSpecification(issue) {
        return {
            title: issue.title,
            description: issue.body || '',
            requirements: this.extractRequirements(issue.body || ''),
            priority: this.extractPriority(issue),
        };
    }
    extractRequirements(body) {
        // Simple requirement extraction - look for bullet points or numbered lists
        const lines = body.split('\n');
        const requirements = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
                requirements.push(trimmed.replace(/^[-*]\s*|^\d+\.\s*/, ''));
            }
        }
        return requirements.length > 0 ? requirements : [body];
    }
    extractPriority(issue) {
        const labels = this.githubUtils.parseIssueLabels(issue);
        // Ensure labels is an array
        if (!Array.isArray(labels)) {
            return 'medium';
        }
        if (labels.includes('priority:high'))
            return 'high';
        if (labels.includes('priority:low'))
            return 'low';
        return 'medium';
    }
    async analyzeImplementation(spec) {
        // Simple implementation analysis
        // In a real system, this would use AI to analyze the specification
        this.log('info', 'Analyzing implementation requirements...');
        // Basic completability check
        const isCompletable = spec.requirements.length > 0 &&
            spec.title.length > 0 &&
            !spec.description.toLowerCase().includes('impossible');
        return {
            isCompletable,
            reason: isCompletable ? undefined : 'Insufficient specification or marked as impossible',
            estimatedComplexity: spec.requirements.length > 3 ? 'high' : 'medium',
            requiredFiles: this.identifyRequiredFiles(spec),
            steps: this.generateImplementationSteps(spec),
        };
    }
    identifyRequiredFiles(spec) {
        // Simple file identification based on keywords
        const files = [];
        const description = spec.description.toLowerCase();
        if (description.includes('agent') || description.includes('class')) {
            files.push('src/agents/new-agent.ts');
        }
        if (description.includes('test')) {
            files.push('test/new-feature.test.ts');
        }
        if (description.includes('util') || description.includes('helper')) {
            files.push('src/agents/shared/new-utils.ts');
        }
        return files;
    }
    generateImplementationSteps(_spec) {
        return [
            'Analyze existing codebase structure',
            'Implement core functionality',
            'Add error handling',
            'Write unit tests',
            'Update documentation',
        ];
    }
    async createImplementationBranch() {
        const branchName = `agent/developer-issue-${this.issueNumber}`;
        this.log('info', `Creating implementation branch: ${branchName}`);
        if (this.isContainerEnvironment()) {
            // In container environment, set up git workspace
            await this.setupContainerGitWorkspace();
            await this.createGitBranch(branchName);
        }
        return branchName;
    }
    isContainerEnvironment() {
        return process.env.NODE_ENV === 'production' && process.env.AGENT_TYPE === 'developer';
    }
    async setupContainerGitWorkspace() {
        const { spawn } = await import('child_process');
        // Clone the repository into workspace
        const options = this.options;
        const repoUrl = `https://${options.githubToken}@github.com/${options.owner}/${options.repo}.git`;
        this.log('info', 'Setting up git workspace in container...');
        await new Promise((resolve, reject) => {
            const cloneProcess = spawn('git', [
                'clone',
                repoUrl,
                '/workspace/repo'
            ], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            cloneProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('info', 'Repository cloned successfully');
                    resolve();
                }
                else {
                    reject(new Error(`Git clone failed with exit code ${code}`));
                }
            });
            cloneProcess.on('error', (error) => {
                reject(error);
            });
        });
        // Change to the repository directory for subsequent git operations
        process.chdir('/workspace/repo');
    }
    async createGitBranch(branchName) {
        const { spawn } = await import('child_process');
        this.log('info', `Creating git branch: ${branchName}`);
        // Create and checkout new branch
        await new Promise((resolve, reject) => {
            const branchProcess = spawn('git', [
                'checkout',
                '-b',
                branchName
            ], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            branchProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('info', `Branch ${branchName} created and checked out`);
                    resolve();
                }
                else {
                    reject(new Error(`Git branch creation failed with exit code ${code}`));
                }
            });
            branchProcess.on('error', (error) => {
                reject(error);
            });
        });
    }
    async implementFeatures(plan) {
        this.log('info', 'Implementing features...');
        for (const step of plan.steps) {
            this.log('info', `Executing step: ${step}`);
            // In a real implementation, this would execute the actual implementation
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        }
    }
    async createPullRequest(branchName, plan) {
        const title = `Implement: ${this.issue.title}`;
        const body = this.generatePullRequestBody(plan);
        this.log('info', 'Creating pull request with branch...');
        try {
            const pr = await this.githubUtils.createPullRequestWithBranch(title, branchName, 'main', body);
            this.log('info', `Pull request created: ${pr.html_url}`);
            // Add comment to original issue
            await this.githubUtils.createIssueComment(this.issueNumber, `✅ Implementation completed! Pull request: ${pr.html_url}`);
        }
        catch (error) {
            this.log('error', 'Failed to create pull request:', error);
            throw error;
        }
    }
    generatePullRequestBody(plan) {
        return `
## Implementation Summary

This PR implements the requirements specified in issue #${this.issueNumber}.

### Changes Made
${plan.steps.map(step => `- ${step}`).join('\n')}

### Files Modified
${plan.requiredFiles.map(file => `- ${file}`).join('\n')}

### Complexity
${plan.estimatedComplexity}

---
🤖 Generated by DeveloperAgent
    `.trim();
    }
    async markIssueCompleted() {
        await this.githubUtils.createIssueComment(this.issueNumber, '✅ Development completed successfully. Ready for review.');
    }
    async reportUncompletableSpec(reason) {
        await this.githubUtils.createIssueComment(this.issueNumber, `❌ Unable to complete this specification.\n\nReason: ${reason}\n\nPlease provide more details or clarify the requirements.`);
    }
    async reportError(error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.githubUtils.createIssueComment(this.issueNumber, `❌ Development failed with error:\n\n\`\`\`\n${errorMessage}\n\`\`\`\n\nPlease check the specification and try again.`);
    }
}
