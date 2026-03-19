#!/usr/bin/env node
/**
 * Symphony Autonomous - Self-healing CI/CD orchestrator
 * 
 * Features:
 * - Handles new issues → PRs
 * - Monitors PRs for failures
 * - Analyzes root cause (code vs infrastructure)
 * - Tries multiple fix strategies
 * - Escalates to human only after exhausting options
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// Config
let CONFIG = {
  repo: process.env.REPO || 'minimingus/mrr-fyi',
  workspaceRoot: process.env.WORKSPACE_ROOT || join(process.env.HOME, 'code', 'symphony-workspaces'),
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '2'),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30') * 1000,
  model: process.env.MODEL || 'sonnet',
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  labels: {
    todo: 'symphony:todo',
    inProgress: 'symphony:in-progress',
    done: 'symphony:done',
    prFailed: 'symphony:pr-failed',
    needsHuman: 'symphony:needs-human'
  }
};

// Active workers
const activeWorkers = new Map();
const prWorkers = new Map();
const prRetryCount = new Map(); // Track retry attempts per PR

// Logging
function log(msg, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = { 
    error: '❌', 
    success: '✅', 
    info: 'ℹ️', 
    warn: '⚠️', 
    pr: '🔀',
    analysis: '🔍',
    retry: '🔄',
    escalate: '🚨'
  }[level] || 'ℹ️';
  console.log(`${timestamp} ${emoji} ${msg}`);
}

// Execute shell command
function exec(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf-8', ...opts });
  } catch (error) {
    throw new Error(`Command failed: ${cmd}\n${error.message}`);
  }
}

// Fetch issues
function getIssues(label) {
  try {
    const output = exec(`gh issue list --repo ${CONFIG.repo} --label "${label}" --json number,title,body --limit 100`);
    return JSON.parse(output);
  } catch (error) {
    log(`Failed to fetch issues: ${error.message}`, 'error');
    return [];
  }
}

// Fetch failing PRs
function getFailingPRs() {
  try {
    const output = exec(`gh pr list --repo ${CONFIG.repo} --json number,title,headRefName,statusCheckRollup,labels --limit 50`);
    const prs = JSON.parse(output);
    
    // Skip PRs already marked as needs-human
    return prs.filter(pr => {
      const needsHuman = pr.labels?.some(l => l.name === CONFIG.labels.needsHuman);
      if (needsHuman) return false;
      
      if (!pr.statusCheckRollup) return false;
      return pr.statusCheckRollup.some(check => 
        check.conclusion === 'FAILURE' || check.conclusion === 'TIMED_OUT'
      );
    });
  } catch (error) {
    log(`Failed to fetch PRs: ${error.message}`, 'error');
    return [];
  }
}

// Analyze CI failure logs
function analyzeCIFailure(prNumber) {
  try {
    // Get failed run
    const runs = JSON.parse(exec(`gh run list --repo ${CONFIG.repo} --branch $(gh pr view ${prNumber} --repo ${CONFIG.repo} --json headRefName -q .headRefName) --json databaseId,conclusion --limit 5`));
    const failedRun = runs.find(r => r.conclusion === 'FAILURE');
    
    if (!failedRun) return null;
    
    // Get logs
    const logs = exec(`gh run view ${failedRun.databaseId} --repo ${CONFIG.repo} --log-failed`);
    
    // Analyze patterns
    const analysis = {
      type: 'unknown',
      category: 'code',
      details: {},
      logs: logs
    };
    
    // Infrastructure issues
    if (logs.includes('Unsupported engine') || logs.includes('Please upgrade your Node')) {
      analysis.type = 'node_version';
      analysis.category = 'infrastructure';
      const match = logs.match(/required: \{ node: '>=(\d+)'/);
      if (match) analysis.details.requiredVersion = match[1];
    }
    
    if (logs.includes('ENOTFOUND') || logs.includes('network') || logs.includes('timeout')) {
      analysis.type = 'network';
      analysis.category = 'infrastructure';
    }
    
    if (logs.includes('ENOSPC') || logs.includes('disk') || logs.includes('No space left')) {
      analysis.type = 'disk_space';
      analysis.category = 'infrastructure';
    }
    
    // Dependency issues
    if (logs.includes('npm error') || logs.includes('peer dependency') || logs.includes('ERESOLVE')) {
      analysis.type = 'dependency';
      analysis.category = 'dependencies';
    }
    
    // Build errors
    if (logs.includes('TS') && logs.includes('error')) {
      analysis.type = 'typescript';
      analysis.category = 'code';
    }
    
    if (logs.includes('Module not found') || logs.includes('Cannot find module')) {
      analysis.type = 'import';
      analysis.category = 'code';
    }
    
    if (logs.includes('lint') || logs.includes('ESLint')) {
      analysis.type = 'linting';
      analysis.category = 'code';
    }
    
    // Test failures
    if (logs.includes('test') && (logs.includes('failed') || logs.includes('FAIL'))) {
      analysis.type = 'tests';
      analysis.category = 'code';
    }
    
    return analysis;
  } catch (error) {
    log(`Failed to analyze CI failure: ${error.message}`, 'error');
    return null;
  }
}

// Build fix strategy based on analysis
function buildFixStrategy(analysis, retryAttempt = 0) {
  const strategies = {
    node_version: [
      {
        name: 'Update CI workflow Node version',
        prompt: `# Fix Node.js Version Mismatch

**Problem:** CI is using an outdated Node.js version that doesn't support current dependencies.

**Required Node version:** ${analysis.details.requiredVersion || '20'}+

**Your task:**
1. Open \`.github/workflows/ci.yml\` (or similar)
2. Find the \`setup-node\` step
3. Update \`node-version\` to '${analysis.details.requiredVersion || '20'}'
4. Commit and push

Example:
\`\`\`yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Updated from 18
\`\`\`

**Important:** This is an infrastructure fix, not a code fix. Only change CI config.`,
        files: ['.github/workflows/*.yml']
      },
      {
        name: 'Update package.json engines',
        prompt: `# Alternative: Relax package.json engine requirements

If CI Node version can't be changed, relax the dependency requirements:

1. Check \`package.json\` for engine constraints
2. If dependencies require newer Node, either update them or document the requirement
3. Consider adding \`.nvmrc\` with the required version`,
        files: ['package.json', '.nvmrc']
      }
    ],
    
    dependency: [
      {
        name: 'Fix peer dependency conflicts',
        prompt: `# Fix Dependency Conflicts

**Problem:** npm/yarn dependency resolution failed.

**Your task:**
1. Review the dependency error in logs
2. Run \`npm install\` locally to see the conflict
3. Options:
   - Update conflicting packages to compatible versions
   - Use \`--legacy-peer-deps\` if safe
   - Remove and reinstall problematic packages
4. Test that build works: \`npm run build\`
5. Commit updated package-lock.json`,
        files: ['package.json', 'package-lock.json']
      }
    ],
    
    typescript: [
      {
        name: 'Fix TypeScript errors',
        prompt: `# Fix TypeScript Compilation Errors

**Problem:** TypeScript compilation failed.

**Your task:**
1. Run \`npx tsc --noEmit\` to see all errors
2. Fix each error:
   - Missing types: add type imports or install @types packages
   - Type mismatches: correct the types
   - Missing properties: add required properties
3. Verify: \`npm run build\` passes
4. Commit fixes`,
        files: ['**/*.ts', '**/*.tsx', 'tsconfig.json']
      }
    ],
    
    import: [
      {
        name: 'Fix missing imports',
        prompt: `# Fix Import Errors

**Problem:** Module imports are broken.

**Your task:**
1. Check the "Module not found" error
2. Verify the file exists at the import path
3. Fix import path or add missing file
4. Check for:
   - Typos in import path
   - Missing file extension
   - Case sensitivity (Component.tsx vs component.tsx)
   - Circular dependencies
5. Test: \`npm run build\`
6. Commit`,
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
      }
    ],
    
    linting: [
      {
        name: 'Auto-fix linting errors',
        prompt: `# Fix Linting Errors

**Problem:** ESLint rules violated.

**Your task:**
1. Run \`npm run lint -- --fix\` to auto-fix
2. Manually fix any remaining errors
3. Common fixes:
   - Add missing semicolons
   - Remove unused imports
   - Fix indentation
   - Add missing return types
4. Verify: \`npm run lint\` passes
5. Commit`,
        files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx']
      }
    ]
  };
  
  const typeStrategies = strategies[analysis.type] || [];
  
  // Return strategy based on retry attempt
  if (retryAttempt < typeStrategies.length) {
    return typeStrategies[retryAttempt];
  }
  
  // Fallback generic strategy
  return {
    name: 'Generic fix attempt',
    prompt: `# Fix CI Failure

**Problem type:** ${analysis.type}
**Category:** ${analysis.category}

**CI Logs:**
\`\`\`
${analysis.logs.slice(0, 2000)}
\`\`\`

**Your task:**
1. Read the error logs carefully
2. Identify the root cause
3. Implement a fix
4. Test locally: \`npm run build\`
5. Commit and push

Be thorough and methodical.`,
    files: ['**/*']
  };
}

