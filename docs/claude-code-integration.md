# Claude Code Integration

This document explains how to use Selfie with Claude Code through MCP (Model Context Protocol) integration.

## Quick Setup

1. **Open this project in Claude Code** - the `.mcp.json` file in the project root will be automatically detected
2. **The MCP server will start automatically** when you use Selfie tools
3. **Use Selfie tools** directly in Claude Code conversations

### Alternative Setup (Manual)
```bash
# Add project-scoped server manually (run from project directory)
claude mcp add selfie-mcp-server -s project "npm run mcp-server"
```

## Available Tools

Once connected, you'll have access to 12 Selfie coordination tools:

### Instance Management
```markdown
- selfie_register: Register new Selfie instances
- selfie_list_instances: List all registered instances  
- selfie_unregister: Remove instances from coordination
- selfie_heartbeat: Send keepalive signals
```

### Task Coordination
```markdown
- selfie_assign_task: Assign development/review/test tasks
- selfie_request_developer: Auto-assign developer to GitHub issue
- selfie_update_task_status: Update task progress
- selfie_get_task: Retrieve specific task details
- selfie_list_tasks: List tasks with filtering
```

### Resource Management
```markdown
- selfie_claim_resource: Claim exclusive access to files/branches/issues
- selfie_release_resource: Release claimed resources
```

### System Information
```markdown
- selfie_get_stats: Server statistics and health
```

## Example Workflows

### 1. Monitor System Health
```json
{
  "tool": "selfie_get_stats",
  "arguments": {}
}
```

### 2. Assign Developer to GitHub Issue
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

### 3. Check Active Instances
```json
{
  "tool": "selfie_list_instances",
  "arguments": {
    "type": "developer",
    "status": "idle"
  }
}
```

### 4. Claim File for Editing
```json
{
  "tool": "selfie_claim_resource",
  "arguments": {
    "resourceType": "file",
    "resourceId": "src/important.ts", 
    "instanceId": "claude-code-session",
    "operation": "edit"
  }
}
```

## Integration Benefits

- **Coordinate with autonomous agents** - Selfie agents can work while you use Claude Code
- **Prevent conflicts** - Resource claiming prevents multiple agents editing the same files
- **Monitor progress** - See what agents are working on in real-time
- **Hybrid development** - Mix manual Claude Code work with autonomous agent tasks

## Troubleshooting

### Tools Not Appearing
1. Verify `.mcp.json` is in the project root
2. Check MCP server is running: `npm run mcp-server`
3. Restart Claude Code to reload configuration

### Connection Issues
1. Ensure dependencies are installed: `npm install`
2. Build the project: `npm run build`
3. Check for TypeScript compilation errors

### Permission Errors
1. Verify the project has write permissions
2. Check that Node.js and npm are properly installed
3. Ensure the MCP server process can start successfully

## Advanced Configuration

For custom configurations, modify `.mcp.json`:

```json
{
  "mcpServers": {
    "selfie-mcp-server": {
      "command": "npm",
      "args": ["run", "mcp-server"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "selfie:*"
      }
    }
  }
}
```

This enables Selfie's powerful agent coordination directly within Claude Code sessions!