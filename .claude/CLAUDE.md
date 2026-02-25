# Commit Story v2 — Evaluation Target

Evaluation copy of commit-story-v2 for telemetry agent instrumentation research. The telemetry agent will instrument this codebase, and the results will be scored against an evaluation rubric.

## Project Constraints

- This is an evaluation target, not the canonical commit-story-v2 (which is reserved for KubeCon demo)
- The telemetry agent will add OpenTelemetry instrumentation to this codebase
- Self-referential: commit-story's git hook runs on every commit, generating journal entries. After instrumentation, commits also produce telemetry data.
- Historical evaluation branches are preserved for progress tracking across runs

## Tech Stack

- **Language**: JavaScript (ES modules)
- **Runtime**: Node.js
- **Framework**: LangGraph (`@langchain/langgraph`) for AI orchestration
- **Test Framework**: Vitest with coverage via @vitest/coverage-v8
- **Schema**: OTel Weaver registry at `telemetry/registry/`

## Development Setup

```bash
npm install
npm test
npm run test:coverage
```

## Testing

- `npm test` — 320 tests, full Vitest suite
- `npm run test:coverage` — with v8 coverage
- Test location: `tests/` directory mirrors `src/` structure

## Secrets Management

This project uses vals for secrets. See `.vals.yaml` for available secrets.
Vals commands: @~/Documents/Repositories/claude-config/guides/vals-usage.md

## Completion Checklist

- Tests pass (`npm test`)
- Coverage not degraded from baseline (83% statements)
