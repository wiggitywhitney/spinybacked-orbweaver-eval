// ABOUTME: Rubric scores for run-25 — dimension-level synthesis from per-file and PR evaluations.
# Rubric Scores — Run-25

**Date**: 2026-06-20
**Branch**: `spiny-orb/instrument-1781909345452`
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/86

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 13 committed files pass `node --check`; 0 failures, 0 syntax errors |
| NDS-002 (Tests) | Per-run | **PASS** — pre-push hook passed; auto-push/PR succeeded (seventeenth consecutive) |
| NDS-003 (Non-instrumentation lines) | Per-file | **PASS** — all 13 committed files pass validator |
| API-001 (Only @opentelemetry/api) | Per-file | **PASS** — `@opentelemetry/api` only across all 13 committed files |
| NDS-006 (Module system) | Per-file | **PASS** — no module system changes |

**Gates: 5/5 PASS**

---

## Dimension Scores

### Non-Destructiveness (NDS): 2/2 (100%)

| Rule | Result | Files |
|------|--------|-------|
| NDS-004 (API signatures preserved) | **PASS** | 13/13 — no function signatures altered |
| NDS-007 (Control flow preserved) | **PASS** | 13/13 — all original catches preserved; graceful-degradation catches (ENOENT loops, MCP error returns, node-function fallback state returns) correctly left unmodified throughout; summary-manager.js inner catches correctly identified as NDS-007 paths |

### Coverage (COV): 4/5 (80%)

