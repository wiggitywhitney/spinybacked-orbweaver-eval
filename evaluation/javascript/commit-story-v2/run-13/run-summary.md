# Run Summary — Run-13

**Date**: 2026-04-12
**Started**: 2026-04-12T17:20:09.398Z
**Completed**: 2026-04-12T18:25:50Z
**Duration**: 1h 5m 40.7s
**Branch**: spiny-orb/instrument-1776014409398
**Spiny-orb build**: feature/prd-372-typescript-provider (f6d482f)
**Target repo**: commit-story-v2 proper
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/62

---

## Results

| Metric | Value |
|--------|-------|
| Files processed | 30 |
| Committed | 7 |
| Partial | 1 |
| Failed | 11 |
| Correct skips | 11 |
| Total tokens (input) | 273.2K |
| Total tokens (output) | 272.0K |
| Cached tokens | 800.4K |
| Estimated cost | ~$6.41 |
| Live-check | PARTIAL (11 files failed) |
| Push/PR | YES (PR #62) |

---

## Committed Files (7)

| File | Spans | Attempts | Cost |
|------|-------|----------|------|
| src/collectors/claude-collector.js | 1 | 1 | $0.13 |
| src/collectors/git-collector.js | 2 | 1 | $0.13 |
| src/commands/summarize.js | 3 | 1 | $0.20 |
| src/integrators/context-integrator.js | 1 | 1 | $0.14 |
| src/managers/auto-summarize.js | 3 | 1 | $0.16 |
| src/utils/journal-paths.js | 1 | 3 | $0.32 |
| src/utils/summary-detector.js | 5 | 2 | $0.41 |

## Partial (1)

| File | Functions | Skipped | Attempts | Cost | Root cause |
|------|-----------|---------|----------|------|------------|
| src/generators/journal-graph.js | 11/12 | summaryNode | 3 | $1.54 | NDS-003 (Code Preserved): agent modifies original line 27 |

## Failed (11)

| File | Root cause |
|------|------------|
| src/generators/prompts/guidelines/accessibility.js | API 400 error ("Not Found") |
| src/generators/prompts/sections/summary-prompt.js | Rolled back: checkpoint failure at file 15/30 |
| src/generators/prompts/sections/technical-decisions-prompt.js | Rolled back: checkpoint failure at file 15/30 |
| src/generators/prompts/sections/weekly-summary-prompt.js | Rolled back: checkpoint failure at file 15/30 |
| src/generators/summary-graph.js | Rolled back: checkpoint failure at file 15/30 |
| src/index.js | Rolled back: checkpoint failure at file 15/30 |
| src/managers/journal-manager.js | Rolled back: checkpoint failure at file 25/30 |
| src/managers/summary-manager.js | Rolled back: checkpoint failure at file 25/30 |
| src/mcp/server.js | Rolled back: checkpoint failure at file 25/30 |
| src/mcp/tools/context-capture-tool.js | Rolled back: checkpoint failure at file 25/30 |
| src/mcp/tools/reflection-tool.js | Rolled back: checkpoint failure at file 25/30 |

## Correct Skips (11)

src/generators/prompts/guidelines/anti-hallucination.js, src/generators/prompts/guidelines/index.js, src/generators/prompts/sections/daily-summary-prompt.js, src/generators/prompts/sections/dialogue-prompt.js, src/generators/prompts/sections/monthly-summary-prompt.js, src/integrators/filters/message-filter.js, src/integrators/filters/sensitive-filter.js, src/integrators/filters/token-filter.js, src/traceloop-init.js, src/utils/commit-analyzer.js, src/utils/config.js

---

## Checkpoint Failures

### Checkpoint 1 — File 15/30 (index.js), rolled back 5 files

**Root cause**: `summary-graph.js` instrumentation called `.length` on `weeklySummaries`/`dailySummaries` inside an `!== undefined` guard, but tests pass `null`. `null !== undefined` is true, so the guard didn't catch it.

```text
TypeError: Cannot read properties of null (reading 'length')
  at src/generators/summary-graph.js:401 — dailySummaries.length
  at src/generators/summary-graph.js:623 — weeklySummaries.length
```

**Tests failed**: `weeklySummaryNode > returns early for null daily summaries`, `monthlySummaryNode > returns early for null weekly summaries`

### Checkpoint 2 — File 25/30 (reflection-tool.js), rolled back 5 files

**Root cause**: `journal-manager.js` instrumentation called `commit.timestamp.split('T')[0]` to extract date portion, but tests provide `commit.timestamp` as a `Date` object, not a string.

```text
TypeError: commit.timestamp.split is not a function
  at src/managers/journal-manager.js:188
```

**Tests failed**: 5 `saveJournalEntry` tests in journal-manager.test.js

---

## Comparison with Run-12

| Metric | Run-12 | Run-13 | Delta |
|--------|--------|--------|-------|
| Committed | 12 | 7 | -5 |
| Failed | 0 | 11 | +11 |
| Partial | 1 | 1 | 0 |
| Correct skips | 11 | 11 | 0 |
| Cost | $5.19 | ~$6.41 | +$1.22 |
| Duration | 53.8 min | 65.7 min | +11.9 min |
| Push/PR | YES (#61) | YES (#62) | — |
| Checkpoint failures | 0 | 2 | +2 |

---

## Notes

- Run-13 is the first run on `feature/prd-372-typescript-provider` branch (TypeScript provider in progress)
- Checkpoint mechanism is functioning correctly — it caught real instrumentation bugs that would have broken the test suite
- The two checkpoint failures represent new failure modes not seen in prior runs: null vs undefined type confusion, and Date-vs-string timestamp assumptions
- summaryNode in journal-graph.js continues to fail NDS-003 (Code Preserved) — unrelated to the truthy-check fix; the agent is modifying original code structure
- summary-manager.js (partial) this run skipped saveWeeklySummary due to NDS-003 oscillation — different from run-12's partial (API overload)
