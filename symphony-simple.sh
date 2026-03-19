#!/bin/bash
# Simple Symphony replacement - just handles one issue at a time
# Uses OpenClaw's coding-agent skill

set -e

REPO="minimingus/mrr-fyi"
PROJECT_DIR="$HOME/dev/levels/mrr-fyi"

echo "🔍 Looking for symphony:todo issues in $REPO..."

# Get first todo issue
ISSUE=$(gh issue list --repo "$REPO" --label "symphony:todo" --json number,title,body --limit 1)

if [ "$ISSUE" = "[]" ]; then
  echo "✅ No todo issues found"
  exit 0
fi

ISSUE_NUMBER=$(echo "$ISSUE" | jq -r '.[0].number')
ISSUE_TITLE=$(echo "$ISSUE" | jq -r '.[0].title')
ISSUE_BODY=$(echo "$ISSUE" | jq -r '.[0].body // "No description provided"')

echo "📋 Found issue #$ISSUE_NUMBER: $ISSUE_TITLE"
echo ""

# Update label
echo "🏷️  Updating label: symphony:todo → symphony:in-progress"
gh issue edit "$ISSUE_NUMBER" --repo "$REPO" \
  --remove-label "symphony:todo" \
  --add-label "symphony:in-progress"

# Build prompt from WORKFLOW.md
WORKFLOW_PROMPT=$(cat "$PROJECT_DIR/WORKFLOW.md" | sed -n '/^---$/,/^---$/!p' | tail -n +2)

# Replace template variables
PROMPT=$(echo "$WORKFLOW_PROMPT" | \
  sed "s/{{ issue\.identifier }}/$ISSUE_NUMBER/g" | \
  sed "s/{{ issue\.title }}/$ISSUE_TITLE/g" | \
  sed "s|{{ issue\.url }}|https://github.com/$REPO/issues/$ISSUE_NUMBER|g" | \
  sed "s/{{ issue\.labels }}/symphony:todo/g")

# Handle if/else for issue.body
if [ -n "$ISSUE_BODY" ]; then
  PROMPT=$(echo "$PROMPT" | sed '/{% if issue\.body %}/,/{% endif %}/c\'"$ISSUE_BODY")
else
  PROMPT=$(echo "$PROMPT" | sed '/{% if issue\.body %}/,/{% else %}/d' | sed '/{% endif %}/d')
fi

echo "🤖 Starting agent work..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run in project directory
cd "$PROJECT_DIR"

# Use openclaw to send message to current session
# This assumes you're running this from within an openclaw session
echo "$PROMPT" | openclaw agent -m "$PROMPT" || {
  echo ""
  echo "❌ Agent failed"
  exit 1
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Agent completed"
echo "🏷️  Updating label: symphony:in-progress → symphony:done"

gh issue edit "$ISSUE_NUMBER" --repo "$REPO" \
  --remove-label "symphony:in-progress" \
  --add-label "symphony:done"

echo "✅ Issue #$ISSUE_NUMBER marked as done"
