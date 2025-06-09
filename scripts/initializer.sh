#!/bin/bash

#
# Initializer Agent Script
# 
# Monitors GitHub issues and spawns child agents via MCP coordination
#

set -euo pipefail

# Get script directory  
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source shared functions
source "$SCRIPT_DIR/shared-functions.sh"

# Default configuration
POLL_INTERVAL=30
DRY_RUN=false
VERBOSE=false
FILTER=""
MCP_SERVER_URL="http://localhost:3000"
MAX_INSTANCES=3
SELFIE_INSTANCE_ID="initializer-$(date +%s)"
STATE_FILE="$PROJECT_ROOT/.initializer-state.json"
SPECIFIC_ISSUE=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
show_help() {
    echo "Initializer Agent - Monitors GitHub issues and spawns child agents"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --poll-interval <seconds>   How often to check for new issues (default: 30)"
    echo "  --dry-run                   Show what would be done without doing it"
    echo "  --verbose                   Enable verbose logging"
    echo "  --filter <label>            Only process issues with specific labels"
    echo "  --mcp-server <url>          MCP server URL (default: http://localhost:3000)"
    echo "  --max-instances <number>    Maximum developer instances (default: 3)"
    echo "  --issue <number>            Process a specific issue number (skip monitoring)"
    echo "  --help                      Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  GITHUB_TOKEN               GitHub personal access token (required)"
    echo "  GITHUB_OWNER               GitHub repository owner (required)"
    echo "  GITHUB_REPO                GitHub repository name (required)"
    echo "  MCP_SERVER_URL             MCP server URL for coordination"
    echo "  SELFIE_INSTANCE_ID         Unique identifier for this instance"
    echo ""
    echo "Examples:"
    echo "  $0                         # Start with default settings"
    echo "  $0 --poll-interval 10      # Check every 10 seconds"
    echo "  $0 --dry-run --verbose     # Test mode with detailed logging"
    echo "  $0 --filter priority:high  # Only process high priority issues"
    echo "  $0 --issue 123             # Process specific issue #123"
}

# Function to initialize state tracking
init_state() {
    if [ ! -f "$STATE_FILE" ]; then
        log "DEBUG" "Creating state file: $STATE_FILE"
        echo '{"processed_issues": [], "active_agents": {}, "last_poll": null}' > "$STATE_FILE"
    fi
    log "DEBUG" "State file initialized"
}

# Function to read state
read_state() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo '{"processed_issues": [], "active_agents": {}, "last_poll": null}'
    fi
}

# Function to update state
update_state() {
    local new_state="$1"
    echo "$new_state" > "$STATE_FILE"
    log "DEBUG" "State updated"
}

