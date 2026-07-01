# Run-17 Summary — commit-story-v2

**Date**: 2026-05-12
**spiny-orb version**: 1.0.0 (SHA c60f79d, main branch)
**Branch**: spiny-orb/instrument-1778585670273
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/69 (auto-created)
**Elapsed**: 1h 51m 8.1s
**Cost**: $10.43 (ceiling $70.20)
**Tokens**: 377.2K input, 415.0K output (605.0K cached)

---

## Results

| Metric | Run-17 | Run-16 | Delta |
|--------|--------|--------|-------|
| Files processed | 30 | 30 | — |
| Committed | 10 | 10+3p | — |
| Failed | 4 | 3 | +1 |
| Partial | 1 | 3p | — |
| Correct skips | 15 | 15 | — |
| Spans (live-check) | 493 | 543 | -50 |
| Cost | $10.43 | $12.29 | -$1.86 |
| Push/PR | YES (#69) | YES (#68) | 7th consecutive |
| Live-check | OK (3660 advisories) | OK (3615 advisories) | — |
| Exit status | 1 (failures) | 1 (failures) | — |

---

## Committed Files (10)

| File | Spans | Notes |
|------|-------|-------|
| src/collectors/claude-collector.js | 1 | 2 attempts |
| src/collectors/git-collector.js | 1 | 3 attempts |
| src/generators/summary-graph.js | ~6 | |
| src/integrators/context-integrator.js | 1 | |
| src/integrators/filters/token-filter.js | 0 | function-level fallback, sync utilities |
| src/managers/journal-manager.js | 2 | function-level fallback (3/3) |
| src/commands/summarize.js | 3 | function-level fallback (7/7) |
| src/utils/summary-detector.js | 9 | |
| src/managers/auto-summarize.js | 3 | 2 attempts |
| src/utils/commit-analyzer.js | 0 | RUN16-3 fix: 0-span passthrough, original returned unchanged ✅ |

---

## Failed Files (4)

### journal-graph.js — ❌ FAILED (49 NDS-003, 2 attempts)
**Regression from run-16** (was partial in runs 14-16). Agent collapsed multi-line expressions throughout the entire file. 49 violations across lines 72, 228-230, 290, 401-404, 412-428 and more. Whole-file NDS-003 failure, not just technicalNode.

### context-capture-tool.js — ❌ FAILED (NDS-003 oscillation, lines 124-125, 3 attempts)
**Changed failure mode from run-16** (was null parsed_output / token exhaustion). RUN16-1 fix resolved the token budget issue — structured output was produced — but the agent introduced NDS-003 violations it could not resolve across 3 attempts. Token exhaustion → NDS-003 oscillation.

### reflection-tool.js — ❌ FAILED (NDS-003 oscillation, lines 116-117, 3 attempts)
Same as context-capture-tool.js. Changed failure mode: token exhaustion → NDS-003 oscillation.

### index.js — ❌ FAILED (2 NDS-003, line 217, 3 attempts)
**New failure in run-17** (was committed in previous runs). Agent collapsed multi-line import statements and filter chains. Agent thinking block shows extensive effort to locate the problem but produced NDS-003 violations it couldn't resolve. Surprise regression.

---

## Partial Files (1)

### summary-manager.js — ⚠️ PARTIAL (6 spans, 3 functions skipped)
11/14 functions instrumented. Skipped:
- generateAndSaveDailySummary: NDS-003 oscillation (lines 13-17)
- generateAndSaveWeeklySummary: NDS-003 (line 13 — function declaration itself)
- generateAndSaveMonthlySummary: NDS-003 (line 13 — function declaration itself)

RUN16-1 fix partially worked: these functions now produce structured output (no token exhaustion). But NDS-003 violations on the multi-line `export async function` declaration prevent them from committing.

---

## Fix Verification

| Fix | Result |
|-----|--------|
| RUN16-1 (token budget exhaustion) | **Partial** — no more null parsed_output; context-capture-tool.js and reflection-tool.js produce output but fail NDS-003 instead |
| RUN16-3 (0-span passthrough) | **CONFIRMED** ✅ — commit-analyzer.js returned original file unchanged |
| RUN16-2 (live-check stdout) | **CONFIRMED** ✅ — no JSON flood to terminal |

---

## Dominant Pattern: NDS-003 Multi-Line Collapsing

All 4 failures and the summary-manager.js partial are driven by NDS-003 (multi-line expression collapsing). The agent joins multi-line import statements, function signatures, object arguments, and method chains onto single lines. This is a run-17-wide pattern, not isolated to specific files. journal-graph.js and index.js were previously committed; both regressed to failure this run.

Run-17 NDS-003 failure count by file:
- journal-graph.js: 49 violations
- context-capture-tool.js: 2 (oscillation)
- reflection-tool.js: 2 (oscillation)
- index.js: 2 violations
- summary-manager.js: 3 functions skipped (NDS-003)

---

## Attempt Count Distribution (D-1 tracking)

| Attempts | Files |
|----------|-------|
| 1 | ~16 (prompt files via pre-scan skip, most direct successes) |
| 2 | claude-collector.js, summary-manager.js, auto-summarize.js, summary-graph.js |
| 3 | git-collector.js, context-capture-tool.js, reflection-tool.js, commit-analyzer.js, index.js |

---

## Cost vs Run-16

Run-17: $10.43 (-$1.86 vs run-16's $12.29). Improvement attributed to:
- No token-exhaustion failures consuming max budget with no output
- BUT: 4 full failures still consumed tokens on failed attempts
- journal-graph.js: 2 full attempts × 36K tokens = significant waste

Cost ceiling $70.20 vs actual $10.43 — 14.8% of ceiling utilized.
