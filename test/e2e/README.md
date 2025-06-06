# End-to-End Tests

This directory contains end-to-end tests that validate the complete workflow of the Selfie agentic build system.

## Setup

1. Copy `.env.example` to `.env` and fill in your GitHub credentials:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your GitHub token and repository information:
   ```env
   GITHUB_TOKEN=your_github_token_here
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=selfie
   ```

3. Generate a GitHub token at: https://github.com/settings/tokens
   - Required permissions: `repo` (Full control of private repositories)

## Running Tests

Run all end-to-end tests:
```bash
npm run test:e2e
```

Run a specific test:
```bash
npx jest test/e2e/github-workflow.test.ts
```

## Test Scenarios

### GitHub Workflow Test (`github-workflow.test.ts`)

This test validates the complete workflow:

1. **Issue Creation**: Creates a GitHub issue with an instruction
2. **InitializerAgent Detection**: Verifies the InitializerAgent detects and processes the issue
3. **DeveloperAgent Spawning**: Confirms the DeveloperAgent is spawned for the task
4. **Implementation Workflow**: Tests the full development cycle
5. **Pull Request Creation**: Validates PR creation (mocked for testing)
6. **Cleanup**: Removes test artifacts

The test includes:
- ✅ Issue creation with proper labels
- ✅ Agent detection and assignment
- ✅ Implementation workflow execution
- ✅ PR creation simulation
- ✅ Comment tracking and verification
- ✅ Label filtering validation

## Test Features

- **Real GitHub Integration**: Uses actual GitHub API calls
- **Branch Fixture System**: Automatically handles branch conflicts when running on main
- **Agent Simulation**: Tests real agent behavior with controlled mocking
- **Cleanup Logic**: Automatically cleans up test artifacts and branches
- **Error Handling**: Robust error handling and reporting
- **Timeout Management**: Appropriate timeouts for real-world scenarios

## Branch Management

The E2E tests include a sophisticated branch fixture system that:

1. **Detects Current Branch**: Automatically detects if running on the main branch
2. **Creates Test Branches**: If on main, creates a temporary test base branch to avoid conflicts
3. **Handles PR Creation**: Creates PRs against the appropriate base branch
4. **Automatic Cleanup**: Removes all test branches after test completion

This prevents the common "Reference already exists" error when running tests multiple times on the main branch.

## Notes

- Tests create real GitHub issues and comments
- Test artifacts are cleaned up automatically
- Environment variables are required for GitHub API access
- Tests may take 10-30 seconds to complete due to API interactions