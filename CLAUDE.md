# Selfie - Agentic Build System

## Project Overview

**Selfie** is an agentic build system that builds itself. This is a revolutionary approach to software development where the system evolves and improves through autonomous agents that respond to human input and create their own development tasks.

## Current Phase: MCP Server Development

We are currently in **Phase 1: MCP Server Development**. During this phase, we are building a Model Context Protocol (MCP) server that enables Selfie instances to interact with each other. This MCP server is the foundational automation layer that will enable the system to create changes to itself based on human input and coordinate between multiple Selfie instances.

### MCP Server Goals

The Selfie MCP server provides:
- **Inter-Selfie Communication**: Enables one Selfie instance to interact with other Selfie instances
- **Agent Coordination**: Allows an initializer Selfie to spawn and coordinate developer Selfie instances
- **Task Distribution**: Distributes development tasks across multiple Selfie instances
- **Resource Management**: Manages shared resources and prevents conflicts between instances
- **State Synchronization**: Keeps multiple Selfie instances synchronized on project state

## System Architecture

### Core Philosophy
- **Self-Building**: The system creates and modifies its own code
- **MCP-Enabled**: Multiple Selfie instances communicate via Model Context Protocol
- **Agentic**: Shell-based autonomous agents handle different aspects of development
- **Human-Guided**: Agents respond to human input via GitHub issues
- **Iterative**: Each phase builds upon the previous one
- **Documentation-Driven**: Each agent is defined by its documentation in `/docs/agents/`

### System Architecture

The system consists of three main components:

#### 1. MCP Server (`src/mcp-server/`)
- **Purpose**: Enables inter-Selfie communication and coordination
- **Protocol**: Implements Model Context Protocol for agent interaction
- **Capabilities**: Task distribution, state management, resource coordination
- **Implementation**: TypeScript server following MCP SDK patterns

#### 2. Shell-Based Agents (`scripts/`)
- **Agent Documentation**: `/docs/agents/<agent-name>.md` - Defines purpose, usage, and requirements
- **Agent Scripts**: `/scripts/<agent-name>.sh` - Executable implementation
- **MCP Integration**: Agents communicate with other Selfie instances via MCP server
- **Dispatcher**: `./start.sh` - Routes commands to appropriate agents

#### 3. TypeScript Library (`src/`)
- **Core Functions**: Basic utility functions and hello world examples
- **MCP Client**: Client functions for interacting with MCP servers
- **Shared Types**: TypeScript types shared between components

### Agent Types

#### 1. Initializer Agent
- **Purpose**: Observe human input and spawn child agentic tasks via MCP
- **Documentation**: `/docs/agents/initializer.md`
- **Script**: `/scripts/initializer.sh`
- **Trigger**: `./start.sh initializer [options]`
- **MCP Integration**: Uses MCP server to coordinate with other Selfie instances
- **Responsibilities**:
  - Monitor GitHub issues for new development tasks
  - Parse and understand human requirements
  - Create appropriate child agent tasks via MCP calls
  - Route tasks to the correct specialized agents across instances

#### 2. Developer Agent
- **Purpose**: Transform specifications into working code via pull requests
- **Documentation**: `/docs/agents/developer.md`
- **Script**: `/scripts/developer.sh`
- **Trigger**: `./start.sh developer --issue <number> [options]` or spawned via MCP
- **MCP Integration**: Can be spawned by initializer agents via MCP calls
- **Responsibilities**:
  - Analyze development specifications
  - Plan implementation approach
  - Write code to meet specifications
  - Create comprehensive pull requests
  - Report status back to coordinating instances via MCP
  - Handle cases where specs are not completable (post back to original issue)

#### 3. Reviewer Agent
- **Purpose**: Automated code review and quality assurance
- **Documentation**: `/docs/agents/reviewer.md`
- **Script**: `/scripts/reviewer.sh`
- **Trigger**: `./start.sh reviewer --pr <number> [options]`
- **Responsibilities**:
  - Analyze pull request changes for quality
  - Run automated tests and check coverage
  - Verify code follows project standards
  - Provide constructive feedback and suggestions

#### 4. Tester Agent
- **Purpose**: Create comprehensive test suites and validate functionality
- **Documentation**: `/docs/agents/tester.md`
- **Script**: `/scripts/tester.sh`
- **Trigger**: `./start.sh tester [options]`
- **Responsibilities**:
  - Generate unit, integration, and e2e tests
  - Maintain and update existing test suites
  - Run comprehensive test validation
  - Report test coverage and quality metrics

