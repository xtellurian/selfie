#!/bin/bash

#
# Developer Agent Script
# 
# Executes the developer agent to implement GitHub issues
#

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source shared functions
source "$SCRIPT_DIR/../shared-functions.sh"

# Load environment variables
load_dotenv

# Validate environment
validate_environment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print usage
print_usage() {
    echo "Usage: $0 <issue-number> [options]"
    echo ""
    echo "Options:"
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

# Parse command line arguments
ISSUE_NUMBER=""
DRY_RUN=false
CLAUDE_PATH="${CLAUDE_PATH:-claude}"
USE_MCP=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            print_usage
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --claude-path)
            CLAUDE_PATH="$2"
            shift 2
            ;;
        --mcp-server)
            USE_MCP=true
            shift
            ;;
        --no-mcp)
            USE_MCP=false
            shift
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

# Validate required environment variables
REQUIRED_VARS=("GITHUB_TOKEN" "GITHUB_OWNER" "GITHUB_REPO")
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        echo -e "${RED}Error: Environment variable $var is required${NC}" >&2
        echo "Please set it in .env file or environment" >&2
        exit 1
    fi
done

# Check if Claude CLI is available
if ! command -v "$CLAUDE_PATH" &> /dev/null; then
    echo -e "${RED}Error: Claude CLI not found at '$CLAUDE_PATH'${NC}" >&2
    echo "Please install Claude CLI or specify correct path with --claude-path" >&2
    exit 1
fi

# Build the project first
echo -e "${BLUE}Building project...${NC}"
cd "$PROJECT_ROOT"
npm run build

# Prepare environment variables for the agent
export CLAUDE_PATH="$CLAUDE_PATH"

if [[ "$USE_MCP" == "true" ]]; then
    export MCP_SERVER_COMMAND="${MCP_SERVER_COMMAND:-npm}"
    export MCP_SERVER_ARGS="${MCP_SERVER_ARGS:-run mcp-server}"
else
    unset MCP_SERVER_COMMAND
    unset MCP_SERVER_ARGS
fi

# Show configuration
echo -e "${BLUE}Developer Agent Configuration:${NC}"
echo "  Issue Number: $ISSUE_NUMBER"
echo "  GitHub Owner: $GITHUB_OWNER"
echo "  GitHub Repo: $GITHUB_REPO"
echo "  Claude Path: $CLAUDE_PATH"
echo "  Working Directory: $PROJECT_ROOT"
echo "  MCP Integration: $([ "$USE_MCP" == "true" ] && echo "enabled" || echo "disabled")"

if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo -e "${YELLOW}DRY RUN: Would execute developer agent with above configuration${NC}"
    echo "Command: node dist/agents/developer/developer-agent.js $ISSUE_NUMBER"
    exit 0
fi

# Execute the developer agent
echo ""
echo -e "${GREEN}🤖 Starting developer agent for issue #$ISSUE_NUMBER...${NC}"
echo ""

# Run the developer agent
if node "dist/agents/developer/developer-agent.js" "$ISSUE_NUMBER"; then
    echo ""
    echo -e "${GREEN}✅ Developer agent completed successfully!${NC}"
    exit 0
else
    EXIT_CODE=$?
    echo ""
    echo -e "${RED}❌ Developer agent failed with exit code $EXIT_CODE${NC}"
    exit $EXIT_CODE
fi