# Evaluation Run 4: Rubric Scores

**Date:** 2026-03-16
**Tool:** SpinybackedOrbWeaver 0.1.0 (fresh build)
**Branch:** `orbweaver/instrument-1773627869602`
**Codebase:** commit-story-v2-eval (29 JavaScript files processed, 16 instrumented on branch)
**Evaluator:** Multi-agent evaluation (per-file agents + synthesis)
**Source artifact:** `per-file-evaluation.json`

---

## Summary

| Metric | Value |
|--------|-------|
| **Gate checks** | 4/5 PASS (NDS-002 fail — branch clean, run had test failures) |
| **Quality rules (strict)** | 15/26 PASS (58%) |
| **Quality rules (methodology-adjusted)** | 18/26 PASS (69%) |
| **Quality rules (split + adjusted)** | 19/26 PASS (73%) |
| **Per-dimension scores** | NDS 1/2, COV 2/6, RST 3/4 (+1 N/A), API 3/3, SCH 2/4, CDQ 4/7 |
| **Strongest dimension** | API-Only Dependency (100%) — up from 33% in run-3 |
| **Weakest dimension** | Coverage (33%) — down from 100% in run-3 (methodology effect) |
| **Files instrumented on branch** | 16/29 (up from 11/21 in run-3) |
| **Files correctly skipped** | 10/29 |
| **Files failed** | 3/29 (down from 4/21 in run-3) |
| **Persistently failing files rescued** | 2/4 (goal met) |
| **Wall-clock time** | ~80 min main |
| **PR artifact** | Not created (32 test failures blocked); summary saved locally |

---

## Scoring Methodology Note

Run-4 uses **multi-agent per-file evaluation** (one agent per file with full rubric context), a significant methodology change from run-3's single-pass evaluation. The per-file agents applied several rules more strictly:

| Rule | Run-3 Interpretation | Run-4 Interpretation |
|------|---------------------|---------------------|
| COV-002 | Parent span coverage accepted | Individual operation spans expected |
| COV-004 | Parent span coverage accepted | Individual async operation spans expected |
| CDQ-002 | Pattern check (trace.getTracer called correctly) | Semantic check (tracer name must be correct) |
| CDQ-006 | toISOString() deemed lightweight (no guard needed) | Any computation needs isRecording() guard |

These methodology differences account for 4 of the 7 new failures in run-4. The **methodology-adjusted score** (69%) reflects what run-4 would score under run-3's criteria. The **split + adjusted score** (73%) additionally applies schema coverage split scoring. Both are provided alongside the strict score for fair cross-run comparison.

---

## Gate Checks (4/5 PASS)

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-001 (Compilation) | **PASS** | All files pass `node --check`. Tracer ReferenceError is a runtime error, not syntax. |
| NDS-002 (Tests pass) | **FAIL** | 32 test failures: `ReferenceError: tracer is not defined`. Caused by summary-graph.js (21) and sensitive-filter.js (11). Function-level fallback omitted tracer import. |
| NDS-003 (Instrumentation-only) | **PASS** | All 16 instrumented files on branch have instrumentation-only changes. |
| API-001 (API-only imports) | **PASS** | All 16 source files import only `@opentelemetry/api`. |
| NDS-006 (Module system) | **PASS** | All ESM `import` statements. No `require()` or `module.exports`. |

**Gate verdict:** NDS-002 FAIL. However, the failing code was never committed to the branch — the branch itself is clean. The test failures occurred in the working directory during the run. Quality scoring proceeds because the deliverable contains only passing instrumentation.

---

## Dimension 1: Non-Destructiveness (NDS) — 1/2 (50%)

*Run-3: 2/2 (100%) — regression*

### NDS-004: Public API Signatures Preserved — PASS

All 16 instrumented files preserve all exported function signatures. `startActiveSpan` callbacks wrap function bodies without modifying parameter lists, return types, or export declarations.

### NDS-005: Error Handling Behavior Preserved — FAIL

**3 files fail:** summarize.js, summary-manager.js, summary-detector.js

All 3 use the same pattern: silent `catch {}` blocks for expected control flow (file/directory not found via `fs.access()` or `fs.readdir()`) were changed to:
```javascript
catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
}
```

