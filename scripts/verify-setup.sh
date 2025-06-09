#!/bin/bash

#
# Setup Verification Script
# 
# Verifies that Selfie is properly configured and ready for use
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Selfie Setup Verification${NC}"
echo "=================================="
echo

# Check Node.js and npm
echo -e "${BLUE}Checking Node.js and npm...${NC}"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi

# Check dependencies
echo -e "\n${BLUE}Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed, installing..."
    npm install
fi

# Check TypeScript compilation
echo -e "\n${BLUE}Checking TypeScript compilation...${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}✓${NC} TypeScript compiled"
else
    echo -e "${YELLOW}⚠${NC} TypeScript not compiled, building..."
    npm run build
fi

# Check required tools
echo -e "\n${BLUE}Checking required tools...${NC}"
if command -v curl >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} curl available"
else
    echo -e "${RED}✗${NC} curl not found (required for GitHub API)"
fi

if command -v jq >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} jq available"
else
    echo -e "${YELLOW}⚠${NC} jq not found (install with: brew install jq)"
fi

if command -v claude >/dev/null 2>&1; then
    CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} Claude CLI: $CLAUDE_VERSION"
else
    echo -e "${YELLOW}⚠${NC} Claude CLI not found (install from: https://claude.ai/code)"
fi

# Check MCP configuration
echo -e "\n${BLUE}Checking MCP configuration...${NC}"
if [ -f ".mcp.json" ]; then
    echo -e "${GREEN}✓${NC} .mcp.json configuration found"
    if jq empty .mcp.json 2>/dev/null; then
        echo -e "${GREEN}✓${NC} .mcp.json is valid JSON"
    else
        echo -e "${RED}✗${NC} .mcp.json is invalid JSON"
    fi
else
    echo -e "${RED}✗${NC} .mcp.json not found"
fi

# Test MCP server
echo -e "\n${BLUE}Testing MCP server...${NC}"
if npm run mcp-server --silent &
then
    SERVER_PID=$!
    sleep 2
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}✓${NC} MCP server starts successfully"
        kill $SERVER_PID 2>/dev/null || true
    else
        echo -e "${RED}✗${NC} MCP server failed to start"
    fi
else
    echo -e "${RED}✗${NC} MCP server command failed"
fi

# Check environment variables
echo -e "\n${BLUE}Checking environment configuration...${NC}"
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"
    
    # Check if essential variables are defined (without revealing values)
    if grep -q "GITHUB_TOKEN=" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} GITHUB_TOKEN configured"
    else
        echo -e "${YELLOW}⚠${NC} GITHUB_TOKEN not found in .env"
    fi
    
    if grep -q "GITHUB_OWNER=" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} GITHUB_OWNER configured"
    else
        echo -e "${YELLOW}⚠${NC} GITHUB_OWNER not found in .env"
    fi
    
    if grep -q "GITHUB_REPO=" .env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} GITHUB_REPO configured"
    else
        echo -e "${YELLOW}⚠${NC} GITHUB_REPO not found in .env"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found"
fi

# Test agents
echo -e "\n${BLUE}Testing agent scripts...${NC}"
if [ -x "scripts/initializer.sh" ]; then
    if scripts/initializer.sh --help >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Initializer agent working"
    else
        echo -e "${RED}✗${NC} Initializer agent failed"
    fi
else
    echo -e "${RED}✗${NC} Initializer agent script not executable"
fi

if [ -x "scripts/developer.sh" ]; then
    if scripts/developer.sh --help >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Developer agent working" 
    else
        echo -e "${RED}✗${NC} Developer agent failed"
    fi
else
    echo -e "${RED}✗${NC} Developer agent script not executable"
fi

# Run tests
echo -e "\n${BLUE}Running tests...${NC}"
if npm test --silent >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} All tests passing"
else
    echo -e "${RED}✗${NC} Some tests failing"
fi

echo
echo -e "${BLUE}==================================${NC}"
echo -e "${GREEN}🎉 Setup verification complete!${NC}"
echo
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Configure GitHub credentials in .env file"
echo "2. Open this project in Claude Code (the .mcp.json will be auto-detected)" 
echo "3. Run: ./start.sh initializer --dry-run"
echo "4. Check available agents: ./start.sh list"
echo "5. Use Selfie coordination tools directly in Claude Code conversations"
echo