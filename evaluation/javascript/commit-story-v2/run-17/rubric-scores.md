# Rubric Scores — Run-17

**Date**: 2026-05-12
**Branch**: spiny-orb/instrument-1778585670273
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/69

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 10 committed files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — 564/565 tests pass, 1 skipped (acceptance gate) |
| NDS-003 (Non-instrumentation lines) | Per-file | **FAIL** — 4 files failed due to NDS-003: journal-graph.js (49 violations, 1 genuine + ~48 reconciler gap), context-capture-tool.js (oscillation, reconciler gap), reflection-tool.js (oscillation, reconciler gap), index.js (2 violations, reconciler gap). 11/15 files with non-trivial instrumentation pass NDS-003. |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — all 11 committed/partial files |
| NDS-006 (Module system) | Per-file | **PASS** — all 11 committed/partial files |

**Gates: 4/5 PASS** — NDS-003 fails for the first time in this run series (runs 9–16 all passed). Note: 3 of 4 NDS-003 failures are spiny-orb reconciler gaps (agent code is semantically correct); 1 (journal-graph.js) has a genuine 1-character content corruption in addition to ~48 reconciler-gap violations.

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 11/11 — all committed/partial files preserve function signatures |
| NDS-005 (Error handling preserved) | **PASS** | 11/11 — RUN16-3 fix confirmed: commit-analyzer.js returned original unchanged (0-span passthrough), no try/catch stripping in any file |

**Improvement from run-16**: NDS was 1/2 (50%) due to the commit-analyzer.js try/catch stripping bug. RUN16-3 fix resolved it. NDS is now 2/2 (100%).

### Coverage (COV): 3/5 (60%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **FAIL** | journal-graph.js (`generateJournalSections` — exported async, file failed entirely); git-collector.js (`getCommitData` — exported async primary orchestrator, committed but lacks span); summary-manager.js (`generateAndSaveDailySummary`, `generateAndSaveWeeklySummary`, `generateAndSaveMonthlySummary` — exported async, skipped in partial); index.js (`main()` — CLI entry point, file failed entirely) |
| COV-003 (Failable ops have error visibility) | **PASS** | 10/10 committed files with spans — all committed spans have `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` in their catch blocks |
| COV-004 (Async ops have spans) | **FAIL** | Same as COV-001 plus: context-capture-tool.js (`saveContext` — unexported async I/O, no span committed), reflection-tool.js (`saveReflection` — same), git-collector.js additional unexported helpers advisory |
| COV-005 (Domain attributes present) | **PASS** | 10/10 — all committed spans include domain-relevant attributes; schema extensions invented where no registry attribute applied |
| COV-006 (Auto-instrumentation preferred) | **PASS** | 1/1 applicable committed file — summary-graph.js places manual spans above auto-instrumented LangChain `model.invoke()` calls; journal-graph.js is the other applicable file but failed entirely |

