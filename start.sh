#!/bin/bash

# Claude Code Startup Script
# This script starts Claude Code in the current project directory

echo "🚀 Starting Claude Code..."
echo "📁 Current directory: $(pwd)"
echo "📋 Project: $(basename $(pwd))"
echo ""

# Check if claude command is available
if ! command -v claude &> /dev/null; then
    echo "❌ Error: Claude Code is not installed or not in PATH"
    echo "Please install Claude Code first:"
    echo "  npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# Display Claude Code version
echo "🔧 Claude Code version: $(claude --version)"
echo ""

# Start Claude Code
echo "Starting Claude Code..."
echo "Note: You may need to authenticate if this is your first time using Claude Code"
echo ""

claude
