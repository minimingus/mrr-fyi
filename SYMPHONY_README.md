# Symphony-OpenClaw

A Symphony-like orchestrator that uses OpenClaw/Codex instead of Claude Code CLI.

## Architecture

This is functionally equivalent to Symphony, but avoids the Claude Code CLI credit requirement:

```
┌─────────────────┐
│  GitHub Issues  │
│  (symphony:todo)│
└────────┬────────┘
         │ polls every 30s
         ▼
┌─────────────────────┐
│  symphony-oc.sh     │
│  - Manages labels   │
│  - Clones to temp   │
│  - Spawns agents    │
└────────┬────────────┘
         │ spawns (max 2 concurrent)
         ▼
┌────────────────────────┐
│  Coding Agent          │
│  (Codex/Claude Code)   │
│  - Reads WORKFLOW.md   │
│  - Implements changes  │
│  - Commits & pushes    │
│  - Opens PR            │
└────────────────────────┘
```

## Setup

1. **Create GitHub labels:**
   ```bash
   gh label create "symphony:todo" --repo minimingus/mrr-fyi
   gh label create "symphony:in-progress" --repo minimingus/mrr-fyi
   gh label create "symphony:done" --repo minimingus/mrr-fyi
   ```

2. **Configure WORKFLOW.md** (already done)

3. **Set environment** (optional):
   ```bash
   export AGENT=codex           # or claude-code
   export MAX_CONCURRENT=2
   export POLL_INTERVAL=30      # seconds
   ```

## Usage

### Run continuously (like Symphony):
```bash
cd ~/dev/levels/mrr-fyi
./symphony-oc.sh
```

### Run once (process current issues then exit):
```bash
cd ~/dev/levels/mrr-fyi
./symphony-oc.sh &
sleep 5
killall symphony-oc.sh
```

### As a background service:
```bash
# Using nohup
nohup ./symphony-oc.sh > symphony.log 2>&1 &

# Or with launchd (macOS)
# Create ~/Library/LaunchAgents/ai.openclaw.symphony.plist
```

## How It Works

1. **Polls GitHub** every 30s for issues labeled `symphony:todo`
2. **Updates label** to `symphony:in-progress`
3. **Clones repo** to isolated workspace (`~/code/symphony-workspaces/issue-N/`)
4. **Builds prompt** from `WORKFLOW.md` with issue details
5. **Spawns Codex/Claude Code** in `--print --permission-mode bypassPermissions` mode
6. **Agent works autonomously** - reads code, implements, commits, pushes PR
7. **Updates label** to `symphony:done` on success

## Differences from Symphony

| Feature | Symphony | symphony-oc.sh |
|---------|----------|----------------|
| Agent | `symphony-claude` (needs credits) | Codex/Claude Code via OpenClaw |
| Language | Elixir | Bash |
| API | JSON-RPC | CLI |
| Concurrency | Task supervision | Background jobs |
| Retries | Built-in with backoff | Manual (can add) |

## Advantages

✅ **No Claude Code subscription needed** - Uses OpenClaw's Claude API  
✅ **Simple** - Just a bash script, easy to understand/modify  
✅ **Same workflow** - Uses the same WORKFLOW.md format  
✅ **Portable** - Runs anywhere with `gh`, `jq`, and `codex`/`claude`

## Limitations

❌ **No retry logic** (yet) - Fails stay in `in-progress`  
❌ **No real-time dashboard** - Just logs  
❌ **Bash-based** - Not as robust as Elixir  
❌ **Sequential cloning** - Symphony pre-clones in parallel

## Monitoring

```bash
# Watch logs
tail -f symphony.log

# Check active workers
ps aux | grep "handle_issue"

# List workspaces
ls ~/code/symphony-workspaces/
```

## Stopping

```bash
# Graceful shutdown (Ctrl-C)
^C

# Force kill
pkill -f symphony-oc.sh
```

## Troubleshooting

**"Credit balance is too low"**
- Make sure you're logged out of claude.ai: `claude auth logout`
- Or switch to Codex: `export AGENT=codex`

**Agent doesn't have permissions**
- We use `--permission-mode bypassPermissions` to skip prompts
- Make sure your agent config allows this

**Issues stuck in "in-progress"**
- Check workspace logs: `cat ~/code/symphony-workspaces/issue-N/agent-output.log`
- Manually review and close, or remove label to retry

## Future Enhancements

- [ ] Add retry logic with exponential backoff
- [ ] Real-time TUI dashboard
- [ ] Parallel cloning
- [ ] Webhook-based (instead of polling)
- [ ] Integration with OpenClaw's session API
- [ ] Support for multiple repos

## Example Workflow

1. Create issue #7 with label `symphony:todo`
2. Symphony-OC polls and finds it
3. Updates to `symphony:in-progress`
4. Clones mrr-fyi to `~/code/symphony-workspaces/issue-7/`
5. Spawns Codex with WORKFLOW.md prompt
6. Codex implements changes, commits, pushes branch
7. Opens PR #8
8. Updates issue to `symphony:done`
9. You review PR #8 and merge

---

**This is a working Symphony replacement that uses your existing OpenClaw/Codex/Claude Code setup!**
