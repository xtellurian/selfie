import { AgentBase, AgentOptions } from '../shared/agent-base.js';
import { GitHubUtils, GitHubIssue } from '../shared/github-utils.js';

export interface DeveloperAgentOptions extends AgentOptions {
  githubToken: string;
  owner: string;
  repo: string;
  issueNumber: number;
}

export class DeveloperAgent extends AgentBase {
  private githubUtils: GitHubUtils;
  private issueNumber: number;
  private issue?: GitHubIssue;

  constructor(options: DeveloperAgentOptions) {
    super(`DeveloperAgent-${options.issueNumber}`, options);
    
    this.githubUtils = new GitHubUtils(
      options.githubToken,
      options.owner,
      options.repo
    );
    
    this.issueNumber = options.issueNumber;
  }

  protected async initialize(): Promise<void> {
    this.log('info', `Initializing developer agent for issue #${this.issueNumber}`);
    
    try {
      this.issue = await this.githubUtils.getIssue(this.issueNumber);
      this.log('info', `Loaded issue: ${this.issue.title}`);
    } catch (error) {
      this.log('error', 'Failed to load issue:', error);
      throw error;
    }
  }

  protected async run(): Promise<void> {
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
      
    } catch (error) {
      this.log('error', 'Development process failed:', error);
      await this.reportError(error);
      throw error;
    }
  }

  private parseIssueSpecification(issue: GitHubIssue): DevelopmentSpecification {
    return {
      title: issue.title,
      description: issue.body || '',
      requirements: this.extractRequirements(issue.body || ''),
      priority: this.extractPriority(issue),
    };
  }

  private extractRequirements(body: string): string[] {
    // Simple requirement extraction - look for bullet points or numbered lists
    const lines = body.split('\n');
    const requirements: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
        requirements.push(trimmed.replace(/^[-*]\s*|^\d+\.\s*/, ''));
      }
    }
    
    return requirements.length > 0 ? requirements : [body];
  }

  private extractPriority(issue: GitHubIssue): 'high' | 'medium' | 'low' {
    const labels = this.githubUtils.parseIssueLabels(issue);
    
    // Ensure labels is an array
    if (!Array.isArray(labels)) {
      return 'medium';
    }
    
    if (labels.includes('priority:high')) return 'high';
    if (labels.includes('priority:low')) return 'low';
    return 'medium';
  }

  private async analyzeImplementation(spec: DevelopmentSpecification): Promise<ImplementationPlan> {
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

  private identifyRequiredFiles(spec: DevelopmentSpecification): string[] {
    // Simple file identification based on keywords
    const files: string[] = [];
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

  private generateImplementationSteps(_spec: DevelopmentSpecification): string[] {
    return [
      'Analyze existing codebase structure',
      'Implement core functionality',
      'Add error handling',
      'Write unit tests',
      'Update documentation',
    ];
  }

  private async createImplementationBranch(): Promise<string> {
    const branchName = `agent/developer-issue-${this.issueNumber}`;
    this.log('info', `Creating implementation branch: ${branchName}`);
    
    // In a real implementation, this would use git commands
    // For now, we'll just return the branch name
    return branchName;
  }

  private async implementFeatures(plan: ImplementationPlan): Promise<void> {
    this.log('info', 'Implementing features...');
    
    for (const step of plan.steps) {
      this.log('info', `Executing step: ${step}`);
      // In a real implementation, this would execute the actual implementation
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    }
  }

  private async createPullRequest(branchName: string, plan: ImplementationPlan): Promise<void> {
    const title = `Implement: ${this.issue!.title}`;
    const body = this.generatePullRequestBody(plan);
    
    this.log('info', 'Creating pull request...');
    
    try {
      const pr = await this.githubUtils.createPullRequest(
        title,
        branchName,
        'main',
        body
      );
      
      this.log('info', `Pull request created: ${pr.html_url}`);
      
      // Add comment to original issue
      await this.githubUtils.createIssueComment(
        this.issueNumber,
        `✅ Implementation completed! Pull request: ${pr.html_url}`
      );
      
    } catch (error) {
      this.log('error', 'Failed to create pull request:', error);
      throw error;
    }
  }

  private generatePullRequestBody(plan: ImplementationPlan): string {
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

  private async markIssueCompleted(): Promise<void> {
    await this.githubUtils.createIssueComment(
      this.issueNumber,
      '✅ Development completed successfully. Ready for review.'
    );
  }

  private async reportUncompletableSpec(reason: string): Promise<void> {
    await this.githubUtils.createIssueComment(
      this.issueNumber,
      `❌ Unable to complete this specification.\n\nReason: ${reason}\n\nPlease provide more details or clarify the requirements.`
    );
  }

  private async reportError(error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await this.githubUtils.createIssueComment(
      this.issueNumber,
      `❌ Development failed with error:\n\n\`\`\`\n${errorMessage}\n\`\`\`\n\nPlease check the specification and try again.`
    );
  }
}

interface DevelopmentSpecification {
  title: string;
  description: string;
  requirements: string[];
  priority: 'high' | 'medium' | 'low';
}

interface ImplementationPlan {
  isCompletable: boolean;
  reason?: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  requiredFiles: string[];
  steps: string[];
}