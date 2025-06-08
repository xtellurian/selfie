# Selfie - Agentic Build System

An agentic build system that builds itself through autonomous agents coordinated via Model Context Protocol (MCP).

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm run build
```

### 2. Start the MCP Server

```bash
npm run mcp-server
```

The MCP server will start on stdio and be ready to accept connections from Claude Code or other MCP clients.

### 3. Add to Claude Code

Configure the Selfie MCP server in Claude Code:

#### Method 1: Using Claude Code CLI
```bash
# Add the MCP server to Claude Code (run from project directory)
claude-code add-mcp-server \
  --name selfie-mcp-server \
  --command "npm run mcp-server" \
  --working-directory "$(pwd)"
```

#### Method 2: Manual Configuration
Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "selfie-mcp-server": {
      "command": "npm",
      "args": ["run", "mcp-server"],
      "cwd": "/path/to/selfie/project"
    }
  }
}
```

**Configuration Details:**
- **Server Name**: `selfie-mcp-server`
- **Command**: `npm run mcp-server`
- **Working Directory**: This project's root directory
- **Transport**: stdio (default)

### 4. Example MCP Usage

Once connected, you can use Selfie coordination tools in Claude Code. Here's a complete workflow:

#### Step 1: Register a Selfie Instance
```json
{
  "tool": "selfie_register",
  "arguments": {
    "instance": {
      "id": "my-developer-1",
      "type": "developer",
      "status": "idle",
      "capabilities": ["development", "typescript", "testing"],
      "metadata": {
        "version": "1.0.0",
        "location": "local"
      }
    }
  }
}
```

**Response:**
```json
{
  "registered": true,
  "instanceId": "my-developer-1"
}
```

#### Step 2: Request a Developer for an Issue
```json
{
  "tool": "selfie_request_developer",
  "arguments": {
    "issueNumber": 123,
    "priority": "high",
    "requirements": ["typescript", "api-development"]
  }
}
```

**Response:**
```json
{
  "taskId": "task-abc123",
  "assignedTo": "my-developer-1",
  "estimated_start": "2024-01-15T10:30:00Z"
}
```

#### Step 3: Check Instance Status
```json
{
  "tool": "selfie_list_instances",
  "arguments": {
    "type": "developer",
    "status": "idle"
  }
}
```

**Response:**
```json
{
  "instances": [
    {
      "id": "my-developer-1",
      "type": "developer",
      "status": "idle",
      "capabilities": ["development", "typescript", "testing"],
      "lastSeen": "2024-01-15T10:30:00Z",
      "metadata": {
        "version": "1.0.0",
        "location": "local"
      }
    }
  ]
}
```

#### Step 4: Claim a Resource (Prevent Conflicts)
```json
{
  "tool": "selfie_claim_resource",
  "arguments": {
    "resourceType": "file",
    "resourceId": "src/important.ts",
    "instanceId": "my-developer-1",
    "operation": "write"
  }
}
```

**Response:**
```json
{
  "claimed": true
}
```

#### Step 5: Get Server Statistics
```json
{
  "tool": "selfie_get_stats",
  "arguments": {}
}
```

**Response:**
```json
{
  "uptime": 1834567,
  "instances": 1,
  "tasks": 1,
  "resources": 1,
  "startedAt": "2024-01-15T10:00:00Z"
}
```

## Available MCP Tools

The Selfie MCP server provides 12 coordination tools:

### Instance Management
- `selfie_register` - Register a new Selfie instance
- `selfie_heartbeat` - Send keepalive and status updates
- `selfie_unregister` - Remove instance from coordination
- `selfie_list_instances` - List registered instances with filters

### Task Coordination
- `selfie_assign_task` - Assign development/review/test tasks
- `selfie_update_task_status` - Update task progress
- `selfie_get_task` - Retrieve specific task details
- `selfie_list_tasks` - List tasks with filtering
- `selfie_request_developer` - Auto-assign developer to issue

### Resource Management
- `selfie_claim_resource` - Claim exclusive access to resources
- `selfie_release_resource` - Release claimed resources

### Server Information
- `selfie_get_stats` - Server statistics and health
- `selfie_get_state` - Detailed server state (debugging)

## Development

### Run Tests
```bash
npm test                    # All tests
npm run test:mcp           # MCP server tests only
npm run test:integration   # Integration tests only
```

### Build and Lint
```bash
npm run build     # Compile TypeScript
npm run lint      # Check code style
npm run typecheck # Type checking only
```

## Troubleshooting

### MCP Server Issues

**Server won't start:**
```bash
# Check dependencies
npm install
npm run build

# Verify server starts
npm run mcp-server
# Should show: "Selfie MCP Server started on stdio"
```

**Claude Code can't connect:**
1. Verify the working directory is correct in MCP config
2. Ensure `npm run mcp-server` works from that directory
3. Check Claude Code logs for connection errors

**Tools not appearing:**
- Restart Claude Code after adding MCP server
- Verify server name matches in configuration
- Check server is running with `selfie_get_stats` tool

### Common Errors

**"Cannot find module" errors:**
```bash
npm install  # Install missing dependencies
npm run build  # Rebuild TypeScript
```

**Jest timeout errors:**
```bash
npm test -- --detectOpenHandles  # Debug hanging tests
```

## Architecture

Selfie uses an MCP server to coordinate multiple autonomous agent instances:

- **Initializer Agents**: Monitor GitHub issues and spawn child tasks
- **Developer Agents**: Implement features via pull requests
- **Reviewer Agents**: Perform code reviews (planned)
- **Tester Agents**: Create and run tests (planned)

All agents communicate through the central MCP server to prevent conflicts and coordinate work distribution.

## Project Status

**Phase 1: MCP Server Development** ✅ Complete
- ✅ MCP server implementation with TypeScript SDK
- ✅ 12 coordination tools for inter-agent communication
- ✅ Resource conflict detection and management
- ✅ Comprehensive unit and integration test coverage
- ✅ Task assignment and lifecycle management

**Next Phase**: Agent integration with MCP calls and GitHub automation

For detailed documentation, see [CLAUDE.md](./CLAUDE.md).