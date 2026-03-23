# Run-10 Summary

## Execution Details

- **Started**: 2026-03-23T06:33:44.090Z
- **Completed**: 2026-03-23T07:19:39.597Z
- **Duration**: 2755.5s (45.9 minutes)
- **Target repo**: commit-story-v2 proper
- **Branch**: `spiny-orb/instrument-1774247624091`
- **spiny-orb version**: v0.1.0 (75dcea6)

## Token Usage

- **Input**: 131.2K tokens
- **Output**: 175.8K tokens
- **Cached**: 422.2K tokens

## File Tally

| Category | Count |
|----------|-------|
| Processed | 30 |
| Committed | 12 |
| Failed | 1 (summary-manager.js — Weaver CLI) |
| Partial | 0 |
| Correct skips | 17 |

## Committed Files (12)

| # | File | Spans | Tokens | Attempts |
|---|------|-------|--------|----------|
| 1 | claude-collector.js | 1 | 4.5K | 1 |
| 2 | git-collector.js | 2 | 4.1K | 1 |
| 3 | summarize.js | 3 | 8.1K | 1 |
| 4 | journal-graph.js | 2 | 76.3K | 3 |
| 5 | summary-graph.js | 6 | 14.9K | 1 |
| 6 | index.js | 1 | 8.3K | 1 |
| 7 | context-integrator.js | 1 | 7.1K | 2 |
| 8 | auto-summarize.js | 3 | 4.9K | 1 |
| 9 | journal-manager.js | 2 | 7.7K | 1 |
| 10 | server.js | 1 | 8.5K | 3 |
| 11 | journal-paths.js | 1 | 3.2K | 1 |
| 12 | summary-detector.js | 5 | 13.3K | 2 |

**Total spans on branch**: 28

## Failed File

| File | Reason |
|------|--------|
| summary-manager.js | Schema extension write failed — Weaver CLI `weaver registry resolve` failed mid-execution. Likely caused by laptop sleep interruption. Instrumentation code was generated (3 spans) but extensions couldn't be written. |

## Correct Skips (17)

All prompt/guideline files, filter files, MCP tool files, utility files, config, commit-analyzer, traceloop-init.

## Push Auth Result

**FAILED (8th consecutive)** — but new diagnostic data:
- `GITHUB_TOKEN present=true` — token IS in environment
- `urlChanged=true, path=token-swap` — URL swap DID fire (first time!)
- Error: `"Password authentication is not supported for Git operations"`

**Analysis**: The URL swap fix (PRs #261, #272, #277) is now working — the token is being embedded in the URL. But GitHub is rejecting the authentication. Possible causes:
1. Token lacks `repo` scope (may only have read access)
2. Token is a classic PAT and GitHub requires fine-grained token
3. Token format incompatible with x-access-token URL scheme

## PR Summary

- Committed on instrument branch (RUN9-7 fix confirmed)
- Saved to `spiny-orb-pr-summary.md`

## Comparison to Run-9

| Metric | Run-9 | Run-10 | Delta |
|--------|-------|--------|-------|
| Files committed | 12 | 12 | 0 (different composition) |
| Failed | 0 | 1 | +1 (Weaver CLI, transient) |
| Partial | 1 | 0 | -1 (journal-graph.js fixed!) |
| Duration | 43.7m | 45.9m | +2.2m |
| Output tokens | 180.2K | 175.8K | -4.4K |
| Push auth | Failed | Failed | Still broken (different error) |

### File Composition Change
- **Gained**: journal-graph.js (partial → committed) — reassembly validator fix worked
- **Lost**: summary-manager.js (committed → failed) — transient Weaver CLI issue
- **Net**: 0 change in count, but journal-graph.js recovery is a genuine improvement
