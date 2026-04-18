# Evaluation Run 5: Rubric Scores

**Date:** 2026-03-17
**Tool:** SpinybackedOrbWeaver 0.1.0
**Branch:** `orbweaver/instrument-1773706515431`
**Codebase:** commit-story-v2-eval (29 JavaScript files processed, 9 committed on branch)
**Evaluator:** Multi-agent evaluation (per-file agents + synthesis)
**Methodology:** Canonical (per-file evaluation + schema coverage split)
**Source artifact:** `per-file-evaluation.json`

---

## Summary

| Metric | Value |
|--------|-------|
| **Gate checks** | 5/5 PASS (first clean gate pass across all runs) |
| **Quality rules (canonical)** | 23/25 PASS (92%) |
| **Failures** | COV-001, COV-005 |
| **Per-dimension scores** | NDS 2/2, COV 3/5, RST 4/4, API 3/3, SCH 4/4, CDQ 7/7 |
| **Strongest dimensions** | NDS, RST, API, SCH, CDQ (all 100%) |
| **Weakest dimension** | Coverage (60%) |
| **Files committed on branch** | 9/29 (down from 16/29 in run-4) |
| **Files correctly skipped** | 12/29 |
| **Files partial (not committed)** | 6/29 |
| **Files failed** | 2/29 |
| **Total spans committed** | 17 (down from 38 in run-4) |
| **Cost** | $9.72 / $67.86 ceiling (14.3%) |

---

## Quality vs Coverage Tradeoff

Run-5's high quality score (92%) comes with a significant coverage cost. The validation pipeline (run-4 finding #2, orbweaver PRD #156) correctly prevents low-quality instrumentation from reaching the branch, but the net effect is fewer instrumented files:

| Metric | Run-4 | Run-5 | Delta |
|--------|-------|-------|-------|
| Committed files | 16 | 9 | -44% |
| Committed spans | 38 | 17 | -55% |
| Quality score (canonical) | 58% strict / 73% adjusted | 92% | +34pp / +19pp |
| Gate pass rate | 80% | 100% | +20pp |

**Interpretation:** The 9 committed files are high quality — 7/9 pass all applicable rules. But 7 files that were instrumented in run-4 are not instrumented in run-5. Two of those (message-filter, token-filter) are **correct skip decisions** (pure sync utilities that were over-instrumented in run-4). The other 5 are **regressions caused by the validation pipeline catching issues that run-4's pipeline didn't check for** (SCH-002 validation, COV-003/NDS-005b conflict).

---

## Gate Checks (5/5 PASS)

| Rule | Result | Evidence | Run-4 |
|------|--------|----------|-------|
| NDS-001 (Compilation) | **PASS** | All 9 committed files pass `node --check`. | PASS |
| NDS-002 (Tests pass) | **PASS** | Test suite passes. Partial/failed files not committed, preserving test integrity. | **FAIL** |
| NDS-003 (Instrumentation-only) | **PASS** | All 9 committed files have instrumentation-only changes. | PASS |
| API-001 (API-only imports) | **PASS** | All 9 files import only `@opentelemetry/api`. | PASS |
| NDS-006 (Module system) | **PASS** | All ESM imports. No `require()` or `module.exports`. | PASS |

**Gate verdict:** First clean gate pass. Run-4's NDS-002 failure (32 test failures from function-level fallback missing tracer import) is resolved — the validation pipeline now catches these before commit.

---

## Dimension 1: Non-Destructiveness (NDS) — 2/2 (100%)

*Run-4: 1/2 (50%) — improvement*

### NDS-004: Public API Signatures Preserved — PASS

All 9 committed files preserve all exported function signatures. `startActiveSpan` callbacks wrap function bodies without modifying parameter lists, return types, or export declarations.

**Instance count:** 9/9 files pass (100%).

### NDS-005: Error Handling Behavior Preserved — PASS

All 9 committed files preserve error handling behavior. No expected-condition catches modified in delivered code.

