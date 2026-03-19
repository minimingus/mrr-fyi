#!/usr/bin/env node
/**
 * Symphony-like orchestrator using OpenClaw sub-agents
 * 
 * This replaces Symphony's Claude Code CLI with OpenClaw's Claude API subscription.
 * 
 * Usage: node symphony-openclaw.js [--once]
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Config
const REPO = 'minimingus/mrr-fyi';
const PROJECT_DIR = __dirname;
const POLL_INTERVAL_MS = 30000; // 30 seconds
const MAX_CONCURRENT = 2;
const LABELS = {
  TODO: 'symphony:todo',
  IN_PROGRESS: 'symphony:in-progress',
  DONE: 'symphony:done'
};

// Load WORKFLOW.md
const WORKFLOW_PATH = join(PROJECT_DIR, 'WORKFLOW.md');
let WORKFLOW_PROMPT = '';
if (existsSync(WORKFLOW_PATH)) {
  const content = readFileSync(WORKFLOW_PATH, 'utf-8');
  // Extract the prompt (everything after the YAML front matter)
  const parts = content.split('---');
  if (parts.length >= 3) {
    WORKFLOW_PROMPT = parts.slice(2).join('---').trim();
  }
}

// Track active workers
const activeWorkers = new Map(); // issueNumber -> { process, startTime }

function log(msg, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${msg}`);
}

function exec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_DIR });
  } catch (error) {
    throw new Error(`Command failed: ${cmd}\n${error.message}`);
  }
}

function getIssuesWithLabel(label) {
  try {
    const output = exec(`gh issue list --repo ${REPO} --label "${label}" --json number,title,body --limit 100`);
    return JSON.parse(output);
  } catch (error) {
    log(`Failed to fetch issues: ${error.message}`, 'error');
    return [];
  }
}

function updateIssueLabel(issueNumber, oldLabel, newLabel) {
  try {
    exec(`gh issue edit ${issueNumber} --repo ${REPO} --remove-label "${oldLabel}" --add-label "${newLabel}"`);
    log(`Updated issue #${issueNumber}: ${oldLabel} → ${newLabel}`, 'success');
  } catch (error) {
    log(`Failed to update issue #${issueNumber}: ${error.message}`, 'error');
  }
}

function buildPrompt(issue) {
  let prompt = WORKFLOW_PROMPT;
  
  // Replace template variables
  prompt = prompt.replace(/\{\{\s*issue\.identifier\s*\}\}/g, issue.number);
  prompt = prompt.replace(/\{\{\s*issue\.title\s*\}\}/g, issue.title);
  prompt = prompt.replace(/\{\{\s*issue\.url\s*\}\}/g, `https://github.com/${REPO}/issues/${issue.number}`);
  prompt = prompt.replace(/\{\{\s*issue\.labels\s*\}\}/g, LABELS.TODO);
  
  // Handle issue body
  const bodyContent = issue.body || 'No description provided.';
  prompt = prompt.replace(
    /\{% if issue\.body %\}[\s\S]*?\{% else %\}[\s\S]*?\{% endif %\}/g,
    bodyContent
  );
  prompt = prompt.replace(/\{\{\s*issue\.body\s*\}\}/g, bodyContent);
  
  return prompt;
}

async function spawnWorker(issue) {
  const issueNumber = issue.number;
  
  if (activeWorkers.has(issueNumber)) {
    return; // Already working on it
  }
  
  if (activeWorkers.size >= MAX_CONCURRENT) {
    log(`Max concurrent workers (${MAX_CONCURRENT}) reached, queuing issue #${issueNumber}`);
    return;
  }
  
  log(`Starting work on issue #${issueNumber}: ${issue.title}`);
  updateIssueLabel(issueNumber, LABELS.TODO, LABELS.IN_PROGRESS);
  
  const prompt = buildPrompt(issue);
  
  // Use Claude Code directly in print mode
  const ocProcess = spawn('claude', ['--print', '--model', 'sonnet'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: PROJECT_DIR,
    env: { ...process.env }
  });
  
  activeWorkers.set(issueNumber, {
    process: ocProcess,
    startTime: Date.now()
  });
  
  // Send the prompt
  ocProcess.stdin.write(prompt + '\n');
  ocProcess.stdin.end();
  
  let output = '';
  
  ocProcess.stdout.on('data', (data) => {
    output += data.toString();
    process.stdout.write(data); // Pass through to console
  });
  
  ocProcess.on('close', (code) => {
    activeWorkers.delete(issueNumber);
    
    if (code === 0) {
      log(`Issue #${issueNumber} completed successfully`, 'success');
      updateIssueLabel(issueNumber, LABELS.IN_PROGRESS, LABELS.DONE);
      
      // TODO: Parse output for PR creation
      // For now, agent should create PR manually
    } else {
      log(`Issue #${issueNumber} failed with code ${code}`, 'error');
      // Leave it in IN_PROGRESS for manual review
    }
  });
  
  ocProcess.on('error', (error) => {
    activeWorkers.delete(issueNumber);
    log(`Issue #${issueNumber} error: ${error.message}`, 'error');
  });
}

async function pollAndProcess() {
  log('Polling for new issues...');
  
  const todoIssues = getIssuesWithLabel(LABELS.TODO);
  
  if (todoIssues.length === 0) {
    log('No todo issues found');
    return;
  }
  
  log(`Found ${todoIssues.length} todo issue(s)`);
  
  for (const issue of todoIssues) {
    await spawnWorker(issue);
  }
}

async function main() {
  const isOnce = process.argv.includes('--once');
  
  log(`Starting Symphony-OpenClaw orchestrator for ${REPO}`);
  log(`Project directory: ${PROJECT_DIR}`);
  log(`Max concurrent: ${MAX_CONCURRENT}`);
  log(`Mode: ${isOnce ? 'one-shot' : 'continuous'}`);
  
  if (!WORKFLOW_PROMPT) {
    log('Warning: WORKFLOW.md not found or empty', 'error');
  }
  
  await pollAndProcess();
  
  if (!isOnce) {
    setInterval(async () => {
      await pollAndProcess();
    }, POLL_INTERVAL_MS);
    
    log(`Polling every ${POLL_INTERVAL_MS / 1000}s...`);
  }
}

main().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
