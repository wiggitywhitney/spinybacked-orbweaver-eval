# Rubric Scores — Run-15

**Date**: 2026-05-03/04
**Branch**: spiny-orb/instrument-1777850275841
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/66

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 14 instrumented files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — 564/564 tests pass, 1 skipped (acceptance gate, no API key) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 14/14 files |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 14/14 files |
| NDS-006 (Module system) | Per-file | **PASS** — 14/14 files |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 14/14 |
| NDS-005 (Error handling preserved) | **PASS** | 14/14 — all pre-existing error handling structures preserved; graceful-degradation catches correctly unchanged (now governed by NDS-007) |

### Coverage (COV): 4/5 (80%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 14/14 applicable |
| COV-003 (Failable ops have error visibility) | **FAIL** | summary-detector.js — getDaysWithEntries and getDaysWithDailySummaries have `startActiveSpan` with try/finally but NO outer catch; unexpected errors propagate through the span completely unrecorded. Inner ENOENT catches are graceful-degradation (NDS-007 correct), but no outer-span catch exists. Inconsistent with findUnsummarizedDays/Weeks/Months in the same file, which have proper `catch (error) { span.recordException(error); span.setStatus(ERROR); }`. The isExpectedConditionCatch exemption does not apply here — there is no catch to exempt; the span simply has no error handler. |
| COV-004 (Async ops have spans) | **PASS** | All 9 exported async functions in summary-manager.js now have spans (resolved after 3 consecutive failures in runs 12–14); all other exported async functions across 13 additional files have spans |
| COV-005 (Domain attributes present) | **PASS** | 14/14 — all schema-defined spans have required attributes; mcp/server.js invented `commit_story.mcp.transport_type` to satisfy COV-005 where no registered attribute applied |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 2/2 applicable — journal-graph.js and summary-graph.js place manual spans above auto-instrumented LangChain model.invoke() calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 14/14 — all synchronous helper functions, formatters, and pure-data functions correctly skipped |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A — no thin wrapper spans present |
| RST-004 (No internal detail spans) | **PASS** | 14/14 — unexported functions correctly skipped; RST-004 exception correctly applied to context-capture-tool.js `saveContext` (only async I/O function, no exported orchestrator covers its path) |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | @opentelemetry/api in peerDependencies at ^1.9.0 |
| API-003 (No vendor SDKs) | **PASS** | No vendor-specific instrumentation packages in dependencies (API-003 marked for deletion in PRD #483 but retained in scoring for continuity) |
| API-004 (No SDK imports) | **PASS** | Only @opentelemetry/api imported across all 14 files; SDK packages in devDependencies only |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 40 spans across 14 files, all following `commit_story.<category>.<operation>` naming convention; SCH-001 semantic-duplicate advisories are false positives (unrelated domains matched across categories) |
| SCH-002 (Attribute keys match registry) | **PASS** | All keys from registry or correctly reported schema extensions; invented attributes follow namespace convention and are semantically non-redundant with registered entries |
| SCH-003 (Attribute types correct) | **PASS** | force=boolean, *_count=integer, timestamps=ISO string, temps=number, paths=string; nullable attr guards (`if (result != null)`) applied in summary-graph.js |
| SCH-004 (No redundant entries) | **PASS** | No true duplicates; SCH-004 marked for deletion per PRD #483 but retained in scoring for continuity |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All 40 spans have `span.end()` in finally blocks; index.js process.exit() bypasses are a known runtime limitation (agent documented), not a code-structure failure — AST pattern satisfied |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 14 files; matches registry manifest `name: commit_story` → `commit-story` |
| CDQ-003 (Error recording pattern) | **PASS** | All error-recording catch blocks use standard `span.recordException(error) + span.setStatus({ code: SpanStatusCode.ERROR })`; graceful-degradation catches correctly have no error recording (NDS-007); no ad-hoc setAttribute('error', ...) patterns |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout all 14 files — context automatically managed |
| CDQ-006 (Expensive guards) | **PASS** | No expensive computations in setAttribute; NODE_TEMPERATURES.* property access (O(1), trivial) not flagged; `.toISOString()` is exempt per CDQ-006 |
| CDQ-007 (No unbounded/PII) | **PASS** | commit.author correctly omitted (PII) across git-collector.js and context-integrator.js; raw file paths (journal-manager.js, journal-paths.js) are advisory findings using a registered attribute — high-cardinality concern, not PII or null-safety failure |
| CDQ-008 (Consistent naming) | **PASS** | `commit-story` consistent across all 14 committed files |

---

## Overall Score

| Dimension | Run-15 | Run-14 | Run-13 | Run-12 | Delta vs Run-14 |
|-----------|--------|--------|--------|--------|-----------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **4/5 (80%)** | 3/5 (60%) | 5/5 (100%) | 4/5 (80%) | **+20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | **7/7 (100%)** | 6/7 (86%) | 7/7 (100%) | 6/7 (86%) | **+14pp** |
| **Total** | **24/25 (96%)** | **22/25 (88%)** | **25/25 (100%)** | **23/25 (92%)** | **+8pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | — |

---

## Canonical Metrics

| Metric | Run-15 | Run-14 | Run-13 | Run-12 | Run-11 |
|--------|--------|--------|--------|--------|--------|
| Quality | **24/25 (96%)** | 22/25 (88%) | 25/25 (100%) | 23/25 (92%) | 25/25 (100%) |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | **14** | 12 | 7 | 12+1p | 13 |
| Total spans | **40** | 32 | 22 | 31+3p | 39 |
| Cost | $6.44 | $5.59 | ~$6.41 | $5.19 | $4.25 |
| Push/PR | YES (#66) | YES (#65) | YES (#62) | YES (#61) | YES (#60) |
| Q×F | **13.4** | 10.6 | 7.0 | 11.0 | 13.0 |
| Duration | 127.2 min (excl. PROGRESS.md interaction) | 54.3 min | — | 53.8 min | 41.2 min |

**Q×F = 13.4** — highest since run-11's 13.0.

---

## Failure Analysis

### COV-003: summary-detector.js — getDaysWithEntries and getDaysWithDailySummaries

**Pattern**: Both functions use `startActiveSpan` with try/finally (no catch). Three other spans in the same file (`findUnsummarizedDays`, `findUnsummarizedWeeks`, `findUnsummarizedMonths`) have proper outer catch blocks with `span.recordException(error)` + `span.setStatus(SpanStatusCode.ERROR)`.

**Why this is a failure**: Unlike the LangGraph node pattern (catch returns degraded state without rethrowing — NDS-007 applicable), getDaysWithEntries and getDaysWithDailySummaries have NO outer catch. If an unexpected error occurs (e.g., filesystem permission error, not ENOENT), it propagates through the span completely unrecorded. The isExpectedConditionCatch exemption requires a catch block that handles errors gracefully — there is no catch to exempt.

**Root cause**: The agent applied NDS-007 to the inner catches (correct — ENOENT catches are graceful-degradation), but failed to add an outer catch for unexpected errors. The inconsistency with findUnsummarizedDays/Weeks/Months suggests the agent treated all catch blocks in this file as NDS-007-applicable, not distinguishing between inner graceful catches and the outer span-level error handler that was missing.

**Impact**: COV-003 FAIL counts as 1 dimension failure (one file, one rule). Both affected spans are in the same file.

---

## Improvements vs Run-14

| Run-14 Failure | Run-15 Result | Note |
|----------------|---------------|------|
| COV-003 FAIL: journal-graph.js summaryNode (no error recording) | **RESOLVED → PASS** | Decision D1: per OTel Recording Errors spec, graceful-degradation catches SHOULD NOT record errors; all three LangGraph nodes now consistently apply NDS-007 |
| COV-004 FAIL: summary-manager.js (6 functions without spans) | **RESOLVED → PASS** | All 9 exported async I/O functions now have spans; 1 attempt vs. 3 in prior runs |
| CDQ-003 FAIL: journal-graph.js summaryNode (inconsistent pattern) | **RESOLVED → PASS** | All three nodes consistently have no error recording (correct per NDS-007); CDQ-003 has no wrong pattern to flag |

## New Failure vs Run-14

| Rule | File | Description |
|------|------|-------------|
| COV-003 | summary-detector.js | getDaysWithEntries and getDaysWithDailySummaries: try/finally with no outer catch; inconsistent with findUnsummarizedDays/Weeks/Months in the same file |
