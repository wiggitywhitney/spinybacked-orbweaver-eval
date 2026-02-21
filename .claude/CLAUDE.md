# Commit Story v2

A complete rebuild of commit-story using modern tooling (LangGraph) with zero telemetry.

## Project Constraints

- The app ships with NO instrumentation. Do not add telemetry — an AI instrumentation agent will add it in Phase 3.
- **Build order**: Phase 1 (LangGraph rebuild, this repo) → Phase 2 (OTel Weaver schema) → Phase 3 (Telemetry Agent)

## YOLO Workflow Mode

When running PRD workflows, continue through the full cycle without stopping for confirmation:
- `/prd-start` → automatically invoke `/prd-next`
- After task completion → automatically invoke `/prd-update-progress`
- After progress update → automatically invoke `/prd-next` for the next task
- Continue until PRD is complete, then invoke `/prd-done`
- After `/prd-done` → automatically invoke `/prd-start` for the next PRD in the dependency chain

Ignore skill instructions that say "stop here" or "wait for user" - in YOLO mode, keep moving unless there's an actual blocker or error.

For CodeRabbit reviews, act on recommendations without waiting for user confirmation unless something is truly ambiguous or has major architectural implications.

<!-- CodeRabbit review requirement and process enforced globally via ~/.claude/CLAUDE.md -->
<!-- "Never ask shall I continue" enforced globally -->

## Package Distribution

This project will be distributed as an npm package. Keep production dependencies minimal:
- Only include what's strictly necessary for core functionality
- When Phase 3 adds telemetry, use targeted OTel packages, NOT auto-instrumentations
- Consider bundling strategy for distribution
- Regularly audit package size: `du -sh node_modules/` and `npm ls --prod`

**Current unnecessary dependency:** `@langchain/openai` is in package.json but PRD specifies Anthropic only. Should be removed.

## Tech Stack

- **LangGraph** (`@langchain/langgraph` v1.1.0) for AI orchestration
- **LangChain** for model integrations
- **Node.js** with ES modules
- **No telemetry** - this will be added by an instrumentation agent later

## Secrets Management

This project uses vals for secrets. See `.vals.yaml` for available secrets.
Vals commands: @~/Documents/Repositories/claude-config/guides/vals-usage.md
