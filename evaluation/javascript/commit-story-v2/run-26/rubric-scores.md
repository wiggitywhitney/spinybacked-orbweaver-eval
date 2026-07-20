// ABOUTME: Rubric scores for run-26 — dimension-level synthesis from per-file and PR evaluations.
# Rubric Scores — Run-26

**Date**: 2026-07-17
**Branch**: `spiny-orb/instrument-1784302707982`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/91

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — `node --check` exits 0 on all 14 committed files, zero syntax failures |
| NDS-002 (Tests) | Per-run | **PASS** — 630 tests pass, 1 skipped (acceptance-gate test requiring a live API key); push/PR required manual recovery (see below) but the gate itself is about test suite health, not delivery mechanics |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — all 14 committed files pass validator |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — `@opentelemetry/api` only across all 14 committed files |
| NDS-006 (Module system) | Per-file | **PASS** — no module system changes |

**Gates: 5/5 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 14/14 — no function signatures altered |
| NDS-007 (Control flow preserved) | **PASS** | 14/14 — all original catches preserved; graceful-degradation catches (ENOENT guards in journal-manager.js/summarize.js, MCP error returns, auto-summarize inner try/catch) correctly left unmodified throughout |

### Coverage (COV): 5/5 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| COV-001 (Entry points have spans) | **PASS** | All 14 committed files instrument their exported async entry points; all 9 exported functions in summary-manager.js committed cleanly with 0 partial |
| COV-003 (Failable ops have error visibility) | **PASS** | All committed-function catch blocks call `recordException` + `SpanStatusCode.ERROR` before rethrow; graceful-degradation catches correctly handled under NDS-007 precedent |
| COV-004 (Async ops have spans) | **PASS** — RUN25-1 REGRESSION RESOLVED | `summary-manager.js` committed all 9 exported async functions (vs. run-25's 7/9 with 2 blocked by a validator false-positive on the `if (err.code !== 'ENOENT') throw err` pattern). Advisory-only COV-004 findings this run (git-collector.js ×4, summary-manager.js ×5, summary-detector.js ×4) fire on unexported internal helpers correctly exempt under RST-004 — none are blocking |
| COV-005 (Domain attributes present) | **PASS** | All 14 committed files carry ≥1 meaningful domain attribute on every span, confirmed against source and/or live traces. Several files where the run-summary.md log's "attributesCreated" figure read 0 (context-integrator.js, context-capture-tool.js, journal-paths.js) were confirmed via source + live trace to carry real attributes — the log's figure counts only new schema extensions, not total attributes set (see per-file-evaluation.md methodology caveat #1) |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in journal-graph.js and summary-graph.js; manual spans establish active context before `model.invoke(...)` calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | All sync helpers excluded across all 14 committed files; `reflection-tool.js` (unexported async, all internal) correctly identified as a full-file RST-001 skip despite 2 attempts of deliberation |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 14/14 — unexported sync helpers excluded per RST-001; unexported async I/O helpers correctly instrumented where COV-004 requires it, correctly left unspanned elsewhere (git-collector.js's `runGit`/`getCommitMetadata`/`getCommitDiff`/`getMergeInfo`, summary-detector.js's 4 file-read helpers) |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in production dependencies; grep for `datadog\|dd-trace\|newrelic\|honeycomb` returns nothing |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 14 committed files; SDK packages only appear in devDependencies |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 41 total spans, all declared as schema extensions in `agent-extensions.yaml`; `commit_story.*` convention followed consistently |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys in committed spans registered in base semconv or agent-extensions; one ADVISORY (journal-paths.js reusing `file_path` for a directory-input context, self-flagged by the agent as only "semantically close enough") but non-blocking; summarize.js's semantic-duplicate resolution (weeks_count/months_count collapsed into dates_count) is a real trade-off but not a rule failure |
| SCH-003 (Attribute types correct) | **FAIL** | `journal-manager.js` — `commit_story.journal.reflections_count` declared `type: int` in `semconv/agent-extensions.yaml`, but code sets it via `String(reflections.length)`. Live trace confirms the mismatch: attribute emitted as the string `"0"`, not an integer. This is a real defect that survived to the committed code with only 1 generation attempt — the validator never caught it. |
| SCH-004 (No redundant entries) | **PASS** | No semantic duplicates among committed attributes; reuse of pre-registered attrs across files (e.g., summary-detector.js's `week_label`/`month_label`/`entries_count`/`file_path`) is intentional schema economy |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | All 14 committed files use `finally { span.end() }` correctly; no redundant calls |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 14 committed files; one ADVISORY (mcp/server.js — agent's thinking described a plan to also capture `server.name` but the committed code only sets `commit_story.mcp.transport`; a plan/implementation mismatch, not a functional defect) |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `SpanStatusCode.ERROR` in all outer catch blocks; graceful-degradation catches (NDS-007) excluded per methodology |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse |
| CDQ-006 (Expensive guards) | **PASS** | Count attributes are direct `.length`/`.size` calls or arithmetic on array lengths (non-expensive); no runtime-expensive computations gated incorrectly |
| CDQ-007 (No unbounded/PII) | **FAIL** | `utils/journal-paths.js` — `commit_story.journal.file_path` set as a raw filesystem path (e.g. `journal/summaries/daily/2026-07-17.md`) with no `basename()` applied, self-acknowledged by the agent as a known limitation rather than fixed despite `basename` from `node:path` being available but unused. Multiple other files (context-capture-tool.js, summary-manager.js ×12, summary-detector.js ×8, auto-summarize.js, index.js) raised the identical raw-path pattern as ADVISORY (non-blocking) — journal-paths.js is the sole instance the evaluation treats as a canonical FAIL, distinguished by the unused-but-available fix |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used consistently across all 14 committed files |

---

## Overall Score

| Dimension | Run-26 | Run-25 | Run-24 | Run-23 | Run-21 | Delta (vs run-25) |
|-----------|--------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **5/5 (100%)** | 4/5 (80%) | 5/5 (100%) | 5/5 (100%) | 4/5 (80%) | **+20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **3/4 (75%)** | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) | 4/4 (100%) | **-25pp** |
| CDQ | **6/7 (86%)** | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | 6/7 (86%) | **-14pp** |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | **23/25 (92%)** | **24/25 (96%)** | 23/25 (92%) | **-4pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | 5/5 (100%) | — |

The COV/SCH/CDQ movements roughly mirror-image run-25: run-26 fixed run-25's COV-004 regression (summary-manager.js now fully committed) but introduced two new failures elsewhere — a SCH-003 type mismatch and a CDQ-007 raw-path miss — that run-25 didn't have. Net total dropped 4pp because COV's +1 rule gain (COV-004 fixed) was offset by SCH's -1 and CDQ's -1 rule losses (two separate new failures, not one shared root cause).

---

## Canonical Metrics

| Metric | Run-26 | Run-25 | Run-24 | Run-23 | Run-21 |
|--------|--------|--------|--------|--------|--------|
| Quality score | **23/25 (92%)** | 24/25 (96%) | 23/25 (92%) | 24/25 (96%) | 23/25 (92%) |
| Gates | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| Committed files | **14** | 13 | 14 | 13 | 12 |
| Partial files | **0** | 1 | 0 | 1 | 0 |
| Failed files | **0** | 0 | 0 | 0 | 2 |
| Total spans | **41** | 47 (40 committed + 7 partial) | 48 | 45 | 42 |
| Model | **claude-sonnet-4-6** | claude-sonnet-4-6 | claude-sonnet-4-6 | claude-sonnet-4-6 | — |
| Cost | **$11.15** | $7.38 | ~$3.70 | ~$5.60 | ~$8.10 |
| Q×F | **12.88** | 12.48 | 12.88 | 12.48 | 11.0 |
| Push/PR | **MANUAL (#91)** — eval-side cause, not a spiny-orb defect (see RUN26-3) | AUTO ✅ (#86) | AUTO ✅ (#81) | AUTO ✅ (#75) | AUTO ✅ (#74) |
| IS | **100/100** | 100/100 | 80/100 | 80/100 | 90/100 |

**Q×F = 12.88** (23/25 × 14). Ties run-24's Q×F exactly — same underlying arithmetic (92% quality × 14 committed files). Run-26 committed one more file than run-25 (14 vs 13, since summary-manager.js's partial from run-25 is now fully committed) but at a lower quality percentage (92% vs 96%), netting a higher raw Q×F than run-25 (12.88 vs 12.48) despite the quality regression — file-count gains outweigh the quality dip in this metric.

**Fix verification summary**:
- **RUN25-1 (COV-004 / summary-manager.js validator false positive)**: ✅ RESOLVED — all 9 exported async functions committed cleanly in 2 attempts, no partial. Validation journey shows 2 legitimate attempts driven by real missing-`recordException` findings, not false-positive rejections.
- **NEW: SCH-003 (journal-manager.js `reflections_count`)**: ❌ NEW FAILURE — `int`-declared attribute emitted as string; validator did not catch it (1 attempt, clean pass)
- **NEW: CDQ-007 (journal-paths.js raw path)**: ❌ NEW FAILURE — `basename()` available but unused; self-acknowledged limitation, not attempted

---

## Failure Analysis

### SCH-003: journal-manager.js — reflections_count type mismatch (NEW FAILURE)

`commit_story.journal.reflections_count` is declared `type: int` in `semconv/agent-extensions.yaml`. The committed code sets it via `span.setAttribute('commit_story.journal.reflections_count', String(reflections.length))` — an explicit string coercion of a value that was already a number (`.length`). The live trace confirms the mismatch at runtime: the attribute is emitted as the quoted string `"0"`, not an integer.

**Root cause**: Unlike git-collector.js's SCH-003 history (run-24's mismatch, de-facto resolved in run-25 by omitting the attribute entirely), this is not a case of the agent avoiding a known problem — this file only needed 1 generation attempt, meaning the validator's SCH-003 check never fired on this attribute during generation. The spiny-orb SCH-003 validator apparently does not reliably catch `String(x.length)`-style coercions where the underlying source value is numeric but gets explicitly stringified before `setAttribute`. This is a validator coverage gap, not an agent reasoning failure — the agent had no signal to correct.

