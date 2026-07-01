# Rubric Scores — Run-21

**Date**: 2026-06-04
**Branch**: spiny-orb/instrument-1780596389399
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/74

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 12 committed files pass `node --check`; mcp/server.js and index.js gate not applicable (0 spans committed) |
| NDS-002 (Tests) | Per-run | **PASS** — 564/565 tests pass (1 skipped: acceptance gate, no API key); pre-push hook passed (auto-push succeeded) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — all 12 committed files pass validator; mcp/server.js and index.js NDS-003 failures (blank-line-near-JSDoc and import-expansion variants) prevented commit but do not affect committed output |
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
| COV-001 (Entry points have spans) | **PASS** | All 12 committed files instrument their exported async entry points; mcp/server.js and index.js entry points correctly instrumented in agent output (NDS-003 failures prevented commit — WOULD PASS per established precedent) |
| COV-003 (Failable ops have error visibility) | **PASS** | All 12 committed files have outer catch with `recordException` + `SpanStatusCode.ERROR` + rethrow |
| COV-004 (Async ops have spans) | **PASS** | All async functions in committed files instrumented; summary-manager.js commits all 9 spans (full suite including readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary and monthly equivalents); summary-detector.js commits all 5 exported async fns (first time); git-collector.js expands from 2 to 6 spans (PRD #902) |
| COV-005 (Domain attributes present) | **FAIL** | summary-manager.js `saveDailySummary`: on the file-already-exists skip path (when options.force is false), the span has zero attributes — `entry_date` is set only after the early return. All other 11 committed files pass COV-005. COV-005 persistent failures from run-20 (git-collector.js, summary-manager.js readWeek*/readMonth*, index.js) are all resolved; one new COV-005 gap opened by full 9-span commit revealing the skip-path gap |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in journal-graph.js and summary-graph.js; manual spans establish active context before `getModel(...).invoke(...)` calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 16 correct skips confirmed; all sync helpers excluded across all committed files; sensitive-filter.js and reflection-tool.js correctly re-classified as skips (target repo refactored both to sync-only between runs 20 and 21) |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 12/12 — unexported helpers excluded where RST-004 applies; unexported async I/O helpers correctly instrumented where COV-004 requires it |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` (unchanged) |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in production dependencies; OTel SDK packages are devDependencies only |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 12 committed files |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 42 new span IDs, all declared as schema extensions in `agent-extensions.yaml`; `commit_story.*` convention followed consistently; 17 SCH-001 advisories in PR are systematic false positives (checker does not recognize in-run registered extensions) |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys registered in base semconv or agent-extensions; `entries_count` registered by summary-graph.js in early files, reused cleanly by summary-manager.js and summary-detector.js |
| SCH-003 (Attribute types correct) | **PASS** | Count attributes (int) via `.length`/`.size`; labels (string) from parameters; booleans via direct expression (`parentCount > 1`); timestamps via `.toISOString()` (string); all match registry declarations |
| SCH-004 (No redundant entries) | **PASS** | No semantic duplicates among committed attributes; `dates_count` reuse across three summary-detector spans is intentional schema economy |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **FAIL** | claude-collector.js — `span.end()` called explicitly in `finally` block inside `startActiveSpan` callback; `startActiveSpan` auto-ends the span when the callback returns or throws, making the explicit call a double-end. All 11 other committed files use `finally { span.end() }` correctly outside `startActiveSpan` or omit the redundant call |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 12 committed files |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `SpanStatusCode.ERROR` in all outer catch blocks |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse |
| CDQ-006 (Expensive guards) | **PASS** | Count attributes are direct `.length`/`.size` calls (non-expensive); CDQ-006 advisory findings in pr-evaluation.md (external-source strings in context-capture-tool.js and journal-manager.js) are advisory, not canonical failures per established rubric precedent |
| CDQ-007 (No unbounded/PII) | **PASS** | run-20 FAIL (journal-manager.js `commit.author` unconditional nullable) resolved — `commit.author` removed entirely in run-21; `vcs.ref.head.revision` uses `commit.shortHash` (structurally required); `commit_story.journal.file_path` raw filesystem path advisory in summary-manager.js, journal-paths.js, and journal-manager.js is a documented low-severity known limitation, consistent with run-20 treatment |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used consistently across all 12 committed files |

---

## Overall Score

| Dimension | Run-21 | Run-20 | Run-19 | Run-18 | Run-17 | Delta (vs run-20) |
|-----------|--------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **4/5 (80%)** | 4/5 (80%) | 2/5 (40%) | 5/5 (100%) | 3/5 (60%) | — |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) | 3/4 (75%) | — |
| CDQ | **6/7 (86%)** | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | **-14pp** |
| **Total** | **23/25 (92%)** | 24/25 (96%) | 21/25 (84%) | 24/25 (96%) | 22/25 (88%) | **-4pp** |
| **Gates** | **5/5 (100%)** | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 4/5 (80%) | — |

---

## Canonical Metrics

| Metric | Run-21 | Run-20 | Run-19 | Run-18 | Run-17 |
|--------|--------|--------|--------|--------|--------|
| Quality score | **23/25 (92%)** | 24/25 (96%) | 21/25 (84%) | 24/25 (96%) | 22/25 (88%) |
| Gates | 5/5 | 5/5 | 5/5 | 5/5 | 4/5 |
| Committed files | **12** | 12 | 10 | 11 | 10+1p |
| Partial files | 0 | 0 | 3 | 0 | 0 |
| Failed files | **2** | 1 | 0 | 0 | 0 |
| Total spans (committed) | **42** | 42 | 30 | 36 | ~28 |
| Cost | **$8.10** | $9.08 | $8.83 | $9.16 | $10.43 |
| Q×F | **11.0** | 11.5 | 8.4 | 10.6 | 8.8 |
| Push/PR | **AUTO ✅ (#74)** | AUTO ✅ (#73) | AUTO ✅ (#71) | YES (#70, manual) | YES (#69) |
| IS | **TBD** | 80/100 | 80/100 | 90/100 | 90/100 |

**Q×F = 11.0** (23/25 × 12). Slight regression from run-20 (11.5). CDQ-001 failure reduces quality from 24 to 23; second failed file (index.js) holds committed count at 12. PRD Q×F target of ≥ 12.5 requires mcp/server.js to commit (13 files) at 96%+ quality — not met in run-21.

---

## Failure Analysis

### CDQ-001: claude-collector.js (new)

claude-collector.js uses `startActiveSpan('name', async (span) => { try { ... } finally { span.end() } })`. The `finally { span.end() }` inside a `startActiveSpan` callback is a double-end: `startActiveSpan` auto-closes the span when the callback promise settles (returns or throws). The explicit call ends an already-ended span.

All 11 other committed files that use `startActiveSpan` correctly omit the redundant `span.end()`, or use the `try/finally` pattern only in `startSpan` (manual span) contexts.

**Root cause**: LLM variation in instrumentation pattern. The agent applied a `try/finally { span.end() }` idiom that is correct for manual `tracer.startSpan()` but incorrect inside `startActiveSpan` callbacks. This is a new failure not previously seen in runs 17–20; claude-collector.js last committed in run-20 where CDQ-001 passed.

**Fix**: Remove `span.end()` from the `finally` block inside `startActiveSpan`. The span will auto-close correctly.

### COV-005: summary-manager.js saveDailySummary (new variant)

`saveDailySummary` has a skip path: when the file already exists and `options.force` is false, the function returns `null` early. The `entry_date` attribute is set after the early return, so the skip path produces a span with zero attributes.

The other 8 spans in summary-manager.js all set at least one attribute unconditionally at span start (`entry_date`, `week_label`, or `month_label`). `saveDailySummary` is the only exception.

**Root cause**: The save functions were newly committed in run-20 (first appearance of read/save functions). Run-20's `readWeek*` and `readMonth*` failures drew the post-run analysis toward input-label-only spans, but the zero-attribute skip-path gap in `saveDailySummary` was not identified as a separate failure class.

**Fix**: Move `span.setAttribute('commit_story.journal.entry_date', entryDate)` to the span start (before the early return check), consistent with `saveWeeklySummary` and `saveMonthlySummary` which set their period labels unconditionally.

### mcp/server.js: Second consecutive failure, new NDS-003 variant

PR #905 resolved the run-20 failure class (shebang/leading trivia stripped when OTel import placed first). In run-21 the shebang (line 1) is preserved correctly. A new independent NDS-003 failure emerged: violations at lines 2, 3, 31, 33, 34 — the JSDoc block delimiter and McpServer constructor area. The validator's forward-check misaligns when a blank line is inserted adjacent to the pre-import JSDoc block.

The agent's output was structurally correct across all 3 attempts (debug dump confirmed). This is a validator algorithm issue, not an agent content error — consistent with the run-20 pattern. Two independent NDS-003 bugs confirmed on this file: (1) shebang trivia-loss FIXED by PR #905; (2) blank-line-near-JSDoc variant UNRESOLVED.

### index.js: New failure class — import expansion

index.js committed cleanly in runs 17–20. In run-21, with ~60 schema extensions accumulated over 29 preceding files, the agent expanded three single-line `import {` statements into multi-line blocks in attempt 1, adding ~14 new lines and triggering 152 NDS-003 violations. Attempt 2 could not reconstruct the exact original formatting and introduced NDS-005 (try/catch restructuring).

The agent's intent was correct (planned `commit_story.cli.main` span with `commit_story.cli.subcommand` attribute in both attempts). This is a context-pollution failure: PRD #902's large auto-registration output (42 span IDs, 12 new attributes) accumulated formatting drift across 30 files.

**Root cause**: Context accumulation across a large file count. The same pattern that causes late-run files to reformat existing code (observed earlier in runs) manifested on index.js at position 30/30. RUN20-3 recovery (commit_story.cli.subcommand) remains unverifiable.

---

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| CDQ-001 | CDQ | claude-collector.js | Double-end: `span.end()` in `finally` inside `startActiveSpan` callback | New (run-21) |
| COV-005 | COV | summary-manager.js `saveDailySummary` | Zero attributes on file-already-exists skip path; `entry_date` set after early return | New (run-21) |
| NDS-003 | — | mcp/server.js | Blank-line-near-JSDoc NDS-003 variant (validator algorithm); agent output correct | 1 run (run-21); shebang variant was 1 run (run-20), fixed PR #905 |
| NDS-003 + NDS-005 | — | index.js | Import expansion + try/catch restructuring from context pollution at file 30/30 | New (run-21) |

**Resolved from run-20:**

| Rule | File(s) | Status |
|------|---------|--------|
| COV-005 (git-collector.js `getCommitData`) | git-collector.js | **RESOLVED** — PRD #902: 6 spans, all with domain attrs including `is_merge` and commit output fields |
| COV-005 (summary-manager.js readWeek*/readMonth*) | summary-manager.js | **RESOLVED** — readWeekDailySummaries sets `week_label` + output count; readMonthWeeklySummaries sets `month_label` + output count |
| COV-005 (index.js subcommand) | index.js | **UNVERIFIABLE** — agent intent confirmed but file did not commit (NDS-003 import expansion) |
| CDQ-007 (journal-manager.js commit.author nullable) | journal-manager.js | **RESOLVED** — `commit.author` removed entirely; CDQ-007 PASS |