| Rule | Result | Evidence |
|------|--------|----------|
| COV-001 (Entry points have spans) | **PASS** | All 13 committed files instrument their exported async entry points; the 2 blocked functions in summary-manager.js would have had spans but were rejected by the validator — consistent with COV-001 partial-file precedent from run-20/run-21/run-23/run-24 |
| COV-003 (Failable ops have error visibility) | **PASS** | All committed-function catch blocks call `recordException` + `SpanStatusCode.ERROR` before rethrow; graceful-degradation catches correctly handled under NDS-007 precedent |
| COV-004 (Async ops have spans) | **FAIL** | `summary-manager.js` — 2 exported async functions (`readWeekDailySummaries`, `readMonthWeeklySummaries`) have no committed spans; validator rejected both due to false-positive on conditional-rethrow ENOENT catch pattern (see Failure Analysis below) |
| COV-005 (Domain attributes present) | **PASS** | All 13 committed files carry ≥1 meaningful domain attribute on every span. Three coverage delta observations (not failures): `context-capture-tool.js` dropped `entry_date` (3→1 attrs across 3 consecutive runs — declining trend); `journal-graph.js` dropped `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` from node spans; `summary-detector.js` uses 0 new schema extensions (all 9 span attributes pre-registered). COV-005 is a minimum bar (≥1 domain attribute), not a sameness requirement. |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in journal-graph.js and summary-graph.js; manual spans establish active context before `model.invoke(...)` calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 16 correct genuine skips confirmed (17th entry in run-summary.md is a bookkeeping artifact for context-integrator.js, which was actually committed); all sync helpers excluded across all committed files; reflection-tool.js (unexported async, all internal) correctly identified as RST-001 skip on 2 attempts for 3rd consecutive run |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 13/13 — unexported sync helpers excluded per RST-001; unexported async I/O helpers correctly instrumented where COV-004 requires it (git-collector.js, context-capture-tool.js, summary-detector.js) |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` (unchanged) |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in production dependencies; OTel SDK packages are devDependencies only |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 13 committed files |

### Schema Fidelity (SCH): 4/4 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 47 total spans, all declared as schema extensions in `agent-extensions.yaml`; `commit_story.*` convention followed consistently; SCH-001 advisories in PR are systematic false positives (checker does not recognize in-run registered extensions) |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys in committed spans registered in base semconv or agent-extensions; no near-synonyms |
| SCH-003 (Attribute types correct) | **PASS** | All committed attributes match declared types; git-collector.js omitted `commit_story.git.diff_lines` entirely rather than reintroducing the type mismatch — SCH-003 not triggered for this file in run-25. Note: the `fixAttributeTypeCoercions()` auto-coercion backstop (spiny-orb commit 91e9413) was not exercised — the agent sidestepped the issue. |
| SCH-004 (No redundant entries) | **PASS** | No semantic duplicates among committed attributes; reuse of pre-registered attrs across files is intentional schema economy |

### Code Quality (CDQ): 7/7 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **PASS** | **RUN24-1 fix confirmed.** `index.js` — `fixProcessExitSpanEnd()` AST restructure (spiny-orb commit 91e9413) moved `process.exit()` to a `.then().catch()` microtask chain *after* the `startActiveSpan` callback's `finally { span.end(); }` executes. All 13 committed files use `finally { span.end() }` correctly. First run with this fix confirmed at runtime. |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 13 committed files |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `SpanStatusCode.ERROR` in all outer catch blocks; graceful-degradation catches (NDS-007) excluded per methodology |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse |
| CDQ-006 (Expensive guards) | **PASS** | Count attributes are direct `.length`/`.size` calls or arithmetic on array lengths (non-expensive); CDQ-006 advisories in PR body are false positives — these files use only pre-set variables, not runtime-expensive computations; advisory cannot apply per established rubric precedent |
| CDQ-007 (No unbounded/PII) | **PASS** | CDQ-007 advisories in PR body are systematic non-actionable (path attributes on `journal.file_path` — a filesystem path that is a known documented limitation; commit.message truncated to first line); no unbounded or PII attributes in committed spans |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used consistently across all 13 committed files |

---

## Overall Score

| Dimension | Run-25 | Run-24 | Run-23 | Run-21 | Run-20 | Delta (vs run-24) |
|-----------|--------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **4/5 (80%)** | 5/5 (100%) | 5/5 (100%) | 4/5 (80%) | 4/5 (80%) | **-20pp** |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **4/4 (100%)** | 3/4 (75%) | 3/4 (75%) | 4/4 (100%) | 4/4 (100%) | **+25pp** |
| CDQ | **7/7 (100%)** | 6/7 (86%) | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | **+14pp** |
| **Total** | **24/25 (96%)** | **23/25 (92%)** | **24/25 (96%)** | 23/25 (92%) | 24/25 (96%) | **+4pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** | 5/5 (100%) | 5/5 (100%) | — |

---

## Canonical Metrics

| Metric | Run-25 | Run-24 | Run-23 | Run-21 | Run-20 |
|--------|--------|--------|--------|--------|--------|
| Quality score | **24/25 (96%)** | 23/25 (92%) | 24/25 (96%) | 23/25 (92%) | 24/25 (96%) |
| Gates | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| Committed files | **13** | 14 | 13 | 12 | 12 |
| Partial files | **1** | 0 | 1 | 0 | 0 |
| Failed files | **0** | 0 | 0 | 2 | 1 |
| Total spans | **47** (40 committed + 7 partial) | 48 | 45 | 42 | 42 |
| Model | **claude-sonnet-4-6** | claude-sonnet-4-6 | claude-sonnet-4-6 | — | — |
| Cost | **$7.38** | ~$3.70 | ~$5.60 | ~$8.10 | $9.08 |
| Q×F | **12.48** | 12.88 | 12.48 | 11.0 | 11.5 |
| Push/PR | **AUTO ✅ (#86)** | AUTO ✅ (#81) | AUTO ✅ (#75) | AUTO ✅ (#74) | AUTO ✅ (#73) |
| IS | **100/100** | 80/100 | 80/100 | 90/100 | 80/100 |

**Q×F = 12.48** (24/25 × 13). Ties run-23 at the same Q×F despite the same quality score. One fewer committed file vs run-24 (13 vs 14) keeps Q×F below run-24's 12.88. If summary-manager.js had been fully committed (14 files, 25/25): 14.0 — an all-time record and the exact target set by the PRD's success criteria. The summary-manager.js partial (validator false positive on conditional-rethrow ENOENT pattern) is the sole blocking factor.

**Fix verification summary**:
- **RUN24-1 (CDQ-001 / index.js)**: ✅ RESOLVED — `fixProcessExitSpanEnd()` AST restructure confirmed working
- **RUN24-2 (SCH-003 / git-collector.js)**: ✅ DE-FACTO RESOLVED — agent omitted `diff_lines` entirely; auto-coercion fix not exercised
- **NEW: COV-004 (summary-manager.js)**: ❌ NEW REGRESSION — validator false positive blocks 2 exported async functions

---

## Coverage Delta Observations

Three files show attribute or span-name choices that differ from run-24. These are not rule failures — all spans retain ≥1 domain attribute (COV-005 PASS). Documented here for completeness and as input for run-26.

### context-capture-tool.js — declining attribute richness

Run-23: 3 attrs (`entry_date`, `file_path`, `source`). Run-24: 2 attrs (`entry_date`, `file_path`). Run-25: 1 attr (`file_path` only). COV-005 passes (≥1 domain attribute), but each run drops one attribute from this span. The trend is worth flagging — by run-27 this span would have zero attributes if the pattern continues.

### journal-graph.js — token usage attributes dropped

Run-24 node spans carried `gen_ai.usage.input_tokens` and `gen_ai.usage.output_tokens` (guarded with `!= null`). Run-25 drops both. The span names also changed (`summary_node`/`technical_node`/`dialogue_node` vs run-24's `generate_summary`/`generate_technical`/`generate_dialogue`). COV-005 passes — remaining attributes (`commit_story.ai.section_type`, `gen_ai.*` model/provider/temperature/max_tokens`) are meaningful domain attributes. Token-cost observability is absent from node spans. Worth noting as a registered-schema attribute that was available but not used.