**Fix needed in spiny-orb**: SCH-003's type-check should flag explicit `String(...)` wrapping of a value being set against an `int`/`number`-typed registry attribute, not just infer type from the literal AST node passed to `setAttribute`.

### CDQ-007: journal-paths.js — raw filesystem path, fix available but unused (NEW FAILURE)

`commit_story.journal.file_path` on the `ensureDirectory` span is set to the full relative path (e.g. `journal/summaries/daily/2026-07-17.md`) rather than a basename. The agent's own instrumentation report explicitly flags this as a known CDQ-007 limitation and recommends importing `basename` from `node:path` — but the fix was never applied even though `node:path` utilities were available in this same codebase (used correctly in other committed files this run).

**Root cause**: This is a self-acknowledged agent limitation, not a validator gap — the report language matches the boilerplate advisory text used across every other file's non-blocking CDQ-007 finding, which may explain why the fix wasn't prioritized: the same generic "lower severity — fix when convenient" framing was applied here despite `basename` being trivially available, unlike other files where importing it might require a new dependency or restructuring.

**Comparison across the run**: This is the only CDQ-007 finding out of ~30 raw-path/PII advisories this run that the evaluation treats as a canonical FAIL rather than ADVISORY — every other instance either lacks an available fix in-file or involves attributes that are genuinely non-PII (per journal-manager.js's CDQ-007 PASS, where the real PII risk `commit.author` was correctly skipped entirely).

---

## Resolved from Run-25

| Rule | File(s) | Status |
|------|---------|--------|
| COV-004 (summary-manager.js validator false positive on conditional-rethrow ENOENT pattern) | summary-manager.js | **RESOLVED** — all 9 exported async functions committed with 0 partial in run-26, vs. 7/9 + 2 blocked in run-25 |

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| SCH-003 | SCH | journal-manager.js (`reflections_count`) | Validator does not catch `String(x.length)` coercion against an `int`-typed registry attribute | 1 run (new) |
| CDQ-007 | CDQ | journal-paths.js (`file_path`) | Self-acknowledged agent limitation — `basename()` available but not applied; generic advisory framing may have deprioritized an easy fix | 1 run (new) |