## Entry Points

### Main Startup Script
```bash
./start.sh [agent_type] [options]
```

### Agent-Specific Commands
```bash
# Start the initializer agent
./start.sh initializer

# Start a developer task for a specific issue
./start.sh developer --issue 123

# Review a pull request
./start.sh reviewer --pr 456

# Generate tests for specific code
./start.sh tester --target src/new-feature.ts

# System commands
./start.sh setup    # Initialize the agent system
./start.sh list     # List all available agents
./start.sh help     # Show help message
./start.sh version  # Show version information
```

## Development Workflow

### For Human Contributors
1. Create GitHub issue with development specification
2. Tag issue with appropriate labels (e.g., `agent:developer`, `priority:high`)
3. Initializer agent detects the new issue
4. Appropriate child agent is spawned to handle the task
5. Agent creates pull request with implementation
6. Human reviews and merges PR

### For Agent Development
1. Agents observe their designated input sources
2. Parse and understand requirements
3. Execute their specialized tasks
4. Provide feedback through designated channels
5. Update their own capabilities when needed

## Code Conventions

### File Organization
```
/
├── docs/                # Documentation
│   └── agents/          # Agent documentation
│       ├── initializer.md
│       ├── developer.md
│       ├── reviewer.md
│       └── tester.md
├── scripts/             # Agent implementations
│   ├── shared-functions.sh
│   ├── initializer.sh
│   ├── developer.sh
│   ├── reviewer.sh
│   └── tester.sh
├── src/                 # TypeScript components
│   ├── mcp-server/      # MCP server implementation
│   │   ├── index.ts     # Server entry point
│   │   ├── handlers/    # MCP request handlers
│   │   ├── types/       # MCP-specific types
│   │   └── utils/       # Server utilities
│   ├── mcp-client/      # MCP client functions
│   └── index.ts         # Core library functions
├── test/                # Test suites
│   ├── mcp-server/      # MCP server tests
│   ├── mcp-client/      # MCP client tests
│   └── index.test.ts    # Core library tests
├── start.sh             # Main entry point and dispatcher
└── CLAUDE.md           # This file (project memory)
```

### Naming Conventions
- **Agent Scripts**: kebab-case with .sh extension (e.g., `initializer.sh`, `developer.sh`)
- **Agent Documentation**: kebab-case with .md extension (e.g., `initializer.md`, `developer.md`)
- **Shell Functions**: snake_case (e.g., `validate_environment`, `create_pull_request`)
- **Environment Variables**: UPPER_SNAKE_CASE (e.g., `GITHUB_TOKEN`, `POLL_INTERVAL`)

### Language Requirements
- **Shell Scripts**: Bash for agent implementations and system scripts
- **TypeScript**: MCP server implementation following TypeScript SDK patterns
- **MCP Protocol**: Model Context Protocol for inter-instance communication
- **Markdown**: Comprehensive documentation for all agents
- **Shell Best Practices**: Use `set -e`, proper quoting, error handling, and dotenv loading
- **Testing**: Unit and integration tests for all MCP server functionality

### Git Workflow
- **Main branch**: `main` (protected, requires PR)
- **Feature branches**: `feature/agent-type-description` (e.g., `feature/initializer-github-integration`)
- **Developer agent branches**: `feature/issue-{number}-description` (e.g., `feature/issue-123-add-user-auth`)
  - **REQUIRED**: All developer agent branches MUST include the issue number to avoid naming conflicts
  - **Format**: `feature/issue-{issueNumber}-{descriptive-name}`
  - **Example**: Issue #456 "Add login system" → `feature/issue-456-add-login-system`
- **Manual branches**: `agent/agent-name-task-id` (e.g., `agent/developer-issue-123`) for non-automated work

## Key Technologies

### Runtime Environment
- **Bash**: Primary runtime for agent execution
- **Node.js**: MCP server runtime and TypeScript compilation
- **MCP Protocol**: Inter-instance communication protocol
- **Git**: Version control and collaboration
- **GitHub CLI**: Optional integration for advanced GitHub operations

