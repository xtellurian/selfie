#!/bin/bash

# Initializer Agent Script
# Monitors GitHub issues and spawns child agents

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
POLL_INTERVAL=30
DRY_RUN=false
VERBOSE=false
FILTER=""

# Function to display usage
show_help() {
    echo "Initializer Agent - Monitors GitHub issues and spawns child agents"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --poll-interval <seconds>  How often to check for new issues (default: 30)"
    echo "  --dry-run                  Show what would be done without doing it"
    echo "  --verbose                  Enable verbose logging"
    echo "  --filter <label>           Only process issues with specific labels"
    echo "  --help                     Show this help message"
    echo ""
}

# Function to log messages
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} [$timestamp] $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} [$timestamp] $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} [$timestamp] $message"
            ;;
        "DEBUG")
            if [ "$VERBOSE" = true ]; then
                echo -e "${BLUE}[DEBUG]${NC} [$timestamp] $message"
            fi
            ;;
    esac
}

# Function to validate environment
validate_environment() {
    log "DEBUG" "Validating environment variables"
    
    if [ -z "$GITHUB_TOKEN" ]; then
        log "ERROR" "GITHUB_TOKEN environment variable is required"
        exit 1
    fi
    
    if [ -z "$GITHUB_OWNER" ]; then
        log "ERROR" "GITHUB_OWNER environment variable is required"
        exit 1
    fi
    
    if [ -z "$GITHUB_REPO" ]; then
        log "ERROR" "GITHUB_REPO environment variable is required"
        exit 1
    fi
    
    log "INFO" "Environment validated successfully"
    log "DEBUG" "Repository: $GITHUB_OWNER/$GITHUB_REPO"
}

# Function to check for new issues
check_for_issues() {
    log "DEBUG" "Checking for new issues"
    
    # Example GitHub API call (would need actual implementation)
    local api_url="https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/issues"
    local filter_params="state=open&labels=agent:developer"
    
    if [ ! -z "$FILTER" ]; then
        filter_params="$filter_params,$FILTER"
    fi
    
    log "DEBUG" "API URL: $api_url?$filter_params"
    
    # This would be replaced with actual GitHub API integration
    log "INFO" "Scanning for issues with labels: $filter_params"
    
    # Simulate finding issues (replace with real API call)
    echo "Found 0 new issues to process"
}

# Function to spawn child agent
spawn_agent() {
    local agent_type="$1"
    local issue_number="$2"
    
    log "INFO" "Spawning $agent_type agent for issue #$issue_number"
    
    if [ "$DRY_RUN" = true ]; then
        log "INFO" "DRY RUN: Would spawn $agent_type agent for issue #$issue_number"
        return
    fi
    
    # Execute the appropriate agent script
    local agent_script="scripts/$agent_type.sh"
    
    if [ ! -f "$agent_script" ]; then
        log "ERROR" "Agent script not found: $agent_script"
        return 1
    fi
    
    log "DEBUG" "Executing: $agent_script --issue $issue_number"
    
    # Run agent in background
    "$agent_script" --issue "$issue_number" &
    local agent_pid=$!
    
    log "INFO" "Started $agent_type agent (PID: $agent_pid) for issue #$issue_number"
}

# Function to main monitoring loop
monitor_issues() {
    log "INFO" "Starting issue monitoring (poll interval: ${POLL_INTERVAL}s)"
    
    while true; do
        log "DEBUG" "Polling for new issues..."
        
        # Check for new issues and spawn agents as needed
        check_for_issues
        
        log "DEBUG" "Waiting $POLL_INTERVAL seconds before next poll"
        sleep "$POLL_INTERVAL"
    done
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --poll-interval)
            POLL_INTERVAL="$2"
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
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log "INFO" "Initializer Agent starting"
    
    if [ "$DRY_RUN" = true ]; then
        log "WARN" "Running in DRY RUN mode - no changes will be made"
    fi
    
    validate_environment
    
    # Set up signal handlers for graceful shutdown
    trap 'log "INFO" "Received shutdown signal, stopping..."; exit 0' SIGINT SIGTERM
    
    monitor_issues
}

# Run main function
main "$@"