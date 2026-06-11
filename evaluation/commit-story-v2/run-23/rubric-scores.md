# Rubric Scores — Run-23

**Date**: 2026-06-10
**Branch**: spiny-orb/instrument-1781089793056
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/75

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 13 committed files pass `node --check`; mcp/server.js and index.js both committed clean (RUN21-1 and RUN21-2 resolved) |
| NDS-002 (Tests) | Per-run | **PASS** — pre-push hook passed; auto-push succeeded |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — all 13 committed files pass validator; mcp/server.js (blank-line-near-JSDoc fix, issue #917) and index.js (import expansion fix, issue #916) both committed clean for the first time since run-20 |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — `@opentelemetry/api` only across all 13 committed files and 1 partial |
| NDS-006 (Module system) | Per-file | **PASS** — no module system changes |

**Gates: 5/5 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 13/13 — no function signatures altered |
| NDS-007 (Error handling preserved) | **PASS** | 13/13 — all original catches preserved; graceful-degradation catches (MCP tool pattern) correctly left unmodified throughout |

### Coverage (COV): 5/5 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| COV-001 (Entry points have spans) | **PASS** | All 13 committed files instrument their exported async entry points; index.js `main()` (program entry point, committed this run for the first time); mcp/server.js `main()` (committed clean this run) |
| COV-003 (Failable ops have error visibility) | **PASS** | All 13 committed files have outer catch with `recordException` + `SpanStatusCode.ERROR` + rethrow; context-capture-tool.js `capture_context` graceful-degradation catch correctly handled under NDS-007 precedent |
| COV-004 (Async ops have spans) | **PASS** | All async functions in committed files instrumented; summary-manager.js commits all 9 spans (full suite, same as run-21); summary-detector.js commits 4/5 exported async fns (1 skipped via validator SCH-002 rejection — not an agent quality failure); context-capture-tool.js `saveContext` (unexported async I/O) correctly instrumented under COV-004 |
| COV-005 (Domain attributes present) | **PASS** | RUN21-4 resolved — summary-manager.js `saveDailySummary` now sets `entry_date` on the span unconditionally (before the file-already-exists early-return guard); all other 12 committed files have ≥1 domain attribute on every span; summary-detector.js partial passes for 4 committed functions |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in journal-graph.js and summary-graph.js; manual spans establish active context before `model.invoke(...)` calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 16 correct skips confirmed; all sync helpers excluded across all committed files; reflection-tool.js (unexported async, all internal) correctly re-classified as a skip on 2 attempts |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 13/13 — unexported helpers excluded where RST-004 applies; unexported async I/O helpers correctly instrumented where COV-004 requires it |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` (unchanged) |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in production dependencies; OTel SDK packages are devDependencies only |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 13 committed files |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 45 total spans, all declared as schema extensions in `agent-extensions.yaml`; `commit_story.*` convention followed consistently; 22 SCH-001 advisories in PR are systematic false positives (checker does not recognize in-run registered extensions) |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys in committed spans registered in base semconv or agent-extensions; `commit_story.journal.base_path` registered via summary-detector.js committed functions; `findUnsummarizedWeeks` rejected as SCH-002 violation (near-synonym of `file_path`) — validator correct, partial file not a rubric failure on committed spans |
| SCH-003 (Attribute types correct) | **FAIL** | Two files with type mismatches: (1) `git-collector.js` — `commit_story.git.diff_size` declared `type: string` in agent-extensions.yaml but set as bare integer `diff.length`; (2) `commands/summarize.js` — `commit_story.summarize.daily_summaries_generated`, `weekly_summaries_generated`, `monthly_summaries_generated` declared `type: string` but set as bare integer `result.generated.length` (no `String()` conversion). `auto-summarize.js` correctly wraps the same attributes with `String()`. |
| SCH-004 (No redundant entries) | **PASS** | No semantic duplicates among committed attributes; `commit_story.summarize.dates_count` reuse across summary-detector spans is intentional schema economy |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | Run-21 FAIL resolved — claude-collector.js committed clean, no double-end in `startActiveSpan` callback; context-capture-tool.js `saveContext` and `capture_context` handler both use `finally { span.end() }` only (no try-block redundant call); index.js `finally { span.end() }` inside `startActiveSpan` is correct and required (process.exit() bypasses Promise resolution — explicit close is the only safe pattern); all 13 files PASS |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 13 committed files |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `SpanStatusCode.ERROR` in all outer catch blocks; graceful-degradation catches (NDS-007) excluded per methodology |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse |
| CDQ-006 (Expensive guards) | **PASS** | Count attributes are direct `.length`/`.size` calls (non-expensive); CDQ-007 advisory findings in pr-evaluation.md (filesystem path attrs in summary-detector.js and context-capture-tool.js) are advisory, not canonical failures per established rubric precedent |
| CDQ-007 (No unbounded/PII) | **PASS** | 41 CDQ-007 advisories in PR body are systematic non-actionable (generic "PII or path" message on `journal.file_path` — a filesystem path that is a known documented limitation, consistent with run-20/run-21 treatment); all canonical setAttribute calls have null-guards or are compile-time constants |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used consistently across all 13 committed files |

---

## Overall Score

| Dimension | Run-23 | Run-21 | Run-20 | Run-19 | Run-18 | Delta (vs run-21) |
|-----------|--------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **5/5 (100%)** | 4/5 (80%) | 4/5 (80%) | 2/5 (40%) | 5/5 (100%) | **+20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **3/4 (75%)** | 4/4 (100%) | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) | **-25pp** |
| CDQ | **7/7 (100%)** | 6/7 (86%) | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | **+14pp** |
| **Total** | **24/25 (96%)** | 23/25 (92%) | 24/25 (96%) | 21/25 (84%) | 24/25 (96%) | **+4pp** |
| **Gates** | **5/5 (100%)** | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | — |

---

## Canonical Metrics

| Metric | Run-23 | Run-21 | Run-20 | Run-19 | Run-18 |
|--------|--------|--------|--------|--------|--------|
| Quality score | **24/25 (96%)** | 23/25 (92%) | 24/25 (96%) | 21/25 (84%) | 24/25 (96%) |
| Gates | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| Committed files | **13** | 12 | 12 | 10 | 11 |
| Partial files | **1** | 0 | 0 | 3 | 0 |
| Failed files | **0** | 2 | 1 | 0 | 0 |
| Total spans (committed) | **45** | 42 | 42 | 30 | 36 |
| Cost | **$7.84** | $8.10 | $9.08 | $8.83 | $9.16 |
| Q×F | **12.48** | 11.0 | 11.5 | 8.4 | 10.6 |
| Push/PR | **AUTO ✅ (#75)** | AUTO ✅ (#74) | AUTO ✅ (#73) | AUTO ✅ (#71) | YES (#70, manual) |
| IS | **TBD** | 90/100 | 80/100 | 80/100 | 90/100 |

**Q×F = 12.48** (24/25 × 13). Improvement of +1.48 from run-21 (11.0) and recovery to near-run-20 levels (11.5). PRD Q×F target of ≥ 12.5 not met — short by 0.02. Root cause: summary-detector.js counted as partial (1 function missing) rather than a full committed file. If summary-detector.js had committed all 5 functions, Q×F = 24/25 × 14 = 13.44, comfortably above target. The SCH-003 regression (2 files × 1 point = -1 quality point) also contributed — without it, Q×F = 25/25 × 13 = 13.0.

---

## Failure Analysis

### SCH-003: git-collector.js `diff_size` (new)

`git-collector.js` declares `commit_story.git.diff_size` as `type: string` in `agent-extensions.yaml` but sets it with `span.setAttribute('commit_story.git.diff_size', diff.length)` — a bare integer (no `String()` conversion). This contradicts the declared schema type.

The same pattern appears in `commands/summarize.js` for the `*_summaries_generated` attributes (see below). Two independent SCH-003 failures in the same run suggest a systemic guidance gap: agents are not reliably applying `String()` conversion when setting attributes declared as `type: string` from numeric sources.

**Fix**: `span.setAttribute('commit_story.git.diff_size', String(diff.length))` or change the schema declaration to `type: int`.

### SCH-003: commands/summarize.js `*_summaries_generated` (recurrence)

`commands/summarize.js` sets `commit_story.summarize.daily_summaries_generated`, `weekly_summaries_generated`, and `monthly_summaries_generated` as bare integers (`result.generated.length`). All three are declared `type: string` in `agent-extensions.yaml`.

The identical attributes in `auto-summarize.js` are correctly wrapped with `String(result.generated.length)`. The discrepancy was introduced when `summarize.js` was newly instrumented in run-23 — it did not reuse `auto-summarize.js`'s pattern.

**Fix**: Add `String()` conversion on all three setAttribute calls, consistent with `auto-summarize.js`.

**Root cause (both SCH-003 failures)**: Schema type mismatch is not caught until the per-file evaluation stage. Agents set `result.generated.length` or `diff.length` directly — valid JS, but wrong for `type: string` declarations. No runtime error; the mismatch is silent. A schema validation step during instrumentation (or explicit guidance to use `String()` on all numeric sources declared as `type: string`) would catch these at instrument time.

### summary-detector.js partial (SCH-002 validator rejection)

`findUnsummarizedWeeks` was not committed. The agent declared `commit_story.journal.base_path` as a new attribute to capture the `basePath` parameter — a near-synonym of the registered `commit_story.journal.file_path`. The validator correctly rejected it as a semantic duplicate (SCH-002) on both attempts. No self-correction occurred. This is a regression from run-21 where the function committed cleanly using `commit_story.summary.unsummarized_weeks_count`.

The correct approach: either reuse `commit_story.journal.file_path` for the `basePath` value, or instrument only the output count attribute (as run-21 did) rather than the parameter.

This is not a quality failure on the 4 committed functions — those all pass. The partial reduces Q×F from 13.44 to 12.48.

**Root cause**: The agent treated a configuration parameter (`basePath`, typically `'.'`) as a semantically significant attribute candidate, rather than focusing on the output metric. The SCH-002 oscillation (declaring the same attribute twice without self-correcting to an existing key) is the same pattern as summary-graph.js (where the agent DID self-correct), but with the opposite outcome. No prompt guidance currently covers "prefer reusing registered output-count attributes over declaring new input-parameter attributes."

---

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| SCH-003 | SCH | git-collector.js (`diff_size`) | `diff.length` integer set without `String()` conversion; declared `type: string` | New (run-23) |
| SCH-003 | SCH | commands/summarize.js (`*_summaries_generated`) | `result.generated.length` integer set without `String()` conversion; declared `type: string`. Same attrs correctly wrapped in auto-summarize.js. | New (run-23) |
| Partial: summary-detector.js | — | `findUnsummarizedWeeks` skipped | SCH-002 validator rejection: `commit_story.journal.base_path` declared as near-synonym of registered `file_path`; no self-correction across 2 attempts | New (run-23) |

**Resolved from run-21:**

| Rule | File(s) | Status |
|------|---------|--------|
| CDQ-001 (claude-collector.js double-end in startActiveSpan) | claude-collector.js | **RESOLVED** — issue #915 prompt guidance update confirmed effective |
| COV-005 (summary-manager.js saveDailySummary skip-path) | summary-manager.js | **RESOLVED** — RUN21-4: `entry_date` now set before the file-already-exists guard; all 9 spans have ≥1 domain attribute |
| NDS-003 (mcp/server.js blank-line-near-JSDoc) | mcp/server.js | **RESOLVED** — issue #917 `removeOtelImports` trivia-doubling fix; committed clean 1 attempt after 3 consecutive failures |
| NDS-003 + NDS-005 (index.js import expansion) | index.js | **RESOLVED** — issue #916 "do not reformat single-line import blocks" guidance; committed clean 1 attempt after run-21 failure |