// Update issue label
function updateLabel(issueNumber, oldLabel, newLabel) {
  try {
    exec(`gh issue edit ${issueNumber} --repo ${CONFIG.repo} --remove-label "${oldLabel}" --add-label "${newLabel}"`);
    log(`Updated issue #${issueNumber}: ${oldLabel} → ${newLabel}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to update label for issue #${issueNumber}: ${error.message}`, 'error');
    return false;
  }
}

// Add label to PR
function addPRLabel(prNumber, label) {
  try {
    exec(`gh pr edit ${prNumber} --repo ${CONFIG.repo} --add-label "${label}"`);
    return true;
  } catch (error) {
    log(`Failed to add label to PR #${prNumber}: ${error.message}`, 'error');
    return false;
  }
}

// Load workflow
function loadWorkflow(path) {
  const content = readFileSync(path, 'utf-8');
  const parts = content.split('---');
  if (parts.length < 3) throw new Error('Invalid WORKFLOW.md format');
  
  const config = YAML.parse(parts[1]);
  const promptTemplate = parts.slice(2).join('---').trim();
  
  return { config, promptTemplate };
}

// Build prompt from template
function buildPrompt(template, issue) {
  let prompt = template;
  prompt = prompt.replace(/\{\{\s*number\s*\}\}/g, issue.number);
  prompt = prompt.replace(/\{\{\s*title\s*\}\}/g, issue.title);
  prompt = prompt.replace(/\{\{\s*body\s*\}\}/g, issue.body || 'No description provided.');
  prompt = prompt.replace(/\{\{\s*identifier\s*\}\}/g, `#${issue.number}`);
  return prompt;
}