# Function to register with MCP server
register_with_mcp() {
    log "INFO" "Registering with MCP server: $MCP_SERVER_URL"
    
    if [ "$DRY_RUN" = true ]; then
        log "INFO" "DRY RUN: Would register with MCP server"
        return 0
    fi
    
    # Build the project first to ensure MCP client exists
    cd "$PROJECT_ROOT"
    if ! npm run build > /dev/null 2>&1; then
        log "WARN" "Failed to build project, continuing without MCP integration"
        return 1
    fi
    
    # Use the TypeScript MCP client to register
    local register_result
    if register_result=$(node -e "
        const { SelfieMCPClient } = require('./dist/mcp-client/index.js');
        const client = new SelfieMCPClient({
            serverCommand: 'npm',
            serverArgs: ['run', 'mcp-server'],
            workingDirectory: '$PROJECT_ROOT'
        });
        
        async function register() {
            try {
                await client.connect();
                const result = await client.register({
                    id: '$SELFIE_INSTANCE_ID',
                    type: 'initializer',
                    status: 'idle',
                    capabilities: ['monitoring', 'coordination', 'task-spawning'],
                    metadata: {
                        version: '1.0.0',
                        pollInterval: $POLL_INTERVAL,
                        maxInstances: $MAX_INSTANCES,
                        startedAt: new Date().toISOString()
                    }
                });
                console.log('SUCCESS');
                await client.disconnect();
            } catch (error) {
                console.log('ERROR: ' + error.message);
                process.exit(1);
            }
        }
        
        register();
    " 2>/dev/null); then
        if [[ "$register_result" == "SUCCESS" ]]; then
            log "INFO" "Successfully registered with MCP server"
            return 0
        else
            log "WARN" "MCP registration failed: $register_result"
            return 1
        fi
    else
        log "WARN" "Failed to connect to MCP server, continuing without coordination"
        return 1
    fi
}

# Function to request developer via MCP
request_developer_via_mcp() {
    local issue_number="$1"
    
    log "INFO" "Requesting developer via MCP for issue #$issue_number"
    
    if [ "$DRY_RUN" = true ]; then
        log "INFO" "DRY RUN: Would request developer via MCP for issue #$issue_number"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    local request_result
    if request_result=$(node -e "
        const { SelfieMCPClient } = require('./dist/mcp-client/index.js');
        const client = new SelfieMCPClient({
            serverCommand: 'npm',
            serverArgs: ['run', 'mcp-server'],
            workingDirectory: '$PROJECT_ROOT'
        });
        
        async function requestDeveloper() {
            try {
                await client.connect();
                const result = await client.requestDeveloper({
                    issueNumber: $issue_number,
                    priority: 'medium',
                    requirements: ['typescript', 'development']
                });
                console.log('ASSIGNED:' + result.assignedTo + ':' + result.taskId);
                await client.disconnect();
            } catch (error) {
                console.log('ERROR: ' + error.message);
                process.exit(1);
            }
        }
        
        requestDeveloper();
    " 2>/dev/null); then
        if [[ "$request_result" == ASSIGNED:* ]]; then
            local assigned_to=$(echo "$request_result" | cut -d: -f2)
            local task_id=$(echo "$request_result" | cut -d: -f3)
            log "INFO" "Developer assigned via MCP: $assigned_to (task: $task_id)"
            return 0
        else
            log "ERROR" "MCP developer request failed: $request_result"
            return 1
        fi
    else
        log "ERROR" "Failed to request developer via MCP"
        return 1
    fi
}

# Function to spawn local developer agent
spawn_local_developer() {
    local issue_number="$1"
    
    log "INFO" "Spawning local developer agent for issue #$issue_number"
    
    if [ "$DRY_RUN" = true ]; then
        log "INFO" "DRY RUN: Would spawn local developer for issue #$issue_number"
        return 0
    fi
    
    local developer_script="$SCRIPT_DIR/developer.sh"
    
    if [ ! -f "$developer_script" ]; then
        log "ERROR" "Developer script not found: $developer_script"
        return 1
    fi
    
    log "DEBUG" "Executing: $developer_script $issue_number"
    
    # Run developer in background
    "$developer_script" "$issue_number" &
    local agent_pid=$!
    
    log "INFO" "Started local developer agent (PID: $agent_pid) for issue #$issue_number"
    
    # Update state to track active agent
    local current_state=$(read_state)
    local updated_state=$(echo "$current_state" | jq --arg issue "$issue_number" --arg pid "$agent_pid" \
        '.active_agents[$issue] = {pid: ($pid | tonumber), started: now}')
    update_state "$updated_state"
    
    return 0
}

# Function to process a specific issue
process_specific_issue() {
    local issue_number="$1"
    
    log "INFO" "Processing specific issue #$issue_number"
    
    local api_url="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/issues/$issue_number"
    
    # Fetch issue details from GitHub API
    local response
    if ! response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
                          -H "Accept: application/vnd.github.v3+json" \
                          "$api_url"); then
        log "ERROR" "Failed to fetch issue #$issue_number from GitHub API"
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response" | jq empty 2>/dev/null; then
        log "ERROR" "Invalid JSON response from GitHub API"
        log "DEBUG" "Response: $response"
        return 1
    fi
    
    # Check if issue exists and is open
    local state=$(echo "$response" | jq -r '.state')
    if [ "$state" = "null" ] || [ "$state" != "open" ]; then
        log "ERROR" "Issue #$issue_number is not open or does not exist"
        return 1
    fi
    
    local issue_title=$(echo "$response" | jq -r '.title')
    local issue_labels=$(echo "$response" | jq -r '.labels[].name' | tr '\n' ',' | sed 's/,$//')
    
    log "INFO" "Processing issue #$issue_number: $issue_title"
    log "DEBUG" "Labels: $issue_labels"
    
    # Try MCP coordination first, fall back to local spawning
    if ! request_developer_via_mcp "$issue_number"; then
        log "WARN" "MCP coordination failed, falling back to local agent spawning"
        spawn_local_developer "$issue_number"
    fi
    
    # Mark issue as processed in state
    local current_state=$(read_state)
    local updated_state=$(echo "$current_state" | jq --arg issue "$issue_number" \
        '.processed_issues += [$issue] | .last_poll = now')
    update_state "$updated_state"
    
    log "INFO" "Successfully processed issue #$issue_number"
    return 0
}

# Function to check for new issues using GitHub API
check_for_issues() {
    log "DEBUG" "Checking for new issues via GitHub API"
    
    local api_url="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/issues"
    local filter_params="state=open&labels=agent:developer"
    
    if [ ! -z "$FILTER" ]; then
        filter_params="$filter_params,$FILTER"
    fi
    
    log "DEBUG" "API URL: $api_url?$filter_params"
    
    # Get current state
    local current_state=$(read_state)
    local processed_issues=$(echo "$current_state" | jq -r '.processed_issues[]')
    
    # Fetch issues from GitHub API
    local response
    if ! response=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
                          -H "Accept: application/vnd.github.v3+json" \
                          "$api_url?$filter_params"); then
        log "ERROR" "Failed to fetch issues from GitHub API"
        return 1
    fi
    
    # Check if response is valid JSON
    if ! echo "$response" | jq empty 2>/dev/null; then
        log "ERROR" "Invalid JSON response from GitHub API"
        log "DEBUG" "Response: $response"
        return 1
    fi
    
    # Parse issues and find new ones
    local new_issues=0
    local issue_numbers
    
    if issue_numbers=$(echo "$response" | jq -r '.[].number' 2>/dev/null); then
        while IFS= read -r issue_number; do
            if [ -z "$issue_number" ] || [ "$issue_number" = "null" ]; then
                continue
            fi
            
            # Check if we've already processed this issue
            if echo "$processed_issues" | grep -q "^$issue_number$"; then
                log "DEBUG" "Issue #$issue_number already processed, skipping"
                continue
            fi
            
            log "INFO" "Found new issue #$issue_number for processing"
            
            # Get issue details
            local issue_details
            if issue_details=$(echo "$response" | jq --arg num "$issue_number" '.[] | select(.number == ($num | tonumber))'); then
                local issue_title=$(echo "$issue_details" | jq -r '.title')
                local issue_labels=$(echo "$issue_details" | jq -r '.labels[].name' | tr '\n' ',' | sed 's/,$//')
                
                log "INFO" "Processing issue #$issue_number: $issue_title"
                log "DEBUG" "Labels: $issue_labels"
                
                # Try MCP coordination first, fall back to local spawning
                if ! request_developer_via_mcp "$issue_number"; then
                    log "WARN" "MCP coordination failed, falling back to local agent spawning"
                    spawn_local_developer "$issue_number"
                fi
                
                # Mark issue as processed
                local updated_state=$(echo "$current_state" | jq --arg issue "$issue_number" \
                    '.processed_issues += [$issue] | .last_poll = now')
                update_state "$updated_state"
                current_state="$updated_state"
                
                new_issues=$((new_issues + 1))
            else
                log "ERROR" "Failed to parse issue details for #$issue_number"
            fi
        done <<< "$issue_numbers"
    else
        log "DEBUG" "No issues found or failed to parse issue numbers"
    fi
    
    if [ $new_issues -eq 0 ]; then
        log "DEBUG" "No new issues found"
    else
        log "INFO" "Processed $new_issues new issue(s)"
    fi
    
    return 0
}