### summary-detector.js — 0 new schema extension attributes

9 spans committed, all with ≥1 domain attribute, all using pre-registered attribute keys. Run-24 declared 3 new schema extension attributes on these spans. Run-25 reuses existing attributes only (`week_label`, `month_label`, `entries_count`, `file_path`). This is correct schema economy — the attributes accurately describe the domain — and is not a coverage failure. The run-24 attributes (`unsummarized_*_count`) are absent; the run-25 attributes cover equivalent semantics.

---

## Failure Analysis

### COV-004: summary-manager.js — validator false positive blocks 2 exported async functions (NEW REGRESSION)

`summary-manager.js` committed 7 of 9 exported async functions. Two functions were blocked by the validator:

- `readWeekDailySummaries` — validator COV-003 rejection on inner `if (err.code !== 'ENOENT') throw err` pattern
- `readMonthWeeklySummaries` — same pattern (two inner-loop catches)

**Root cause** (from `failure-deep-dives.md`): The validator's `isExpectedConditionCatch` in `cov003.ts` treats any catch body containing both an ENOENT pattern string and a `ThrowStatement` as requiring error recording. The pattern is semantically a graceful-degradation catch: ENOENT means the file doesn't exist (expected in loop-over-files scenarios), and non-ENOENT errors rethrow to the outer span's handler. The outer catch correctly records and rethrows — COV-003 is already satisfied at that level. The validator's conservative analysis treats the conditional rethrow as a failable operation requiring its own error recording, which conflicts with NDS-007 (the conditional rethrow should not be wrapped).

**Historical context**: In run-24, summary-manager.js was fully committed (9/9 spans) because the agent worked around this pattern by replacing `if (err.code !== 'ENOENT') throw err` with `catch { }` (empty catch) — which passes the validator but silently swallows non-ENOENT errors. The run-25 agent preserved the semantically correct original behavior and was blocked. Run-24's "fix" introduced a subtle NDS-007 violation that the run-24 validator did not catch.

**Fix needed in spiny-orb**: The validator should recognize `if (err.code !== 'ENOENT') throw err` as an acceptable conditional rethrow — a graceful-degradation catch where the "not-an-error" case is handled silently and the "real error" case propagates. This is a common Node.js filesystem pattern. See `failure-deep-dives.md` for the proposed fix.

---

## Resolved from Run-24

| Rule | File(s) | Status |
|------|---------|--------|
| CDQ-001 (index.js `process.exit()` bypasses `finally { span.end() }`) | index.js | **RESOLVED** — `fixProcessExitSpanEnd()` AST restructure (spiny-orb commit 91e9413) confirmed working in run-25; `process.exit()` now runs after span closes |
| SCH-003 (git-collector.js `diff_lines` declared `type: string`, set as integer) | git-collector.js | **DE-FACTO RESOLVED** — attribute omitted by run-25 agent; `fixAttributeTypeCoercions()` auto-coercion backstop (same commit 91e9413) not exercised against a real case; issue #928 status unchanged |

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| COV-004 | COV | summary-manager.js (2 functions: `readWeekDailySummaries`, `readMonthWeeklySummaries`) | Validator false positive — `if (err.code !== 'ENOENT') throw err` treated as COV-003 violation; run-24's workaround (empty catch) silently swallowed non-ENOENT errors; run-25 agent preserved correct behavior and was blocked | 1 run (new) |