// Run Claude agent
async function runAgent(prompt, workspace, label = null) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    
    const args = ['--print', '--permission-mode', 'bypassPermissions'];
    if (label) args.push('--label', label);
    
    const claude = spawn('claude', args, {
      cwd: workspace,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    claude.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });
    
    claude.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    claude.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
      }
    });
    
    claude.on('error', (error) => reject(error));
    
    claude.stdin.write(prompt);
    claude.stdin.end();
  });
}

// Handle issue (original flow)
async function handleIssue(issue, workflowConfig, promptTemplate) {
  const issueNumber = issue.number;
  
  if (activeWorkers.has(issueNumber)) return;
  
  try {
    activeWorkers.set(issueNumber, { startTime: Date.now() });
    
    log(`Starting work on issue #${issueNumber}: ${issue.title}`);
    updateLabel(issueNumber, CONFIG.labels.todo, CONFIG.labels.inProgress);
    
    const workspace = join(CONFIG.workspaceRoot, `${CONFIG.repo.replace('/', '-')}-${issueNumber}`);
    mkdirSync(workspace, { recursive: true });
    
    if (workflowConfig.hooks?.after_create) {
      log(`Running after_create hook...`);
      try {
        const env = { ...process.env };
        delete env.ANTHROPIC_API_KEY;
        exec(workflowConfig.hooks.after_create, { cwd: workspace, env });
      } catch (error) {
        log(`Hook failed (non-fatal): ${error.message}`, 'warn');
      }
    }
    
    const prompt = buildPrompt(promptTemplate, issue);
    
    log(`Running Claude agent for issue #${issueNumber}...`);
    const result = await runAgent(prompt, workspace, `symphony-issue-${issueNumber}`);
    
    if (result.success) {
      log(`Issue #${issueNumber} completed`, 'success');
      
      const outputPath = join(workspace, 'agent-output.txt');
      writeFileSync(outputPath, result.output);
      
      updateLabel(issueNumber, CONFIG.labels.inProgress, CONFIG.labels.done);
    }
    
  } catch (error) {
    log(`Issue #${issueNumber} error: ${error.message}`, 'error');
  } finally {
    activeWorkers.delete(issueNumber);
  }
}

