# Developer Agent
## Transforms specifications into working code via pull requests

### Purpose
The Developer Agent takes development specifications from GitHub issues and implements them by creating working code, tests, and documentation. It operates autonomously to create pull requests that fulfill the specified requirements. Can be spawned by Initializer Agents via MCP calls or run independently.

### Input Source
- Spawned by Initializer Agent via MCP calls with specific issue numbers
- GitHub issue containing development specifications
- Can be manually triggered for specific issues
- MCP coordination messages from other Selfie instances

### Responsibilities
- Analyze development specifications from GitHub issues
- Plan implementation approach and architecture
- Write code to meet specifications
- Create or update tests for the implementation
- Update documentation as needed
- Create comprehensive pull requests
- Report progress and status back to coordinating Selfie instances via MCP
- Handle cases where specs are not completable (report back to issue and MCP coordinator)
- Coordinate with other developer instances to prevent conflicts

### Usage
```bash
./start.sh developer --issue <issue_number> [options]
```

### Options
- `--issue <number>` - GitHub issue number to implement (required)
- `--branch <name>` - Custom branch name (default: auto-generated)
- `--base <branch>` - Base branch for PR (default: main)
- `--dry-run` - Analyze and plan without making changes
- `--verbose` - Enable verbose logging
- `--mcp-server <url>` - MCP server URL for coordination (default: http://localhost:3000)
- `--coordinator-id <id>` - ID of the coordinating Selfie instance (for MCP spawned agents)

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
SELFIE_INSTANCE_ID=developer-worker-1
```

### Examples
```bash
# Implement a specific issue
./start.sh developer --issue 123

# Use a custom branch name
./start.sh developer --issue 123 --branch feature/my-implementation

# Target a different base branch
./start.sh developer --issue 123 --base develop

# Dry run to see the implementation plan
./start.sh developer --issue 123 --dry-run
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