### Integration Points
- **MCP Server**: Central coordination point for Selfie instances
- **GitHub API**: Issue monitoring and PR creation via shell scripts and MCP
- **Claude CLI**: AI-powered code generation and implementation planning
- **Claude Code**: AI-powered development assistance
- **GitHub Actions**: CI/CD pipeline for agent validation
- **Shell Environment**: Direct system integration and process management
- **Inter-Process Communication**: MCP-based coordination between instances

## Claude CLI Integration

The Developer Agent uses Claude CLI for intelligent code generation and implementation planning. The Claude CLI provides both interactive and non-interactive modes for AI-powered development assistance.

### Installation and Setup
Ensure Claude CLI is installed and available in your PATH:
```bash
# Check if Claude CLI is available
claude --version

# Check Claude CLI health
claude doctor

# Update to latest version
claude update
```

### Basic Usage
```bash
# Interactive mode (default)
claude "Write a TypeScript function to add two numbers"

# Non-interactive mode (essential for scripting)
claude --print "Write a TypeScript function to add two numbers"

# JSON output format
claude --print --output-format json "Generate a JSON response"

# Stream JSON for real-time output
claude --print --output-format stream-json "Long prompt here"
```

### Developer Agent Integration
The Developer Agent uses Claude CLI in non-interactive mode for:

#### Implementation Planning
```bash
claude --print "Analyze this GitHub issue and create a detailed implementation plan..."
```

#### Code Generation
```bash
claude --print "Generate TypeScript code for this file specification..."
```

### Key Options for Agent Usage
- `--print` / `-p`: **Required** - Print response and exit (essential for scripting)
- `--output-format`: Control output format (`text`, `json`, `stream-json`)
- `--model`: Specify model (e.g. `sonnet`, `opus`, or full model name like `claude-sonnet-4-20250514`)
- `--debug`: Enable debug mode for troubleshooting
- `--continue` / `-c`: Continue previous conversation
- `--resume`: Resume specific conversation by ID

### Configuration Commands
```bash
# View current configuration
claude config

# Set global theme
claude config set -g theme dark

# Manage MCP servers
claude mcp

# Check system health
claude doctor
```

### Agent Implementation Pattern
```typescript
// In TypeScript agent code
const claudePath = this.config.claudePath || 'claude';
const result = execSync(`${claudePath} --print "${prompt.replace(/"/g, '\\"')}"`, {
  encoding: 'utf8',
  cwd: this.config.workingDirectory
});
```

### Best Practices for Agent Integration
1. **Always use `--print`** for non-interactive agent execution
2. **Escape quotes properly** in prompts: `"prompt with \"quotes\""`
3. **Use specific models** when needed: `--model sonnet`
4. **Handle errors gracefully** with try-catch blocks
5. **Validate JSON responses** from Claude CLI output
6. **Set appropriate timeouts** for long-running prompts
7. **Use structured prompts** for consistent output formats

### Environment Variables
Configure Claude CLI behavior through environment variables:
```bash
# Set default Claude CLI path
export CLAUDE_PATH="/usr/local/bin/claude"

# Configure model preference
export CLAUDE_MODEL="sonnet"
```

### Error Handling
```typescript
try {
  const result = execSync(`${claudePath} --print "${prompt}"`, {
    encoding: 'utf8',
    cwd: this.config.workingDirectory,
    timeout: 60000 // 1 minute timeout
  });
  return JSON.parse(result.trim());
} catch (error) {
  if (error.code === 'ENOENT') {
    throw new Error('Claude CLI not found. Please install Claude CLI.');
  }
  throw new Error(`Claude CLI error: ${error.message}`);
}
```

## Common Commands

### Development Commands
```bash
# Initialize the agent system
./start.sh setup

# Build TypeScript (including MCP server)
npm run build

# Run all tests (including MCP server tests)
npm test

# Start MCP server
npm run mcp-server

# List available agents
./start.sh list

# Show system version
./start.sh version
```

### Agent Commands
```bash
# Start monitoring for issues (with MCP coordination)
./start.sh initializer

# Implement a specific issue
./start.sh developer --issue 123

# Review a pull request
./start.sh reviewer --pr 456

# Generate tests for code
./start.sh tester --target src/
```

### MCP Commands
```bash
# Start the MCP server for inter-instance communication
npm run mcp-server

# Test MCP server connectivity
npm run test:mcp