// Handle failing PR with retry logic
async function handleFailingPR(pr) {
  const prNumber = pr.number;
  
  if (prWorkers.has(prNumber)) return;
  
  const retryAttempt = prRetryCount.get(prNumber) || 0;
  
  // Check if we've exceeded max retries
  if (retryAttempt >= CONFIG.maxRetries) {
    log(`PR #${prNumber} exceeded max retries (${CONFIG.maxRetries}), escalating to human`, 'escalate');
    addPRLabel(prNumber, CONFIG.labels.needsHuman);
    prRetryCount.delete(prNumber);
    
    // TODO: Create issue for human review
    try {
      exec(`gh issue create --repo ${CONFIG.repo} \
        --title "PR #${prNumber} needs human attention (CI failures)" \
        --body "PR #${prNumber} (${pr.title}) has failing CI checks that Symphony couldn't fix after ${CONFIG.maxRetries} attempts.

Please review: https://github.com/${CONFIG.repo}/pull/${prNumber}

This may require infrastructure changes or complex debugging." \
        --label "${CONFIG.labels.needsHuman}"`);
    } catch (e) {
      log(`Failed to create escalation issue: ${e.message}`, 'error');
    }
    
    return;
  }
  
  try {
    prWorkers.set(prNumber, { startTime: Date.now(), retry: retryAttempt });
    prRetryCount.set(prNumber, retryAttempt + 1);
    
    log(`PR #${prNumber} has failing checks (attempt ${retryAttempt + 1}/${CONFIG.maxRetries})`, 'pr');
    
    // Analyze failure
    log(`Analyzing CI failure for PR #${prNumber}...`, 'analysis');
    const analysis = analyzeCIFailure(prNumber);
    
    if (!analysis) {
      log(`Could not analyze PR #${prNumber} failure`, 'warn');
      prWorkers.delete(prNumber);
      return;
    }
    
    log(`Analysis: type=${analysis.type}, category=${analysis.category}`, 'analysis');
    
    // Get fix strategy
    const strategy = buildFixStrategy(analysis, retryAttempt);
    log(`Strategy: ${strategy.name}`, 'retry');
    
    const workspace = join(CONFIG.workspaceRoot, `${CONFIG.repo.replace('/', '-')}-pr-${prNumber}-attempt-${retryAttempt}`);
    mkdirSync(workspace, { recursive: true });
    
    // Setup workspace
    try {
      exec(`git clone https://github.com/${CONFIG.repo}.git .`, { cwd: workspace });
      exec(`gh auth setup-git`, { cwd: workspace });
      exec(`git config user.email "tomerabr@gmail.com"`, { cwd: workspace });
      exec(`git config user.name "minimingus"`, { cwd: workspace });
      exec(`git fetch origin ${pr.headRefName}:${pr.headRefName}`, { cwd: workspace });
      exec(`git checkout ${pr.headRefName}`, { cwd: workspace });
      exec(`npm install`, { cwd: workspace });
    } catch (error) {
      log(`Failed to setup PR workspace: ${error.message}`, 'error');
      prWorkers.delete(prNumber);
      return;
    }
    
    log(`Running fix agent for PR #${prNumber} (${strategy.name})...`, 'pr');
    const result = await runAgent(strategy.prompt, workspace, `symphony-pr-fix-${prNumber}-${retryAttempt}`);
    
    if (result.success) {
      log(`PR #${prNumber} fix attempt ${retryAttempt + 1} completed`, 'success');
      
      const outputPath = join(workspace, `fix-output-${retryAttempt}.txt`);
      writeFileSync(outputPath, result.output);
      
      // Reset retry count on successful fix (CI will re-run)
      prRetryCount.delete(prNumber);
    }
    
  } catch (error) {
    log(`PR #${prNumber} fix error: ${error.message}`, 'error');
  } finally {
    prWorkers.delete(prNumber);
  }
}

