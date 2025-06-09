#!/usr/bin/env node

/**
 * Developer Agent
 * 
 * Autonomous agent that takes GitHub issue specifications and implements
 * them by writing code, tests, and creating pull requests using Claude CLI.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import { SelfieMCPClient } from '../../mcp-client/index.js';

// Load environment variables
dotenv.config();

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

export class DeveloperAgent {
  private config: DeveloperAgentConfig;
  private octokit: Octokit;
  private instanceId: string;
  private mcpClient: SelfieMCPClient | null = null;
  private currentTaskId: string | null = null;

  constructor(config: DeveloperAgentConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.githubToken
    });
    this.instanceId = `developer-${Date.now()}`;
    
    // Initialize MCP client if server command provided
    if (config.mcpServerCommand) {
      this.mcpClient = new SelfieMCPClient({
        serverCommand: config.mcpServerCommand,
        serverArgs: config.mcpServerArgs,
        workingDirectory: config.workingDirectory
      });
    }
    
    // Validate required tools
    this.validateEnvironment();
  }

  private validateEnvironment(): void {
    // Check if Claude CLI is available
    try {
      const claudePath = this.config.claudePath || 'claude';
      execSync(`${claudePath} --version`, { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Claude CLI not found. Please install Claude CLI and ensure it\'s in PATH.');
    }

    // Check git
    try {
      execSync('git --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Git not found. Please install Git.');
    }

    // Validate GitHub token
    if (!this.config.githubToken) {
      throw new Error('GitHub token is required');
    }
  }

  /**
   * Main entry point - develop a solution for the given issue
   */
  async develop(): Promise<string> {
    console.log(`🤖 Developer agent starting work on issue #${this.config.issueNumber}`);
    
    try {
      // Step 1: Register with MCP server
      await this.registerWithMCP();

      // Step 2: Claim the issue resource
      await this.claimIssue();

      // Step 3: Fetch and parse the issue
      const issueSpec = await this.fetchIssue();
      console.log(`📋 Issue: ${issueSpec.title}`);

      // Step 4: Generate implementation plan using Claude
      const plan = await this.generateImplementationPlan(issueSpec);
      console.log(`📝 Plan: ${plan.files.length} files to implement`);

      // Step 5: Create feature branch
      const branchName = await this.createFeatureBranch(plan.branchName);
      console.log(`🌿 Created branch: ${branchName}`);

      // Step 6: Implement each file using Claude
      for (const file of plan.files) {
        await this.implementFile(file, issueSpec);
        console.log(`✅ Implemented: ${file.path}`);
      }

      // Step 7: Run tests to verify implementation
      await this.runTests();
      console.log(`🧪 Tests passing`);

      // Step 8: Commit changes
      await this.commitChanges(plan.commitMessage);
      console.log(`💾 Changes committed`);

      // Step 9: Create pull request
      const prUrl = await this.createPullRequest(plan, issueSpec);
      console.log(`🚀 Pull request created: ${prUrl}`);

      // Step 10: Update task status and release resources
      await this.completeTask(prUrl);

      return prUrl;

    } catch (error) {
      console.error(`❌ Development failed:`, error);
      await this.handleError(error);
      throw error;
    }
  }

  private async registerWithMCP(): Promise<void> {
    if (!this.mcpClient) return;

    try {
      await this.mcpClient.connect();
      
      const result = await this.mcpClient.register({
        id: this.instanceId,
        type: 'developer',
        status: 'idle',
        capabilities: ['development', 'typescript', 'testing', 'github'],
        metadata: {
          version: '1.0.0',
          issueNumber: this.config.issueNumber,
          startedAt: new Date().toISOString()
        }
      });

      console.log(`📡 Registered with MCP server: ${result.instanceId}`);
    } catch (error) {
      console.warn(`⚠️ Failed to register with MCP server:`, error);
    }
  }

  private async claimIssue(): Promise<void> {
    if (!this.mcpClient) return;

    try {
      const result = await this.mcpClient.claimResource(
        'issue',
        this.config.issueNumber.toString(),
        this.instanceId,
        'develop'
      );

      if (result.claimed) {
        console.log(`🔒 Claimed issue #${this.config.issueNumber}`);
      } else {
        throw new Error(`Failed to claim issue #${this.config.issueNumber}. Conflicts with: ${result.conflictsWith?.join(', ')}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to claim issue:`, error);
      throw error;
    }
  }

  private async fetchIssue(): Promise<IssueSpec> {
    const { data: issue } = await this.octokit.issues.get({
      owner: this.config.githubOwner,
      repo: this.config.githubRepo,
      issue_number: this.config.issueNumber
    });

    return {
      title: issue.title,
      body: issue.body || '',
      labels: issue.labels.map(label => typeof label === 'string' ? label : label.name || ''),
      assignee: issue.assignee?.login,
      milestone: issue.milestone?.title
    };
  }

  private async generateImplementationPlan(issueSpec: IssueSpec): Promise<ImplementationPlan> {
    const prompt = `
You are a senior software engineer. Analyze this GitHub issue and create a detailed implementation plan.

ISSUE:
Title: ${issueSpec.title}
Description: ${issueSpec.body}
Labels: ${issueSpec.labels.join(', ')}

PROJECT CONTEXT:
- TypeScript project with Jest testing
- ES modules (import/export)
- Follows existing code patterns in src/
- All new functionality needs comprehensive tests

Please provide a JSON implementation plan with:
1. List of files to create/modify (with descriptions)
2. Branch name (feature/descriptive-name format)
3. Commit message (conventional commits format)
4. PR title and description

Focus on:
- Clean, maintainable TypeScript code
- Comprehensive test coverage
- Following existing project patterns
- Clear documentation

Return ONLY valid JSON in this format:
{
  "files": [
    {
      "path": "src/feature/new-feature.ts",
      "description": "Main implementation",
      "type": "implementation"
    },
    {
      "path": "test/feature/new-feature.test.ts", 
      "description": "Unit tests",
      "type": "test"
    }
  ],
  "branchName": "feature/descriptive-name",
  "commitMessage": "feat: add new feature functionality",
  "prTitle": "Add new feature functionality",
  "prDescription": "Implements new feature as requested in issue #${this.config.issueNumber}\\n\\n- Feature description\\n- Implementation details\\n\\nCloses #${this.config.issueNumber}"
}`;

    const claudePath = this.config.claudePath || 'claude';
    const result = execSync(`${claudePath} "${prompt.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      cwd: this.config.workingDirectory
    });

    try {
      return JSON.parse(result.trim());
    } catch (error) {
      throw new Error(`Failed to parse implementation plan: ${result}`);
    }
  }

  private async createFeatureBranch(branchName: string): Promise<string> {
    // Ensure we're on main and up to date
    execSync('git checkout main', { cwd: this.config.workingDirectory });
    execSync('git pull origin main', { cwd: this.config.workingDirectory });
    
    // Create and checkout feature branch
    execSync(`git checkout -b ${branchName}`, { cwd: this.config.workingDirectory });
    
    return branchName;
  }

  private async implementFile(
    file: { path: string; description: string; type: string },
    issueSpec: IssueSpec
  ): Promise<void> {
    const fullPath = join(this.config.workingDirectory, file.path);
    const dirPath = dirname(fullPath);

    // Create directory if it doesn't exist
    execSync(`mkdir -p "${dirPath}"`, { cwd: this.config.workingDirectory });

    // Read existing file if it exists
    const existingContent = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';

    // Read related files for context
    const context = await this.gatherFileContext();

    const prompt = `
You are implementing a file for a TypeScript project. 

TASK: ${file.description}
FILE: ${file.path}
TYPE: ${file.type}

ISSUE CONTEXT:
Title: ${issueSpec.title}
Description: ${issueSpec.body}

EXISTING FILE CONTENT:
${existingContent || '(new file)'}

PROJECT CONTEXT:
${context}

REQUIREMENTS:
1. Use TypeScript with strict typing
2. Follow ES module syntax (import/export)
3. For implementation files: write clean, maintainable code
4. For test files: use Jest with @jest/globals imports
5. Follow existing code patterns shown in context
6. Add comprehensive JSDoc comments
7. Handle edge cases and errors appropriately

${file.type === 'test' ? `
TEST REQUIREMENTS:
- Import from '@jest/globals'
- Use describe/it blocks
- Test happy path and edge cases
- Mock external dependencies if needed
- Aim for high coverage
` : ''}

${file.type === 'implementation' ? `
IMPLEMENTATION REQUIREMENTS:
- Export functions/classes that fulfill the issue requirements
- Use existing utilities and patterns where possible
- Add proper error handling
- Follow the project's coding conventions
` : ''}

Generate the complete file content. Do not include markdown code blocks or explanations - return only the file content.`;

    const claudePath = this.config.claudePath || 'claude';
    const result = execSync(`${claudePath} "${prompt.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      cwd: this.config.workingDirectory
    });

    // Write the generated content
    writeFileSync(fullPath, result.trim(), 'utf8');
  }

  private async gatherFileContext(): Promise<string> {
    const contexts: string[] = [];

    // Get package.json for dependencies
    try {
      const packagePath = join(this.config.workingDirectory, 'package.json');
      if (existsSync(packagePath)) {
        const packageJson = readFileSync(packagePath, 'utf8');
        contexts.push(`PACKAGE.JSON:\n${packageJson}`);
      }
    } catch (error) {
      // Ignore
    }

    // Get related files from src directory
    try {
      const srcDir = join(this.config.workingDirectory, 'src');
      if (existsSync(srcDir)) {
        const files = execSync(`find "${srcDir}" -name "*.ts" -type f | head -3`, {
          encoding: 'utf8',
          cwd: this.config.workingDirectory
        }).split('\n').filter(Boolean);

        for (const file of files) {
          const fullPath = join(this.config.workingDirectory, file);
          if (existsSync(fullPath)) {
            const content = readFileSync(fullPath, 'utf8');
            contexts.push(`EXAMPLE FILE (${file}):\n${content.substring(0, 1000)}`);
          }
        }
      }
    } catch (error) {
      // Ignore
    }

    return contexts.join('\n\n');
  }

  private async runTests(): Promise<void> {
    try {
      execSync('npm test', {
        cwd: this.config.workingDirectory,
        stdio: 'pipe'
      });
    } catch (error) {
      throw new Error(`Tests failed: ${error}`);
    }
  }

  private async commitChanges(commitMessage: string): Promise<void> {
    // Stage all changes
    execSync('git add .', { cwd: this.config.workingDirectory });

    // Check if there are changes to commit
    try {
      execSync('git diff --staged --quiet', { cwd: this.config.workingDirectory });
      throw new Error('No changes to commit');
    } catch (error) {
      // If the error is our manually thrown one, re-throw it
      if (error instanceof Error && error.message === 'No changes to commit') {
        throw error;
      }
      // Otherwise, it means git diff failed because there are changes - which is what we want
    }

    // Commit changes
    execSync(`git commit -m "${commitMessage}"`, { cwd: this.config.workingDirectory });
  }

  private async createPullRequest(plan: ImplementationPlan, _issueSpec: IssueSpec): Promise<string> {
    // Push branch to remote
    execSync(`git push origin ${plan.branchName}`, { cwd: this.config.workingDirectory });

    // Create pull request
    const { data: pr } = await this.octokit.pulls.create({
      owner: this.config.githubOwner,
      repo: this.config.githubRepo,
      title: plan.prTitle,
      body: plan.prDescription,
      head: plan.branchName,
      base: 'main'
    });

    return pr.html_url;
  }

  private async completeTask(prUrl: string): Promise<void> {
    if (!this.mcpClient) return;

    try {
      // Update task status if we have one
      if (this.currentTaskId) {
        await this.mcpClient.updateTaskStatus(this.currentTaskId, 'completed', {
          pullRequestUrl: prUrl,
          completedAt: new Date().toISOString()
        });
      }

      // Release the issue resource
      await this.mcpClient.releaseResource(
        'issue',
        this.config.issueNumber.toString(),
        this.instanceId
      );

      // Update status to idle
      await this.mcpClient.heartbeat(this.instanceId, 'idle', {
        lastTask: this.currentTaskId,
        completedAt: new Date().toISOString()
      });

      console.log(`✅ Task completed and resources released: ${prUrl}`);
    } catch (error) {
      console.warn(`⚠️ Failed to complete task cleanup:`, error);
    } finally {
      // Always disconnect
      await this.mcpClient.disconnect();
    }
  }

  private async handleError(error: unknown): Promise<void> {
    if (!this.mcpClient) return;

    try {
      // Update task status as failed if we have one
      if (this.currentTaskId) {
        await this.mcpClient.updateTaskStatus(this.currentTaskId, 'failed', {
          error: error instanceof Error ? error.message : String(error),
          failedAt: new Date().toISOString()
        });
      }

      // Release the issue resource
      await this.mcpClient.releaseResource(
        'issue',
        this.config.issueNumber.toString(),
        this.instanceId
      );

      // Update status to offline
      await this.mcpClient.heartbeat(this.instanceId, 'offline', {
        error: error instanceof Error ? error.message : String(error),
        failedAt: new Date().toISOString()
      });

      console.log(`❌ Task failed, resources released`);
    } catch (mcpError) {
      console.warn(`⚠️ Failed to handle error cleanup:`, mcpError);
    } finally {
      // Always disconnect
      await this.mcpClient.disconnect();
    }
  }
}

// CLI entry point (ES module compatible)
const isMainModule = process.argv[1] && process.argv[1].endsWith('developer-agent.js');
if (isMainModule) {
  const issueNumber = parseInt(process.argv[2]);
  if (!issueNumber) {
    console.error('Usage: developer-agent.js <issue-number>');
    process.exit(1);
  }

  const config: DeveloperAgentConfig = {
    issueNumber,
    githubToken: process.env.GITHUB_TOKEN || '',
    githubOwner: process.env.GITHUB_OWNER || '',
    githubRepo: process.env.GITHUB_REPO || '',
    workingDirectory: process.cwd(),
    claudePath: process.env.CLAUDE_PATH || 'claude',
    mcpServerCommand: process.env.MCP_SERVER_COMMAND || 'npm',
    mcpServerArgs: process.env.MCP_SERVER_ARGS?.split(' ') || ['run', 'mcp-server']
  };

  const agent = new DeveloperAgent(config);
  agent.develop()
    .then(prUrl => {
      console.log(`🎉 Development completed successfully!`);
      console.log(`Pull Request: ${prUrl}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Development failed:', error.message);
      process.exit(1);
    });
}