ENOENT is the **expected happy path** (file doesn't exist = generate new summary). Recording it as an exception + ERROR status pollutes telemetry. OTel's `setStatus` is a one-way latch — once set to ERROR, the span is permanently ERROR even when the function succeeds.

**New failure class:** This is distinct from traditional NDS-005 (agent broke error handling). The control flow is preserved, but the observability semantics are wrong. Filed as orbweaver issue #10.

---

## Dimension 2: Coverage (COV) — 2/6 (33%)

*Run-3: 6/6 (100%) — apparent regression, partially driven by methodology change*

### COV-001: Entry Points Have Spans — FAIL

**1 file fails:** index.js — main() (CLI entry point) has NO root span. Only the summarize and journal-generate code paths within main are spanned. Without a root span, the trace has no top-level operation.

*Run-3 had a `commit_story.generate_journal_entry` span on main(). This is a genuine regression.*

### COV-002: Outbound Calls Have Spans — FAIL

**2 files fail:** claude-collector.js (findJSONLFiles/parseJSONLFile lack individual spans), index.js (3 git validation calls lack spans).

**Methodology note:** Run-3 accepted parent span coverage for internal helpers and scored COV-002 PASS. Run-4 per-file agents evaluate individual operations. Under run-3 methodology, this would PASS.

### COV-003: Failable Operations Have Error Visibility — PASS

All 48 spans across 16 files have `recordException` + `setStatus(ERROR)` in catch blocks.

### COV-004: Long-Running / Async Operations Have Spans — FAIL

**3 files fail:** claude-collector.js, git-collector.js (internal async helpers), index.js (main() async without span).

**Methodology note:** Same as COV-002 — run-3 accepted parent span coverage. Under run-3 methodology, this would PASS.

### COV-005: Domain-Specific Attributes Present — FAIL

**2 files fail:** auto-summarize.js (4 ad-hoc attrs), summary-detector.js (3 ad-hoc attrs).

Both are **schema-uncovered** summary subsystem files where no registry definitions exist. The ad-hoc attributes follow `commit_story.*` namespace and are semantically valid. Under schema coverage split methodology, the attribute *quality* is high — the failure is strictly a registry mismatch.

### COV-006: Auto-Instrumentation Preferred Over Manual Spans — PASS

journal-graph.js: manual spans on LangGraph graph nodes are justified — `@traceloop/instrumentation-langchain` covers ChatAnthropic.invoke() but NOT LangGraph node execution, state transitions, or graph orchestration.

---

## Dimension 3: Restraint (RST) — 3/4 (75%), 1 N/A

*Run-3: 4/4 (100%) — regression*

### RST-001: No Spans on Utility Functions — FAIL

**1 file fails:** token-filter.js — `truncateDiff()` and `truncateMessages()` are exported but are pure synchronous data transformation functions with no I/O. They are called from `applyTokenBudget` (which has a span). Adding spans to pure functions is over-instrumentation.

### RST-002: No Spans on Trivial Accessors — PASS

No trivial accessor spans across all files.

### RST-003: No Duplicate Spans on Thin Wrappers — PASS

No duplicate or wrapper spans.

### RST-004: No Spans on Internal Implementation Details — PASS

All spanned unexported functions have I/O exemption. 2 borderline cases in MCP tools (saveContext, saveReflection — unexported but do file I/O, exemption applies).

### RST-005: No Re-Instrumentation — N/A

First instrumentation run on this codebase.

---

## Dimension 4: API-Only Dependency (API) — 3/3 (100%)

*Run-3: 1/3 (33%) — major improvement*

### API-002: Correct Dependency Declaration — PASS

`@opentelemetry/api` is in `peerDependencies` (^1.9.0). commit-story-v2 is distributed as a library — `peerDependencies` is correct. The agent preserved the existing declaration without marking it optional.

*Improvement from run-3 FAIL (agent made `@opentelemetry/api` optional — regression that no longer occurs).*

### API-003: No Vendor-Specific SDKs — PASS

No vendor-specific SDK packages (dd-trace, @newrelic/*, @splunk/*). `@traceloop/instrumentation-langchain` and `@traceloop/instrumentation-mcp` added as optional peerDependencies — community auto-instrumentation, not vendor SDKs.

*Improvement from run-3 FAIL (stale build included `@traceloop/node-server-sdk` mega-bundle). Fresh build resolved this.*

### API-004: No SDK-Internal Imports in Source Files — PASS

No `@opentelemetry/sdk-*` or `@opentelemetry/instrumentation-*` imports in source files.

---

## Dimension 5: Schema Fidelity (SCH) — 2/4 (50%) strict | 3/4 (75%) split

*Run-3: 2/4 (50%) — unchanged strict, improved with split*

### SCH-001: Consistent Span Naming — FAIL

8 of 37 span names (22%) deviate from the `commit_story.*` convention:

| Pattern | Count | Examples |
|---------|-------|---------|
| `commit_story.*` | 29 | `commit_story.context.collect`, `commit_story.ai.generate_summary` |
| `context.*` | 2 | `context.gather_for_commit`, `context.capture.save` |
| `summary.*` | 3 | `summary.daily.generate`, `summary.weekly.generate`, `summary.monthly.generate` |
| `mcp.*` | 3 | `mcp.server.start`, `mcp.tool.journal_capture_context`, `mcp.tool.journal_add_reflection` |

**Schema coverage split:** SCH-001 fails in both covered (context-integrator: 1/10 files) and uncovered (4/6 files) categories. The covered-file failure is a genuine naming bug. The uncovered-file failures correlate with broken schema evolution — without naming convention propagation, later files reinvent prefixes. Run-3 had 4+ naming patterns due to stale build; run-4 has fewer patterns but the deviation is concentrated in schema-uncovered files.

### SCH-002: Attribute Keys Match Registry Names — FAIL (strict) | PASS (split)

**Strict:** 11 ad-hoc attribute keys not in registry across 3 files.

**Schema coverage split:**
- **Schema-covered files (10):** 0 ad-hoc attributes. All keys match registry. **PASS.**
- **Schema-uncovered files (6):** 11 ad-hoc attributes across 3 files. Invention quality assessment:
  - Namespace adherence: 11/11 (100%) follow `commit_story.*`
  - Semantic validity: 11/11 (100%) represent real domain concepts
  - Naming convention: 10/11 (91%) use consistent snake_case
  - Type appropriateness: 11/11 (100%) use correct types
  - **PASS** (high invention quality)

*Under split scoring, SCH-002 passes — the strict failure is entirely attributable to the deliberate schema gap for the summary subsystem.*

### SCH-003: Attribute Values Conform to Registry Types — PASS

All enum attributes use valid members, all string/int/boolean attributes use correct types.

### SCH-004: No Redundant Schema Entries — PASS

All ad-hoc attributes capture genuinely new domain concepts not covered by existing registry entries.

---

## Dimension 6: Code Quality (CDQ) — 4/7 (57%)

*Run-3: 4/7 (57%) — same score, completely different failure set*

### CDQ-001: Spans Closed in All Code Paths — PASS

All 48 spans use `startActiveSpan` callback pattern with `finally { span.end() }`. No span leaks.

### CDQ-002: Tracer Acquired Correctly — FAIL

All 16 files use `trace.getTracer('unknown_service')`. The library name should be `commit-story` (from `package.json#name`). This is a systemic agent configuration bug — one root cause, 16 affected files.

**Scoring note:** Run-3 CDQ-002 evaluated only whether `trace.getTracer()` was called with a string argument (pattern check → PASS). Run-4 evaluates whether the library name is correct (semantic check → FAIL). The underlying bug existed in run-3 but was not captured by CDQ-002. The scoring criterion is stricter in run-4.

### CDQ-003: Standard Error Recording Pattern — FAIL

**1 file fails:** summarize.js — uses `recordException` + `setStatus(ERROR)` on a non-error control flow path (file-not-found is the expected condition for generating a new summary). Misuse of the error recording pattern.

*Run-3 CDQ-003 failed for commit-analyzer.js (missing `recordException`). That file passes in run-4. New failure is a different class of issue (misuse vs absence).*

### CDQ-005: Async Context Maintained — PASS

All spans use `startActiveSpan` callback pattern, automatically maintaining async context.

### CDQ-006: Expensive Attribute Computation Guarded — FAIL

**2 files fail:** claude-collector.js, git-collector.js — `toISOString()` calls without `span.isRecording()` guard.

**Scoring note:** Run-3 deemed `toISOString()` lightweight enough to not need a guard (CDQ-006 PASS). Run-4 per-file agents apply the rubric strictly. Whether `toISOString()` requires a guard is debatable — it's a very cheap operation.

### CDQ-007: No Unbounded or PII Attributes — PASS

No unbounded or PII attributes. `commit_story.commit.author` is in the registry with a PII annotation (accepted per decision log 2026-03-15).

*Improvement from run-3 FAIL. This is a schema/rubric change (PII annotation added), not an agent improvement.*

### CDQ-008: Consistent Tracer Naming Convention — PASS

All 16 files use `trace.getTracer('unknown_service')` — single convention, consistent. The name is wrong (CDQ-002 captures this), but CDQ-008 evaluates consistency, not correctness.

*Improvement from run-3 FAIL (stale build had two naming conventions). Fresh build resolved this.*

---

## Overall Score Summary

### Gate Check Results

| Rule | Result | Evidence |
|------|--------|----------|
| NDS-001 | **PASS** | All files pass syntax validation |
| NDS-002 | **FAIL** | 32 test failures (working directory only — branch is clean) |
| NDS-003 | **PASS** | All 16 on-branch files have instrumentation-only changes |
| API-001 | **PASS** | Only `@opentelemetry/api` in source files |
| NDS-006 | **PASS** | All ESM imports |

### Quality Rules by Dimension

| Dimension | Pass | Fail | N/A | Score | Run-3 | Change |
|-----------|------|------|-----|-------|-------|--------|
| Non-Destructiveness (NDS) | 1 | 1 | 0 | 1/2 (50%) | 2/2 (100%) | Regression |
| Coverage (COV) | 2 | 4 | 0 | 2/6 (33%) | 6/6 (100%) | Regression* |
| Restraint (RST) | 3 | 1 | 1 | 3/4 (75%) | 4/4 (100%) | Regression |
| API-Only Dependency (API) | 3 | 0 | 0 | 3/3 (100%) | 1/3 (33%) | **Improvement** |
| Schema Fidelity (SCH) | 2 | 2 | 0 | 2/4 (50%) | 2/4 (50%) | Unchanged |
| Code Quality (CDQ) | 4 | 3 | 0 | 4/7 (57%) | 4/7 (57%) | Unchanged |
| **Total** | **15** | **11** | **1** | **15/26 (58%)** | **19/26 (73%)** | |

*\* COV regression is largely driven by stricter per-file evaluation methodology. See methodology-adjusted scores below.*

### Score Variants

| Variant | Score | Description |
|---------|-------|-------------|
| **Strict** | 15/26 (58%) | All rules scored per run-4 per-file agent evaluation |
| **Methodology-adjusted** | 18/26 (69%) | COV-002, COV-004, CDQ-002 restored to PASS under run-3 criteria |
| **Schema split** | 16/26 (62%) | SCH-002 PASS under split scoring |
| **Split + adjusted** | 19/26 (73%) | Combined methodology adjustment and schema split |

The methodology-adjusted + split score (73%) matches run-3's score, showing that the underlying agent quality is comparable. The improvements (API dimension going from 33% to 100%) are offset by genuine new failures (NDS-005, COV-001, RST-001).

### Failure Summary

| Rule | Category | Root Cause | Run-3? |
|------|----------|-----------|--------|
| NDS-002 | Gate fail | Function-level fallback missing tracer import | New (run-3 NDS-002 passed) |
| NDS-005 | Quality | Expected-condition catch blocks changed to record errors | New finding |
| COV-001 | Quality | index.js missing root span on main() | Genuine regression |
| COV-002 | Quality | Parent span coverage insufficient per run-4 criteria | Methodology change |
| COV-004 | Quality | Same as COV-002 | Methodology change |
| COV-005 | Quality | Ad-hoc attrs in schema-uncovered summary files | New territory |
| RST-001 | Quality | Spans on pure sync functions (token-filter.js) | New finding |
| SCH-001 | Quality | 8/37 span names deviate from commit_story.* | Persistent (different profile) |
| SCH-002 | Quality | 11 ad-hoc attrs in schema-uncovered files | Persistent (different profile) |
| CDQ-002 | Quality | All files use trace.getTracer('unknown_service') | New criterion (bug existed in run-3) |
| CDQ-003 | Quality | Error recording misuse on expected-condition path | Persistent (different file) |
| CDQ-006 | Quality | toISOString() without isRecording() guard | Methodology change |

### Failure Classification

- **Genuine improvements (4):** API-002, API-003, CDQ-007, CDQ-008
- **Genuine new findings (3):** NDS-005, RST-001, CDQ-002 (bug existed but not captured in run-3)
- **Genuine regression (1):** COV-001 (index.js root span missing)
- **Methodology changes (4):** COV-002, COV-004, CDQ-006 (stricter criteria), CDQ-002 (stricter criterion)
- **New territory (1):** COV-005 (schema-uncovered files)
- **Schema evolution dependency (2):** SCH-001, SCH-002 (would improve with working evolution)
- **Persistent with different cause (1):** CDQ-003 (different file, different issue)

---

## Key Findings

### What Improved
1. **API dimension: 33% → 100%** — the largest single-dimension improvement. Fresh build eliminated the mega-bundle (API-003), and the agent no longer marks `@opentelemetry/api` as optional (API-002).
2. **CDQ-008: inconsistent tracer naming resolved** — fresh build fixed the stale-build repeat.
3. **CDQ-007: PII accepted in schema** — decision to annotate `commit_story.commit.author` with PII note.
4. **File rescue: 2 of 4 persistently failing files rescued** — journal-graph.js (4 spans, function-level fallback) and context-integrator.js (1 span, instrumentation-only approach found).
5. **Coverage expanded: 16 instrumented files** (up from 11 in run-3), including summary subsystem files not attempted before.

### What Regressed
1. **NDS-005: expected-condition catch blocks** — 3 summary files had ENOENT catches changed to ERROR. New failure class needing orbweaver attention (issue #10).
2. **COV-001: index.js root span missing** — a genuine coverage regression at the CLI entry point.
3. **RST-001: over-instrumentation in token-filter.js** — spans on pure synchronous functions.
4. **CDQ-002: unknown_service tracer name** — systemic bug (issue #11), newly captured with stricter criterion.

### What the Scores Don't Show
1. **Schema evolution completely broken** — all 29 files received identical base schema. Zero extensions registered. This is the most significant infrastructure finding but does not directly affect the quality score because the rubric doesn't yet have a schema evolution rule (see SCH-005 proposal in lessons-for-prd5.md).
2. **2 rescued files** — journal-graph.js and context-integrator.js, which failed in both run-2 and run-3, are now successfully instrumented. This is a major orbweaver capability improvement.
3. **32 test failures never reached the branch** — the test failures were catastrophic during the run but the branch deliverable is clean. The gate failure is more about process quality than deliverable quality.
4. **11 ad-hoc attributes are all high-quality** — under split scoring, the agent's attribute invention demonstrates good domain understanding. The strict SCH-002 failure masks this positive signal.

---

## 85% Target Assessment

**Did run-4 reach the 85% target?** No, under any scoring variant.

| Variant | Score | Gap to 85% |
|---------|-------|------------|
| Strict | 58% | -27% |
| Methodology-adjusted | 69% | -16% |
| Schema split | 62% | -23% |
| Split + adjusted | 73% | -12% |

**Why the target was not met:**
1. **New failure classes** (NDS-005 expected-condition catches, CDQ-002 unknown_service) added failures that offset the 4 improvements.
2. **Stricter evaluation methodology** penalized coverage and code quality rules that run-3 passed.
3. **More files = more surface area for failures** — 16 instrumented files vs 11 means more opportunities for rule violations.

**What would it take to reach 85% (22/26)?**
Under the methodology-adjusted + split variant (19/26), fixing 3 more rules:
- CDQ-002 (unknown_service → commit-story) — orbweaver issue #11
- NDS-005 (expected-condition catches) — orbweaver issue #10
- COV-001 (index.js root span) — agent should add a root span on main()

This would yield 22/26 = 85% under the most favorable scoring. Under strict scoring, additional fixes for COV-002, COV-004, CDQ-006, and RST-001 would be needed.
