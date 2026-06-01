# Rubric Scores — Run-20

**Date**: 2026-06-01
**Branch**: spiny-orb/instrument-1780313045724
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/73

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 12 committed files pass `node --check`; mcp/server.js gate not applicable (0 spans committed) |
| NDS-002 (Tests) | Per-run | **PASS** — pre-push hook passed (auto-push succeeded); 565 tests known-passing from run-19 baseline |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — all 12 committed files pass validator; mcp/server.js failure is a spiny-orb false positive (`stripOtelNodes` trivia-loss bug), not a committed violation |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — `@opentelemetry/api` only across all 12 committed files |
| NDS-006 (Module system) | Per-file | **PASS** — no module system changes |

**Gates: 5/5 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 12/12 — no function signatures altered |
| NDS-005 (Error handling preserved) | **PASS** | 12/12 — all original catches preserved; NDS-007 (graceful-degradation) correctly applied throughout |

### Coverage (COV): 4/5 (80%)

| Rule | Result | Evidence |
|------|--------|----------|
| COV-001 (Entry points have spans) | **PASS** | All 12 committed files instrument their exported async entry points; P1 RESOLVED — `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, `generateAndSaveMonthlySummary` (summary-manager.js) and `triggerAutoSummaries` (auto-summarize.js) all committed; mcp/server.js entry point correctly instrumented in agent output (false positive prevented commit) |
| COV-003 (Failable ops have error visibility) | **PASS** | All 12 committed files have outer catch with `recordException` + `SpanStatusCode.ERROR` + rethrow |
| COV-004 (Async ops have spans) | **PASS** | All async functions in committed files instrumented; summary-manager.js commits all 9 spans (full recovery from run-19's 6-span partial); auto-summarize.js commits all 3 spans |
| COV-005 (Domain attributes present) | **FAIL** | Three files set only input parameters with no computed output attributes: (1) git-collector.js `getCommitData` — only `vcs.ref.head.revision` (input); `CommitData` return value uncaptured; persistent from run-19 (2) summary-manager.js `readWeekDailySummaries` and `readMonthWeeklySummaries` — only `week_label`/`month_label` (input labels); no output counts; new this run (3) index.js `main()` — only `vcs.ref.head.revision` (input); `commit_story.cli.subcommand` dropped in attempt 3; regression from run-19 |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in journal-graph.js and summary-graph.js; manual spans wrap application-layer logic above auto-instrumented calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 17 correct skips confirmed; all sync helpers excluded across all committed files |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 12/12 — unexported helpers excluded where RST-004 applies; unexported helpers with standalone I/O correctly instrumented (summary-detector.js) |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` (unchanged) |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in dependencies |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all committed files |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 42 new span IDs, all declared as schema extensions in `agent-extensions.yaml`; `commit_story.*` convention followed consistently; mcp/server.js SCH-001 failure (unregistered span name) is noted in per-file evaluation but does not affect committed output |
| SCH-002 (Attribute keys match registry) | **PASS** | **RESOLVED from runs 18–19**: journal-manager.js `discoverReflections` uses `commit_story.journal.entries_count` (registered in `agent-extensions.yaml`) instead of `commit_story.journal.quotes_count` (semantic mismatch); three-consecutive-run watch broken |
| SCH-003 (Attribute types correct) | **PASS** | Count attributes (int) via `.length`/`.size`; labels (string) from parameters; timestamps via `.toISOString()` (string); boolean via `!!` coercion; all match registry declarations |
| SCH-004 (No redundant entries) | **PASS** | No semantic duplicates among committed attributes; SCH-001 advisories in PR are false positives on correctly declared extensions |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | `span.end()` in `finally` blocks across all committed files; index.js CDQ-001 span-leak on `process.exit()` paths is a known architectural limitation, consistent with runs 12–19 |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 12 committed files |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `SpanStatusCode.ERROR` in all outer catch blocks |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse |
| CDQ-006 (Expensive guards) | **PASS** | Count attributes are direct `.length`/`.size` calls (non-expensive); valid CDQ-006 advisories (journal-graph.js `sections` from LLM output, context-integrator.js `commit.message` from git) noted in pr-evaluation.md but are advisory, not canonical failures per established rubric precedent |
| CDQ-007 (No unbounded/PII) | **PASS** | Counts from `.length`/`.size` (non-nullable); timestamps via `.toISOString()`; nullable fields guarded with `!= null` checks; raw `file_path` advisory in journal-paths.js and journal-manager.js is a documented low-severity limitation |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used consistently across all 12 committed files |

---

## Overall Score

| Dimension | Run-20 | Run-19 | Run-18 | Run-17 | Run-16 | Delta (vs run-19) |
|-----------|--------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **4/5 (80%)** | 2/5 (40%) | 5/5 (100%) | 3/5 (60%) | 3/5 (60%) | **+40pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **4/4 (100%)** | 3/4 (75%) | 3/4 (75%) | 3/4 (75%) | 4/4 (100%) | **+25pp** |
| CDQ | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | — |
| **Total** | **24/25 (96%)** | 21/25 (84%) | 24/25 (96%) | 22/25 (88%) | 22/25 (88%) | **+12pp** |
| **Gates** | **5/5 (100%)** | 5/5 (100%) | 5/5 (100%) | 4/5 (80%) | 5/5 (100%) | — |

