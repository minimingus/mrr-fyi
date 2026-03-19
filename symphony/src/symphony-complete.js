#!/usr/bin/env node
/**
 * Symphony Complete - Full orchestration with PR monitoring & auto-fix
 * 
 * Like the original Symphony but uses your Claude.ai subscription.
 * 
 * Features:
 * - Polls GitHub Issues with symphony:todo
 * - Creates PRs with auto-merge
 * - Monitors PRs for CI failures
 * - Spawns agents to fix failing PRs
 * - Auto-merges when all checks pass
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import YAML from 'yaml';

// Config
let CONFIG = {
  repo: process.env.REPO || 'minimingus/mrr-fyi',
  workspaceRoot: process.env.WORKSPACE_ROOT || join(process.env.HOME, 'code', 'symphony-workspaces'),
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '2'),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30') * 1000,
  model: process.env.MODEL || 'sonnet',
  labels: {
    todo: 'symphony:todo',
    inProgress: 'symphony:in-progress',
    done: 'symphony:done',
    prFailed: 'symphony:pr-failed',
    prFixing: 'symphony:pr-fixing'
  }
};

// Active workers
const activeWorkers = new Map();
const prWorkers = new Map(); // PR# -> worker info

// Logging
function log(msg, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = { error: '❌', success: '✅', info: 'ℹ️', warn: '⚠️', pr: '🔀' }[level] || 'ℹ️';
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

// Fetch PRs with failing checks
function getFailingPRs() {
  try {
    const output = exec(`gh pr list --repo ${CONFIG.repo} --json number,title,headRefName,statusCheckRollup --limit 50`);
    const prs = JSON.parse(output);
    
    return prs.filter(pr => {
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

// Get PR check failures
function getPRFailures(prNumber) {
  try {
    const output = exec(`gh pr view ${prNumber} --repo ${CONFIG.repo} --json statusCheckRollup`);
    const data = JSON.parse(output);
    
    const failures = data.statusCheckRollup?.filter(check => 
      check.conclusion === 'FAILURE' || check.conclusion === 'TIMED_OUT'
    ) || [];
    
    return failures.map(f => ({
      name: f.name,
      conclusion: f.conclusion,
      detailsUrl: f.detailsUrl
    }));
  } catch (error) {
    log(`Failed to get PR failures: ${error.message}`, 'error');
    return [];
  }
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

// Build PR fix prompt
function buildPRFixPrompt(pr, failures) {
  const failureDetails = failures.map(f => `- ${f.name}: ${f.conclusion}`).join('\n');
  
  return `# PR CI Failure Fix

You are working on **PR #${pr.number}**: ${pr.title}

**Branch:** \`${pr.headRefName}\`

## CI Failures

The following checks failed:
${failureDetails}

## Your Task

1. Check out the branch: \`git checkout ${pr.headRefName}\`
2. Identify the root cause of the failures
3. Fix the issues
4. Run \`npm run build\` to verify locally
5. Commit and push fixes
6. Update the PR if needed

## Important

- Only fix CI/build issues, don't change functionality
- Make minimal changes needed to pass checks
- Use conventional commit messages: "fix: <description>"
- Push directly to the branch (no new PR needed)

When done, the CI will re-run automatically.`;
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

// Handle failing PR
async function handleFailingPR(pr) {
  const prNumber = pr.number;
  
  if (prWorkers.has(prNumber)) return;
  
  try {
    prWorkers.set(prNumber, { startTime: Date.now() });
    
    log(`PR #${prNumber} has failing checks, spawning fix agent...`, 'pr');
    
    const failures = getPRFailures(prNumber);
    if (failures.length === 0) {
      log(`PR #${prNumber} failures resolved externally`, 'pr');
      prWorkers.delete(prNumber);
      return;
    }
    
    const workspace = join(CONFIG.workspaceRoot, `${CONFIG.repo.replace('/', '-')}-pr-${prNumber}`);
    mkdirSync(workspace, { recursive: true });
    
    // Clone and checkout PR branch
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
    
    const prompt = buildPRFixPrompt(pr, failures);
    
    log(`Running fix agent for PR #${prNumber}...`, 'pr');
    const result = await runAgent(prompt, workspace, `symphony-pr-fix-${prNumber}`);
    
    if (result.success) {
      log(`PR #${prNumber} fix attempt completed`, 'success');
      
      const outputPath = join(workspace, 'fix-output.txt');
      writeFileSync(outputPath, result.output);
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
  
  // Poll PRs (if we have capacity)
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
  
  log('Symphony-Complete starting...');
  log(`Repo: ${CONFIG.repo}`);
  log(`Workspace: ${CONFIG.workspaceRoot}`);
  log(`Model: ${CONFIG.model}`);
  log(`Max concurrent: ${CONFIG.maxConcurrent}`);
  log('Features: Issue handling + PR monitoring & auto-fix');
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
