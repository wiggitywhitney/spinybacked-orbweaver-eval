# Rubric Scores — Run-14

**Date**: 2026-04-15
**Branch**: spiny-orb/instrument-1776263984892
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/65

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 12 instrumented files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — live-check OK; zero checkpoint test failures |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 12/12 files |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 12/12 files |
| NDS-006 (Module system) | Per-file | **PASS** — 12/12 files |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 12/12 |
| NDS-005 (Error handling preserved) | **PASS** | 12/12 — all pre-existing error handling structures preserved; inner expected-condition catches (ENOENT, duplicate detection) unchanged throughout |

### Coverage (COV): 3/5 (60%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 12/12 applicable |
| COV-003 (Failable ops have error visibility) | **FAIL** | journal-graph.js — summaryNode catch block has no error recording (no recordException, setStatus, or error-related setAttribute); LLM failures invisible in trace data. technicalNode and dialogueNode in the same file both have correct error recording. |
| COV-004 (Async ops have spans) | **FAIL** | summary-manager.js — 6 exported async I/O functions without spans (readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary). Same failure as run-12. |
| COV-005 (Domain attributes present) | **PASS** | 12/12 |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 2/2 applicable (journal-graph.js, summary-graph.js) — manual spans placed at application logic level above auto-instrumented LangChain model.invoke() calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 12/12 — all sync helpers, formatters, and pure-data exports correctly skipped |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 12/12 — unexported functions correctly skipped; entry-point override for main() in mcp/server.js correct |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | @opentelemetry/api in peerDependencies at ^1.9.0 |
| API-003 (No vendor SDKs) | **PASS** | No vendor-specific instrumentation packages in dependencies |
| API-004 (No SDK imports) | **PASS** | Only @opentelemetry/api imported across all 12 files |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 32 unique spans, all well-formed commit_story.* extensions |
| SCH-002 (Attribute keys match registry) | **PASS** | All keys from registry or correctly reported schema extensions; no unregistered keys |
| SCH-003 (Attribute types correct) | **PASS** | force=boolean, *_count=integer, timestamps=ISO string, labels=string, temp=number; nullable attrs guarded with != null before setAttribute |
| SCH-004 (No redundant entries) | **PASS** | 1 SCH-004 advisory (generated_count flagged as duplicate of messages_count) is a false positive — different domains, different semantics. No true duplicates. |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All 32 spans closed in finally blocks |
| CDQ-002 (Tracer name) | **PASS** | 'commit-story' in all 12 files |
| CDQ-003 (Error recording) | **FAIL** | journal-graph.js summaryNode catch — missing span.recordException(error) + span.setStatus({ code: SpanStatusCode.ERROR }). technicalNode and dialogueNode in the same file both have correct patterns. Inconsistent implementation within a single file. |
| CDQ-005 (Async context) | **PASS** | startActiveSpan with async callbacks throughout |
| CDQ-006 (Expensive guards) | **PASS** | No expensive computations in setAttribute; CDQ-006 advisory on entryPath.split('/').pop() is false positive (trivial string operation, exempt) |
| CDQ-007 (No unbounded/PII) | **PASS** | nullable fields guarded with != null throughout; Date/string fix via new Date(value).toISOString(); no PII fields set |
| CDQ-008 (Consistent naming) | **PASS** | 'commit-story' consistent across all 12 committed files |

---

## Overall Score

| Dimension | Run-14 | Run-13 | Run-12 | Run-11 | Delta vs Run-13 |
|-----------|--------|--------|--------|--------|-----------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | 3/5 (60%) | 5/5 (100%) | 4/5 (80%) | 5/5 (100%) | **-40pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 6/7 (86%) | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | **-14pp** |
| **Total** | **22/25 (88%)** | **25/25 (100%)** | **23/25 (92%)** | **25/25 (100%)** | **-12pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | — |

---

## Canonical Metrics

| Metric | Run-14 | Run-13 | Run-12 | Run-11 |
|--------|--------|--------|--------|--------|
| Quality | 22/25 (88%) | 25/25 (100%) | 23/25 (92%) | 25/25 (100%) |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | 12 | 7 | 12 + 1 partial | 13 |
| Total spans | 32 | 16 | 31 | 39 |
| Cost | $5.59 | ~$6.41 | $5.19 | $4.25 |
| Push/PR | YES (#65) | YES (#62) | YES (#61) | YES (#60) |
| Q×F | **10.6** | 7.0 | 11.0 | 13.0 |
| Duration | 54.3 min | 65.7 min | 53.8 min | 41.2 min |

**Q×F = 10.6** — improvement from run-13's 7.0, near run-12's 11.0, but below run-11's 13.0.

---

## Failure Analysis

### COV-003 + CDQ-003: summaryNode (journal-graph.js)

summaryNode was instrumented for the first time in any run (runs 11–13 all skipped it due to NDS-003 Code Preserved failures). The instrumentation is correct in most respects — CDQ-001 passes (span.end() in finally), COV-001 passes (span present), COV-004 passes (async function has span).

The defect: the catch block returns a fallback state without adding `span.recordException(error)` or `span.setStatus({ code: SpanStatusCode.ERROR })`. This means the span ends with OK status when the LLM call fails — telemetry will show successful execution even when an error occurred.

Notably, technicalNode and dialogueNode — instrumented in the same file — both have correct error recording in their catch blocks. summaryNode appears to be the agent's first attempt in the file (attempt 1) before the pattern was refined. The run output shows 3 attempts total; the catch-block inconsistency suggests the first version (summaryNode) was written before the pattern solidified.

**Root cause**: Within-file pattern inconsistency across a 3-attempt run on a large file. The agent's catch-block error recording improved across attempts but summaryNode wasn't updated to match.

### COV-004: summary-manager.js (persistent)

Identical to run-12. 3 pipeline orchestrators are instrumented (correct for COV-001), but 6 exported async I/O functions remain without spans. The agent's "ratio backstop" reasoning is not a COV-004 exemption. See run-12 failure analysis for full detail.

**Root cause**: LLM variation in span allocation strategy — agent applies a restraint heuristic that overrides COV-004 requirements for this file.
