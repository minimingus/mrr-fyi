# Symphony Autonomous - Intelligent Self-Healing

## What Makes It Different

**Symphony Autonomous** goes beyond simple automation. It's **intelligent** and **self-healing**:

### 🧠 **Root Cause Analysis**
- Analyzes CI failure logs automatically
- Identifies issue category: infrastructure vs code vs dependencies
- Determines fix strategy based on analysis

### 🔄 **Multi-Strategy Retry**
- Tries multiple fix approaches for the same problem
- Each retry uses a different strategy
- Learns from failures and escalates when stuck

### 🚨 **Human Escalation**
- Only involves humans after exhausting all options
- Creates detailed escalation issues
- Marks PRs with `symphony:needs-human` label

---

## Intelligence Levels

### **Level 1: Pattern Recognition**
Detects common failure patterns:

| Pattern | Detection | Strategy |
|---------|-----------|----------|
| **Node version** | "Unsupported engine", "Please upgrade" | Update CI workflow Node version |
| **Dependencies** | "npm error", "peer dependency" | Fix package.json conflicts |
| **TypeScript** | "TS error" | Type fixes, add imports |
| **Imports** | "Module not found" | Fix import paths |
| **Linting** | "ESLint" | Auto-fix with --fix |
| **Tests** | "test failed", "FAIL" | Debug and fix test code |
| **Network** | "ENOTFOUND", "timeout" | Infrastructure issue escalation |
| **Disk space** | "ENOSPC" | Infrastructure issue escalation |

### **Level 2: Category Classification**
Groups issues into actionable categories:

- **Infrastructure** - CI config, Node versions, system resources
- **Dependencies** - Package conflicts, peer deps, version mismatches
- **Code** - TypeScript, imports, linting, logic errors
- **Tests** - Failing tests, test setup issues

### **Level 3: Multi-Strategy Retry**
For Node version mismatch example:

**Attempt 1:** Update CI workflow Node version
```yaml
node-version: '20'  # Fix infrastructure
```

**Attempt 2:** Update package.json engines (if CI can't be changed)
```json
"engines": { "node": ">=18" }
```

**Attempt 3:** Create .nvmrc and document requirements

**After 3 attempts:** Escalate to human with detailed context

---

## How It Works

### 🔍 **1. Detection Phase**
```javascript
const failingPRs = getFailingPRs();
// Returns only PRs without symphony:needs-human label
```

### 🔬 **2. Analysis Phase**
```javascript
const analysis = analyzeCIFailure(prNumber);
// {
//   type: 'node_version',
//   category: 'infrastructure',
//   details: { requiredVersion: '20' },
//   logs: '...'
// }
```

### 🎯 **3. Strategy Selection**
```javascript
const strategy = buildFixStrategy(analysis, retryAttempt);
// Returns targeted fix prompt based on:
// - Issue type
// - Retry attempt number
// - Previous failure context
```

### 🤖 **4. Execution**
```javascript
const result = await runAgent(strategy.prompt, workspace);
// Agent attempts fix with focused context
```

### 📊 **5. Outcome Tracking**
```javascript
if (result.success) {
  prRetryCount.delete(prNumber); // Reset on success
} else if (retryAttempt >= maxRetries) {
  escalateToHuman(prNumber); // Create issue, add label
}
```

---

## Real-World Example

### **Your Case: Node Version Mismatch**

**What Happened:**
- PRs #6, #8, #4 all failed with same error
- All failed at dependency install phase
- Error: "Prisma requires Node 20.19+"

**What Symphony Autonomous Would Do:**

#### **Attempt 1** (30 seconds after detection)
```
🔍 Analyzing PR #6...
📊 Analysis: type=node_version, category=infrastructure
🎯 Strategy: Update CI workflow Node version
🤖 Spawning agent...
```

Agent receives focused prompt:
```markdown
# Fix Node.js Version Mismatch

**Problem:** CI using Node 18, Prisma requires Node 20+

**Task:** Update .github/workflows/ci.yml
Change: node-version: '18' → '20'

**Files to modify:** .github/workflows/*.yml
```

**Result:** 
- ✅ Agent updates CI workflow
- ✅ Commits and pushes
- ✅ CI re-runs automatically
- ✅ All 3 PRs unblocked by single infrastructure fix

**Total time:** 2-3 minutes
**Human involvement:** Zero

#### **If Attempt 1 Failed** (would try attempt 2)
```
⚠️ PR #6 still failing after attempt 1
🔄 Retry 2/3: Alternative strategy
🎯 Strategy: Update package.json engines
```

#### **If All 3 Attempts Failed**
```
🚨 PR #6 exceeded max retries (3)
📝 Creating escalation issue...
🏷️ Adding label: symphony:needs-human

Issue created: "PR #6 needs human attention (CI failures)"
- Links to PR
- Includes all 3 attempted fixes
- Provides analysis summary
- Suggests next steps
```

---

## Configuration

### Environment Variables

```bash
# Max retry attempts before escalation
export MAX_RETRIES=3

# Concurrent workers
export MAX_CONCURRENT=2

# Poll interval (seconds)
export POLL_INTERVAL=30

# Model
export MODEL=sonnet
```

### Labels Used

| Label | Meaning |
|-------|---------|
| `symphony:todo` | New issue to implement |
| `symphony:in-progress` | Issue being worked on |
| `symphony:done` | Issue completed |
| `symphony:needs-human` | PR needs human attention after retries |

---

## Comparison

| Feature | claude-symphony | symphony-complete | **symphony-autonomous** |
|---------|----------------|-------------------|----------------------|
| Issue → PR | ✅ | ✅ | ✅ |
| PR monitoring | ❌ | ✅ | ✅ |
| Root cause analysis | ❌ | ❌ | **✅** |
| Category classification | ❌ | ❌ | **✅** |
| Multi-strategy retry | ❌ | ❌ | **✅** |
| Infrastructure fixes | ❌ | ❌ | **✅** |
| Intelligent escalation | ❌ | ❌ | **✅** |
| Detailed context | ❌ | ❌ | **✅** |

---

## When to Use Which

### Use **claude-symphony** when:
- ✅ Simple issue → PR workflow
- ✅ PRs rarely fail CI
- ✅ You want minimal complexity

### Use **symphony-autonomous** when:
- ✅ High PR volume
- ✅ CI failures are common
- ✅ You want true automation
- ✅ Infrastructure issues arise
- ✅ You value intelligent retry logic

---

## Success Metrics

**Autonomous Symphony aims for:**
- 🎯 **>90% auto-fix rate** for common issues
- ⚡ **<5 min resolution** for infrastructure issues
- 🚨 **<5% escalation rate** to humans
- 🔄 **<2 retries average** per failing PR

**Your case would have been:**
- ✅ 100% auto-fix (Node version)
- ✅ ~3 min resolution
- ✅ 0% escalation
- ✅ 1 retry (succeeded first time)

---

## Try It

```bash
cd ~/dev/levels/mrr-fyi
node symphony/src/symphony-autonomous.js WORKFLOW-SYMPHONY-CODE.md
```

Watch it:
1. Pick up new issues
2. Monitor PRs for failures
3. Analyze root causes
4. Try intelligent fixes
5. Escalate only when truly stuck

**This is Symphony as it should be: intelligent, self-healing, and minimally invasive to humans.**