**Instance count:** 9/9 committed files pass (100%).

**Latent issue:** 3 partial files (journal-manager, summary-manager, summary-detector) have 8 NDS-005b violations in working-tree diffs. The underlying agent behavior is NOT fixed — the validation pipeline prevented violations from reaching the branch. Root cause: DEEP-1 (COV-003 validator lacks expected-condition exemption). If the validation pipeline is relaxed to commit partial files (finding PR-4), these NDS-005b violations would become canonical failures.

---

## Dimension 2: Coverage (COV) — 3/5 (60%), 1 N/A

*Run-4: 2/6 (33%) — improvement, partially driven by methodology standardization*

### COV-001: Entry Points Have Spans — FAIL

All committed entry-point functions have spans. However, the application's primary entry point (`src/index.js main()`) failed instrumentation entirely — SCH-002 oscillation during fix/retry loop. Without a root span, the trace has no top-level operation.

**Instance count:** 8/9 committed files pass (journal-paths N/A — utility, not entry point). But the primary entry point is absent from the branch.

**Persistent from run-4.** Run-4: index.js was on branch but lacked root span. Run-5: index.js failed instrumentation entirely — **worse outcome, same rule failure.** Finding refs: RUN-1, DEEP-6.

### COV-002: Outbound Calls Have Spans — PASS

git-collector.js wraps `execFileAsync` in spans. commit-analyzer.js wraps `execFileSync` calls. Other committed files have no outbound calls requiring individual spans.

**Instance count:** 2/2 applicable files pass, 7 N/A.

*Run-4 failed COV-002 on claude-collector (internal fs helpers) and index.js. Canonical methodology: internal sync helpers are N/A for COV-002.*

### COV-003: Failable Operations Have Error Visibility — PASS

All 17 spans across 9 committed files have `recordException` + `setStatus(ERROR)` in catch blocks.

**Instance count:** 9/9 files pass (100%).

### COV-004: Long-Running / Async Operations Have Spans — PASS

All async/long-running functions in committed files have spans.

**Instance count:** 9/9 files pass (100%).

*Run-4 failed COV-004 on internal async helpers. Canonical methodology resolves the parent-span-coverage question.*

### COV-005: Domain-Specific Attributes Present — FAIL

**2 files fail:** auto-summarize.js (3 spans, ZERO attributes) and server.js (1 span, ZERO attributes). Both are schema-uncovered files. The agent strips attributes to pass SCH-002 validation but doesn't add schema-compliant alternatives.

**Instance count:** 7/9 files pass, 2/9 fail (78%).

**Systemic bug (EVAL-1):** Schema-uncovered files get zero attributes because the agent has no registry to guide attribute selection, and the SCH-002 validator rejects any attributes the agent invents. Schema-covered files have rich attributes (context-integrator.js: 10 attributes), showing the agent CAN add attributes when guided. Finding ref: EVAL-1.

*Run-4 failed COV-005 on auto-summarize (4 ad-hoc attrs) and summary-detector (3 ad-hoc attrs). Run-5 failure is worse: zero attributes vs wrong-registry attributes. The validation pipeline trades attribute presence for schema compliance.*

### COV-006: Auto-Instrumentation Preferred Over Manual Spans — N/A

