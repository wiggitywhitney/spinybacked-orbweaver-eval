# Rubric Scores — Run-13

**Date**: 2026-04-12
**Branch**: spiny-orb/instrument-1776014409398
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/62

**Scoring scope**: 7 committed files only. journal-graph.js partial was not preserved in git and is excluded from scoring. Its ongoing NDS-003 failure (summaryNode) is documented in the Ongoing Issues section.

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — checkpoint mechanism confirmed no syntax errors in 7 committed files |
| NDS-002 (Tests) | Per-run | **PASS** — checkpoint rollbacks removed the two test-breaking files; committed set does not break tests |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 7/7 committed files. journal-graph.js summaryNode excluded (not committed) |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 7/7 files |
| NDS-006 (Module system) | Per-file | **PASS** — 7/7 files |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 7/7 |
| NDS-005 (Error handling preserved) | **PASS** | 7/7 — inner expected-condition catches correctly left without recordException; outer catches have recordException + setStatus |

### Coverage (COV): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 7/7 applicable |
| COV-002 (I/O operations traced) | **PASS** | 7/7 — filesystem, subprocess, and summary I/O covered |
| COV-003 (Failable ops have error visibility) | **PASS** | 7/7 applicable |
| COV-004 (Async ops have spans) | **PASS** | 7/7 — all exported async functions in committed files are instrumented |
| COV-005 (Domain attributes present) | **PASS** | 7/7 — all spans have at least one domain attribute |
| COV-006 (Auto-instrumentation preferred) | **N/A** | 0/0 applicable — none of the 7 committed files use auto-instrumented libraries |

**Note**: The CDQ-007 failure that would have been present in journal-manager.js (commit.timestamp.split on Date object) was caught by checkpoint 2 and that file was rolled back — so the checkpoint mechanism prevented a CDQ-007 failure from entering the committed set.

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 7/7 — 30+ sync utility functions correctly skipped across all committed files |
| RST-002 (No trivial accessor spans) | **PASS** | N/A |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 7/7 — unexported async helpers in summary-detector.js and auto-summarize.js correctly skipped |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api: ^1.9.0` in peerDependencies |
| API-003 (No vendor SDKs) | **PASS** | No OTel SDK in runtime deps |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported in committed files |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 16 unique span names in committed files, all registered in agent-extensions or existing schema |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys from registry or registered extensions |
| SCH-003 (Attribute types correct) | **PASS** | force=boolean, *_count=int, timestamps=ISO string, labels=string |
| SCH-004 (No redundant entries) | **PASS** | SCH-004 advisories on summarize.js are false positives (date_count ≠ time_window timestamps; force ≠ max_tokens) |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All paths close spans via try/finally |
| CDQ-002 (Tracer name) | **PASS** | 'commit-story' in all 7 files |
| CDQ-003 (Error recording) | **PASS** | recordException + SpanStatusCode.ERROR on all non-expected-condition catches |
| CDQ-005 (Async context) | **PASS** | startActiveSpan with async callbacks throughout |
| CDQ-006 (Expensive guards) | **PASS** | `filePath.split('/').pop()` in journal-paths.js is O(1) — exempt |
| CDQ-007 (No unbounded/PII) | **PASS** | journal-manager.js CDQ-007 failure was caught by checkpoint and rolled back; committed files are clean |
| CDQ-008 (Consistent naming) | **PASS** | 'commit-story' everywhere |

---

## Overall Score

| Dimension | Run-13 | Run-12 | Run-11 | Delta (13 vs 12) |
|-----------|--------|--------|--------|-----------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | 5/5 (100%) | 4/5 (80%) | 5/5 (100%) | **+20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | **+14pp** |
| **Total** | **25/25 (100%)** | **23/25 (92%)** | **25/25 (100%)** | **+8pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | — |

**Quality: 25/25 restored.** The two run-12 failures (COV-004 on summary-manager.js, CDQ-007 on journal-manager.js) do not appear in the committed set: summary-manager.js was rolled back by checkpoint 2, and journal-manager.js's CDQ-007 failure was also caught by checkpoint 2 and rolled back. The NDS-003 truthy-check fix (PR #391) worked — no truthy-guard NDS-003 violations in the committed set.

---

## Canonical Metrics

| Metric | Run-13 | Run-12 | Run-11 | Run-10 |
|--------|--------|--------|--------|--------|
| Quality | **25/25 (100%)** | 23/25 (92%) | 25/25 (100%) | 23/25 (92%) |
| Gates | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| Files committed | 7 | 12 + 1 partial | 13 | 12 |
| Checkpoint failures | 2 | 0 | 0 | 0 |
| Total spans (committed) | 16 | 28 + 3 partial | 39 | 28 |
| Cost | ~$6.41 | $5.19 | $4.25 | $4.36 |
| Push/PR | YES (#62) | YES (#61) | YES (#60) | NO |
| Quality × Files | **7.0** | 11.0 | 13.0 | 11.0 |
| Duration | 65.7 min | 53.8 min | 41.2 min | 45.9 min |

**Quality × Files = 7.0** — lowest ever. Quality restored to 25/25 but at significant reduction in committed file count (7 vs target 13).

---

## Ongoing Issues

### journal-graph.js summaryNode NDS-003 — 3rd consecutive run

| Run | Outcome | Root cause |
|-----|---------|------------|
| Run-11 | summaryNode skipped | NDS-003 Code Preserved |
| Run-12 | summaryNode skipped | NDS-003 Code Preserved, 3 attempts |
| Run-13 | summaryNode skipped, partial not committed | NDS-003 Code Preserved, 3 attempts; partial not preserved in git |

The agent modifies `const systemContent = \`${guidelines}` (line 27) every attempt. This is a structural problem — the agent cannot instrument summaryNode without touching the template literal. Three consecutive runs, same failure. Prompt guidance needed to avoid modifying template literal structure.

### Checkpoint failures — new failure class

Two checkpoint test failures caused 10 files to be rolled back. Both are type-safety gaps:

| Failure | Root cause | Fix guidance needed |
|---------|-----------|---------------------|
| summary-graph.js `null.length` | Agent used `!== undefined` but parameter can be `null`; `null !== undefined` is true | Use `!= null` to guard against both null and undefined |
| journal-manager.js `Date.split()` | Agent assumed timestamp is always a string; tests pass Date objects | Use `new Date(value).toISOString()` for type-agnostic string conversion |

Both failures were caught by the checkpoint mechanism and correctly rolled back. The committed set is clean. But 10 files (including meaningful instrumentation in summary-manager.js, index.js, journal-manager.js, mcp/server.js) were discarded as collateral.

**Smart rollback opportunity**: Both checkpoint failures had explicit file paths in the stack trace. A targeted rollback (revert only the file containing the failing code, keep the other 4 in the window) would have preserved 8 additional files while still catching the bugs.
