# Initializer Agent
## Observes human input and spawns child agentic tasks via MCP

### Purpose
The Initializer Agent monitors GitHub issues in the repository and creates appropriate child agent tasks when new development work is requested. It serves as the primary entry point for human-initiated development tasks and coordinates with other Selfie instances via the Model Context Protocol (MCP) server.

### Input Source
- GitHub issues in this repository
- Issues labeled with `agent:developer` for development tasks
- Issues labeled with `agent:reviewer` for code review tasks
- Issues labeled with `agent:tester` for testing tasks

### Responsibilities
- Monitor GitHub issues for new development tasks
- Parse and understand human requirements from issue descriptions
- Validate that issues are properly formatted and actionable
- Route tasks to the correct specialized agents via MCP calls
- Create child agent processes with appropriate parameters across Selfie instances
- Coordinate with other Selfie instances via MCP server
- Track agent status and report back to issues
- Manage resource allocation and prevent conflicts between instances

### Usage
```bash
./start.sh initializer [options]
```

### Options
- `--poll-interval <seconds>` - How often to check for new issues (default: 30)
- `--dry-run` - Show what would be done without actually doing it
- `--verbose` - Enable verbose logging
- `--filter <label>` - Only process issues with specific labels
- `--mcp-server <url>` - MCP server URL for coordination (default: http://localhost:3000)
- `--max-instances <number>` - Maximum number of developer instances to spawn (default: 3)

### Environment Variables
Environment variables can be set in a `.env` file in the project root or as system environment variables:

- `GITHUB_TOKEN` - GitHub personal access token (required)
- `GITHUB_OWNER` - Repository owner (required)
- `GITHUB_REPO` - Repository name (required)
- `MCP_SERVER_URL` - MCP server URL for coordination (optional, default: http://localhost:3000)
- `SELFIE_INSTANCE_ID` - Unique identifier for this Selfie instance (optional, auto-generated)

Example `.env` file:
```bash
GITHUB_TOKEN=github_pat_your_token_here
GITHUB_OWNER=your-username
GITHUB_REPO=your-repository
MCP_SERVER_URL=http://localhost:3000
SELFIE_INSTANCE_ID=initializer-main
```

### Examples
```bash
# Start the initializer agent with default settings
./start.sh initializer

# Start with faster polling for development
./start.sh initializer --poll-interval 10

# Run in dry-run mode to see what would happen
./start.sh initializer --dry-run

# Only process high-priority issues
./start.sh initializer --filter priority:high
```

### Issue Format
The Initializer Agent expects GitHub issues to follow this format:

```markdown
# Feature Title

## Description
Clear description of what needs to be implemented.

## Requirements
- Requirement 1
- Requirement 2
- Requirement 3

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### Labels
- `agent:developer` - Route to Developer Agent for implementation
- `agent:reviewer` - Route to Reviewer Agent for code review
- `agent:tester` - Route to Tester Agent for test creation
- `priority:high` - High priority task
- `priority:medium` - Medium priority task (default)
- `priority:low` - Low priority task

### Output
- Creates child agent processes
- Comments on GitHub issues with agent assignments
- Logs all activities for monitoring and debugging
- Updates issue labels to track progress

### Error Handling
- Invalid issues are commented with specific error messages
- Failed agent spawning is logged and reported
- Network issues are retried with exponential backoff
- Malformed requests are rejected with helpful feedback

### Implementation Script
Location: `scripts/initializer.sh`

The implementation script should:
1. Set up environment variables
2. Configure GitHub API access
3. Poll for new issues at specified intervals
4. Parse issue content and extract requirements
5. Validate issue format and completeness
6. Spawn appropriate child agents
7. Handle errors and edge cases gracefully