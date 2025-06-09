# Developer Agent
## Autonomous code implementation from GitHub issues using Claude CLI

### Purpose
The Developer Agent is an autonomous software development agent that takes GitHub issue specifications and implements them by writing code, tests, and creating pull requests using Claude CLI. It operates autonomously to transform issue requirements into working software through intelligent code generation.

### Key Features
- **Claude CLI Integration**: Uses Claude CLI for intelligent code generation
- **MCP Coordination**: Integrates with MCP server for multi-agent coordination
- **Autonomous Implementation**: Complete end-to-end development workflow
- **Quality Assurance**: Runs tests and validates implementation
- **GitHub Integration**: Creates PRs linked to original issues

### Input Source
- GitHub issues with development specifications
- Can be spawned by Initializer Agent via MCP calls
- Manual execution for specific issues
- MCP coordination messages from other Selfie instances

### Responsibilities
- Fetch and analyze GitHub issue specifications
- Generate implementation plans using Claude CLI
- Write TypeScript code following project conventions
- Create comprehensive test suites with Jest
- Run tests to verify implementation
- Create pull requests with detailed descriptions
- Coordinate with MCP server to prevent conflicts
- Handle errors and provide meaningful feedback

### Usage
```bash
./start.sh developer <issue_number> [options]
```

### Options
- `<issue_number>` - GitHub issue number to implement (required)
- `--help, -h` - Show help message
- `--dry-run` - Show implementation plan without executing
- `--claude-path PATH` - Path to Claude CLI executable
- `--mcp-server` - Use MCP server for coordination
- `--no-mcp` - Skip MCP server integration

### Environment Variables
Environment variables can be set in a `.env` file in the project root:

**Required:**
- `GITHUB_TOKEN` - GitHub personal access token with repo permissions
- `GITHUB_OWNER` - Repository owner/organization name
- `GITHUB_REPO` - Repository name

**Optional:**
- `CLAUDE_PATH` - Path to Claude CLI executable (default: `claude`)
- `MCP_SERVER_COMMAND` - Command to start MCP server (default: `npm`)
- `MCP_SERVER_ARGS` - Arguments for MCP server (default: `run mcp-server`)

Example `.env` file:
```bash
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-username
GITHUB_REPO=your-repository
CLAUDE_PATH=/usr/local/bin/claude
MCP_SERVER_COMMAND=npm
MCP_SERVER_ARGS=run mcp-server
```

### Examples
```bash
# Implement a specific issue
./start.sh developer 123

# Show implementation plan without executing
./start.sh developer 123 --dry-run

# Use custom Claude CLI path
./start.sh developer 123 --claude-path /path/to/claude

# Work without MCP coordination
./start.sh developer 123 --no-mcp
```

### Implementation Process
1. **Analysis Phase**
   - Fetch and parse the GitHub issue
   - Extract requirements and acceptance criteria
   - Assess technical feasibility
   - Identify required files and components

2. **Planning Phase**
   - Generate implementation plan
   - Identify code patterns and architecture
   - Plan test strategy
   - Estimate complexity and effort

3. **Implementation Phase**
   - Create feature branch
   - Implement core functionality
   - Add error handling and edge cases
   - Write unit and integration tests
   - Update documentation

4. **Review Phase**
   - Run tests and verify functionality
   - Check code quality and standards
   - Validate against acceptance criteria
   - Create comprehensive PR description

### Code Standards
- Follow existing code patterns and conventions
- Maintain TypeScript strict mode compliance
- Include comprehensive JSDoc documentation
- Write tests for all new functionality
- Follow security best practices
- Ensure backward compatibility when possible

### Pull Request Format
```markdown
## Implementation Summary
Brief description of what was implemented.

### Changes Made
- List of specific changes
- New files created
- Modified functionality

### Requirements Fulfilled
- [x] Requirement 1
- [x] Requirement 2
- [ ] Requirement 3 (partial/future work)

### Testing
- Unit tests added/updated
- Integration tests passed
- Manual testing performed

### Documentation
- Code documentation updated
- README updated if needed
- API documentation updated

Closes #<issue_number>
```

### Error Handling
- **Incomplete Specifications**: Comment on issue requesting clarification
- **Technical Impossibility**: Explain why implementation isn't feasible
- **Dependency Issues**: Identify missing dependencies or conflicts
- **Test Failures**: Report test failures and potential solutions

### Quality Assurance
- All code must pass existing tests
- New tests must be written for new functionality
- Code coverage should not decrease
- Linting and formatting must pass
- TypeScript compilation must succeed

### Implementation Script
Location: `scripts/developer.sh`

The implementation script should:
1. Validate environment and parameters
2. Fetch and parse the GitHub issue
3. Create implementation branch
4. Analyze codebase and plan implementation
5. Write code following project standards
6. Create and run tests
7. Update documentation
8. Create pull request with detailed description
9. Handle errors and report status back to issue