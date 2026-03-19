# Symphony Migration Guide

## What Changed

Your Symphony orchestrator has been extracted into a standalone repository:

**Repository:** https://github.com/minimingus/symphony-orchestrator

## Local vs Global

### Current Local Setup (Still Works!)

Your existing local Symphony setup at `~/dev/levels/mrr-fyi/symphony/` **remains intact and functional**.

- `symphony/src/claude-symphony.js` - Basic mode
- `symphony/src/symphony-autonomous.js` - Autonomous mode  
- `symphony/control.sh` - Service management

**Nothing is broken!** You can continue using it exactly as before.

### New Global Installation

Symphony is now also available globally:

```bash
# Primary command
symphony --help

# Alternative names (all work the same)
symphony-ai --help
sai --help
```

## How to Use

### Option 1: Keep Using Local (No Changes)

```bash
cd ~/dev/levels/mrr-fyi
node symphony/src/symphony-autonomous.js WORKFLOW-SYMPHONY-CODE.md
```

Everything works exactly as it did before.

### Option 2: Use Global Command

```bash
cd ~/dev/levels/mrr-fyi
symphony WORKFLOW-SYMPHONY-CODE.md

# Or alternative names (all equivalent)
symphony-ai WORKFLOW-SYMPHONY-CODE.md
sai WORKFLOW-SYMPHONY-CODE.md
```

### Option 3: Use in package.json

Add to your `package.json`:

```json
{
  "scripts": {
    "symphony": "symphony-ai WORKFLOW-SYMPHONY-CODE.md",
    "symphony:basic": "symphony-ai --basic WORKFLOW-SYMPHONY-CODE.md"
  }
}
```

Then run:

```bash
npm run symphony
```

## Benefits of Global Installation

### For This Project (mrr-fyi)

You can now choose:
- Local version (for testing/development)
- Global version (for production/stable)

### For Other Projects

Install Symphony in any project:

```bash
cd ~/dev/another-project
npm install -g @minimingus/symphony  # When published to npm
# Or use npm link for now:
symphony-ai WORKFLOW.md
```

### Development

Make changes to Symphony orchestrator:

```bash
cd ~/dev/symphony-orchestrator
# Edit src/autonomous.js
git commit -m "improvement: better error handling"
git push

# Changes immediately available globally via npm link
cd ~/dev/levels/mrr-fyi
symphony-ai WORKFLOW-SYMPHONY-CODE.md  # Uses updated version
```

## Migration Checklist

- [x] Symphony code extracted to standalone repo
- [x] Global CLI installed (`symphony-ai` and `sai`)
- [x] Local setup preserved (nothing broken)
- [x] Repository created on GitHub
- [x] MIT license added
- [x] Comprehensive README written
- [ ] Publish to npm (optional, for easier installation)
- [ ] Add tests
- [ ] Add CI/CD for Symphony itself

## FAQ

### Will my existing Symphony setup break?

No! Your local `symphony/` directory is untouched. Everything continues working.

### Should I delete the local setup?

Not yet! Keep it as a backup until you're confident the global version works for you.

### How do I update Symphony?

```bash
cd ~/dev/symphony-orchestrator
git pull
# Changes immediately available since we used npm link
```

### Can I use different versions in different projects?

Yes! You can:
- Use local version in one project
- Use global version in another
- Even install specific versions per-project when it's on npm

### What's next?

1. Test the global version on mrr-fyi
2. Use it on other projects
3. Contribute improvements back to the repo
4. Eventually publish to npm for easier sharing

---

**Your Symphony journey: Local experiment → Standalone tool → Shared package!**
