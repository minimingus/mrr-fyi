#!/bin/bash
# Symphony-like orchestrator using OpenClaw's coding-agent skill
# 
# This continuously polls GitHub issues and spawns coding agents to handle them.
# Similar to Symphony, but uses OpenClaw instead of Claude Code CLI.

set -euo pipefail

# Config
REPO="${REPO:-minimingus/mrr-fyi}"
PROJECT_DIR="${PROJECT_DIR:-$HOME/dev/levels/mrr-fyi}"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$HOME/code/symphony-workspaces}"
MAX_CONCURRENT="${MAX_CONCURRENT:-2}"
POLL_INTERVAL="${POLL_INTERVAL:-30}"
AGENT="${AGENT:-codex}" # codex or claude-code

LABEL_TODO="symphony:todo"
LABEL_IN_PROGRESS="symphony:in-progress"  
LABEL_DONE="symphony:done"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
  local level=$1
  shift
  local msg="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  case $level in
    error) echo -e "${timestamp} ${RED}❌${NC} $msg" ;;
    success) echo -e "${timestamp} ${GREEN}✅${NC} $msg" ;;
    info) echo -e "${timestamp} ${BLUE}ℹ️${NC}  $msg" ;;
    warn) echo -e "${timestamp} ${YELLOW}⚠️${NC}  $msg" ;;
  esac
}

get_active_workers() {
  # Count running background jobs
  jobs -r | wc -l | tr -d ' '
}

get_issue_workspace() {
  local issue_num=$1
  echo "$WORKSPACE_ROOT/issue-$issue_num"
}

build_prompt() {
  local issue_num=$1
  local issue_title=$2
  local issue_body=$3
  
  # Read WORKFLOW.md template
  local workflow_file="$PROJECT_DIR/WORKFLOW.md"
  if [[ ! -f "$workflow_file" ]]; then
    log error "WORKFLOW.md not found at $workflow_file"
    return 1
  fi
  
  # Extract prompt (skip YAML front matter)
  local prompt=$(sed -n '/^---$/,/^---$/!p' "$workflow_file" | tail -n +2)
  
  # Replace template variables (simple sed replacement)
  prompt=$(echo "$prompt" | sed "s/{{ *issue\.identifier *}}/$issue_num/g")
  prompt=$(echo "$prompt" | sed "s/{{ *issue\.title *}}/$issue_title/g")
  prompt=$(echo "$prompt" | sed "s|{{ *issue\.url *}}|https://github.com/$REPO/issues/$issue_num|g")
  prompt=$(echo "$prompt" | sed "s/{{ *issue\.labels *}}/$LABEL_TODO/g")
  
  # Handle issue body conditionals (crude but works)
  if [[ -n "$issue_body" && "$issue_body" != "null" ]]; then
    prompt=$(echo "$prompt" | sed '/{% *if issue\.body *%}/,/{% *endif *%}/c\'"$issue_body")
  else
    prompt=$(echo "$prompt" | sed '/{% *if issue\.body *%}/,/{% *else *%}/d; /{% *endif *%}/d')
  fi
  
  echo "$prompt"
}

handle_issue() {
  local issue_num=$1
  local issue_title=$2
  local issue_body=$3
  
  log info "Starting work on issue #$issue_num: $issue_title"
  
  # Update label to in-progress
  if ! gh issue edit "$issue_num" --repo "$REPO" \
      --remove-label "$LABEL_TODO" \
      --add-label "$LABEL_IN_PROGRESS" 2>/dev/null; then
    log warn "Failed to update label for issue #$issue_num"
  fi
  
  # Create workspace
  local workspace=$(get_issue_workspace "$issue_num")
  mkdir -p "$workspace"
  
  # Clone repo
  log info "Cloning $REPO into $workspace"
  if ! git clone --depth 1 "https://github.com/$REPO.git" "$workspace" 2>&1 | grep -v "Cloning into"; then
    log error "Failed to clone repo for issue #$issue_num"
    return 1
  fi
  
  # Build prompt
  local prompt=$(build_prompt "$issue_num" "$issue_title" "$issue_body")
  
  # Run coding agent
  log info "Spawning $AGENT agent for issue #$issue_num"
  
  cd "$workspace"
  
  # Use the coding-agent skill via codex/claude-code
  local agent_cmd
  if [[ "$AGENT" == "codex" ]]; then
    agent_cmd="codex --print --permission-mode bypassPermissions"
  else
    agent_cmd="claude --print --permission-mode bypassPermissions"
  fi
  
  if echo "$prompt" | $agent_cmd 2>&1 | tee "$workspace/agent-output.log"; then
    log success "Issue #$issue_num completed successfully"
    
    # Update label to done
    gh issue edit "$issue_num" --repo "$REPO" \
      --remove-label "$LABEL_IN_PROGRESS" \
      --add-label "$LABEL_DONE" 2>/dev/null || true
  else
    log error "Issue #$issue_num failed"
    # Leave in IN_PROGRESS for manual review
  fi
  
  cd - >/dev/null
}

poll_and_dispatch() {
  # Get all TODO issues
  local issues=$(gh issue list --repo "$REPO" \
    --label "$LABEL_TODO" \
    --json number,title,body \
    --limit 100)
  
  local issue_count=$(echo "$issues" | jq '. | length')
  
  if [[ "$issue_count" -eq 0 ]]; then
    return
  fi
  
  log info "Found $issue_count todo issue(s)"
  
  # Process issues (respecting MAX_CONCURRENT)
  for row in $(echo "$issues" | jq -r '.[] | @base64'); do
    _jq() {
      echo "$row" | base64 --decode | jq -r "$1"
    }
    
    local issue_num=$(_jq '.number')
    local issue_title=$(_jq '.title')
    local issue_body=$(_jq '.body')
    
    # Check concurrent limit
    while [[ $(get_active_workers) -ge $MAX_CONCURRENT ]]; then
      log info "Max concurrent workers ($MAX_CONCURRENT) reached, waiting..."
      sleep 5
    done
    
    # Spawn worker in background
    handle_issue "$issue_num" "$issue_title" "$issue_body" &
  done
}

main() {
  log info "Starting Symphony-OpenClaw orchestrator"
  log info "Repo: $REPO"
  log info "Project: $PROJECT_DIR"
  log info "Workspace: $WORKSPACE_ROOT"
  log info "Max concurrent: $MAX_CONCURRENT"
  log info "Agent: $AGENT"
  log info "Poll interval: ${POLL_INTERVAL}s"
  
  # Create workspace root
  mkdir -p "$WORKSPACE_ROOT"
  
  # Main loop
  while true; do
    poll_and_dispatch
    
    # Wait for next poll
    sleep "$POLL_INTERVAL"
  done
}

# Handle Ctrl-C gracefully
trap 'log info "Shutting down..."; exit 0' INT TERM

main
