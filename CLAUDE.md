# Selfie - Agentic Build System

## Project Overview

**Selfie** is an agentic build system that builds itself. This is a revolutionary approach to software development where the system evolves and improves through autonomous agents that respond to human input and create their own development tasks.

## Current Phase: Initialization

We are currently in **Phase 1: Initialization**. During this phase, we are building the foundational automations that will enable the system to create changes to itself based on human input.

## System Architecture

### Core Philosophy
- **Self-Building**: The system creates and modifies its own code
- **Agentic**: Autonomous agents handle different aspects of development
- **Human-Guided**: Agents respond to human input via GitHub issues
- **Iterative**: Each phase builds upon the previous one

### Agent Types

#### 1. Initializer Agent
- **Purpose**: Observe human input and spawn child agentic tasks
- **Input Source**: GitHub issues in this repository
- **Trigger**: `./start.sh initializer [options]`
- **Responsibilities**:
  - Monitor GitHub issues for new development tasks
  - Parse and understand human requirements
  - Create appropriate child agent tasks
  - Route tasks to the correct specialized agents

#### 2. Developer Agent
- **Purpose**: Transform specifications into working code via pull requests
- **Trigger**: Spawned by Initializer Agent when development tasks are detected
- **Input**: Specification from GitHub issue
- **Output**: Pull Request with implementation
- **Responsibilities**:
  - Analyze development specifications
  - Plan implementation approach
  - Write code to meet specifications
  - Create comprehensive pull requests
  - Handle cases where specs are not completable (post back to original issue)

### Future Agent Types (Planned)
- **Reviewer Agent**: Code review and quality assurance
- **Tester Agent**: Automated testing and validation
- **Documentation Agent**: Maintain project documentation
- **Deployment Agent**: Handle releases and deployments

## Entry Points

### Main Startup Script
```bash
./start.sh [agent_type] [options]
```

### Agent-Specific Commands
```bash
# Start the initializer agent
./start.sh initializer

# Start a specific developer task
./start.sh developer --issue-number 123

# View available agent types
./start.sh --help
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
├── agents/              # Agent implementations
│   ├── initializer/     # Initializer agent code
│   ├── developer/       # Developer agent code
│   └── shared/          # Shared utilities
├── docs/                # Documentation
├── start.sh             # Main entry point
└── CLAUDE.md           # This file (project memory)
```

### Naming Conventions
- **Agents**: PascalCase classes (e.g., `InitializerAgent`, `DeveloperAgent`)
- **Functions**: camelCase (e.g., `parseGitHubIssue`, `createPullRequest`)
- **Files**: kebab-case (e.g., `github-utils.ts`, `agent-base.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)

### Language Requirements
- **TypeScript Only**: All source code, tests, and fixtures must be written in TypeScript (.ts files)
- **No JavaScript**: Do not create .js files - everything should be TypeScript
- **Type Safety**: Maintain strict TypeScript typing throughout the codebase
- **ES Modules**: Use ES module syntax (import/export)

### Git Workflow
- **Main branch**: `main` (protected, requires PR)
- **Feature branches**: `feature/agent-type-description` (e.g., `feature/initializer-github-integration`)
- **Agent branches**: `agent/agent-name-task-id` (e.g., `agent/developer-issue-123`)

## Key Technologies

### Runtime Environment
- **Node.js**: Primary runtime for agent execution
- **Shell Scripts**: System integration and startup
- **Git**: Version control and collaboration

### Integration Points
- **GitHub API**: Issue monitoring and PR creation
- **Claude Code**: AI-powered development assistance
- **GitHub Actions**: CI/CD pipeline (future)

## Common Commands

### Development Commands
```bash
# Install dependencies (when package.json exists)
npm install

# Run tests (when test suite exists)
npm test

# Start development mode
./start.sh --dev

# Check agent status
./start.sh status
```

### Agent Commands
```bash
# List all issues assigned to agents
./start.sh issues list

# Check agent health
./start.sh health-check

# Force agent restart
./start.sh restart [agent-type]
```

## Important Notes

### For Claude Code Sessions
- This is a **self-modifying system** - be cautious with changes
- Always test agents in isolated environments first
- Agent code should be robust and handle edge cases
- Follow the principle of "agents building agents"

### Error Handling
- Agents must gracefully handle API failures
- All agent actions should be logged
- Failed tasks should report back to originating issues
- System should be resilient to individual agent failures

### Security Considerations
- Agents have write access to the repository
- Validate all external inputs thoroughly
- Use least-privilege principles for API access
- Monitor agent behavior for unexpected patterns

## Getting Started

### For New Contributors
1. Read this CLAUDE.md file thoroughly
2. Review existing agent implementations in `/agents/`
3. Check current GitHub issues for context
4. Run `./start.sh --help` to understand available commands

### For Claude Code Sessions
1. Start with: `/init` to understand current project state
2. Use: `summarize this project` to get oriented
3. Check: `list current GitHub issues` to see active tasks
4. Always consider: How does this change support the self-building philosophy?

## Project Status

- ✅ Basic project structure established
- ✅ Claude Code integration completed
- ✅ Documentation framework created
- ✅ Initializer agent (completed)
- ✅ Developer agent (completed)
- ✅ GitHub API integration (completed)
- ✅ Agent coordination system (completed)
- ✅ End-to-end testing framework (completed)
- ✅ Unit test coverage for all agents (completed)

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
