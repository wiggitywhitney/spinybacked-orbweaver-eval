# Rubric Scores — Run-16

**Date**: 2026-05-11
**Branch**: spiny-orb/instrument-1778526749797
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/68

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 13 instrumented files (10 committed + 3 partial) pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — test suite passes on instrument branch; no checkpoint failures reported during run |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 13/13 files; summary-manager.js NDS-003 flag is a false positive from line number drift (D1) |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 13/13 files |
| NDS-006 (Module system) | Per-file | **PASS** — 13/13 files |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 1/2 (50%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 13/13 |
| NDS-005 (Error handling preserved) | **FAIL** | commit-analyzer.js — function-level fallback ran on a 0-span file and stripped a try/catch block during reassembly. Committed code has a structural defect: one original try/catch block is absent. Root cause: spiny-orb bug (function-level fallback should not modify files when no spans are added). |

### Coverage (COV): 3/5 (60%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **FAIL** | journal-graph.js — `technicalNode` (exported async LangGraph node, calls `model.invoke()`) has no span due to NDS-003 oscillation. summary-manager.js — `generateAndSaveWeeklySummary` and `generateAndSaveMonthlySummary` (exported async pipeline entry points) have no spans due to token budget exhaustion (D2). |
| **COV-003 (Failable ops have error visibility)** | **✅ PASS** ★ | **Primary goal achieved.** `getDaysWithEntries` and `getDaysWithDailySummaries` in summary-detector.js now have outer catch blocks with `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })`, consistent with `findUnsummarizedDays/Weeks/Months` in the same file. COV-003 passes for all 5 spans in summary-detector.js. All other committed files pass COV-003. |
| COV-004 (Async ops have spans) | **FAIL** | Same functions as COV-001: journal-graph.js `technicalNode`; summary-manager.js `generateAndSaveWeeklySummary` and `generateAndSaveMonthlySummary`. Additionally: context-capture-tool.js `saveContext` and reflection-tool.js `saveReflection` (advisory, unexported) have no spans due to full-file failures. |
| COV-005 (Domain attributes present) | **PASS** | 13/13 — all committed spans have domain attributes; mcp/server.js invented `commit_story.mcp.transport` to satisfy COV-005 where no registered attribute applied |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 2/2 applicable — journal-graph.js and summary-graph.js place manual spans above auto-instrumented LangChain `model.invoke()` calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 13/13 — all synchronous helpers, formatters, and pure-data functions correctly skipped |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 13/13 — unexported functions correctly handled; function-level fallback correctly instruments only the unexported async I/O functions that lack an exported orchestrator covering their path |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at ^1.9.0 |
| API-003 (No vendor SDKs) | **PASS** | No vendor-specific instrumentation packages in dependencies (API-003 marked for deletion in PRD #483; retained for scoring continuity) |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 13 files; SDK packages in devDependencies only |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 38 new span IDs across 13 files, all following `commit_story.<category>.<operation>` convention; SCH-001 semantic-duplicate advisories are false positives (superficial namespace prefix similarities across distinct operations in summary-detector.js and auto-summarize.js) |
| SCH-002 (Attribute keys match registry) | **PASS** | All keys from registry or correctly declared extensions (6 new attributes: entries_count, month_label, months_count, week_label, weeks_count, mcp.transport) |
| SCH-003 (Attribute types correct) | **PASS** | *_count=integer, labels=string, timestamps=ISO string via .toISOString(), transport='stdio'=string |
| SCH-004 (No redundant entries) | **PASS** | No true duplicates; SCH-004 marked for deletion per PRD #483 but retained for scoring continuity |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All committed spans have `span.end()` in finally blocks |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 13 files |
| CDQ-003 (Error recording pattern) | **PASS** | Standard `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` used throughout; graceful-degradation catches correctly have no error recording (NDS-007); no ad-hoc `setAttribute('error', ...)` patterns |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout all 13 files |
| CDQ-006 (Expensive guards) | **PASS** | No expensive computations unguarded; `isRecording()` guard used in journal-manager.js for `entry_date` computation |
| CDQ-007 (No unbounded/PII) | **PASS** | PII: `commit.author` and `commit.authorEmail` correctly excluded; raw file paths are advisory findings using registered `commit_story.journal.file_path` attribute (CDQ-007 import constraint applies — `basename` not imported; known limitation). CDQ-007 null-guard advisories (22 instances) are false positives — variables initialized from array-returning functions cannot be null. |
| CDQ-008 (Consistent naming) | **PASS** | `commit-story` consistent across all 13 files (CDQ-008 retained for continuity; superseded by CDQ-011) |

---

## Overall Score

| Dimension | Run-16 | Run-15 | Run-14 | Run-13 | Delta vs Run-15 |
|-----------|--------|--------|--------|--------|-----------------|
| NDS | **1/2 (50%)** | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | **-50pp** |
| COV | **3/5 (60%)** | 4/5 (80%) | 3/5 (60%) | 5/5 (100%) | **-20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 7/7 (100%) | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | — |
| **Total** | **22/25 (88%)** | **24/25 (96%)** | **22/25 (88%)** | **25/25 (100%)** | **-8pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | — |

---

## Canonical Metrics

| Metric | Run-16 | Run-15 | Run-14 | Run-13 | Run-12 |
|--------|--------|--------|--------|--------|--------|
| Quality | **22/25 (88%)** | 24/25 (96%) | 22/25 (88%) | 25/25 (100%) | 23/25 (92%) |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | **10 + 3p** | 14 | 12 | 7 | 12+1p |
| Total spans | **~38** (28 committed + ~10 partial) | 40 | 32 | 22 | 31+3p |
| Cost | **$12.29** | $6.44 | $5.59 | ~$6.41 | $5.19 |
| Push/PR | YES (#68) | YES (#66) | YES (#65) | YES (#62) | YES (#61) |
| Q×F | **8.8** | 13.4 | 10.6 | 7.0 | 11.0 |

**Q×F = 8.8** — significant regression from run-15's 13.4. Three canonical failures (NDS-005, COV-001, COV-004) and 4 fewer committed files (10 vs 14) drove the regression despite the primary goal (COV-003) being achieved.

---

## Failure Analysis

### NDS-005: commit-analyzer.js — Function-Level Fallback Bug

**What happened**: The pre-scan correctly found no instrumentable functions (0 spans, sync only). The function-level fallback ran anyway, modified the file during reassembly, and stripped a try/catch block. The file was committed as "partial results" with the structural defect.

**Root cause**: Spiny-orb bug — function-level fallback should be a no-op when 0 spans are added. The reassembly pass modified business logic it had no reason to touch.

**Impact**: Committed code is missing a try/catch block from one of the two sync functions. Runtime behavior changed for the error-handling path. COV-005 severity: behavioral regression in committed code.

### COV-001: journal-graph.js (technicalNode) and summary-manager.js (2 functions)

**journal-graph.js technicalNode**: NDS-003 oscillation prevented span placement. On attempt 3, fresh regeneration increased NDS-003 error count from 1 to 5 (lines 29, 30, 54, 57, 31). summaryNode, dialogueNode, and generateJournalSections all committed correctly. Third consecutive run where technicalNode misses.

**summary-manager.js generateAndSaveWeeklySummary / generateAndSaveMonthlySummary**: Token budget exhaustion (null parsed_output). Both are complex pipeline functions (~complex multi-await, LLM calls via summary-graph) that exhausted their per-function minimum budget (16,384 tokens) on adaptive thinking before producing structured output. See D2.

**Impact**: Two entire pipeline stages (weekly and monthly summarization entry points) are invisible to telemetry. For journal-graph.js, the technical decisions generation step has no span.

### COV-001 Primary Goal Context

Despite the COV-001 failures, the primary goal of run-16 was achieved: **COV-003 PASS for summary-detector.js** — the RUN15-1 fix (outer catch guidance for functions with inner graceful-degradation catches) worked correctly. `getDaysWithEntries` and `getDaysWithDailySummaries` both have proper outer catch blocks, eliminating the inconsistency with `findUnsummarizedDays/Weeks/Months`.

---

## Improvements vs Run-15

| Run-15 Failure | Run-16 Result | Note |
|----------------|---------------|------|
| COV-003 FAIL: summary-detector.js (getDaysWithEntries, getDaysWithDailySummaries — no outer catch) | **✅ RESOLVED → PASS** | D2 fix (outer catch guidance for NDS-007 pattern) worked correctly |

## New Failures vs Run-15

| Rule | File | Description |
|------|------|-------------|
| NDS-005 | commit-analyzer.js | Function-level fallback bug stripped try/catch on 0-span file |
| COV-001 | journal-graph.js | technicalNode: NDS-003 oscillation (third consecutive run) |
| COV-001 | summary-manager.js | generateAndSaveWeeklySummary + generateAndSaveMonthlySummary: token exhaustion |
| COV-004 | journal-graph.js + summary-manager.js | Same functions as COV-001 |