// Main polling loop
async function poll(workflowConfig, promptTemplate) {
  log('Polling for issues and PRs...');
  
  // Poll issues
  const issues = getIssues(CONFIG.labels.todo);
  if (issues.length > 0) {
    log(`Found ${issues.length} todo issue(s)`);
    
    for (const issue of issues) {
      if (activeWorkers.size >= CONFIG.maxConcurrent) {
        log(`Max concurrent limit (${CONFIG.maxConcurrent}) reached for issues`);
        break;
      }
      
      handleIssue(issue, workflowConfig, promptTemplate).catch(error => {
        log(`Unhandled error for issue #${issue.number}: ${error.message}`, 'error');
      });
    }
  }
  
  // Poll PRs
  if (activeWorkers.size + prWorkers.size < CONFIG.maxConcurrent) {
    const failingPRs = getFailingPRs();
    if (failingPRs.length > 0) {
      log(`Found ${failingPRs.length} PR(s) with failing checks`, 'pr');
      
      for (const pr of failingPRs) {
        if (prWorkers.size >= Math.floor(CONFIG.maxConcurrent / 2)) {
          log(`Max concurrent PR workers reached`);
          break;
        }
        
        handleFailingPR(pr).catch(error => {
          log(`Unhandled error for PR #${pr.number}: ${error.message}`, 'error');
        });
      }
    }
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const workflowPath = args[0] || '../WORKFLOW-SYMPHONY-CODE.md';
  
  log(`Loading workflow from ${workflowPath}...`);
  const { config: workflowConfig, promptTemplate } = loadWorkflow(workflowPath);
  
  if (workflowConfig.tracker?.repo) CONFIG.repo = workflowConfig.tracker.repo;
  if (workflowConfig.workspace?.root) CONFIG.workspaceRoot = workflowConfig.workspace.root.replace('~', process.env.HOME);
  if (workflowConfig.agent?.max_concurrent_agents) CONFIG.maxConcurrent = workflowConfig.agent.max_concurrent_agents;
  
  log('Symphony-Autonomous starting...');
  log(`Repo: ${CONFIG.repo}`);
  log(`Workspace: ${CONFIG.workspaceRoot}`);
  log(`Model: ${CONFIG.model}`);
  log(`Max concurrent: ${CONFIG.maxConcurrent}`);
  log(`Max retries per PR: ${CONFIG.maxRetries}`);
  log('Features: Issue handling + Intelligent PR auto-fix + Human escalation');
  log('Using Claude.ai subscription (ANTHROPIC_API_KEY unset for agents)');
  
  await poll(workflowConfig, promptTemplate);
  
  setInterval(() => {
    poll(workflowConfig, promptTemplate).catch(error => {
      log(`Poll error: ${error.message}`, 'error');
    });
  }, CONFIG.pollInterval);
}

process.on('SIGINT', () => {
  log('Shutting down gracefully...');
  process.exit(0);
});

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});
