# Symphony - Claude Subscription Edition

**A working Symphony clone that uses your Claude.ai subscription!**

## What We Built

After trying multiple approaches (symphony-claude, symphony-code, caclawphony), we built our own that actually works with your setup:

- ✅ Uses **your Claude.ai subscription** (no API credits needed)
- ✅ Polls GitHub Issues with `symphony:todo` label
- ✅ Creates isolated workspaces per issue  
- ✅ Runs agents with full file access via `claude --print`
- ✅ Automatic label management (`todo` → `in-progress` → `done`)
- ✅ Concurrent issue handling (configurable limit)
- ✅ Compatible with Symphony WORKFLOW.md format

## Setup

Already done! Dependencies installed.

## Usage

### Start Symphony

```bash
cd ~/dev/levels/mrr-fyi
node symphony/src/claude-symphony.js WORKFLOW-SYMPHONY-CODE.md
```

It will:
1. Poll GitHub every 30s for issues labeled `symphony:todo`
2. Create workspace at `~/code/symphony-workspaces/minimingus-mrr-fyi-<issue#>/`
3. Run `after_create` hook (git clone, npm install)
4. Spawn Claude agent with your subscription
5. Update label to `symphony:done` when complete

### Run in Background

```bash
cd ~/dev/levels/mrr-fyi
nohup node symphony/src/claude-symphony.js WORKFLOW-SYMPHONY-CODE.md > symphony.log 2>&1 &
echo $! > symphony.pid
```

### Stop Symphony

```bash
kill $(cat ~/dev/levels/mrr-fyi/symphony.pid)
```

### Check Logs

```bash
tail -f ~/dev/levels/mrr-fyi/symphony.log
```

## Configuration

Edit `WORKFLOW-SYMPHONY-CODE.md` to customize:

```yaml
tracker:
  repo: minimingus/mrr-fyi
  labels: ["symphony:todo"]

workspace:
  root: ~/code/symphony-workspaces

agent:
  max_concurrent_agents: 2
  max_turns: 30

hooks:
  after_create: |
    git clone ...
    npm install
```

## Environment Variables

```bash
export REPO=minimingus/mrr-fyi          # GitHub repo
export WORKSPACE_ROOT=~/workspaces      # Workspace directory
export MAX_CONCURRENT=2                 # Max parallel agents
export POLL_INTERVAL=30                 # Seconds between polls
export MODEL=sonnet                     # Claude model
```

## How It Works

### Key Insight: Unset ANTHROPIC_API_KEY

The `claude` CLI prioritizes `ANTHROPIC_API_KEY` over your subscription. We unset it in the agent environment to force subscription mode:

```javascript
const env = { ...process.env };
delete env.ANTHROPIC_API_KEY;
```

This way Claude CLI uses your Claude.ai subscription instead of trying to use API credits.

### Workflow

```
GitHub Issues (symphony:todo)
    ↓
Symphony Orchestrator
    ↓ Creates workspace
~/code/symphony-workspaces/minimingus-mrr-fyi-7/
    ↓ Runs after_create hook
git clone + npm install
    ↓ Spawns agent
claude --print (uses your subscription!)
    ↓ Agent works autonomously
Read/Write files, run commands, open PR
    ↓ Updates label
symphony:done
```

## Troubleshooting

### "Credit balance is too low"

Make sure Symphony is actually unsetting `ANTHROPIC_API_KEY`. Check logs for:
```
Using Claude.ai subscription (ANTHROPIC_API_KEY unset for agents)
```

### Agent stuck

Check workspace logs:
```bash
cat ~/code/symphony-workspaces/minimingus-mrr-fyi-<issue#>/agent-output.txt
```

### Issue stuck in "in-progress"

Manually reset:
```bash
gh issue edit <#> --repo minimingus/mrr-fyi \
  --remove-label "symphony:in-progress" \
  --add-label "symphony:todo"
```

## Comparison with Other Solutions

| Solution | Status | Issue |
|----------|--------|-------|
| **symphony-claude** | ❌ | Needs claude.ai credits (separate from subscription) |
| **symphony-code** | ❌ | Same credit issue + sketchy repo |
| **caclawphony** | ❌ | Uses Codex (needs OpenAI credits) |
| **Anthropic API** | ❌ | Your API key has no credits |
| **Our Symphony** | ✅ | Uses your Claude.ai subscription! |

## Files

```
symphony/
├── package.json
├── src/
│   ├── index.js              # Anthropic API version (needs credits)
│   ├── openclaw-symphony.js  # OpenClaw version (uses OC subscription)
│   └── claude-symphony.js    # ✅ Working version (uses Claude.ai)
└── README.md                 # This file
```

## Example Issue Flow

1. **Create issue** with `symphony:todo` label:
   ```bash
   gh issue create --repo minimingus/mrr-fyi \
     --title "Add dark mode toggle" \
     --body "Implement dark mode..." \
     --label "symphony:todo"
   ```

2. **Symphony picks it up** within 30s

3. **Agent works autonomously**:
   - Reads codebase
   - Implements changes  
   - Creates branch
   - Opens PR

4. **Review PR** and merge manually

## Future Enhancements

- [ ] Web dashboard (like original Symphony)
- [ ] Retry logic with exponential backoff
- [ ] Multi-turn agent support
- [ ] PR auto-merge (with approval gates)
- [ ] Metrics tracking (cost, time, success rate)
- [ ] Discord/Slack notifications

## Credits

Inspired by:
- [OpenAI Symphony](https://github.com/openai/symphony)
- [OpenClaw Caclawphony](https://github.com/openclaw/caclawphony)
- Various Symphony forks (sapsaldog, SabatinoMasala, nnndv)

Built from scratch because none of them worked with your setup! 🎉

---

**You now have a working Symphony that uses your Claude.ai subscription!**
