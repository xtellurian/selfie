# Selfie - Agentic Build System

## Project Overview

**Selfie** is an agentic build system that builds itself. This is a revolutionary approach to software development where the system evolves and improves through autonomous agents that respond to human input and create their own development tasks.

## Current Phase: Initialization

We are currently in **Phase 1: Initialization**. During this phase, we are building the foundational automations that will enable the system to create changes to itself based on human input.

## System Architecture

### Core Philosophy
- **Self-Building**: The system creates and modifies its own code
- **Agentic**: Shell-based autonomous agents handle different aspects of development
- **Human-Guided**: Agents respond to human input via GitHub issues
- **Iterative**: Each phase builds upon the previous one
- **Documentation-Driven**: Each agent is defined by its documentation in `/docs/agents/`

### Agent Architecture

Agents are implemented as shell scripts with comprehensive documentation:
- **Agent Documentation**: `/docs/agents/<agent-name>.md` - Defines purpose, usage, and requirements
- **Agent Scripts**: `/scripts/<agent-name>.sh` - Executable implementation
- **Dispatcher**: `./start.sh` - Routes commands to appropriate agents

### Agent Types

#### 1. Initializer Agent
- **Purpose**: Observe human input and spawn child agentic tasks
- **Documentation**: `/docs/agents/initializer.md`
- **Script**: `/scripts/initializer.sh`
- **Trigger**: `./start.sh initializer [options]`
- **Responsibilities**:
  - Monitor GitHub issues for new development tasks
  - Parse and understand human requirements
  - Create appropriate child agent tasks
  - Route tasks to the correct specialized agents

#### 2. Developer Agent
- **Purpose**: Transform specifications into working code via pull requests
- **Documentation**: `/docs/agents/developer.md`
- **Script**: `/scripts/developer.sh`
- **Trigger**: `./start.sh developer --issue <number> [options]`
- **Responsibilities**:
  - Analyze development specifications
  - Plan implementation approach
  - Write code to meet specifications
  - Create comprehensive pull requests
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
│   ├── initializer.sh
│   ├── developer.sh
│   ├── reviewer.sh
│   └── tester.sh
├── src/                 # TypeScript library (minimal)
│   └── index.ts         # Hello world functions
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
- **TypeScript**: Minimal Node.js library in src/ (hello world functions only)
- **Markdown**: Comprehensive documentation for all agents
- **Shell Best Practices**: Use `set -e`, proper quoting, and error handling

### Git Workflow
- **Main branch**: `main` (protected, requires PR)
- **Feature branches**: `feature/agent-type-description` (e.g., `feature/initializer-github-integration`)
- **Agent branches**: `agent/agent-name-task-id` (e.g., `agent/developer-issue-123`)

## Key Technologies

### Runtime Environment
- **Bash**: Primary runtime for agent execution
- **Node.js**: Minimal TypeScript library compilation and hello world functions
- **Git**: Version control and collaboration
- **GitHub CLI**: Optional integration for advanced GitHub operations

### Integration Points
- **GitHub API**: Issue monitoring and PR creation via curl/wget
- **Claude Code**: AI-powered development assistance
- **GitHub Actions**: CI/CD pipeline for agent validation
- **Shell Environment**: Direct system integration and process management

## Common Commands

### Development Commands
```bash
# Initialize the agent system
./start.sh setup

# Build TypeScript library
npm run build

# Run TypeScript tests
npm test

# List available agents
./start.sh list

# Show system version
./start.sh version
```

### Agent Commands
```bash
# Start monitoring for issues
./start.sh initializer

# Implement a specific issue
./start.sh developer --issue 123

# Review a pull request
./start.sh reviewer --pr 456

# Generate tests for code
./start.sh tester --target src/
```

## Important Notes

### For Claude Code Sessions
- This is a **shell-based agent system** - agents are implemented as documented bash scripts
- Always refer to agent documentation in `/docs/agents/` before modifying scripts
- Test agents with `--dry-run` flags before making changes
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
1. Start with: `./start.sh list` to see available agents
2. Check: agent documentation before modifying any scripts
3. Use: `--dry-run` flags to test changes safely
4. Always consider: How does this change support the self-building philosophy?
5. Follow: documentation-driven development - update docs first, then implementation

## Project Status

- ✅ Shell-based agent architecture implemented
- ✅ Agent documentation framework created (`/docs/agents/`)
- ✅ Agent dispatcher system (`./start.sh`)
- ✅ Initializer agent documentation and script
- ✅ Developer agent documentation and script
- ✅ Reviewer agent documentation (script template)
- ✅ Tester agent documentation (script template)
- ✅ Minimal TypeScript library with hello world functions
- ⚠️ GitHub API integration (needs implementation in shell scripts)
- ⚠️ End-to-end testing (needs adaptation to shell-based system)

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
