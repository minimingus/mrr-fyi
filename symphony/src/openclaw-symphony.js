#!/usr/bin/env node
/**
 * Symphony - OpenClaw Native Edition
 * 
 * Uses OpenClaw's sessions_spawn to create sub-agents.
 * No CLI wrappers, no credit checks - pure OpenClaw power.
 */

import { execSync } from 'child_process';
import { readFileSync, mkdirSync, existsSync } from 'fs';
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

// Active workers (issue# -> sessionKey)
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
  
  // Extract YAML front matter
  const parts = content.split('---');
  if (parts.length < 3) {
    throw new Error('Invalid WORKFLOW.md format');
  }
  
  const config = YAML.parse(parts[1]);
  const promptTemplate = parts.slice(2).join('---').trim();
  
  return { config, promptTemplate };
}

// Build prompt from template
function buildPrompt(template, issue, workspace) {
  let prompt = template;
  
  // Replace template variables
  prompt = prompt.replace(/\{\{\s*number\s*\}\}/g, issue.number);
  prompt = prompt.replace(/\{\{\s*title\s*\}\}/g, issue.title);
  prompt = prompt.replace(/\{\{\s*body\s*\}\}/g, issue.body || 'No description provided.');
  prompt = prompt.replace(/\{\{\s*identifier\s*\}\}/g, `#${issue.number}`);
  
  // Add workspace context
  prompt += `\n\n## Workspace\n\nYou are working in: \`${workspace}\`\n\n`;
  prompt += `When done, run:\n\`\`\`bash\ngh issue edit ${issue.number} --remove-label "${CONFIG.labels.inProgress}" --add-label "${CONFIG.labels.done}"\n\`\`\`\n`;
  
  return prompt;
}

// Spawn OpenClaw sub-agent
async function spawnAgent(prompt, workspace, issueNumber) {
  return new Promise((resolve, reject) => {
    const label = `symphony-issue-${issueNumber}`;
    
    log(`Spawning OpenClaw agent for issue #${issueNumber} (label: ${label})`);
    
    // Use openclaw CLI to spawn a sub-agent
    // This will use OpenClaw's Claude subscription automatically
    const cmd = `openclaw agent run --label "${label}" --cwd "${workspace}" --model "${CONFIG.model}" --message "${prompt.replace(/"/g, '\\"')}"`;
    
    try {
      const output = exec(cmd, { cwd: workspace, timeout: 600000 }); // 10min timeout
      log(`Agent output:\n${output.substring(0, 500)}...`);
      resolve({ success: true, output });
    } catch (error) {
      log(`Agent failed: ${error.message}`, 'error');
      reject(error);
    }
  });
}

// Handle a single issue
async function handleIssue(issue, workflowConfig, promptTemplate) {
  const issueNumber = issue.number;
  
  if (activeWorkers.has(issueNumber)) {
    return;
  }
  
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
        exec(workflowConfig.hooks.after_create, { cwd: workspace });
      } catch (error) {
        log(`Hook failed: ${error.message}`, 'warn');
      }
    }
    
    // Build prompt
    const prompt = buildPrompt(promptTemplate, issue, workspace);
    
    // Spawn agent
    log(`Running agent for issue #${issueNumber}...`);
    const result = await spawnAgent(prompt, workspace, issueNumber);
    
    if (result.success) {
      log(`Issue #${issueNumber} completed`, 'success');
      
      // Check if agent already updated the label
      const currentIssue = JSON.parse(exec(`gh issue view ${issueNumber} --repo ${CONFIG.repo} --json labels`))[0];
      const hasDoneLabel = currentIssue.labels.some(l => l.name === CONFIG.labels.done);
      
      if (!hasDoneLabel) {
        updateLabel(issueNumber, CONFIG.labels.inProgress, CONFIG.labels.done);
      }
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
    
    // Handle in background
    handleIssue(issue, workflowConfig, promptTemplate).catch(error => {
      log(`Unhandled error for issue #${issue.number}: ${error.message}`, 'error');
    });
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const workflowPath = args[0] || '../WORKFLOW-SYMPHONY-CODE.md';
  
  // Load workflow
  log(`Loading workflow from ${workflowPath}...`);
  const { config: workflowConfig, promptTemplate } = loadWorkflow(workflowPath);
  
  // Override config from workflow
  if (workflowConfig.tracker?.repo) {
    CONFIG.repo = workflowConfig.tracker.repo;
  }
  if (workflowConfig.workspace?.root) {
    CONFIG.workspaceRoot = workflowConfig.workspace.root.replace('~', process.env.HOME);
  }
  if (workflowConfig.agent?.max_concurrent_agents) {
    CONFIG.maxConcurrent = workflowConfig.agent.max_concurrent_agents;
  }
  if (workflowConfig.claude?.model) {
    CONFIG.model = workflowConfig.claude.model;
  }
  
  log('Symphony-OpenClaw starting...');
  log(`Repo: ${CONFIG.repo}`);
  log(`Workspace: ${CONFIG.workspaceRoot}`);
  log(`Model: ${CONFIG.model}`);
  log(`Max concurrent: ${CONFIG.maxConcurrent}`);
  
  // Initial poll
  await poll(workflowConfig, promptTemplate);
  
  // Continuous polling
  setInterval(() => {
    poll(workflowConfig, promptTemplate).catch(error => {
      log(`Poll error: ${error.message}`, 'error');
    });
  }, CONFIG.pollInterval);
}

// Graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down gracefully...');
  process.exit(0);
});

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});
