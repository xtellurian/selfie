#!/bin/bash

# Selfie - Agentic Build System
# Agent dispatcher script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Agent configuration
AGENTS_DIR="docs/agents"
SCRIPTS_DIR="scripts"

# Function to display usage
show_help() {
    echo -e "${BLUE}Selfie - Agentic Build System${NC}"
    echo ""
    echo "Usage: ./start.sh <agent> [options]"
    echo ""
    echo -e "${YELLOW}Available Agents:${NC}"
    
    if [ -d "$AGENTS_DIR" ]; then
        for agent_file in "$AGENTS_DIR"/*.md; do
            if [ -f "$agent_file" ]; then
                agent_name=$(basename "$agent_file" .md)
                # Extract description from first line after title
                description=$(grep -A 1 "^# " "$agent_file" | tail -n 1 | sed 's/^## *//' | head -c 60)
                printf "  %-15s %s\n" "$agent_name" "$description"
            fi
        done
    else
        echo "  No agents configured yet. Run: ./start.sh setup"
    fi
    
    echo ""
    echo -e "${YELLOW}System Commands:${NC}"
    echo "  setup           Initialize the agent system"
    echo "  list            List all available agents"
    echo "  help            Show this help message"
    echo "  version         Show version information"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./start.sh initializer"
    echo "  ./start.sh developer --issue 123"
    echo "  ./start.sh setup"
    echo ""
}

# Function to show version
show_version() {
    echo -e "${BLUE}Selfie Agentic Build System v1.0.0${NC}"
    echo "A self-building system that evolves through autonomous agents"
    echo ""
    
    # Show Node.js library version if available
    if [ -f "package.json" ]; then
        echo "Node.js Library: $(node -p "require('./package.json').version")"
    fi
    
    # Show TypeScript compilation status
    if [ -d "dist" ]; then
        echo -e "${GREEN}✓${NC} TypeScript compiled"
    else
        echo -e "${YELLOW}⚠${NC} TypeScript not compiled (run: npm run build)"
    fi
}

# Function to list agents
list_agents() {
    echo -e "${BLUE}Available Agents:${NC}"
    echo ""
    
    if [ -d "$AGENTS_DIR" ]; then
        for agent_file in "$AGENTS_DIR"/*.md; do
            if [ -f "$agent_file" ]; then
                agent_name=$(basename "$agent_file" .md)
                echo -e "${GREEN}$agent_name${NC}"
                
                # Show agent description
                description=$(grep -A 1 "^# " "$agent_file" | tail -n 1 | sed 's/^## *//')
                if [ ! -z "$description" ]; then
                    echo "  $description"
                fi
                
                # Show agent status
                script_file="$SCRIPTS_DIR/$agent_name.sh"
                if [ -f "$script_file" ]; then
                    echo -e "  ${GREEN}✓${NC} Script available"
                else
                    echo -e "  ${YELLOW}⚠${NC} Script missing"
                fi
                echo ""
            fi
        done
    else
        echo -e "${YELLOW}No agents found. Run './start.sh setup' to initialize.${NC}"
    fi
}

# Function to setup the agent system
setup_system() {
    echo -e "${BLUE}Setting up Selfie Agent System...${NC}"
    echo ""
    
    # Create directories
    mkdir -p "$AGENTS_DIR"
    mkdir -p "$SCRIPTS_DIR"
    
    echo -e "${GREEN}✓${NC} Created directories"
    
    # Check if we have a basic agent setup
    if [ ! -f "$AGENTS_DIR/initializer.md" ]; then
        echo -e "${YELLOW}⚠${NC} No agents configured yet"
        echo "Please refer to CLAUDE.md for agent creation instructions"
    else
        echo -e "${GREEN}✓${NC} Agents configured"
    fi
    
    # Check Node.js setup
    if [ -f "package.json" ]; then
        echo -e "${GREEN}✓${NC} Node.js project configured"
        
        if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..."
            npm install
        fi
        
        if [ ! -d "dist" ]; then
            echo "Building TypeScript..."
            npm run build
        fi
    else
        echo -e "${YELLOW}⚠${NC} No package.json found"
    fi
    
    echo ""
    echo -e "${GREEN}Setup complete!${NC}"
    echo "Run './start.sh list' to see available agents"
}

# Function to run an agent
run_agent() {
    local agent_name="$1"
    shift # Remove agent name from arguments
    
    # Check if agent documentation exists
    agent_doc="$AGENTS_DIR/$agent_name.md"
    if [ ! -f "$agent_doc" ]; then
        echo -e "${RED}Error: Agent '$agent_name' not found${NC}"
        echo "Run './start.sh list' to see available agents"
        exit 1
    fi
    
    # Check if agent script exists
    agent_script="$SCRIPTS_DIR/$agent_name.sh"
    if [ ! -f "$agent_script" ]; then
        echo -e "${RED}Error: Script for agent '$agent_name' not found${NC}"
        echo "Expected: $agent_script"
        echo "Please create the script or refer to the agent documentation"
        exit 1
    fi
    
    # Make script executable
    chmod +x "$agent_script"
    
    echo -e "${BLUE}Starting agent: $agent_name${NC}"
    echo "Documentation: $agent_doc"
    echo "Script: $agent_script"
    echo ""
    
    # Execute the agent script with remaining arguments
    exec "$agent_script" "$@"
}

# Main script logic
main() {
    # Parse command line arguments
    case "${1:-help}" in
        "help" | "-h" | "--help")
            show_help
            ;;
        "version" | "-v" | "--version")
            show_version
            ;;
        "list" | "-l" | "--list")
            list_agents
            ;;
        "setup")
            setup_system
            ;;
        *)
            # Assume it's an agent name
            run_agent "$@"
            ;;
    esac
}

# Run main function with all arguments
main "$@"