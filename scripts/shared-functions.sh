#!/bin/bash

# Shared functions for Selfie agents
# Source this file in agent scripts: source "$(dirname "$0")/shared-functions.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to load environment variables from .env file
load_dotenv() {
    local env_file=".env"
    
    # Look for .env file in current directory or parent directories
    local current_dir=$(pwd)
    while [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/.env" ]; then
            env_file="$current_dir/.env"
            break
        fi
        current_dir=$(dirname "$current_dir")
    done
    
    if [ -f "$env_file" ]; then
        log "DEBUG" "Loading environment variables from $env_file"
        
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
        done < "$env_file"
        
        log "INFO" "Environment variables loaded successfully"
    else
        log "WARN" "No .env file found - using system environment variables"
    fi
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

# Function to validate required environment variables
validate_environment() {
    log "DEBUG" "Validating environment variables"
    
    local required_vars=("GITHUB_TOKEN" "GITHUB_OWNER" "GITHUB_REPO")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "ERROR" "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log "ERROR" "  - $var"
        done
        log "ERROR" "Please set these variables in your .env file or environment"
        exit 1
    fi
    
    log "INFO" "Environment validated successfully"
    log "DEBUG" "Repository: $GITHUB_OWNER/$GITHUB_REPO"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log "ERROR" "Not in a git repository"
        log "ERROR" "Please run this script from within the Selfie repository"
        exit 1
    fi
    
    log "DEBUG" "Git repository detected"
}

# Function to setup signal handlers for graceful shutdown
setup_signal_handlers() {
    local script_name="$1"
    
    trap "log 'INFO' 'Received shutdown signal for $script_name, stopping...'; exit 0" SIGINT SIGTERM
}

# Function to validate required parameters
validate_required_param() {
    local param_name="$1"
    local param_value="$2"
    local description="$3"
    
    if [ -z "$param_value" ]; then
        log "ERROR" "$description is required"
        log "ERROR" "Use --$param_name parameter to specify the value"
        exit 1
    fi
}