# Run MCP integration tests
npm run test:integration
```

## Important Notes

### For Claude Code Sessions
- This is a **shell-based agent system** - agents are implemented as documented bash scripts
- Always refer to agent documentation in `/docs/agents/` before modifying scripts
- Test agents with `--dry-run` flags before making changes
- Environment variables are loaded from `.env` file automatically
- Use shared functions from `scripts/shared-functions.sh` for common operations
- Follow the principle of "documentation-driven development"
- Each agent must have both documentation (.md) and implementation (.sh)

### Error Handling
- Shell scripts must use `set -e` for proper error handling
- All agent actions should be logged with timestamps
- Failed tasks should report back to originating issues via GitHub comments
- Use proper exit codes (0 for success, non-zero for errors)
- Validate environment variables and parameters before execution

### Security Considerations
- Shell scripts should validate all inputs and environment variables
- Use proper quoting to prevent injection attacks
- GitHub tokens should be stored securely as environment variables
- Limit agent permissions to only what's necessary
- Log all agent activities for audit trails

## Getting Started

### For New Contributors
1. Read this CLAUDE.md file thoroughly
2. Review agent documentation in `/docs/agents/`
3. Check agent implementations in `/scripts/`
4. Run `./start.sh setup` to initialize the system
5. Run `./start.sh help` to understand available commands

### For Claude Code Sessions
1. **Setup MCP Integration**: The project includes `.mcp.json` in the root for automatic MCP server configuration when you open the project
2. Start with: `./start.sh list` to see available agents
3. Check: agent documentation before modifying any scripts
4. Use: `--dry-run` flags to test changes safely
5. Always consider: How does this change support the self-building philosophy?
6. Follow: documentation-driven development - update docs first, then implementation

## Claude Code MCP Integration

### Automatic Configuration
This project includes a `.mcp.json` file that automatically configures the Selfie MCP server for Claude Code:

```json
{
  "mcpServers": {
    "selfie-mcp-server": {
      "command": "npm",
      "args": ["run", "mcp-server"],
      "env": {}
    }
  }
}
```

### Using Selfie Tools in Claude Code
Once the MCP server is configured, you'll have access to 12 coordination tools:

**Instance Management:**
- `selfie_register` - Register new Selfie instances
- `selfie_list_instances` - List all registered instances
- `selfie_unregister` - Remove instances

**Task Coordination:**
- `selfie_assign_task` - Assign development tasks
- `selfie_request_developer` - Auto-assign developers to issues
- `selfie_update_task_status` - Update task progress
- `selfie_get_task` / `selfie_list_tasks` - Retrieve task information

**Resource Management:**
- `selfie_claim_resource` - Claim exclusive access to files/branches
- `selfie_release_resource` - Release claimed resources

**System Information:**
- `selfie_get_stats` - Server statistics
- `selfie_get_state` - Detailed server state

### Example Claude Code Workflow
```markdown
1. Use `selfie_list_instances` to see available developer agents
2. Use `selfie_request_developer` to assign work to GitHub issues
3. Use `selfie_get_stats` to monitor system health
4. Use resource tools to coordinate file access between agents
```

This enables seamless coordination between Claude Code sessions and autonomous Selfie agents.

## Project Status

### Phase 1: MCP Server Development
- ✅ Shell-based agent architecture implemented
- ✅ Agent documentation framework created (`/docs/agents/`)
- ✅ Agent dispatcher system (`./start.sh`)
- ✅ Initializer agent documentation and script
- ✅ Developer agent documentation and script
- ✅ Reviewer agent documentation (script template)
- ✅ Tester agent documentation (script template)
- ✅ Core TypeScript library with hello world functions
- 🚧 **MCP Server Implementation** (current focus)
  - ⚠️ MCP server directory structure (needs creation)
  - ⚠️ MCP TypeScript SDK integration (needs implementation)
  - ⚠️ Inter-Selfie communication handlers (needs implementation)
  - ⚠️ Task coordination and distribution (needs implementation)
  - ⚠️ MCP server unit tests (needs implementation)
  - ⚠️ MCP integration tests (needs implementation)
- ⚠️ GitHub API integration via MCP (needs implementation)
- ⚠️ Agent-to-MCP integration (needs shell script updates)

## Reflection and Feedback System

### Core Principle
Selfie continuously improves through systematic reflection on its actions and outcomes. Every session, task completion, and significant interaction should trigger a reflection process that captures learnings and updates the system's knowledge base.

### Reflection Triggers
- **End of Session**: After every Claude Code session or agent task completion
- **Error Events**: When agents encounter failures or unexpected behaviors
- **Milestone Completion**: After completing significant development phases
- **Human Feedback**: When humans provide explicit feedback on agent performance

### Reflection Process

#### 1. Performance Assessment
- **Task Completion Quality**: How well did the agent meet the specified requirements?
- **Code Quality**: Was the generated code maintainable, efficient, and well-structured?
- **Process Efficiency**: Were there unnecessary steps or missed opportunities for optimization?
- **Human Interaction**: How effectively did the system communicate with human contributors?

#### 2. Learning Identification
- **Successful Patterns**: What approaches worked particularly well?
- **Failure Points**: Where did the system struggle or fail?
- **Knowledge Gaps**: What information was missing that would have improved performance?
- **Process Improvements**: How could the workflow be optimized?

#### 3. Knowledge Capture
All significant learnings must be documented in the `/docs` directory:

```
/docs/
├── learnings/
│   ├── agent-behavior/          # Agent-specific behavioral insights
│   ├── code-patterns/           # Effective coding approaches
│   ├── process-optimization/    # Workflow improvements
│   └── human-interaction/       # Communication best practices
├── failures/
│   ├── error-analysis/          # Detailed failure analysis
│   └── prevention-strategies/   # How to avoid similar issues
└── system-evolution/
    ├── capability-growth/       # New abilities discovered
    └── architecture-insights/   # System design learnings
