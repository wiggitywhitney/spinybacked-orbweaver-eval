# Evaluation Run-9 Summary

**Target repo**: commit-story-v2 proper (not the eval copy)
**Branch**: `spiny-orb/instrument-1774115750647`
**Started**: 2026-03-21T17:55:50.647Z
**Completed**: 2026-03-21T18:39:34.530Z
**Duration**: 43.7 minutes (2623.9s)
**Spiny-orb version**: 0.1.0 (e6f87f0)

## Results

| Metric | Run-9 | Run-8 | Delta |
|--------|-------|-------|-------|
| Files processed | 29 | 29 | — |
| Committed | 12 | 12 | — |
| Partial | 1 | 1 | — |
| Failed | 0 | 0 | — |
| Correct skips | 16 | 16 | — |
| Input tokens | 63.7K | — | — |
| Output tokens | 180.2K | — | — |
| Cached tokens | 274.0K | — | — |
| Push succeeded | **NO (7th consecutive)** | NO (6th) | — |
| PR created | NO | NO | — |

## Committed Files (12 files)

| # | File | Spans | Output Tokens |
|---|------|-------|---------------|
| 1 | src/collectors/claude-collector.js | 1 | 5.0K |
| 2 | src/collectors/git-collector.js | 2 | 3.9K |
| 3 | src/commands/summarize.js | 3 | 8.4K |
| 4 | src/generators/summary-graph.js | 3 | 15.0K |
| 5 | src/index.js | 1 | 9.4K |
| 6 | src/integrators/context-integrator.js | 1 | 4.5K |
| 7 | src/managers/auto-summarize.js | 3 | 6.2K |
| 8 | src/managers/journal-manager.js | 2 | 7.2K |
| 9 | src/managers/summary-manager.js | 3 | 10.0K |
| 10 | src/mcp/server.js | 1 | 2.7K |
| 11 | src/utils/journal-paths.js | 1 | 3.0K |
| 12 | src/utils/summary-detector.js | 5 | 9.9K |
| **Total** | | **26** | **85.2K** |

## Partial File (1 file)

| File | Spans | Attempts | Output Tokens | Failure |
|------|-------|----------|---------------|---------|
| src/generators/journal-graph.js | 1 | 2 | 91.4K | SCH-001: reassembly validator rejected extension span name `commit_story.journal.generate_sections` as "not found in registry span definitions" |

**Cost guard working**: Limited to 2 attempts (vs 3 in run-8). But 91.4K tokens for zero committed value (50.7% of total output tokens).

## Correct Skips (16 files)

All correctly skipped — sync-only files with no async I/O:

| File | Reason |
|------|--------|
| generators/prompts/guidelines/accessibility.js | String constant export |
| generators/prompts/guidelines/anti-hallucination.js | String constant export |
| generators/prompts/guidelines/index.js | Sync function |
| generators/prompts/sections/daily-summary-prompt.js | Sync function |
| generators/prompts/sections/dialogue-prompt.js | String constant export |
| generators/prompts/sections/monthly-summary-prompt.js | Sync function |
| generators/prompts/sections/summary-prompt.js | Sync function |
| generators/prompts/sections/technical-decisions-prompt.js | String constant export |
| generators/prompts/sections/weekly-summary-prompt.js | Sync function |
| integrators/filters/message-filter.js | Sync functions |
| integrators/filters/sensitive-filter.js | Sync functions |
| integrators/filters/token-filter.js | Sync functions |
| mcp/tools/context-capture-tool.js | Sync function |
| mcp/tools/reflection-tool.js | Sync function |
| utils/commit-analyzer.js | Sync functions |
| utils/config.js | Module-level validation only |

Note: `src/instrumentation.js` was not processed by spiny-orb (29 files processed, not 30). Spiny-orb appears to have excluded it — likely recognized as OTel bootstrap code.

## Push Failure Analysis

**Error**: `remote: Invalid username or token. Password authentication is not supported for Git operations.`

The error shows the bare `https://github.com/wiggitywhitney/commit-story-v2.git/` URL — the token-embedded URL swap (PR #272) did not fire. Despite pre-run verification confirming `git ls-remote` works with the `x-access-token` URL, the `pushBranch()` function's URL swap path was not reached in production.

Possible causes:
1. The `resolveAuthenticatedUrl()` function returned the same URL (no swap needed/detected)
2. The GITHUB_TOKEN env var was not visible inside the spiny-orb process
3. A race condition or error in the URL detection logic

This is a **critical finding** for run-10 — 7 consecutive push failures.

## File Comparison with Run-8

| File | Run-8 | Run-9 | Change |
|------|-------|-------|--------|
| claude-collector.js | committed | committed | — |
| git-collector.js | committed | committed | — |
| summarize.js | committed | committed | — |
| journal-graph.js | partial | partial | — |
| summary-graph.js | committed | committed | — |
| index.js | committed | committed | — |
| context-integrator.js | committed | committed | — |
| auto-summarize.js | committed | committed | — |
| journal-manager.js | committed | committed | — |
| summary-manager.js | committed | committed | — |
| server.js | committed | committed | — |
| journal-paths.js | committed | committed | — |
| summary-detector.js | committed | committed | — |
| 16 correct skips | correct | correct | — |

**Identical file outcomes to run-8.** No regressions, no new files recovered.
