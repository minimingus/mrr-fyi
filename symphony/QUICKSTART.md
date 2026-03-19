# Symphony Quick Reference

## Service Control

```bash
cd ~/dev/levels/mrr-fyi/symphony

# Start Symphony
./control.sh start

# Stop Symphony  
./control.sh stop

# Restart Symphony
./control.sh restart

# Check status
./control.sh status

# Watch live logs
./control.sh logs

# View errors
./control.sh errors
```

## Current Status

✅ **Symphony is running as a background service**

- **Service:** `com.symphony.mrr-fyi` (LaunchAgent)
- **Logs:** `~/dev/levels/mrr-fyi/symphony/logs/stdout.log`
- **Polling:** Every 30 seconds
- **Auth:** Uses your Claude.ai subscription (ANTHROPIC_API_KEY unset)

## Create New Issue

```bash
gh issue create --repo minimingus/mrr-fyi \
  --title "Your feature title" \
  --body "Description..." \
  --label "symphony:todo"
```

Symphony will:
1. Pick it up within 30s
2. Create workspace in `~/code/symphony-workspaces/minimingus-mrr-fyi-<#>/`
3. Run after_create hook (git clone, npm install)
4. Spawn Claude agent
5. Open PR when done
6. Mark issue as `symphony:done`

## Example: Test It Now

```bash
# Create a test issue
gh issue create --repo minimingus/mrr-fyi \
  --title "Update README with deployment instructions" \
  --body "Add section to README explaining how to deploy to Vercel." \
  --label "symphony:todo"

# Watch it work
./control.sh logs
```

## Troubleshooting

### Service won't start
```bash
# Check error logs
cat ~/dev/levels/mrr-fyi/symphony/logs/stderr.log

# Check launchctl
launchctl list | grep symphony

# Reload service
launchctl unload ~/Library/LaunchAgents/com.symphony.mrr-fyi.plist
launchctl load ~/Library/LaunchAgents/com.symphony.mrr-fyi.plist
```

### Agent fails with "Credit balance is too low"
Make sure you're logged into claude.ai:
```bash
claude auth status
# Should show: "authMethod": "claude.ai"
```

### Issue stuck in "in-progress"
```bash
# Manually reset
gh issue edit <#> --repo minimingus/mrr-fyi \
  --remove-label "symphony:in-progress" \
  --add-label "symphony:todo"
```

### Check workspace manually
```bash
cd ~/code/symphony-workspaces/minimingus-mrr-fyi-<issue#>
git status
git log
```

## Disable Auto-Start

If you want to stop Symphony from running automatically on login:

```bash
./control.sh stop
rm ~/Library/LaunchAgents/com.symphony.mrr-fyi.plist
```

## Files

```
symphony/
├── src/
│   └── claude-symphony.js    # Main orchestrator
├── logs/
│   ├── stdout.log            # Output logs
│   └── stderr.log            # Error logs
├── control.sh                # Service control script
├── README.md                 # Full documentation
└── QUICKSTART.md            # This file
```

## What Just Happened?

Your first successful Symphony run:

1. **Issue #7** - "Add loading skeleton to leaderboard"
2. **PR #8** - https://github.com/minimingus/mrr-fyi/pull/8
3. **Agent created:**
   - `components/LoadingSkeleton.tsx`
   - `app/loading.tsx`
4. **All automatic!**

---

**Symphony is now continuously monitoring your GitHub issues and will automatically implement them using your Claude.ai subscription! 🎉**
