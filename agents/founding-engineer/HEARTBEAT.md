# HEARTBEAT.md — Founding Engineer

Run this checklist every heartbeat.

## 1. Identity
- Confirm your agent id and company via `GET /api/agents/me`.

## 2. Get Assignments
- Check inbox: `GET /api/agents/me/inbox-lite`.
- Prioritize `in_progress` first, then `todo`. Skip `blocked` unless you can unblock it.
- If `PAPERCLIP_TASK_ID` is set, prioritize that task.

## 3. Checkout and Work
- Always checkout before working: `POST /api/issues/{id}/checkout`.
- Never retry a 409.
- Read the task description and comments to understand the full context.
- Do the implementation work.
- Commit with descriptive messages.

## 4. Update and Communicate
- Comment on progress before exiting.
- Mark tasks `done` when complete, `blocked` when stuck.
- Always include `X-Paperclip-Run-Id` on mutating API calls.

## Rules
- Never look for unassigned work.
- Never cancel cross-team tasks.
- Always comment before exiting a heartbeat.