**New COV-001 failure in run-17**: git-collector.js `getCommitData` (exported async, primary orchestrator called throughout the application) has no span — only `getPreviousCommitTime` was instrumented. This failure existed in run-16 but was not caught in prior evaluations. **First detection in this eval series.**

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | All 15 correct-skip files verified — no synchronous utilities were incorrectly instrumented |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 11/11 — unexported functions handled correctly; function-level fallback correctly instruments unexported async I/O with no exported orchestrator covering the path |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` |
| API-003 (No vendor SDKs) | **PASS** | No vendor-specific instrumentation packages in dependencies |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported in committed src/ files; SDK packages in devDependencies only |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | All new span names follow `commit_story.<category>.<operation>` convention; all declared as schemaExtension |
| SCH-002 (Attribute keys match registry) | **FAIL** | summary-graph.js: `commit_story.context.messages_count` set to `entries.length` (journal entries, not chat session messages); `commit_story.journal.quotes_count` set to `entries.length` (journal entries, not extracted developer quotes). Both are registered keys repurposed for semantically different values. |
| SCH-003 (Attribute types correct) | **PASS** | All attribute values match registered types: `int` for counts, `string` for labels, `number` for temperature/tokens |
| SCH-004 (No redundant entries) | **PASS** | `weekly_summaries_count` reused across 3 functions in summary-detector.js (advisory noted) but not a canonical duplicate — the key is appropriate for weekly summary counts regardless of calling context |

**New SCH-002 failure in run-17**: summary-graph.js attribute reuse. This file passed SCH in runs 9–16. The failure reflects the agent reusing the nearest-matching registered key rather than creating a domain-specific extension. **First detection in this eval series.**

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All spans use `startActiveSpan` callback or `span.end()` in `finally` blocks |
| CDQ-003 (Error recording) | **PASS** | `span.recordException(error)` + `span.setStatus({ code: SpanStatusCode.ERROR })` present in all committed span catch blocks |
| CDQ-005 (Async context) | **PASS** | All committed spans use `startActiveSpan` callback pattern; summarize.js agent notes described `startSpan` but actual committed code uses `startActiveSpan` |
| CDQ-006 (isRecording guard) | **PASS** | Advisory on summary-manager.js is valid but does not constitute a canonical CDQ-006 failure — no blocking expensive computation guard required |
| CDQ-007 (No unbounded/PII) | **PASS** | Raw filesystem path advisories across 5 files are import-constrained (cannot add `path.basename` without violating instrumentation import rules); no PII attributes (commit.author excluded this run); no unconditional nullable accesses |
| CDQ-008 (Consistent naming) | **PASS** | `trace.getTracer('commit-story')` used consistently across all 10 committed files |
| CDQ-011 (Tracer scope) | **PASS** | All tracers initialized at module scope, not per-call |

---

## Overall Score

| Dimension | Run-17 | Run-16 | Run-15 | Delta (16→17) |
|-----------|--------|--------|--------|---------------|
| NDS | 2/2 (100%) | 1/2 (50%) | 2/2 (100%) | **+50pp** |
| COV | 3/5 (60%) | 3/5 (60%) | 4/5 (80%) | — |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 3/4 (75%) | 4/4 (100%) | 4/4 (100%) | **-25pp** |
| CDQ | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | — |
| **Total** | **22/25 (88%)** | **22/25 (88%)** | **24/25 (96%)** | **—** |
| **Gates** | **4/5** | **5/5** | **5/5** | **-1 gate** |
| **Files** | **10 + 1p** | **10 + 3p** | **14** | — |
| **Cost** | **$10.43** | **$12.29** | **$6.44** | **-$1.86** |
| **Push/PR** | **YES (#69)** | **YES (#68)** | **YES (#66)** | 7th consecutive |
| **Q×F** | **8.8** | **8.8** | **13.4** | **—** |

---

## Canonical Metrics

| Metric | Run-17 | Run-16 | Run-15 | Run-14 |
|--------|--------|--------|--------|--------|
| Quality | 22/25 (88%) | 22/25 (88%) | 24/25 (96%) | 22/25 (88%) |
| Gates | 4/5 | 5/5 | 5/5 | 5/5 |
| Files committed | 10 + 1p | 10 + 3p | 14 | 12 |
| Total spans | ~38 | ~38 | 40 | ~28 |
| Cost | $10.43 | $12.29 | $6.44 | $5.59 |
| Push/PR | YES (#69) | YES (#68) | YES (#66) | YES (#65) |
| Q×F | 8.8 | 8.8 | 13.4 | 10.6 |
| Duration | 1h 51m | ~2h | ~54m | ~45m |

**Q×F = 8.8** — flat from run-16. The NDS improvement (+50pp) exactly offsets the SCH regression (-25pp) and new SCH-002 failure at the overall 22/25 level. The gate regression (4/5 vs 5/5) is not captured in Q×F; it represents a qualitative worsening even at the same numerical quality score.

---

## Failure Summary

### Primary Goal — RUN16-1 (token budget exhaustion): ✅ PARTIAL

The fix worked: context-capture-tool.js, reflection-tool.js, and summary-manager.js's generate functions all produced structured output. None failed with `null parsed_output` or `stop_reason: max_tokens`. However, the freed-up output now hits NDS-003 reconciler gaps instead — the files still cannot commit. Net result: failure mode changed, but files still don't commit.

### Primary Goal — RUN16-3 (0-span passthrough): ✅ CONFIRMED

commit-analyzer.js returned original unchanged with all try/catch blocks intact. NDS-005 passes for the first time since run-14. Full credit.

### New Failure: NDS-003 Gate Regression

The NDS-003 gate failed for the first time in runs 9–17. Root causes:
1. **Reconciler gap** (3 files): `startActiveSpan` wrapping inside nested callbacks introduces indentation shifts the reconciler misclassifies as line removals. Spiny-orb issue.
2. **Content corruption** (1 file, 1 instance): journal-graph.js dropped `}` from a template literal — 1 genuine agent error among 49 total violations.

### New Failure: git-collector.js COV-001 (Previously Undetected)

`getCommitData` (exported async, primary data orchestrator for all git collection) has no span. Only `getPreviousCommitTime` was instrumented in run-17. This failure likely existed in prior runs but was not caught by less thorough evaluation. The per-agent evaluation approach surfaced it. **Not a run-17 regression — a previously undetected gap.**

### New Failure: summary-graph.js SCH-002 (Previously Undetected)

Two attributes (`messages_count`, `quotes_count`) used for semantically incorrect domain values. Same note as git-collector: likely present in prior runs, first detected by thorough per-file evaluation. **Not a run-17 regression — a previously undetected gap.**
