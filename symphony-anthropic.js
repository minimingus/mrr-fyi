#!/usr/bin/env node
/**
 * Symphony-like orchestrator using Anthropic API directly
 * No CLI tools, no credit checks - just direct API calls
 */

import Anthropic from '@anthropic-ai/sdk';
import { execSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Config
const REPO = process.env.REPO || 'minimingus/mrr-fyi';
const PROJECT_DIR = process.env.PROJECT_DIR || __dirname;
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || join(process.env.HOME, 'code', 'symphony-workspaces');
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '2');
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL || '30') * 1000;
const MODEL = process.env.MODEL || 'claude-sonnet-4-20250514';

const LABELS = {
  TODO: 'symphony:todo',
  IN_PROGRESS: 'symphony:in-progress',
  DONE: 'symphony:done'
};

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

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
    return execSync(cmd, { encoding: 'utf-8', cwd: PROJECT_DIR, ...opts });
  } catch (error) {
    throw new Error(`Command failed: ${cmd}\n${error.message}`);
  }
}

// Fetch issues from GitHub
function getIssuesWithLabel(label) {
  try {
    const output = exec(`gh issue list --repo ${REPO} --label "${label}" --json number,title,body --limit 100`);
    return JSON.parse(output);
  } catch (error) {
    log(`Failed to fetch issues: ${error.message}`, 'error');
    return [];
  }
}

// Update issue label
function updateIssueLabel(issueNumber, oldLabel, newLabel) {
  try {
    exec(`gh issue edit ${issueNumber} --repo ${REPO} --remove-label "${oldLabel}" --add-label "${newLabel}"`);
    log(`Updated issue #${issueNumber}: ${oldLabel} → ${newLabel}`, 'success');
  } catch (error) {
    log(`Failed to update label for issue #${issueNumber}: ${error.message}`, 'error');
  }
}

// Build prompt from WORKFLOW.md
function buildPrompt(issue) {
  const workflowPath = join(PROJECT_DIR, 'WORKFLOW.md');
  if (!existsSync(workflowPath)) {
    throw new Error('WORKFLOW.md not found');
  }
  
  let content = readFileSync(workflowPath, 'utf-8');
  
  // Extract prompt (skip YAML front matter)
  const parts = content.split('---');
  let prompt = parts.length >= 3 ? parts.slice(2).join('---').trim() : content;
  
  // Replace template variables
  prompt = prompt.replace(/\{\{\s*issue\.identifier\s*\}\}/g, issue.number);
  prompt = prompt.replace(/\{\{\s*issue\.title\s*\}\}/g, issue.title);
  prompt = prompt.replace(/\{\{\s*issue\.url\s*\}\}/g, `https://github.com/${REPO}/issues/${issue.number}`);
  prompt = prompt.replace(/\{\{\s*issue\.labels\s*\}\}/g, LABELS.TODO);
  
  // Handle issue body
  const bodyContent = issue.body || 'No description provided.';
  prompt = prompt.replace(
    /\{%\s*if\s+issue\.body\s*%\}[\s\S]*?\{%\s*else\s*%\}[\s\S]*?\{%\s*endif\s*%\}/g,
    bodyContent
  );
  prompt = prompt.replace(/\{\{\s*issue\.body\s*\}\}/g, bodyContent);
  
  return prompt;
}

// Call Anthropic API with streaming
async function callClaude(prompt, workspace) {
  const messages = [{
    role: 'user',
    content: prompt
  }];
  
  let fullResponse = '';
  
  const stream = await anthropic.messages.stream({
    model: MODEL,
    max_tokens: 8192,
    messages: messages,
    system: 'You are an expert software engineer working autonomously on GitHub issues. Follow the instructions precisely.'
  });
  
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const text = event.delta.text;
      process.stdout.write(text);
      fullResponse += text;
    }
  }
  
  return fullResponse;
}

// Handle a single issue
async function handleIssue(issue) {
  const issueNumber = issue.number;
  
  if (activeWorkers.has(issueNumber)) {
    return;
  }
  
  try {
    activeWorkers.set(issueNumber, { startTime: Date.now() });
    
    log(`Starting work on issue #${issueNumber}: ${issue.title}`);
    updateIssueLabel(issueNumber, LABELS.TODO, LABELS.IN_PROGRESS);
    
    // Create workspace
    const workspace = join(WORKSPACE_ROOT, `issue-${issueNumber}`);
    mkdirSync(workspace, { recursive: true });
    
    // Clone repo
    log(`Cloning ${REPO} into ${workspace}`);
    exec(`git clone --depth 1 https://github.com/${REPO}.git ${workspace}`);
    
    // Configure git
    exec('git config user.email "tomerabr@gmail.com"', { cwd: workspace });
    exec('git config user.name "minimingus"', { cwd: workspace });
    
    // Build and send prompt
    const prompt = buildPrompt(issue);
    
    log(`Calling Claude API for issue #${issueNumber}...`);
    const response = await callClaude(prompt, workspace);
    
    // Save response
    const outputPath = join(workspace, 'agent-output.txt');
    writeFileSync(outputPath, response);
    
    log(`Issue #${issueNumber} completed`, 'success');
    updateIssueLabel(issueNumber, LABELS.IN_PROGRESS, LABELS.DONE);
    
  } catch (error) {
    log(`Issue #${issueNumber} failed: ${error.message}`, 'error');
  } finally {
    activeWorkers.delete(issueNumber);
  }
}

// Main polling loop
async function poll() {
  log('Polling for todo issues...');
  
  const issues = getIssuesWithLabel(LABELS.TODO);
  
  if (issues.length === 0) {
    log('No todo issues found');
    return;
  }
  
  log(`Found ${issues.length} todo issue(s)`);
  
  for (const issue of issues) {
    if (activeWorkers.size >= MAX_CONCURRENT) {
      log(`Max concurrent limit (${MAX_CONCURRENT}) reached, queuing remaining issues`);
      break;
    }
    
    // Handle in background (non-blocking)
    handleIssue(issue).catch(error => {
      log(`Unhandled error for issue #${issue.number}: ${error.message}`, 'error');
    });
  }
}

// Main
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    log('Error: ANTHROPIC_API_KEY environment variable not set', 'error');
    process.exit(1);
  }
  
  log('Starting Symphony-Anthropic orchestrator');
  log(`Repo: ${REPO}`);
  log(`Workspace: ${WORKSPACE_ROOT}`);
  log(`Max concurrent: ${MAX_CONCURRENT}`);
  log(`Model: ${MODEL}`);
  log(`Poll interval: ${POLL_INTERVAL_MS / 1000}s`);
  
  // Initial poll
  await poll();
  
  // Continuous polling
  setInterval(poll, POLL_INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('Shutting down gracefully...');
  process.exit(0);
});

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
