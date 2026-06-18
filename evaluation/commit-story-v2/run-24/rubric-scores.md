// ABOUTME: Rubric scores for run-24 — dimension-level synthesis from per-file and PR evaluations.
# Rubric Scores — Run-24

**Date**: 2026-06-18
**Branch**: spiny-orb/instrument-1781811083418
**PR**: https://github.com/wiggitywhitney/commit-story-v2/pull/81

---

## Gate Results

| Gate | Scope | Result |
|------|-------|--------|
| NDS-001 (Syntax) | Per-run | **PASS** — all 14 committed files pass `node --check`; 0 failures, 0 partials |
| NDS-002 (Tests) | Per-run | **PASS** — pre-push hook passed; auto-push succeeded |
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
| NDS-007 (Control flow preserved) | **PASS** | 14/14 — all original catches preserved; graceful-degradation catches (MCP tool pattern, ENOENT catches) correctly left unmodified throughout |

### Coverage (COV): 4/5 (80%)

| Rule | Result | Evidence |
|------|--------|----------|
| COV-001 (Entry points have spans) | **PASS** | All 14 committed files instrument their exported async entry points; summary-detector.js commits all 5 exported async functions (upgrade from run-23's 4-function partial) |
| COV-003 (Failable ops have error visibility) | **PASS** | All 14 committed files have outer catch with `recordException` + `SpanStatusCode.ERROR` + rethrow; graceful-degradation catches correctly handled under NDS-007 precedent |
| COV-004 (Async ops have spans) | **PASS** | All async functions in committed files instrumented; summary-manager.js commits all 9 spans (5th consecutive run); summary-detector.js commits 9 spans across all 5 exported + 4 unexported async I/O helpers |
| COV-005 (Domain attributes present) | **PASS** | All 14 committed files carry ≥1 meaningful domain attribute on every span. Two files show coverage delta observations (not failures): `context-capture-tool.js` dropped `commit_story.context.source` from run-23 while retaining `entry_date` and `file_path`; `index.js` dropped `commit_story.journal.file_path` while retaining `vcs.ref.head.revision` and `commit_story.git.subcommand`. COV-005 is a minimum bar (≥1 domain attribute), not a sameness requirement — attribute variation across runs is expected and valid. |
| COV-006 (Auto-instrumentation preferred) | **PASS** | `@traceloop/instrumentation-langchain` used correctly in journal-graph.js and summary-graph.js; manual spans establish active context before `model.invoke(...)` calls |

### Restraint (RST): 4/4 (100%)

| Rule | Result | Files |
|------|--------|-------|
| RST-001 (No utility spans) | **PASS** | 17 correct skips confirmed; all sync helpers excluded across all committed files; reflection-tool.js (unexported async, all internal) correctly identified as RST-001 skip on 2 attempts; logger.js (new file in run-24) correctly skipped |
| RST-003 (No duplicate wrapper spans) | **PASS** | N/A |
| RST-004 (No internal detail spans) | **PASS** | 14/14 — unexported helpers excluded where RST-004 applies; unexported async I/O helpers correctly instrumented where COV-004 requires it |
| RST-005 (No re-instrumentation) | **PASS** | N/A |

### API-Only Dependency (API): 3/3 (100%)

| Rule | Result | Evidence |
|------|--------|----------|
| API-002 (Correct dependency) | **PASS** | `@opentelemetry/api` in peerDependencies at `^1.9.0` (unchanged) |
| API-003 (No vendor SDKs) | **PASS** | No vendor packages in production dependencies; OTel SDK packages are devDependencies only |
| API-004 (No SDK imports) | **PASS** | Only `@opentelemetry/api` imported across all 14 committed files |

### Schema Fidelity (SCH): 3/4 (75%)

| Rule | Result | Evidence |
|------|--------|----------|
| SCH-001 (Span names match registry) | **PASS** | 48 total spans, all declared as schema extensions in `agent-extensions.yaml`; `commit_story.*` convention followed consistently; 35 SCH-001 advisories in PR are systematic false positives (checker does not recognize in-run registered extensions; up from 22 in run-23 due to more committed spans) |
| SCH-002 (Attribute keys match registry) | **PASS** | All attribute keys in committed spans registered in base semconv or agent-extensions; `commit_story.journal.base_path` from run-23's partial is absent — replaced by 3 semantically precise `unsummarized_*_count` attributes (RUN23-3 fix confirmed) |
| SCH-003 (Attribute types correct) | **FAIL** | `git-collector.js` — `commit_story.git.diff_lines` declared `type: string` in `agent-extensions.yaml` but set as bare integer `lines.length`. Datadog confirms `diff_lines: 296` (integer). Run-23 had `diff_size` with the same type mismatch; run-24 renames the attribute but does not fix the `type: string` declaration — same root cause, second consecutive run. Fix: change `type: string` → `type: int` in `agent-extensions.yaml`. |
| SCH-004 (No redundant entries) | **PASS** | No semantic duplicates among committed attributes; `commit_story.summaries.unsummarized_*_count` reuse across summary-detector spans is intentional schema economy |

### Code Quality (CDQ): 6/7 (86%)

| Rule | Result | Evidence |
|------|--------|----------|
| CDQ-001 (Spans closed) | **FAIL** | `index.js` — `process.exit(1)` calls inside `main()` body bypass `finally { span.end() }`. No explicit `span.end()` before individual exits. Run-12 added `span.end()` before each `process.exit()`; that fix was preserved in run-23; run-24 regresses. Early-exit paths (no commit hash, unsupported subcommand) leave spans unended. Success path unaffected (CDQ-001 not observable on success path — confirmed by Datadog showing successful span completion). Fix: add explicit `span.end()` before each `process.exit(1)` call inside `startActiveSpan` callback, consistent with the run-12 pattern. |
| CDQ-002 (Tracer name) | **PASS** | `trace.getTracer('commit-story')` in all 14 committed files |
| CDQ-003 (Error recording) | **PASS** | `recordException` + `SpanStatusCode.ERROR` in all outer catch blocks; graceful-degradation catches (NDS-007) excluded per methodology |
| CDQ-005 (Async context) | **PASS** | `startActiveSpan` with async callbacks throughout; no `startSpan` misuse |
| CDQ-006 (Expensive guards) | **PASS** | Count attributes are direct `.length`/`.size` calls (non-expensive); 2 CDQ-006 advisories in PR body (journal-graph.js, context-capture-tool.js) are false positives — both files have 0 custom `setAttribute()` calls in committed instrumentation; advisory cannot apply per established rubric precedent |
| CDQ-007 (No unbounded/PII) | **PASS** | 41 CDQ-007 advisories in PR body are systematic non-actionable (generic "PII or path" message on `journal.file_path` — a filesystem path that is a known documented limitation, consistent with run-20/run-21/run-23 treatment); all canonical setAttribute calls have null-guards or are compile-time constants |
| CDQ-008 (Consistent naming) | **PASS** | `'commit-story'` used consistently across all 14 committed files |

---

## Overall Score

| Dimension | Run-24 | Run-23 | Run-21 | Run-20 | Run-19 | Delta (vs run-23) |
|-----------|--------|--------|--------|--------|--------|-------------------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | — |
| COV | **5/5 (100%)** | 5/5 (100%) | 4/5 (80%) | 4/5 (80%) | 2/5 (40%) | — |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | — |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | — |
| SCH | **3/4 (75%)** | 3/4 (75%) | 4/4 (100%) | 4/4 (100%) | 3/4 (75%) | — |
| CDQ | **6/7 (86%)** | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | 7/7 (100%) | **-14pp** |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | 23/25 (92%) | 24/25 (96%) | 21/25 (84%) | **-4pp** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) | — |

