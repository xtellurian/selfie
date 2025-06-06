#!/usr/bin/env node

import { config } from 'dotenv';
import { InitializerAgent } from './agents/initializer/initializer-agent.js';
import { DeveloperAgent } from './agents/developer/developer-agent.js';

// Load environment variables
config();

interface CLIOptions {
  agentType?: string;
  issueNumber?: number;
  help?: boolean;
  dev?: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--dev':
        options.dev = true;
        break;
      case '--issue-number':
        options.issueNumber = parseInt(args[++i], 10);
        break;
      default:
        if (!options.agentType) {
          options.agentType = arg;
        }
        break;
    }
  }

  return options;
}

function showHelp(): void {
  console.log(`
Selfie - Agentic Build System

Usage: npm start [agent_type] [options]

Agent Types:
  initializer    Start the initializer agent to monitor GitHub issues
  developer      Start a developer agent for a specific issue

Options:
  --issue-number <number>  Issue number for developer agent
  --dev                    Enable development mode
  --help, -h              Show this help message

Examples:
  npm start initializer
  npm start developer --issue-number 123
  npm run dev

Environment Variables:
  GITHUB_TOKEN    GitHub personal access token
  GITHUB_OWNER    Repository owner (e.g., 'xtellurian')
  GITHUB_REPO     Repository name (e.g., 'selfie')
  `);
}

function validateEnvironment(): { token: string; owner: string; repo: string } {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }
  if (!owner) {
    throw new Error('GITHUB_OWNER environment variable is required');
  }
  if (!repo) {
    throw new Error('GITHUB_REPO environment variable is required');
  }

  return { token, owner, repo };
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    const { token, owner, repo } = validateEnvironment();

    switch (options.agentType) {
      case 'initializer': {
        console.log('Starting Initializer Agent...');
        const agent = new InitializerAgent({
          githubToken: token,
          owner,
          repo,
          pollIntervalMs: options.dev ? 10000 : 30000, // 10s in dev, 30s in prod
        });

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
          console.log('\nReceived SIGINT, shutting down gracefully...');
          await agent.stop();
          process.exit(0);
        });

        await agent.start();
        break;
      }

      case 'developer': {
        if (!options.issueNumber) {
          throw new Error('Developer agent requires --issue-number option');
        }

        console.log(`Starting Developer Agent for issue #${options.issueNumber}...`);
        const agent = new DeveloperAgent({
          githubToken: token,
          owner,
          repo,
          issueNumber: options.issueNumber,
        });

        await agent.start();
        break;
      }

      default:
        console.error('Unknown agent type. Use --help for usage information.');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});