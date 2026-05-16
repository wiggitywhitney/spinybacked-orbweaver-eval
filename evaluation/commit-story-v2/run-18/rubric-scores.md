# Rubric Scores — Run-18

**Date**: 2026-05-16
**Branch**: spiny-orb/instrument-1778932891597
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/70

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 11 committed files pass `node --check` |
| NDS-002 (Tests) | Per-run | **PASS** — 565/565 tests pass |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — 11/11 files |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — 11/11 files |
| NDS-006 (Module system) | Per-file | **PASS** — 11/11 files |

**Gates**: 5/5 PASS

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 11/11 |
| NDS-005 (Error handling preserved) | **PASS** | 11/11 |

### Coverage (COV): 5/5 (100%)

| Rule | Result | Files |
|------|--------|-------|
| COV-001 (Entry points have spans) | **PASS** | 11/11 |
| COV-003 (Failable ops have error visibility) | **PASS** | 11/11 applicable |
| COV-004 (Async ops have spans) | **PASS** | 11/11 — summary-manager.js achieves full 9/9 exported async coverage (3→6→9 span trajectory); git-collector.js now 2/2 (RUN17-3 resolved) |
| COV-005 (Domain attributes present) | **PASS** | 11/11 |
| COV-006 (Auto-instrumentation preferred) | **PASS** | journal-graph.js notes `@traceloop/instrumentation-langchain` |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 11/11 — 15 correct skips confirmed |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 11/11 |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in dependencies |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 11 committed files |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 36 new span IDs, all declared as schema extensions; `commit_story.*` convention followed |
| SCH-002 (Attribute keys match registry) | **FAIL** | journal-manager.js uses `commit_story.journal.quotes_count` for `reflections.length` — attribute is defined as "Number of developer quotes extracted for the entry" (journal generation context); reflection discovery is a distinct operation class. Correct key: `commit_story.journal.reflections_count` or a new extension |
| SCH-003 (Attribute types correct) | **PASS** | Count attributes (int) via `.length`; labels (string); timestamps via `.toISOString()` (string); all types match registry declarations |
| SCH-004 (No redundant entries) | **PASS** | No true semantic duplicates (SCH-001 advisories in PR summary are false positives on correctly declared extensions) |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All 11 committed files: `span.end()` in `finally` blocks throughout; no unclosed path |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 11 committed files |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `SpanStatusCode.ERROR` in all outer catch blocks |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse |
| CDQ-006 (Expensive guards) | **PASS** | No expensive computations guarded; all attribute values are direct property accesses or `.length`/`.size` calls |
| CDQ-007 (No unbounded/PII) | **PASS** | All committed files: counts from `.length`/`.size` (non-nullable); timestamps via `.toISOString()`; nullable fields guarded. Raw `file_path` advisory in journal-paths.js and journal-manager.js is a known CDQ-007 low-severity finding (import constraint prevents basename); not a canonical failure |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used consistently across all 11 files |

---

## Overall Score

| Dimension | Score | Run-17 | Run-16 | Run-15 | Delta (vs run-17) |
|-----------|-------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **5/5 (100%)** | 3/5 (60%) | 3/5 (60%) | 4/5 (80%) | **+40pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **3/4 (75%)** | 3/4 (75%) | 4/4 (100%) | 4/4 (100%) | — |
| CDQ | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | — |
| **Total** | **24/25 (96%)** | **22/25 (88%)** | **22/25 (88%)** | **24/25 (96%)** | **+8pp** |
| **Gates** | **5/5 (100%)** | **4/5 (80%)** | **5/5 (100%)** | **5/5 (100%)** | **+1 gate** |

---

## Canonical Metrics

| Metric | Run-18 | Run-17 | Run-16 | Run-15 |
|--------|--------|--------|--------|--------|
| Quality | **24/25 (96%)** | 22/25 (88%) | 22/25 (88%) | 24/25 (96%) |
| Gates | **5/5** | 4/5 | 5/5 | 5/5 |
| Files committed | 11 | 10+1p | 10+3p | 14 |
| Total spans | **36** | ~28 | ~24 | ~37 |
| Cost | **$9.16** | $10.43 | $12.29 | $6.44 |
| Push/PR | YES (#70, manual) | YES (#69) | YES (#68) | YES (#66) |
| Quality × Files | **10.6** | 8.8 | 8.8 | 13.4 |
| Duration | 103 min | ~55 min | ~55 min | ~53 min |

**Quality × Files = 10.6** — improvement from run-17's 8.8; below run-15's 13.4 record (fewer files committed due to RUN17-1 persisting).

---

## Failure Analysis

### SCH-002: journal-manager.js — `quotes_count` attribute semantic mismatch

`commit_story.journal.quotes_count` is a registered schema attribute defined as "Number of developer quotes extracted for the entry" — a journal generation context attribute (used by AI section generators that extract memorable quotes from commits).

In run-18's `discoverReflections` function, the agent sets `commit_story.journal.quotes_count` to `reflections.length` — the count of reflection entries discovered in a time window by reading markdown files. This is a distinct operation class: file system traversal and count, not AI extraction of quotes.

The type match is correct (both are `int`), but the semantic definition does not align. A reviewer looking at a trace would expect `quotes_count` to represent AI-extracted quotes from a journal entry generation operation, not the count of previously written reflection files.

**Correct fix**: Use `commit_story.journal.reflections_count` (which appeared in run-17 via `agent-extensions.yaml`) or declare `commit_story.journal.discovered_reflections_count` as a new schema extension.

**Run-over-run pattern**: This is the same SCH-002 pattern from run-17 (summary-graph.js used `messages_count`/`quotes_count` for wrong domains) and run-12 (attribute type mismatches). The prompt's semantic precision rule (PRD #857, M2-M3) addresses count attribute selection — this may be a case where the rule wasn't applied correctly, or the registered description is ambiguous.

---

## COV Improvement Analysis

COV improved from 3/5 (60%) in runs 16–17 to 5/5 (100%) in run-18. Three fixes contributed:

1. **git-collector.js getCommitData** (RUN17-3): issue #855 bypass of MIN_STATEMENTS for exported async functions. `getCommitData` has 2 statements (Promise.all + return) — was previously dropped silently.

2. **summary-manager.js generateAndSave* functions** (RUN17-1 partial): same issue #855 fix. The three orchestrators each have 2–3 statements, below the previous threshold.

3. **Run-17's 3 other COV failures** (index.js, context-capture-tool.js, reflection-tool.js): These files FAILED in run-18 (NDS-003 reconciler gap), so COV couldn't be assessed — they don't appear in the committed file count. The COV score of 5/5 reflects only the 11 committed files.

The 4 failed files would likely add COV-001 findings if they could commit (particularly index.js `main()` and the MCP tool handlers). The 5/5 COV score is correct for committed files but does not represent full repository COV coverage.
