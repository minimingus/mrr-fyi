#!/usr/bin/env node
/**
 * Symphony - Claude Subscription Edition
 * 
 * Uses claude CLI with your Claude.ai subscription.
 * Unsets ANTHROPIC_API_KEY to force subscription mode.
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
    done: 'symphony:done'
  }
};

// Active workers
const activeWorkers = new Map();

// Logging
function log(msg, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = { error: '❌', success: '✅', info: 'ℹ️', warn: '⚠️' }[level] || 'ℹ️';
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

// Fetch issues from GitHub
function getIssues(label) {
  try {
    const output = exec(`gh issue list --repo ${CONFIG.repo} --label "${label}" --json number,title,body --limit 100`);
    return JSON.parse(output);
  } catch (error) {
    log(`Failed to fetch issues: ${error.message}`, 'error');
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

// Run Claude agent
async function runAgent(prompt, workspace, maxTurns = 30) {
  return new Promise((resolve, reject) => {
    // Remove ANTHROPIC_API_KEY to force subscription mode
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;
    
    const claude = spawn('claude', ['--print', '--permission-mode', 'bypassPermissions'], {
      cwd: workspace,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    claude.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text); // Stream to console
    });
    
    claude.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    claude.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output, turns: 1 });
      } else {
        reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
      }
    });
    
    claude.on('error', (error) => {
      reject(error);
    });
    
    // Send prompt
    claude.stdin.write(prompt);
    claude.stdin.end();
  });
}

// Handle a single issue
async function handleIssue(issue, workflowConfig, promptTemplate) {
  const issueNumber = issue.number;
  
  if (activeWorkers.has(issueNumber)) return;
  
  try {
    activeWorkers.set(issueNumber, { startTime: Date.now() });
    
    log(`Starting work on issue #${issueNumber}: ${issue.title}`);
    updateLabel(issueNumber, CONFIG.labels.todo, CONFIG.labels.inProgress);
    
    // Create workspace
    const workspace = join(CONFIG.workspaceRoot, `${CONFIG.repo.replace('/', '-')}-${issueNumber}`);
    mkdirSync(workspace, { recursive: true });
    
    // Run after_create hook
    if (workflowConfig.hooks?.after_create) {
      log(`Running after_create hook...`);
      try {
        // Also remove ANTHROPIC_API_KEY for hooks
        const env = { ...process.env };
        delete env.ANTHROPIC_API_KEY;
        exec(workflowConfig.hooks.after_create, { cwd: workspace, env });
      } catch (error) {
        log(`Hook failed (non-fatal): ${error.message}`, 'warn');
      }
    }
    
    // Build prompt
    const prompt = buildPrompt(promptTemplate, issue);
    
    // Run agent
    log(`Running Claude agent for issue #${issueNumber}...`);
    const result = await runAgent(prompt, workspace, workflowConfig.agent?.max_turns || 30);
    
    if (result.success) {
      log(`Issue #${issueNumber} completed`, 'success');
      
      // Save output
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

// Main polling loop
async function poll(workflowConfig, promptTemplate) {
  log('Polling for issues...');
  
  const issues = getIssues(CONFIG.labels.todo);
  
  if (issues.length === 0) {
    log('No todo issues found');
    return;
  }
  
  log(`Found ${issues.length} todo issue(s)`);
  
  for (const issue of issues) {
    if (activeWorkers.size >= CONFIG.maxConcurrent) {
      log(`Max concurrent limit (${CONFIG.maxConcurrent}) reached`);
      break;
    }
    
    handleIssue(issue, workflowConfig, promptTemplate).catch(error => {
      log(`Unhandled error for issue #${issue.number}: ${error.message}`, 'error');
    });
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const workflowPath = args[0] || '../WORKFLOW-SYMPHONY-CODE.md';
  
  log(`Loading workflow from ${workflowPath}...`);
  const { config: workflowConfig, promptTemplate } = loadWorkflow(workflowPath);
  
  // Override config from workflow
  if (workflowConfig.tracker?.repo) CONFIG.repo = workflowConfig.tracker.repo;
  if (workflowConfig.workspace?.root) CONFIG.workspaceRoot = workflowConfig.workspace.root.replace('~', process.env.HOME);
  if (workflowConfig.agent?.max_concurrent_agents) CONFIG.maxConcurrent = workflowConfig.agent.max_concurrent_agents;
  
  log('Symphony-Claude starting...');
  log(`Repo: ${CONFIG.repo}`);
  log(`Workspace: ${CONFIG.workspaceRoot}`);
  log(`Model: ${CONFIG.model}`);
  log(`Max concurrent: ${CONFIG.maxConcurrent}`);
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
