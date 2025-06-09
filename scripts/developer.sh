#!/bin/bash

#
# Developer Agent Script
# 
# Shell wrapper for the TypeScript developer agent
#

set -euo pipefail

# Get script directory  
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print usage
print_usage() {
    echo "Developer Agent - Implements features from GitHub issues"
    echo ""
    echo "Usage: $0 <issue-number> [options]"
    echo ""
    echo "Options:"
    echo "  <issue-number>          GitHub issue number to implement (required)"
    echo "  --help, -h              Show this help message"
    echo "  --dry-run              Show what would be done without executing"
    echo "  --claude-path PATH     Path to Claude CLI (default: claude)"
    echo "  --mcp-server           Use MCP server for coordination"
    echo "  --no-mcp               Skip MCP server integration"
    echo ""
    echo "Environment Variables:"
    echo "  GITHUB_TOKEN           GitHub personal access token (required)"
    echo "  GITHUB_OWNER           GitHub repository owner (required)"
    echo "  GITHUB_REPO            GitHub repository name (required)"
    echo "  CLAUDE_PATH            Path to Claude CLI executable"
    echo "  MCP_SERVER_COMMAND     Command to start MCP server"
    echo "  MCP_SERVER_ARGS        Arguments for MCP server command"
    echo ""
    echo "Examples:"
    echo "  $0 123                 # Implement issue #123"
    echo "  $0 456 --dry-run       # Show plan for issue #456"
    echo "  $0 789 --no-mcp        # Work without MCP coordination"
}

# Function to load environment variables from .env file
load_dotenv() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        echo -e "${BLUE}Loading environment variables from .env${NC}"
        
        # Read .env file and export variables
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip empty lines and comments
            if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
                continue
            fi
            
            # Export the variable
            if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
                export "${BASH_REMATCH[1]}"="${BASH_REMATCH[2]}"
            fi
        done < "$PROJECT_ROOT/.env"
    else
        echo -e "${YELLOW}No .env file found - using system environment variables${NC}"
    fi
}

# Parse command line arguments
ISSUE_NUMBER=""
AGENT_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            print_usage
            exit 0
            ;;
        --dry-run|--claude-path|--mcp-server|--no-mcp)
            AGENT_ARGS+=("$1")
            shift
            ;;
        --claude-path)
            AGENT_ARGS+=("$1" "$2")
            shift 2
            ;;
        -*|--*)
            echo -e "${RED}Unknown option $1${NC}" >&2
            print_usage >&2
            exit 1
            ;;
        *)
            if [[ -z "$ISSUE_NUMBER" ]]; then
                ISSUE_NUMBER="$1"
            else
                echo -e "${RED}Multiple issue numbers provided${NC}" >&2
                print_usage >&2
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate issue number
if [[ -z "$ISSUE_NUMBER" ]]; then
    echo -e "${RED}Error: Issue number is required${NC}" >&2
    print_usage >&2
    exit 1
fi

if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
    echo -e "${RED}Error: Issue number must be a positive integer${NC}" >&2
    exit 1
fi

# Load environment variables
load_dotenv

# Validate required environment variables
REQUIRED_VARS=("GITHUB_TOKEN" "GITHUB_OWNER" "GITHUB_REPO")
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo -e "${RED}Error: Environment variable $var is required${NC}" >&2
        echo "Please set it in .env file or environment" >&2
        exit 1
    fi
done

# Build the project first
echo -e "${BLUE}Building project...${NC}"
cd "$PROJECT_ROOT"
npm run build

# Show configuration
echo -e "${BLUE}Developer Agent Configuration:${NC}"
echo "  Issue Number: $ISSUE_NUMBER"
echo "  GitHub Owner: $GITHUB_OWNER"
echo "  GitHub Repo: $GITHUB_REPO"
echo "  Working Directory: $PROJECT_ROOT"

# Execute the TypeScript developer agent
echo ""
echo -e "${GREEN}🤖 Starting developer agent for issue #$ISSUE_NUMBER...${NC}"
echo ""

# Run the developer agent
if [ ${#AGENT_ARGS[@]} -eq 0 ]; then
    # No additional arguments
    node "dist/agents/developer/developer-agent.js" "$ISSUE_NUMBER"
else
    # Pass additional arguments
    node "dist/agents/developer/developer-agent.js" "$ISSUE_NUMBER" "${AGENT_ARGS[@]}"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Developer agent completed successfully!${NC}"
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}❌ Developer agent failed with exit code $EXIT_CODE${NC}"
    exit $EXIT_CODE
fi