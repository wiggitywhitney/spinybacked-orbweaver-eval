# Run-4 Execution Summary

**Date:** 2026-03-15
**Orbweaver version:** 0.1.0
**Model:** claude-sonnet-4-6
**Branch:** orbweaver/instrument-1773627869602

---

## Timing

- **Start:** 2026-03-15 21:24:28 CDT
- **End:** 2026-03-15 22:44:49 CDT
- **Duration:** ~1 hour 20 minutes

## Cost

| Component | Tokens | Rate | Cost |
|-----------|--------|------|------|
| Input | 272,496 | $3/MTok | $0.82 |
| Output | 309,955 | $15/MTok | $4.65 |
| Cache read | 1,054,412 | $0.30/MTok | $0.32 |
| Cache write | 14,444 | $3.75/MTok | $0.05 |
| **Total** | | | **$5.84** |

**Cost ceiling:** $67.86 (8.6% of ceiling used)

**Note:** The low cost relative to ceiling is a symptom of broken schema evolution (orb issue #1). The prompt was cached identically across all 29 files because the Weaver schema never changed — it should have grown with each file's extensions.

## File Results

| # | File | Status | Spans |
|---|------|--------|-------|
| 1 | collectors/claude-collector.js | success | 1 |
| 2 | collectors/git-collector.js | success | 3 |
| 3 | commands/summarize.js | success | 3 |
| 4 | generators/journal-graph.js | success | 4 |
| 5 | generators/prompts/guidelines/accessibility.js | success | 0 |
| 6 | generators/prompts/guidelines/anti-hallucination.js | success | 0 |
| 7 | generators/prompts/guidelines/index.js | success | 0 |
| 8 | generators/prompts/sections/daily-summary-prompt.js | success | 0 |
| 9 | generators/prompts/sections/dialogue-prompt.js | success | 0 |
| 10 | generators/prompts/sections/monthly-summary-prompt.js | success | 0 |
| 11 | generators/prompts/sections/summary-prompt.js | success | 0 |
| 12 | generators/prompts/sections/technical-decisions-prompt.js | success | 0 |
| 13 | generators/prompts/sections/weekly-summary-prompt.js | success | 0 |
| 14 | generators/summary-graph.js | partial (12/12 fn) | 6 |
| 15 | index.js | success | 2 |
| 16 | integrators/context-integrator.js | success | 1 |
| 17 | integrators/filters/message-filter.js | success | 1 |
| 18 | integrators/filters/sensitive-filter.js | partial (2/3 fn) | 2 |
| 19 | integrators/filters/token-filter.js | success | 3 |
| 20 | managers/auto-summarize.js | success | 3 |
| 21 | managers/journal-manager.js | partial (1/3 fn) | 0 |
| 22 | managers/summary-manager.js | success | 3 |
| 23 | mcp/server.js | success | 1 |
| 24 | mcp/tools/context-capture-tool.js | success | 2 |
| 25 | mcp/tools/reflection-tool.js | success | 2 |
| 26 | utils/commit-analyzer.js | success | 6 |
| 27 | utils/config.js | success | 0 |
| 28 | utils/journal-paths.js | success | 1 |
| 29 | utils/summary-detector.js | success | 5 |

## Tally

- **Files processed:** 29
- **Success:** 26 (including 10 correct 0-span skips)
- **Partial:** 3 (summary-graph.js, sensitive-filter.js, journal-manager.js)
- **Failed:** 0
- **Total spans added:** ~48

## Persistent File Rescue (vs run-2/run-3)

| File | Run-2 | Run-3 | Run-4 | Outcome |
|------|-------|-------|-------|---------|
| journal-graph.js | failed (token budget) | failed (oscillation) | success (4 spans) | **Rescued** |
| context-integrator.js | failed (NDS-003) | failed (NDS-003) | success (1 span) | **Rescued** |
| sensitive-filter.js | failed (null output) | failed (null output) | partial (2/3 fn) | Improved |
| journal-manager.js | failed (NDS-003) | failed (NDS-003 x5) | partial (1/3 fn) | Improved |

**2 of 4 persistent failures fully rescued, 2 improved to partial.**

## PR Status

- **PR created:** No — blocked by 32 test failures
- **Branch pushed:** Yes (pushed manually after run)
- **PR summary saved:** Yes — `orbweaver-pr-summary.md` (106KB)
- **Libraries installed:** @opentelemetry/api, @traceloop/instrumentation-langchain, @traceloop/instrumentation-mcp

## Test Failures

32 tests failed, all with `ReferenceError: tracer is not defined`:
- `summary-graph.js` — 17 failures (tracer used but never imported; function-level fallback path)
- `sensitive-filter.js` — 11 failures (same root cause)
- Downstream: 4 failures in weekly/monthly summary manager tests (call into summary-graph.js)

See orb-issues-to-file.md issues #2, #3, #4 for root cause analysis and fix proposals.

## Schema Evolution

**Not functional.** All schema extensions rejected as "(unparseable)" due to format mismatch between agent output (string IDs) and parser (expects YAML objects). The Weaver schema was identical for all 29 files. See orb-issues-to-file.md issue #1.

## Supplemental Passes

**Not needed.** No files hit the token budget. Function-level instrumentation (orbweaver #106) eliminated the oscillation/budget failures that plagued run-2 and run-3.

## Artifacts

| Artifact | Location |
|----------|----------|
| Raw CLI output | `evaluation/run-4/orb-output.log` |
| PR summary | `orbweaver-pr-summary.md` (project root) |
| Orbweaver branch | `orbweaver/instrument-1773627869602` (local + remote) |
| Pre-run verification | `evaluation/run-4/pre-run-verification.md` |
| Orbweaver issues | `evaluation/run-4/orb-issues-to-file.md` |
| Lessons for PRD #5 | `evaluation/run-4/lessons-for-prd5.md` |