---

## Canonical Metrics

| Metric | Run-24 | Run-23 | Run-21 | Run-20 | Run-19 |
|--------|--------|--------|--------|--------|--------|
| Quality score | **23/25 (92%)** | 24/25 (96%) | 23/25 (92%) | 24/25 (96%) | 21/25 (84%) |
| Gates | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| Committed files | **14** | 13 | 12 | 12 | 10 |
| Partial files | **0** | 1 | 0 | 0 | 3 |
| Failed files | **0** | 0 | 2 | 1 | 0 |
| Total spans (committed) | **48** | 45 | 42 | 42 | 30 |
| Cost | **~$3.70** | ~$5.60 | $8.10 | $9.08 | $8.83 |
| Q×F | **12.88** | 12.48 | 11.0 | 11.5 | 8.4 |
| Push/PR | **AUTO ✅ (#81)** | AUTO ✅ (#75) | AUTO ✅ (#74) | AUTO ✅ (#73) | AUTO ✅ (#71) |
| IS | **80/100** | 80/100 | 90/100 | 80/100 | 80/100 |

**Q×F = 12.88** (23/25 × 14). A new high-water mark by Q×F, edging past run-23 (12.48) despite a quality point regression. The 14-file clean sweep drives the gain — even at 23/25 quality, 14 committed files produces a higher Q×F than 13 files at 24/25. Without the two remaining failures (CDQ-001 + SCH-003): 25/25 × 14 = 14.0 would have set an all-time record by a wide margin.

**Note on COV-005 methodology**: Two files (`context-capture-tool.js`, `index.js`) showed coverage delta observations — attribute choices that differ from run-23 but are not COV-005 failures. COV-005 is a minimum bar (≥1 domain attribute per span), not a sameness requirement against the prior run. Attribute variation across runs is expected; the rubric does not penalize it. See coverage delta observations in per-file-evaluation.md for detail.

---

## Coverage Delta Observations

Two files show attribute choices that differ from run-23. These are not rule failures — both spans retain ≥1 domain attribute (COV-005 PASS). They are documented here for completeness and as context for future runs.

### context-capture-tool.js — `commit_story.context.source` dropped

Run-23 had 2 spans (outer anonymous MCP callback carrying `source: 'mcp'`, inner `saveContext`). Run-24 has 1 span (`saveContext`) with `entry_date` and `file_path`. The `source` attribute identified the ingestion pathway; its absence reduces diagnostic richness on the MCP path but both remaining attributes are meaningful domain attributes. The agent scope decision (instrument only `saveContext`) is a valid choice.

### index.js — `commit_story.journal.file_path` dropped

Run-23's main span carried 3 attributes including `file_path` (the generated entry path — a result attribute). Run-24 carries 2 attributes (`vcs.ref.head.revision`, `commit_story.git.subcommand`). The result attribute is gone but the span is not attribute-sparse. The agent's choice to capture only input attributes is valid; run-23's approach of also capturing the result was also valid.

---

## Failure Analysis

### CDQ-001: index.js — `process.exit()` bypasses `finally { span.end() }` (regression from run-12 fix)

`index.js`'s `main()` contains `process.exit(1)` calls for early-exit paths (no commit hash found, unsupported subcommand). These calls bypass `finally { span.end() }` because `process.exit()` terminates the process synchronously before the finally block runs.

Run-12 fixed this by adding explicit `span.end()` calls before each `process.exit(1)`. That fix was preserved in run-23. Run-24 regresses — the explicit pre-exit calls are absent.

**Fix**: Add `span.end()` immediately before each `process.exit(1)` inside the `startActiveSpan` callback body, following the run-12 pattern.

**Root cause**: CDQ-001 violations on early-exit paths are not observable in the captured trace (Datadog only records successful runs). Without the Datadog trace confirming the issue at runtime, the agent had no signal that the pattern was wrong. The fix is known (run-12 discovered it); the guidance does not yet prompt agents to apply it proactively.

### SCH-003: git-collector.js — `diff_lines` type mismatch (second consecutive run)

`git-collector.js` declares `commit_story.git.diff_lines` as `type: string` in `agent-extensions.yaml` but sets it with `span.setAttribute('commit_story.git.diff_lines', lines.length)` — a bare integer. Datadog confirms `diff_lines: 296` (integer).

Run-23's failure was `diff_size` with the identical type mismatch. Run-24 renamed the attribute (`diff_size` → `diff_lines`) without fixing the `type: string` declaration — the SCH-003 failure recurs under a new name. The rename was the intended fix for the attribute semantics (diff character count → diff line count); the type declaration was not updated.

**Fix**: Change `type: string` → `type: int` in `agent-extensions.yaml` for `commit_story.git.diff_lines`. No code change needed — the attribute is already set as an integer.

**Root cause**: The type mismatch is not caught during instrumentation — it requires post-run schema validation. Agents declare attributes as `type: string` by default when uncertain, or carry over the wrong type from a prior declaration. A prompt guidance line targeting "use `type: int` when the value is a `.length` count" would prevent this class of error without requiring external validation.

---

## Failure Summary

| Rule | Dimension | File(s) | Root Cause | Runs Open |
|------|-----------|---------|-----------|-----------|
| CDQ-001 | CDQ | index.js (`process.exit()` bypasses span.end) | Run-12 fix not carried forward; pre-exit `span.end()` calls absent on early-exit paths | Regression (run-12 fix maintained in run-23) |
| SCH-003 | SCH | git-collector.js (`diff_lines: type: string`) | Attribute renamed from `diff_size` but `type: string` declaration not corrected to `type: int` | 2nd consecutive run (issue #928) |

**Resolved from run-23:**

| Rule | File(s) | Status |
|------|---------|--------|
| SCH-003 (commands/summarize.js `*_summaries_generated`) | commands/summarize.js | **RESOLVED** — `dates_count` (type: int) and `force` (type: boolean) correct in run-24 |
| SCH-002 (summary-detector.js `base_path` near-synonym) | summary-detector.js | **RESOLVED** — replaced by 3 semantically precise `unsummarized_*_count` attributes; all 9 spans committed |