```

### Reflection Actions

#### Immediate Actions
- **Session Summary**: Create brief summary of what was accomplished
- **Quality Assessment**: Rate the success of the session (1-5 scale)
- **Key Learnings**: Document 1-3 most important insights
- **Action Items**: Identify specific improvements for next sessions

#### Documentation Updates
- **Behavioral Patterns**: Update agent behavior guidelines based on successful approaches
- **Error Prevention**: Add new error handling patterns to agent code
- **Process Refinement**: Update workflow documentation with optimizations
- **Knowledge Base**: Expand system knowledge with new insights

#### Code Improvements
- **Self-Modification**: Agents should propose improvements to their own code
- **Pattern Recognition**: Implement successful patterns as reusable components
- **Error Handling**: Enhance error handling based on encountered failures
- **Capability Expansion**: Add new features based on identified needs

### Feedback Integration

#### From Human Contributors
- **GitHub Issue Comments**: Parse feedback from issue interactions
- **Pull Request Reviews**: Learn from code review feedback
- **Direct Communication**: Process explicit feedback about agent performance

#### From System Monitoring
- **Performance Metrics**: Track execution times, success rates, error frequencies
- **Resource Usage**: Monitor computational efficiency
- **Output Quality**: Assess code quality metrics over time

#### Self-Assessment
- **Goal Achievement**: Compare outcomes to original objectives
- **Efficiency Analysis**: Evaluate resource usage and time management
- **Quality Metrics**: Assess code maintainability, readability, and functionality

### Implementation Requirements

#### For All Agents
- **Reflection Method**: Every agent must implement a `reflect()` method
- **Learning Storage**: Agents must save learnings to appropriate `/docs` subdirectories
- **Performance Tracking**: Log key metrics for later analysis
- **Improvement Proposals**: Generate specific suggestions for system enhancement

#### Reflection Data Format
```json
{
  "session_id": "unique-identifier",
  "timestamp": "ISO-8601-datetime",
  "agent_type": "initializer|developer|etc",
  "task_summary": "brief description",
  "success_rating": 1-5,
  "key_learnings": ["learning1", "learning2"],
  "failures_encountered": ["error1", "error2"],
  "improvement_suggestions": ["suggestion1", "suggestion2"],
  "documentation_updates": ["file1", "file2"]
}
```

### Continuous Improvement Cycle

1. **Execute**: Agent performs assigned task
2. **Reflect**: Assess performance and identify learnings
3. **Document**: Save insights to knowledge base
4. **Improve**: Update code/processes based on learnings
5. **Share**: Make learnings available to other agents
6. **Iterate**: Apply improvements in next execution cycle

### Success Metrics

- **Learning Velocity**: Rate of new insights captured per session
- **Error Reduction**: Decrease in repeated mistakes over time
- **Quality Improvement**: Measurable improvements in code/output quality
- **Efficiency Gains**: Reduced time to complete similar tasks
- **Knowledge Application**: Evidence of applying previous learnings

---

*Last updated: June 6, 2025*
*This file serves as project memory for Claude Code and should be updated as the system evolves.*
