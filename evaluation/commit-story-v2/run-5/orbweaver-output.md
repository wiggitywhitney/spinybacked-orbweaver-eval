# Orbweaver Instrument Output — Run-5

## Run Metadata

- **Start time**: 2026-03-17T00:14:59Z (2026-03-16 19:14:59 CDT)
- **End time**: Indeterminate (ran overnight; completed before 2026-03-17T10:14:23Z)
- **Orbweaver version**: 0.1.0
- **Binary path**: /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver/bin/orbweaver.js
- **Command**: `env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver/bin/orbweaver.js instrument src/ --verbose -y`
- **Branch created**: orbweaver/instrument-1773706515431
- **Exit code**: 1 (push failed)

## Summary

- **Files processed**: 29
- **Succeeded**: 21 (9 instrumented + 12 correctly skipped)
- **Failed**: 2 (summarize.js, index.js)
- **Partial**: 6 (not committed to branch)
- **Skipped**: 0

## Per-File Results

| # | File | Outcome | Spans | Notes |
|---|------|---------|-------|-------|
| 1 | src/collectors/claude-collector.js | success | 1 | — |
| 2 | src/collectors/git-collector.js | success | 3 | — |
| 3 | src/commands/summarize.js | **failed** | 0 | COV-003 x4, SCH-002 x18 |
| 4 | src/generators/journal-graph.js | **partial** | 1 | 1/1 functions |
| 5 | src/generators/prompts/guidelines/accessibility.js | success | 0 | correct skip |
| 6 | src/generators/prompts/guidelines/anti-hallucination.js | success | 0 | correct skip |
| 7 | src/generators/prompts/guidelines/index.js | success | 0 | correct skip |
| 8 | src/generators/prompts/sections/daily-summary-prompt.js | success | 0 | correct skip |
| 9 | src/generators/prompts/sections/dialogue-prompt.js | success | 0 | correct skip |
| 10 | src/generators/prompts/sections/monthly-summary-prompt.js | success | 0 | correct skip |
| 11 | src/generators/prompts/sections/summary-prompt.js | success | 0 | correct skip |
| 12 | src/generators/prompts/sections/technical-decisions-prompt.js | success | 0 | correct skip |
| 13 | src/generators/prompts/sections/weekly-summary-prompt.js | success | 0 | correct skip |
| 14 | src/generators/summary-graph.js | **partial** | 5 | 11/12 functions |
| 15 | src/index.js | **failed** | 0 | Oscillation: SCH-002 9→12 |
| 16 | src/integrators/context-integrator.js | success | 1 | — |
| 17 | src/integrators/filters/message-filter.js | success | 0 | correct skip |
| 18 | src/integrators/filters/sensitive-filter.js | **partial** | 0 | 2/3 functions |
| 19 | src/integrators/filters/token-filter.js | success | 0 | correct skip |
| 20 | src/managers/auto-summarize.js | success | 3 | — |
| 21 | src/managers/journal-manager.js | **partial** | 1 | 2/3 functions |
| 22 | src/managers/summary-manager.js | **partial** | 4 | 9/14 functions |
| 23 | src/mcp/server.js | success | 1 | — |
| 24 | src/mcp/tools/context-capture-tool.js | success | 2 | — |
| 25 | src/mcp/tools/reflection-tool.js | success | 2 | — |
| 26 | src/utils/commit-analyzer.js | success | 3 | — |
| 27 | src/utils/config.js | success | 0 | correct skip |
| 28 | src/utils/journal-paths.js | success | 1 | — |
| 29 | src/utils/summary-detector.js | **partial** | 4 | 4/5 functions |

## Files on Branch (git diff main...orbweaver/instrument-1773706515431)

```
 package-lock.json                     | 351
 package.json                          |  12
 semconv/agent-extensions.yaml         |  63
 src/collectors/claude-collector.js    |  98
 src/collectors/git-collector.js       | 104
 src/integrators/context-integrator.js | 184
 src/managers/auto-summarize.js        | 293
 src/mcp/server.js                     |  23
 src/mcp/tools/context-capture-tool.js |  77
 src/mcp/tools/reflection-tool.js      |  77
 src/utils/commit-analyzer.js          | 143
 src/utils/journal-paths.js            |  18
 12 files changed, 1048 insertions(+), 395 deletions(-)
```

**Verification**: 9 instrumented source files + package.json + package-lock.json + agent-extensions.yaml = 12 total files. All 6 partial files and 2 failed files correctly absent from branch.

## Schema Evolution

**Status**: WORKING (major improvement from run-4)

`semconv/agent-extensions.yaml` created with 14 agent-discovered attributes, all using correct `commit_story.*` namespace:
- commit_story.context.collect_chat_messages
- commit_story.context.gather_context_for_commit
- commit_story.git.collect_commit_data
- commit_story.git.get_changed_files
- commit_story.git.get_commit_metadata
- commit_story.git.get_previous_commit_time
- commit_story.git.is_merge_commit
- commit_story.git.run
- commit_story.journal.ensure_directory
- commit_story.mcp.capture_context
- commit_story.mcp.journal_add_reflection
- commit_story.mcp.save_context
- commit_story.mcp.save_reflection
- commit_story.mcp.server

## Run-Level Issues

1. **Push failed** (persistent — 3rd consecutive run): `remote: Invalid username or token. Password authentication is not supported for Git operations.` The orbweaver tool attempted HTTPS push which requires token-based auth, but the token didn't work or wasn't configured for the tool's git context.
2. **No PR created** — consequence of push failure. PR summary saved to `orbweaver-pr-summary.md`.
3. **Summary tally discrepancy**: stdout says "21 succeeded, 2 failed, 0 skipped" (23/29), omitting 6 partial files. The PR summary correctly reports all three categories.
4. **SDK init file pattern mismatch**: "SDK init file does not match recognized NodeSDK pattern. Instrumentation config written to orbweaver-instrumentations.js." Fallback instrumentations file generated.
5. **Run duration**: Significantly longer than run-4 (~80 min) — the validation/retry loop adds multiple LLM calls per file.

## Dependencies Installed

- @opentelemetry/api
- @traceloop/instrumentation-langchain
- @traceloop/instrumentation-mcp

## Artifacts

- Branch: `orbweaver/instrument-1773706515431`
- PR summary: `evaluation/run-5/orbweaver-pr-summary.md`
- Partial diffs: `evaluation/run-5/partial-diffs/*.diff` (5 files)
- Full output: this file
