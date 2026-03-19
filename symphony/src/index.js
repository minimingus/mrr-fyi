#!/usr/bin/env node
/**
 * Symphony - Anthropic API Edition
 * 
 * A Symphony-like orchestrator that uses Anthropic API directly
 * with proper tool support for file editing.
 */

import Anthropic from '@anthropic-ai/sdk';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Config
let CONFIG = {
  repo: process.env.REPO || 'minimingus/mrr-fyi',
  workspaceRoot: process.env.WORKSPACE_ROOT || join(process.env.HOME, 'code', 'symphony-workspaces'),
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '2'),
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30') * 1000,
  model: process.env.MODEL || 'claude-sonnet-4-20250514',
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
function buildPrompt(template, issue) {
  let prompt = template;
  
  // Replace template variables
  prompt = prompt.replace(/\{\{\s*number\s*\}\}/g, issue.number);
  prompt = prompt.replace(/\{\{\s*title\s*\}\}/g, issue.title);
  prompt = prompt.replace(/\{\{\s*body\s*\}\}/g, issue.body || 'No description provided.');
  prompt = prompt.replace(/\{\{\s*identifier\s*\}\}/g, `#${issue.number}`);
  
  return prompt;
}

// Tool definitions for Anthropic API
const TOOLS = [
  {
    name: 'read_file',
    description: 'Read the contents of a file',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Write content to a file, creating it if it doesn\'t exist',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to write'
        },
        content: {
          type: 'string',
          description: 'Content to write to the file'
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'execute_command',
    description: 'Execute a shell command',
    input_schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Command to execute'
        }
      },
      required: ['command']
    }
  }
];

// Execute tool
function executeTool(toolName, toolInput, workspace) {
  const cwd = workspace;
  
  switch (toolName) {
    case 'read_file': {
      const filePath = join(cwd, toolInput.path);
      try {
        const content = readFileSync(filePath, 'utf-8');
        return { content };
      } catch (error) {
        return { error: `Failed to read file: ${error.message}` };
      }
    }
    
    case 'write_file': {
      const filePath = join(cwd, toolInput.path);
      try {
        mkdirSync(dirname(filePath), { recursive: true });
        writeFileSync(filePath, toolInput.content, 'utf-8');
        return { success: true, message: `Wrote ${toolInput.content.length} bytes to ${toolInput.path}` };
      } catch (error) {
        return { error: `Failed to write file: ${error.message}` };
      }
    }
    
    case 'list_files': {
      const dirPath = join(cwd, toolInput.path);
      try {
        const files = exec(`ls -la "${dirPath}"`, { cwd });
        return { files };
      } catch (error) {
        return { error: `Failed to list files: ${error.message}` };
      }
    }
    
    case 'execute_command': {
      try {
        const output = exec(toolInput.command, { cwd });
        return { output };
      } catch (error) {
        return { error: `Command failed: ${error.message}` };
      }
    }
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Run agent with tool loop
async function runAgent(prompt, workspace, maxTurns = 30) {
  const messages = [{ role: 'user', content: prompt }];
  let turnCount = 0;
  
  while (turnCount < maxTurns) {
    turnCount++;
    log(`Turn ${turnCount}/${maxTurns}...`);
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: CONFIG.model,
      max_tokens: 8192,
      tools: TOOLS,
      messages: messages
    });
    
    // Add assistant response to messages
    messages.push({
      role: 'assistant',
      content: response.content
    });
    
    // Check if we're done (no tool calls)
    const toolUses = response.content.filter(block => block.type === 'tool_use');
    if (toolUses.length === 0) {
      // Agent finished
      const textBlocks = response.content.filter(block => block.type === 'text');
      return {
        success: true,
        finalMessage: textBlocks.map(b => b.text).join('\n'),
        turns: turnCount
      };
    }
    
    // Execute tools and build tool results
    const toolResults = [];
    for (const toolUse of toolUses) {
      log(`Executing tool: ${toolUse.name}`);
      const result = executeTool(toolUse.name, toolUse.input, workspace);
      
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      });
    }
    
    // Add tool results to messages
    messages.push({
      role: 'user',
      content: toolResults
    });
  }
  
  return {
    success: false,
    error: 'Max turns reached',
    turns: turnCount
  };
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
      exec(workflowConfig.hooks.after_create, { cwd: workspace });
    }
    
    // Build prompt
    const prompt = buildPrompt(promptTemplate, issue);
    
    // Run agent
    log(`Running agent for issue #${issueNumber}...`);
    const result = await runAgent(prompt, workspace, workflowConfig.agent?.max_turns || 30);
    
    if (result.success) {
      log(`Issue #${issueNumber} completed in ${result.turns} turns`, 'success');
      log(`Final message: ${result.finalMessage.substring(0, 200)}...`);
      updateLabel(issueNumber, CONFIG.labels.inProgress, CONFIG.labels.done);
    } else {
      log(`Issue #${issueNumber} failed: ${result.error}`, 'error');
    }
    
  } catch (error) {
    log(`Issue #${issueNumber} error: ${error.message}`, 'error');
    console.error(error.stack);
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
  
  if (!process.env.ANTHROPIC_API_KEY) {
    log('Error: ANTHROPIC_API_KEY not set', 'error');
    process.exit(1);
  }
  
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
  
  log('Symphony-Anthropic starting...');
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