# Function to cleanup finished agents
cleanup_finished_agents() {
    log "DEBUG" "Checking for finished agents"
    
    local current_state=$(read_state)
    local active_agents=$(echo "$current_state" | jq -r '.active_agents | keys[]')
    
    if [ -z "$active_agents" ]; then
        return 0
    fi
    
    local updated_state="$current_state"
    
    while IFS= read -r issue_number; do
        if [ -z "$issue_number" ]; then
            continue
        fi
        
        local pid=$(echo "$current_state" | jq -r --arg issue "$issue_number" '.active_agents[$issue].pid')
        
        if [ "$pid" != "null" ] && [ ! -z "$pid" ]; then
            # Check if process is still running
            if ! kill -0 "$pid" 2>/dev/null; then
                log "INFO" "Agent for issue #$issue_number (PID: $pid) has finished"
                updated_state=$(echo "$updated_state" | jq --arg issue "$issue_number" 'del(.active_agents[$issue])')
            fi
        fi
    done <<< "$active_agents"
    
    update_state "$updated_state"
}

# Function for main monitoring loop
monitor_issues() {
    log "INFO" "Starting issue monitoring (poll interval: ${POLL_INTERVAL}s)"
    log "INFO" "Repository: $GITHUB_OWNER/$GITHUB_REPO"
    log "INFO" "Filter: ${FILTER:-none}"
    log "INFO" "Max instances: $MAX_INSTANCES"
    
    # Register with MCP server if available
    MCP_AVAILABLE=false
    if register_with_mcp; then
        MCP_AVAILABLE=true
        log "INFO" "MCP coordination enabled"
    else
        log "WARN" "MCP coordination disabled, using local agents only"
    fi
    
    local poll_count=0
    
    while true; do
        poll_count=$((poll_count + 1))
        log "DEBUG" "Poll #$poll_count - Checking for new issues..."
        
        # Clean up any finished agents
        cleanup_finished_agents
        
        # Check for new issues and spawn agents as needed
        if ! check_for_issues; then
            log "ERROR" "Failed to check for issues, will retry next cycle"
        fi
        
        log "DEBUG" "Waiting $POLL_INTERVAL seconds before next poll"
        sleep "$POLL_INTERVAL"
    done
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --poll-interval)
            POLL_INTERVAL="$2"
            if ! [[ "$POLL_INTERVAL" =~ ^[0-9]+$ ]] || [ "$POLL_INTERVAL" -lt 1 ]; then
                echo -e "${RED}Error: Poll interval must be a positive integer${NC}" >&2
                exit 1
            fi
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --filter)
            FILTER="$2"
            shift 2
            ;;
        --mcp-server)
            MCP_SERVER_URL="$2"
            shift 2
            ;;
        --max-instances)
            MAX_INSTANCES="$2"
            if ! [[ "$MAX_INSTANCES" =~ ^[0-9]+$ ]] || [ "$MAX_INSTANCES" -lt 1 ]; then
                echo -e "${RED}Error: Max instances must be a positive integer${NC}" >&2
                exit 1
            fi
            shift 2
            ;;
        --issue)
            SPECIFIC_ISSUE="$2"
            if ! [[ "$SPECIFIC_ISSUE" =~ ^[0-9]+$ ]] || [ "$SPECIFIC_ISSUE" -lt 1 ]; then
                echo -e "${RED}Error: Issue number must be a positive integer${NC}" >&2
                exit 1
            fi
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}" >&2
            show_help >&2
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log "INFO" "Initializer Agent starting"
    log "INFO" "Instance ID: $SELFIE_INSTANCE_ID"
    
    # Change to project root
    cd "$PROJECT_ROOT"
    
    # Load environment variables
    load_dotenv
    
    if [ "$DRY_RUN" = true ]; then
        log "WARN" "Running in DRY RUN mode - no changes will be made"
    fi
    
    # Validate environment
    validate_environment
    
    # Check for required tools
    if ! command -v curl >/dev/null 2>&1; then
        log "ERROR" "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        log "ERROR" "jq is required but not installed"
        log "ERROR" "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
    
    # Initialize state tracking
    init_state
    
    # Setup signal handlers for graceful shutdown
    setup_signal_handlers "Initializer Agent"
    
    # Check if we should process a specific issue or start monitoring
    if [ ! -z "$SPECIFIC_ISSUE" ]; then
        log "INFO" "Processing specific issue #$SPECIFIC_ISSUE"
        
        # Register with MCP server if available
        if register_with_mcp; then
            log "INFO" "MCP coordination enabled for issue processing"
        else
            log "WARN" "MCP coordination disabled, using local agents only"
        fi
        
        # Process the specific issue
        process_specific_issue "$SPECIFIC_ISSUE"
        
        log "INFO" "Issue processing completed"
    else
        # Start monitoring
        monitor_issues
    fi
}

# Run main function
main "$@"