#!/bin/bash
# Symphony Monitor - Watch Symphony work in real-time

echo "🎵 Symphony Monitor"
echo "=================="
echo ""

# Check service status
if launchctl list | grep -q "com.symphony.mrr-fyi"; then
    echo "✅ Service: Running"
else
    echo "❌ Service: Not running"
    exit 1
fi

# Show active issues
echo ""
echo "📋 Active Issues (symphony:in-progress):"
gh issue list --repo minimingus/mrr-fyi --label "symphony:in-progress" --json number,title | \
    jq -r '.[] | "  #\(.number): \(.title)"'

echo ""
echo "⏳ Queued Issues (symphony:todo):"
gh issue list --repo minimingus/mrr-fyi --label "symphony:todo" --json number,title | \
    jq -r '.[] | "  #\(.number): \(.title)"'

# Show recent PRs
echo ""
echo "🔀 Recent PRs:"
gh pr list --repo minimingus/mrr-fyi --limit 3 --json number,title,state | \
    jq -r '.[] | "  #\(.number): \(.title) [\(.state)]"'

# Show workspaces
echo ""
echo "📁 Active Workspaces:"
ls -1 ~/code/symphony-workspaces/ | grep "minimingus-mrr-fyi" | \
    while read dir; do
        if [ -d ~/code/symphony-workspaces/$dir/.git ]; then
            echo "  $dir"
        fi
    done

echo ""
echo "📊 Recent Activity:"
tail -10 ~/dev/levels/mrr-fyi/symphony/logs/stdout.log | \
    grep -E "(Found|Starting|Updated|completed|Running)" | \
    tail -5

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Commands:"
echo "  ./control.sh logs    - Follow live logs"
echo "  ./control.sh status  - Check service status"
echo "  ./monitor.sh         - Run this again"