---

## Canonical Metrics

| Metric | Run-20 | Run-19 | Run-18 | Run-17 | Run-16 |
|--------|--------|--------|--------|--------|--------|
| Quality score | **24/25 (96%)** | 21/25 (84%) | 24/25 (96%) | 22/25 (88%) | 22/25 (88%) |
| Gates | 5/5 | 5/5 | 5/5 | 4/5 | 5/5 |
| Committed files | **12** | 10 | 11 | 10+1p | 10+3p |
| Partial files | 0 | 3 | 0 | 0 | 0 |
| Failed files | 1 | 0 | 0 | 0 | 0 |
| Total spans (committed) | **42** | 30 | 36 | ~28 | ~25 |
| Cost | **$9.08** | $8.83 | $9.16 | $10.43 | $12.29 |
| Q×F | **11.5** | 8.4 | 10.6 | 8.8 | 8.8 |
| Push/PR | **AUTO ✅ (#73)** | AUTO ✅ (#71) | YES (#70, manual) | YES (#69) | YES (#68) |
| IS | — *(pending)* | 80/100 | 90/100 | 90/100 | 80/100 |

**Q×F = 11.5** (24/25 × 12). Better than run-19 (8.4) but below run-18 (10.6) due to mcp/server.js failure reducing committed file count from expected 13 to 12. PRD target of Q×F ≥ 12.0 required 14 files; 12 committed files yields 11.5 at this quality level.

---

## Score Recovery Analysis

Run-20 recovers to 24/25 (96%) from run-19's regression to 21/25 (84%). The +3 point gain comes from two distinct improvements:

### +2 points: COV recovery (PRD #885 fix confirmed)

PRD #885 (NDS-003 multiLine flag normalization) resolved the indentation-driven Prettier reformatting that caused 4 functions to fail in run-19:
- `generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, `generateAndSaveMonthlySummary` in summary-manager.js (COV-001, COV-004 restored)
- `triggerAutoSummaries` in auto-summarize.js (COV-001, COV-004 restored)

COV-001 and COV-004 return to PASS. COV-005 remains a failure (see below).

### +1 point: SCH recovery (journal-manager.js SCH-002 resolved)

`discoverReflections` in journal-manager.js switched from `commit_story.journal.quotes_count` (defined for AI-extracted quotes; semantic mismatch for filesystem-discovered reflection files) to `commit_story.journal.entries_count` (registered in `agent-extensions.yaml`; semantically appropriate for a count of discovered entries). SCH-002 returns to PASS after two consecutive failures.

### COV-005: Persistent and new failures

The one remaining COV failure has three contributors:

| File | Failure | Status |
|------|---------|--------|
| git-collector.js `getCommitData` | Only input param set; no output from `CommitData` return value | Persistent (runs 19–20) |
| summary-manager.js `readWeekDailySummaries`, `readMonthWeeklySummaries` | Only input labels set; no output counts | New this run (9 spans committed for first time) |
| index.js `main()` | `commit_story.cli.subcommand` dropped in attempt 3; only input param remains | Regression from run-19 |

The index.js regression is notable: the same JSON string serialization issue that caused mcp/server.js to fail outright (NDS-003 at lines 1, 3–20, 37, 39 from shebang/JSDoc trivia loss) also caused index.js to require 3 attempts (vs 1 in run-19), and the agent simplified the output in attempt 3 at the cost of dropping the subcommand attribute.

The summary-manager.js COV-005 gap is a consequence of complete success: the 9-span commit is the first time `readWeekDailySummaries` and `readMonthWeeklySummaries` have been committed, revealing that the agent set only their input labels on those spans. This was invisible in prior runs where those functions were not committed.

### mcp/server.js: Spiny-orb regression, not agent regression

mcp/server.js failure does not count against the quality score (scoring is based on committed output), but it reduces Q×F by 1 file. The agent's instrumentation was correct across all 3 attempts; the NDS-003 oscillation was caused by the PRD #885 `stripOtelNodes` bug removing file-level leading trivia (shebang + JSDoc) when the OTel import is placed first. Fix location: `removeOtelImports` in `nds003-ast-stripper.ts`.

---

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| COV-005 | COV | git-collector.js `getCommitData` | Agent notes intent but committed code sets only input param; general COV-005/CDQ-005 guidance insufficient | 2 (runs 19–20) |
| COV-005 | COV | summary-manager.js `readWeek*`, `readMonth*` | First-time commit reveals only input labels set; no prompt guidance for these secondary functions | New (run-20) |
| COV-005 | COV | index.js `main()` | JSON serialization NDS-003 (same root as mcp/server.js) caused agent to simplify in attempt 3, dropping subcommand attribute | Regression (run-20) |
