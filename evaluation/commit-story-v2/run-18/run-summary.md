# Run Summary — Run-18

**Date**: 2026-05-16
**Started**: 2026-05-16T12:01:31.597Z
**Duration**: 1h 43m 32.9s
**Branch**: spiny-orb/instrument-1778932891597
**Spiny-orb build**: 1.0.0 (SHA 1c53ffd, main branch)
**Target repo**: commit-story-v2 main
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/70

---

## Results

| Metric | Value |
|--------|-------|
| Files processed | 30 |
| Committed | 11 |
| Failed | 4 |
| Partial | 0 |
| Correct skips | 15 |
| Skipped | 0 |
| Input tokens | 345.9K |
| Output tokens | 375.9K (360.5K cached) |
| Total cost | $9.16 |
| Live-check | OK (575 spans, 3848 advisory findings — partial: 4 failed files missing) |
| Push | MANUAL — spiny-orb auto-push failed (pre-push hook returned non-zero); manual token push succeeded |
| PR created | YES — #70 (manual) |

---

## Committed Files (11)

| # | File | Spans | Attempts | Cost |
|---|------|-------|----------|------|
| 1 | collectors/claude-collector.js | 1 | 2 | $0.29 |
| 2 | collectors/git-collector.js | 2 | 3 | $0.80 |
| 3 | generators/journal-graph.js | 4 | 2 | $1.67 |
| 4 | integrators/context-integrator.js | 1 | 3 | $0.89 |
| 5 | managers/auto-summarize.js | 3 | 2 | $0.40 |
| 6 | managers/journal-manager.js | 2 | 2 | $0.66 |
| 7 | managers/summary-manager.js | 9 | 2 | $0.74 |
| 8 | mcp/server.js | 1 | 1 | $0.05 |
| 9 | commands/summarize.js | 3 | 3 | $1.10 |
| 10 | utils/journal-paths.js | 1 | 1 | $0.18 |
| 11 | utils/summary-detector.js | 9 | 1 | $0.29 |

**Total spans (committed)**: 36

---

## Failed Files (4)

| File | Attempts | Cost | Failure |
|------|----------|------|---------|
| generators/summary-graph.js | 2 | $1.00 | NDS-003: original line 485 missing/modified: `}),` — multi-line closing brace in nested callback |
| mcp/tools/context-capture-tool.js | 3 | $0.24 | NDS-003 oscillation: lines 124–125 (×2 consecutive) — `server.tool()` callback re-indentation |
| mcp/tools/reflection-tool.js | 3 | $0.23 | NDS-003 oscillation: lines 116–117 (×2 consecutive) — `server.tool()` callback re-indentation |
| src/index.js | 2 | $0.61 | NDS-003: original line 217 missing/modified: `);` — multi-line subcommandArgs push collapsed |

All four failures share the same root cause: NDS-003 reconciler offset calculation breaks when `startActiveSpan` wrapping re-indents lines inside nested callbacks (RUN17-1, unresolved).

---

## Correct Skips (15)

All sync-only, constant-export, or pure-template files:

1. generators/prompts/guidelines/accessibility.js
2. generators/prompts/guidelines/anti-hallucination.js
3. generators/prompts/guidelines/index.js
4. generators/prompts/sections/daily-summary-prompt.js
5. generators/prompts/sections/dialogue-prompt.js
6. generators/prompts/sections/monthly-summary-prompt.js
7. generators/prompts/sections/summary-prompt.js
8. generators/prompts/sections/technical-decisions-prompt.js
9. generators/prompts/sections/weekly-summary-prompt.js
10. integrators/filters/message-filter.js
11. integrators/filters/sensitive-filter.js
12. integrators/filters/token-filter.js
13. traceloop-init.js
14. utils/commit-analyzer.js
15. utils/config.js

---

## Run-17 → Run-18 Comparison

| Metric | Run-17 | Run-18 | Delta |
|--------|--------|--------|-------|
| Committed | 10+1p | 11 | +1 (net) |
| Failed | 4 | 4 | — |
| Partial | 1 | 0 | -1 |
| Total spans (committed) | ~28 | 36 | +8 |
| Cost | $10.43 | $9.16 | -$1.27 |
| Duration | ~55 min | 103 min | +48 min |
| Push/PR | YES (#69) | YES (#70, manual) | Ninth consecutive |
| journal-graph.js | FAILED | SUCCESS (4 spans) | RUN17-2 resolved ✅ |
| git-collector.js spans | 1 | 2 | RUN17-3 resolved ✅ (getCommitData added) |
| summary-manager.js spans | 0 (skipped) | 9 | RUN17-1 partial ✅ (generate functions now detected) |
| context-capture-tool.js | FAILED | FAILED | RUN17-1 persists ❌ |
| reflection-tool.js | FAILED | FAILED | RUN17-1 persists ❌ |
| index.js | FAILED | FAILED | RUN17-1 persists ❌ |

---

## Notable Observations

1. **journal-graph.js committed** — Full success at 4 spans, 2 attempts. This was a full failure in run-17 (RUN17-2 content corruption + thinking budget). Resolved without any code change — the 65% thinking budget cap turned out to be sufficient this time, or the 2nd attempt succeeded on a different code path.

2. **summary-manager.js: 9 spans committed** — The 3 `generateAndSave*` functions are now detected and instrumented. In run-17 these were silently dropped because each has only 2 statements (below the MIN_STATEMENTS threshold). The issue #855 fix (`isWorthInstrumenting` bypass for exported async functions) resolved this directly.

3. **git-collector.js: 2 spans** — `getCommitData` now has a span (was missing in run-17). Same issue #855 fix.

4. **RUN17-1 persists for 3 of 4 blocked files** — context-capture-tool.js, reflection-tool.js, and index.js all fail with identical NDS-003 offset errors. The `server.tool()` callback re-indentation pattern (lines shifted when `startActiveSpan` wraps the body) is unchanged. PRD #845 content-aware diff remains the required fix.

5. **summary-graph.js still failing** — NDS-003 on closing brace of nested callback (line 485 `}),`). Different file structure from the MCP tools but same reconciler gap.

6. **Duration increased significantly** — 103 min vs ~55 min in run-17. journal-graph.js and context-integrator.js took longest (both needed multiple attempts). No budget exhaustion detected.

7. **Auto-push failed — root cause identified** — The `progress-md-pr.sh` pre-push hook in commit-story-v2 ran, created a new PROGRESS.md commit on the instrument branch, then printed "Push again to include it" and exited non-zero. spiny-orb doesn't retry after a hook-created commit, so git returned `exit status 1` and spiny-orb gave up. Manual token push succeeded (picked up the PROGRESS.md commit). This is a spiny-orb issue: any target repo with a hook that creates commits mid-push will trigger this failure. Tests (565/565) and security check both passed.

8. **Live-check: 575 spans, 3848 advisory findings** — Partial (4 failed files missing spans). Advisory finding count is high; will require per-file advisory pass analysis.