No committed files have applicable auto-instrumentation coverage decisions. journal-graph.js (run-4's COV-006 target) is partial, not committed.

---

## Dimension 3: Restraint (RST) — 4/4 (100%), 1 N/A

*Run-4: 3/4 (75%) — improvement*

### RST-001: No Spans on Utility Functions — PASS

No utility functions have spans. Only I/O-performing and entry-point functions are instrumented.

**Instance count:** 9/9 files pass (100%).

*Run-4 failed: token-filter.js (truncateDiff/truncateMessages are pure sync functions). Run-5: token-filter.js correctly skipped entirely. This represents an improved skip decision by the agent.*

### RST-002: No Spans on Trivial Accessors — PASS

No trivial accessor spans in any committed file. **Instance count:** 9/9 (100%).

### RST-003: No Duplicate Spans on Thin Wrappers — PASS

No duplicate or wrapper spans. **Instance count:** 9/9 (100%).

### RST-004: No Spans on Internal Implementation Details — PASS

All spanned unexported functions have I/O exemption: saveContext/saveReflection (file I/O), runGit (subprocess I/O). **Instance count:** 9/9 (100%).

### RST-005: No Re-Instrumentation — N/A

First instrumentation run on this codebase.

---

## Dimension 4: API-Only Dependency (API) — 3/3 (100%)

*Run-4: 3/3 (100%) — unchanged*

### API-002: Correct Dependency Declaration — PASS

`@opentelemetry/api` in `peerDependencies` (^1.9.0). Correct for library. Agent also added `@traceloop/instrumentation-langchain` and `@traceloop/instrumentation-mcp` as optional peerDependencies — architecturally questionable for a library (finding EVAL-2) but non-blocking for API-002.

### API-003: No Vendor-Specific SDKs — PASS

No vendor-specific SDK packages. `@traceloop` packages are community auto-instrumentation, not vendor SDKs.

### API-004: No SDK-Internal Imports — PASS

No `@opentelemetry/sdk-*` or `@opentelemetry/instrumentation-*` imports in source files.

---

## Dimension 5: Schema Fidelity (SCH) — 4/4 (100%)

*Run-4: 2/4 (50%) — major improvement*

### SCH-001: Consistent Span Naming — PASS

All 17 span names across 9 committed files follow the `commit_story.*` namespace convention. Consistent pattern: `commit_story.{subsystem}.{operation}`.

**Instance count:** 17/17 spans compliant (100%).

*Run-4: 8/37 span names (22%) deviated from `commit_story.*` (context.\*, summary.\*, mcp.\* prefixes). Schema evolution propagation (PR #170) and prompt naming guidance (PR #175) resolved this. Partial files still show naming inconsistencies (summary-graph.js: mixed ai/journal namespaces) but the validation pipeline prevents these from reaching the branch.*

### SCH-002: Attribute Keys Match Registry — PASS (schema coverage split)

**Schema-covered files (5 + 2 partially covered):** All 7 files use only registry-defined attribute keys. Zero ad-hoc attributes.

**Schema-uncovered files (2):** auto-summarize.js and server.js have zero attributes — N/A for SCH-002 (nothing to evaluate). The absence is captured by COV-005.

*Run-4 strict: 11 ad-hoc attributes in 3 files (FAIL). Run-4 split: PASS (invention quality high). Run-5: PASS — covered files compliant, uncovered files have no attributes. Note: the "resolution" is a side-effect of zero attributes, not improved compliance. Run-4 had well-formed ad-hoc attributes; run-5 has none.*

### SCH-003: Attribute Values Conform to Types — PASS

All attribute values match registry types. Enums use valid members. `toISOString()` produces valid ISO 8601 strings.

### SCH-004: No Redundant Schema Entries — PASS

All attributes in committed files capture distinct domain concepts.

---

## Dimension 6: Code Quality (CDQ) — 7/7 (100%)

*Run-4: 4/7 (57%) — major improvement*

### CDQ-001: Spans Closed in All Code Paths — PASS

All 17 spans use `startActiveSpan` callback + `finally { span.end() }`. No span leaks.

### CDQ-002: Tracer Acquired Correctly — PASS

All 9 files use `trace.getTracer('commit-story')`. Library name matches `package.json#name`.

*Run-4: all 16 files used `'unknown_service'` (systemic bug, 16 affected files). Orbweaver PR #165 fixed prompt guidance. This was the highest-impact single fix.*

### CDQ-003: Standard Error Recording Pattern — PASS

Standard pattern (`recordException` + `setStatus(ERROR)` + re-throw) in all committed files. No misuse on expected-condition catches in delivered code.

*Run-4: summarize.js used `recordException` on expected-condition catches. Run-5: summarize.js failed instrumentation and was not committed. Latent CDQ-003 misuse exists in partial files (DEEP-3).*

### CDQ-005: Async Context Maintained — PASS

All spans use `startActiveSpan` callback pattern.

### CDQ-006: Expensive Attribute Computation Guarded — PASS

`toISOString()` calls exempt under cheap computation rule (run-5 methodology clarification). Property access (`.size`, `.length`) and trivial conversions do not require `isRecording()` guards.

*Run-4: toISOString() flagged (FAIL). Methodology clarification makes CDQ-006 consistent across runs.*

### CDQ-007: No Unbounded or PII Attributes — PASS

No unbounded or PII attributes. `commit.author` is in registry with PII annotation.

### CDQ-008: Consistent Tracer Naming Convention — PASS

All 9 files use `trace.getTracer('commit-story')`. Consistent and correct.

---

## Overall Score Summary

### Quality Rules by Dimension

| Dimension | Pass | Fail | N/A | Score | Run-4 | Change |
|-----------|------|------|-----|-------|-------|--------|
| Non-Destructiveness (NDS) | 2 | 0 | 0 | 2/2 (100%) | 1/2 (50%) | **Improvement** |
| Coverage (COV) | 3 | 2 | 1 | 3/5 (60%) | 2/6 (33%) | **Improvement** |
| Restraint (RST) | 4 | 0 | 1 | 4/4 (100%) | 3/4 (75%) | **Improvement** |
| API-Only Dependency (API) | 3 | 0 | 0 | 3/3 (100%) | 3/3 (100%) | Unchanged |
| Schema Fidelity (SCH) | 4 | 0 | 0 | 4/4 (100%) | 2/4 (50%) | **Improvement** |
| Code Quality (CDQ) | 7 | 0 | 0 | 7/7 (100%) | 4/7 (57%) | **Improvement** |
| **Total** | **23** | **2** | **2** | **23/25 (92%)** | **15/26 (58%)** | |

### Canonical Score

| Metric | Run-5 | Run-4 Strict | Run-4 Split+Adj |
|--------|-------|-------------|----------------|
| Quality score | **23/25 (92%)** | 15/26 (58%) | 19/26 (73%) |
| Gate pass rate | 5/5 (100%) | 4/5 (80%) | 4/5 (80%) |
| Committed files | 9 | 16 | 16 |
| Committed spans | 17 | 38 | 38 |

### Failure Summary

| Rule | Category | Root Cause | Finding |
|------|----------|-----------|---------|
| COV-001 | Persistent | index.js failed instrumentation (SCH-002 oscillation) | RUN-1, DEEP-6 |
| COV-005 | Genuine new finding | Schema-uncovered files get zero attributes | EVAL-1 |

---

## Systemic Bug Classification

### In Canonical Score

| Bug | Root Cause | Rules | Files | Instances |
|-----|-----------|-------|-------|-----------|
| SYS-1: Zero attributes on schema-uncovered files | Agent strips attributes to pass SCH-002, doesn't add alternatives | COV-005 | auto-summarize.js, server.js | 4 spans |
| SYS-2: Entry point SCH-002 oscillation | Agent can't converge on schema-compliant attributes for index.js | COV-001 | index.js | 1 file |

### Latent (Not in Canonical Score — Partial Files Only)

| Bug | Root Cause | Rules | Files | Instances |
|-----|-----------|-------|-------|-----------|
| SYS-3: COV-003/NDS-005b validator conflict | COV-003 requires error recording on expected-condition catches | NDS-005 | journal-manager, summary-manager, summary-detector | 8 violations |
| SYS-4: Duplicate JSDoc comments | Agent generates new JSDoc AND preserves original | NDS-003 | 5 partial files | 5 files |

**Why latent bugs matter:** If finding PR-4 (partial file instrumentation should be committable) is implemented, SYS-3 violations would become canonical NDS-005 failures. SYS-3 should be resolved (via DEEP-1: COV-003 expected-condition exemption) BEFORE relaxing the commit policy.

---

## Failure Classification

### Resolved from Run-4 (9 rules)

| Rule | Run-4 Status | Resolution |
|------|-------------|------------|
| NDS-005 | FAIL (3 files) | Violating files not committed. **Underlying behavior NOT fixed** — latent in partial files. |
| COV-002 | FAIL (methodology) | Canonical methodology: internal sync helpers are N/A. |
| COV-004 | FAIL (methodology) | Canonical methodology resolves parent-span-coverage debate. |
| RST-001 | FAIL (token-filter) | token-filter.js correctly skipped in run-5. |
| SCH-001 | FAIL (8/37 names) | Schema evolution + prompt naming guidance → all committed spans use `commit_story.*`. |
| SCH-002 | FAIL (11 ad-hoc attrs) | Schema coverage split: covered compliant, uncovered have zero attrs (COV-005). |
| CDQ-002 | FAIL (unknown_service) | Agent reads `package.json` name correctly. Orbweaver PR #165. |
| CDQ-003 | FAIL (summarize.js) | Violating file not committed. Latent in partial files. |
| CDQ-006 | FAIL (toISOString) | Cheap computation exemption standardized. |

### Persistent from Run-4 (1 rule)

| Rule | Evidence |
|------|----------|
| COV-001 | index.js entry point still has no span. Worse: run-4 had index.js on branch (missing root span); run-5 has index.js failed entirely. |

### Genuine New Findings (1 rule)

| Rule | Evidence |
|------|----------|
| COV-005 | auto-summarize.js and server.js have ZERO attributes (worse than run-4's wrong-registry attributes). Root cause: validation forces attribute removal on schema-uncovered files. |

---

## Run-4 Score Projection Validation

Run-4 predicted three tiers for run-5:

| Tier | Projected | Actual (92%) | Assessment |
|------|-----------|-------------|------------|
| **Minimum** (critical infra only) | 62-65% | Exceeded | Schema evolution and validation pipeline both working. |
| **Target** (critical + high priority) | 85% | Exceeded | CDQ-002, SCH-001 fixes pushed quality higher than projected. |
| **Stretch** (all genuine findings) | 92% adjusted | **Matched** | 92% canonical score matches stretch projection. |

**Caveat:** The stretch projection assumed a stable file set (16 committed files). Run-5 achieved 92% with only 9 committed files. The score was reached through a different mechanism: validation filtering + fixes, rather than fixes alone. The projection methodology assumed fixes would improve existing files' scores, not that the file set would shrink.

---

## Scoring Methodology Notes

### Run-5 Canonical vs Run-4 Scoring

Run-5 establishes the canonical scoring methodology (per-file evaluation + schema coverage split). Key differences from run-4:

1. **Single score.** No more 4-variant scoring (strict/adjusted/split/split+adjusted). One canonical score.
2. **Schema coverage split is standard.** SCH-002 evaluates schema-covered files on registry compliance, uncovered files on invention quality.
3. **Cheap computation exemption.** CDQ-006 exempts trivial conversions (`toISOString()`, `String()`, `Number()`).
4. **CDQ-002 semantic check.** Tracer name correctness, not just pattern match.
5. **NDS-005a/005b sub-classification.** Expected-condition catches (005b) distinguished from structural breakage (005a).
6. **Instance counts.** Per-file pass/fail counts alongside rule-level scores.
7. **Systemic bug classification.** One root cause → one finding, N affected instances.

### Denominator Difference

Run-4: 26 applicable rules (RST-005 N/A). Run-5: 25 applicable rules (RST-005 N/A, COV-006 N/A). COV-006 became N/A because journal-graph.js — the only file testing auto-instrumentation preferences — is partial in run-5, not committed.
