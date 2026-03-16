# Baseline Comparison: Run-4 vs Run-3 vs Run-2

**Date:** 2026-03-16
**Run-2:** SpinybackedOrbWeaver v1.0.0, 2026-03-12 (21 files)
**Run-3:** SpinybackedOrbWeaver (stale build), 2026-03-13 (21 files)
**Run-4:** SpinybackedOrbWeaver 0.1.0 (fresh build), 2026-03-16 (29 files)

---

## Executive Summary

Run-4 processed 29 files (up from 21) with a fresh orbweaver build, resolving all 3 stale-build repeat failures from run-3 (API-003, SCH-001, CDQ-008) and the API-002 regression. The API dimension improved from 33% to 100% — the largest single-dimension gain across all runs. Two persistently failing files (journal-graph.js, context-integrator.js) were rescued after failing in every prior run. However, the strict quality score dropped from 73% to 58%, driven by stricter per-file evaluation methodology (4 rules) and genuine new findings (NDS-005 expected-condition catches, CDQ-002 unknown_service tracer name, COV-001 missing root span, RST-001 over-instrumentation). Under methodology-adjusted + schema coverage split scoring, run-4 scores 73% — identical to run-3, showing that underlying agent quality is comparable while the evaluation methodology matured.

**The run-3 prediction — "fresh build pushes quality to ~85%" — was not met.** The 3 stale-build fixes (+3 rules) were offset by 4 genuine new failures and 4 methodology-driven failures. Reaching 85% requires fixing 3 specific orbweaver bugs (CDQ-002 unknown_service, NDS-005 expected-condition catches, COV-001 missing root span).

---

## Key Metrics Comparison

| Metric | Run-2 | Run-3 | Run-4 | Run-3→4 Change |
|--------|-------|-------|-------|----------------|
| **Overall quality (strict)** | 74% (20/27) | 73% (19/26) | 58% (15/26) | -15pp |
| **Overall quality (adjusted)** | — | — | 69% (18/26) | — |
| **Overall quality (split + adjusted)** | — | — | 73% (19/26) | ±0pp vs run-3 |
| **Gate checks** | 4/4 pass | 4/4 pass | 4/5 pass | NDS-002 fail (new) |
| **Files in scope** | 21 | 21 | 29 | +8 (summary subsystem) |
| **Files instrumented on branch** | 10 | 11 | 16 | +5 |
| **Files correctly skipped** | 7 | 6 | 10 | +4 |
| **Files failed/partial** | 4 | 4 | 3 (partial) | -1 (0 full failures) |
| **Persistently failing files rescued** | — | — | 2/4 | New metric |
| **Total spans on branch** | ~21 | 18 | 48 | +30 |
| **Unique span names** | — | 18 | 37 | +19 |
| **Wall-clock time** | Unknown | 52.4 min | ~80 min | +28 min (more files) |
| **PR artifact** | Created (--no-pr) | Failed (git push auth) | Failed (32 test failures) | Different failure |
| **Test suite** | 320/320 pass | 320/320 pass | 32 failures | Regressed (branch clean) |
| **Schema evolution** | Unknown | Unknown | Broken (0 extensions) | New observation |

**Rubric version note:** Run-2 used 27 rules; runs 3-4 use 26 scored quality rules + 5 gates (32 total rules, but NDS-006 was added and RST-005 is N/A). The overall percentages are directly comparable between run-3 and run-4 but run-2 had a slightly different rubric.

---

## Dimension-Level Comparison

| Dimension | Run-2 | Run-3 | Run-4 (strict) | Run-4 (adjusted) | Trend |
|-----------|-------|-------|-----------------|-------------------|-------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) | 1/2 (50%) | 1/2 (50%) | Regression (new finding) |
| Coverage (COV) | 4/6 + 2 partial | 6/6 (100%) | 2/6 (33%) | 4/6 (67%) | Regression (methodology + genuine) |
| Restraint (RST) | 5/5 (100%) | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) | Regression (new finding) |
| API-Only Dependency (API) | 0/3 (0%) | 1/3 (33%) | 3/3 (100%) | 3/3 (100%) | **Strong improvement** |
| Schema Fidelity (SCH) | 3/4 (75%) | 2/4 (50%) | 2/4 (50%) | 3/4 (75%)* | Unchanged strict; improved split |
| Code Quality (CDQ) | 6/7 (86%) | 4/7 (57%) | 4/7 (57%) | 5/7 (71%)** | Unchanged strict; different failures |

*SCH under schema coverage split: SCH-002 passes (schema-uncovered files evaluated on invention quality)
**CDQ under methodology adjustment: CDQ-002 passes (run-3 pattern-only criterion)

### Dimension Narratives

**API-Only Dependency (0% → 33% → 100%):** The standout improvement across all runs. Run-2 failed all 3 API rules. Run-3 improved one (API-004 via pre-run ESM setup) but regressed another (API-002 optional peerDep). Run-4 with a fresh build passes all three — the mega-bundle is gone (API-003), the agent correctly preserves peerDependencies (API-002), and no SDK imports appear in source (API-004). This validates the run-3 prediction that stale-build fixes would resolve API-003, and also shows the API-002 regression was a one-time agent behavior, not a persistent pattern.

**Coverage (100% → 33% strict, 67% adjusted):** The most dramatic apparent regression, but largely a methodology artifact. Run-3 used single-pass evaluation that accepted parent span coverage (COV-002, COV-004 PASS). Run-4's per-file agents evaluate individual operations more strictly, failing both rules. Under run-3 methodology, COV scores 67% — still lower than run-3 due to a genuine COV-001 regression (index.js missing root span) and COV-005 (new files with ad-hoc attributes). The methodology shift is permanent — run-5 should use per-file evaluation for consistency.

**Non-Destructiveness (100% → 100% → 50%):** First-ever NDS regression. Three files (summarize.js, summary-manager.js, summary-detector.js) have expected-condition catch blocks changed to record exceptions — a new failure class where the agent doesn't distinguish error handling from expected control flow. These are all new summary subsystem files not present in run-2 or run-3.

**Restraint (100% → 100% → 75%):** First-ever RST regression. token-filter.js has spans on pure synchronous functions (truncateDiff, truncateMessages) — a clear over-instrumentation case. This file was instrumented in prior runs but the spans on these functions are new in run-4.

**Schema Fidelity (75% → 50% → 50%):** Unchanged strict score across runs 3-4, but different failure profiles. Run-3: 4+ naming patterns (stale build), 2 ad-hoc attributes. Run-4: 8/37 span names deviate (schema-uncovered files), 11 ad-hoc attributes (all schema-uncovered files). Under schema coverage split methodology, SCH-002 passes — the agent's attribute invention quality is high for files with no registry guidance. See [Schema Coverage Split Context](#schema-coverage-split-context) below.

**Code Quality (86% → 57% → 57%):** Same score across runs 3-4, completely different failure set. Run-3 failures (CDQ-003 missing recordException, CDQ-007 PII, CDQ-008 inconsistent naming) are all resolved in run-4. Run-4 introduces CDQ-002 (unknown_service tracer name — bug existed in run-3 but not captured), CDQ-003 (error recording misuse on expected-condition path — different from run-3's "missing" issue), and CDQ-006 (toISOString without isRecording guard — methodology change). The turnover shows the evaluation is catching different issues as methodology matures, not the same ones recurring.

---

## Gate Check Comparison

| Gate | Run-2 | Run-3 | Run-4 | Trend |
|------|-------|-------|-------|-------|
| NDS-001 (Compilation) | PASS | PASS | PASS | Stable |
| NDS-002 (Tests pass) | PASS | PASS | **FAIL** (32 failures) | Regression |
| NDS-003 (Instrumentation-only) | PASS | PASS | PASS | Stable |
| API-001 (API-only imports) | PASS | PASS | PASS | Stable |
| NDS-006 (Module system) | N/A | N/A | PASS | New rule (run-4) |

**NDS-002 context:** The 32 test failures came from working-directory code that was never committed to the branch. The branch itself passes all tests. This is a run-process failure (function-level fallback doesn't add tracer imports), not a deliverable quality failure. Prior runs had no function-level fallback, so this failure mode didn't exist.

---

## File Outcome Comparison

### All Files Across Runs

| File | Run-2 | Run-3 | Run-4 | Change |
|------|-------|-------|-------|--------|
| claude-collector.js | Instrumented (1) | Instrumented (1) | Instrumented (3) | +2 spans |
| git-collector.js | Instrumented (2) | Instrumented (3) | Instrumented (5) | +2 spans |
| journal-graph.js | **Failed** (token budget) | **Failed** (oscillation) | **Instrumented (4)** | **Rescued** |
| guidelines/index.js | Instrumented (1) | Instrumented (1) | Instrumented (1) | Same |
| index.js | Instrumented (1) | Instrumented (1) | Instrumented (4) | +3 spans, but missing root |
| context-integrator.js | **Failed** (NDS-003) | **Failed** (NDS-003) | **Instrumented (1)** | **Rescued** |
| message-filter.js | Instrumented (1) | Instrumented (1) | Instrumented (2) | +1 span |
| sensitive-filter.js | **Failed** (null output) | **Failed** (null output) | **Partial** (2, not committed) | Improved |
| token-filter.js | Instrumented (2) | Instrumented (2) | Instrumented (3) | +1 span (over-instrumented) |
| journal-manager.js | **Failed** (NDS-003) | **Failed** (NDS-003 x5) | **Partial** (0 useful spans) | Marginal |
| mcp/server.js | Instrumented (1) | Instrumented (1) | Instrumented (2) | +1 span |
| context-capture-tool.js | Instrumented (2) | Instrumented (2) | Instrumented (2) | Same |
| reflection-tool.js | Instrumented (2) | Instrumented (2) | Instrumented (2) | Same |
| journal-paths.js | Instrumented (1) | Instrumented (1) | Instrumented (1) | Same |
| commit-analyzer.js | **Failed** (token budget) | Instrumented (3) | Instrumented (3) | Stable |
| config.js | Skipped (0) | Skipped (0) | Skipped (0) | Same |
| 5 prompt files | Skipped (0 each) | Skipped (0 each) | Skipped (0 each) | Same |
| **New in run-4:** | | | | |
| summarize.js | — | — | Instrumented (3) | New file |
| auto-summarize.js | — | — | Instrumented (2) | New file |
| summary-manager.js | — | — | Instrumented (4) | New file |
| summary-detector.js | — | — | Instrumented (2) | New file |
| summary-graph.js | — | — | **Partial** (6, not committed) | New file |
| monthly-summary-prompt.js | — | — | Skipped (0) | New file |
| 3 more prompt files | — | — | Skipped (0 each) | New files |

### File Outcome Summary

| Outcome | Run-2 | Run-3 | Run-4 | Trend |
|---------|-------|-------|-------|-------|
| Instrumented (on branch) | 10 | 11 | 16 | +5 from run-3 |
| Correctly skipped | 7 | 6 | 10 | +4 (new files) |
| Failed / Partial | 4 | 4 | 3 | -1 |
| **Total** | **21** | **21** | **29** | +8 new files |

### Persistently Failing Files — Cross-Run Tracker

| File | Run-2 | Run-3 | Run-4 | Status |
|------|-------|-------|-------|--------|
| journal-graph.js | Failed (token budget) | Failed (oscillation) | **Success (4 spans)** | **Rescued** — function-level fallback (orbweaver #106) |
| context-integrator.js | Failed (NDS-003) | Failed (NDS-003) | **Success (1 span)** | **Rescued** — agent found instrumentation-only approach |
| sensitive-filter.js | Failed (null output) | Failed (null output) | Partial (2 spans, not committed) | **Improved** — no longer null output; blocked by regex mangling + missing tracer import |
| journal-manager.js | Failed (NDS-003) | Failed (NDS-003 x5) | Partial (0 useful spans) | **Marginal** — NDS-003 still blocks meaningful functions |
| commit-analyzer.js | Failed (token budget) | Instrumented (3) | Instrumented (3) | **Stable** — rescued in run-3 via 150K budget |

**File rescue goal: 2 of 4 persistent failures rescued — goal met.**

---

## Failure Classification

### What Improved (Run-3 Failures → Run-4 Pass)

| Rule | Run-3 Status | Run-4 Status | How Resolved |
|------|-------------|-------------|--------------|
| API-002 | FAIL (optional peerDep) | PASS | Agent no longer marks @opentelemetry/api optional |
| API-003 | FAIL (mega-bundle, stale build) | PASS | Fresh build eliminated @traceloop/node-server-sdk |
| CDQ-007 | FAIL (PII in commit.author) | PASS | Registry updated with PII annotation (schema change) |
| CDQ-008 | FAIL (two tracer naming conventions) | PASS | Fresh build resolved stale-build inconsistency |

**4 rules improved.** 3 are stale-build resolution (API-003, CDQ-008, and indirectly CDQ-007). 1 is a genuine agent behavior improvement (API-002).

### What Regressed (Run-3 Pass → Run-4 Fail)

| Rule | Category | Root Cause | Genuine or Methodology? |
|------|----------|-----------|------------------------|
| NDS-005 | Expected-condition catches | 3 new summary files: ENOENT catches changed to ERROR | **Genuine** — new failure class |
| COV-001 | Missing root span | index.js main() has no span (run-3 had one) | **Genuine regression** |
| COV-002 | Individual operations | Parent span coverage insufficient per run-4 criteria | Methodology change |
| COV-004 | Individual async ops | Same methodology shift as COV-002 | Methodology change |
| COV-005 | Ad-hoc attributes | New summary files with no registry coverage | New territory |
| RST-001 | Over-instrumentation | token-filter.js spans on pure sync functions | **Genuine** — new finding |
| CDQ-002 | Wrong tracer name | All 16 files use 'unknown_service' | **Genuine** (bug existed in run-3, newly captured) |
| CDQ-006 | isRecording guard | toISOString() without guard | Methodology change |

**8 rules regressed.** 3 are genuine new findings, 1 is a genuine regression (COV-001), 3 are methodology changes, 1 is new territory.

### Persistent Failures (Same Status Across Runs)

| Rule | Runs 2–4 Status | Profile Change |
|------|-----------------|----------------|
| SCH-001 | FAIL across all runs | Run-2: registry mismatch. Run-3: 4+ patterns (stale). Run-4: 8/37 deviations (schema evolution). Different root cause each run. |
| SCH-002 | FAIL in runs 3–4 | Run-2: PASS. Run-3: 2 ad-hoc attrs. Run-4: 11 ad-hoc attrs (all schema-uncovered). Passes under split scoring. |
| CDQ-003 | FAIL in runs 3–4 | Run-3: missing recordException (commit-analyzer). Run-4: error recording misuse on expected-condition (summarize.js). Different file, different issue. |

---

## Schema Coverage Split Context

Run-4 processed ~9 new summary subsystem files that did not exist in run-2 or run-3. The Weaver schema was designed before this subsystem existed — no pre-defined span names or attributes cover these files. This has two cross-run comparison implications:

### 1. SCH Failures on New Files Are Not Regressions

SCH-001 and SCH-002 failures concentrated in schema-uncovered files (summarize.js, auto-summarize.js, summary-manager.js, summary-detector.js, MCP tools) represent the agent operating without registry guidance. Comparing these failures to run-3's SCH scores — where all evaluated files had registry coverage — is misleading.

**Apples-to-apples SCH comparison (schema-covered files only):**

| Rule | Run-3 (all covered) | Run-4 (covered only) | Run-4 (uncovered only) |
|------|---------------------|---------------------|----------------------|
| SCH-001 | FAIL (4+ naming patterns, stale build) | FAIL (1/10 files: context-integrator) | FAIL (4/6 files deviate) |
| SCH-002 | FAIL (2 ad-hoc attrs) | PASS (0 ad-hoc in covered files) | PASS (invention quality high) |

For schema-covered files, SCH-002 improved from FAIL to PASS — the 2 ad-hoc attributes from run-3 (git.subcommand, commit.parent_count) were pre-registered in the registry before run-4. SCH-001 improved from 4+ naming patterns to 1 outlier file (context-integrator using `context.gather_for_commit` instead of `commit_story.*`).

### 2. Schema Evolution Would Change Everything

Schema evolution was completely broken in run-4 (all extensions rejected as unparseable). If evolution had worked:
- Later files would have seen earlier files' span names → SCH-001 naming consistency would likely improve
- Schema-uncovered files would have had visibility into the `commit_story.*` convention → deviation would decrease
- Ad-hoc attributes would have been registered by evolution → SCH-002 would potentially pass under strict scoring

**Run-5's key comparison point:** With schema evolution fixed, re-evaluate SCH dimensions to determine how much of the SCH failure is agent judgment vs broken infrastructure.

---

## Cross-Run Trend Analysis

### Consistently Strong (All Runs)

- **NDS-003 (instrumentation-only changes):** PASS across all runs. The agent never modifies business logic in committed code. The NDS-003 validator is the strongest quality gate.
- **API-001 (API-only imports in source):** PASS across all runs. Source files only import `@opentelemetry/api`.
- **CDQ-001 (spans closed in all paths):** PASS across all runs. The `startActiveSpan` callback pattern prevents span leaks.
- **CDQ-005 (async context maintained):** PASS across all runs. Callback pattern handles this automatically.
- **RST-002, RST-003, RST-004:** PASS across all runs. No trivial accessor spans, no duplicate wrapper spans, I/O exemption correctly applied.

### Improving

- **API dimension (0% → 33% → 100%):** The clearest improvement trajectory. Each run fixed more dependency management issues. Run-4's fresh build eliminated the last stale-build repeat.
- **File success rate:** 48% (10/21) → 52% (11/21) → 55% (16/29). Steady increase, with function-level fallback as the key enabler for run-4.
- **Span density:** ~2.1 spans/file (run-2) → ~1.6 spans/file (run-3) → ~3.0 spans/file (run-4). The agent is finding more instrumentation opportunities per file.

### Regressing

- **NDS-005 (error handling):** First failure in run-4. The new summary subsystem files introduced a failure class (expected-condition catches) that didn't exist in the run-2/3 codebase. This is a genuine agent limitation, not a regression on existing files.
- **COV dimension (67-100% → 100% → 33-67%):** Regressed due to methodology change (stricter per-file evaluation) plus a genuine COV-001 regression. The methodology change is permanent.
- **Gate pass rate:** 100% → 100% → 80%. First-ever gate failure (NDS-002) from function-level fallback's missing tracer import.

### Persistent Problems

- **Span naming consistency (SCH-001):** Failed in every run, always with a different root cause. Run-2: registry mismatch. Run-3: stale build. Run-4: schema evolution broken. This is the most persistent single-rule failure. Resolution depends on schema evolution (orbweaver finding #1) and potentially a naming template in the agent prompt (finding #10).
- **NDS-003 blocking files:** journal-manager.js has been blocked by NDS-003 in all 3 runs. The validator correctly prevents non-instrumentation changes, but the agent can't instrument meaningful functions in this file without minor structural changes. This is a design tension, not a bug.
- **PR delivery:** No successful GitHub PR in runs 3-4. Run-3: git push auth failed. Run-4: test failures blocked creation. The orbweaver run has never successfully delivered a PR artifact to GitHub for this codebase.

---

## Evaluation Methodology Evolution

The evaluation methodology itself has improved significantly across runs, which complicates direct score comparison.

| Aspect | Run-2 | Run-3 | Run-4 |
|--------|-------|-------|-------|
| **Evaluator** | Human + LLM | Human + LLM | Multi-agent per-file |
| **Rules applied** | 27 | 26 (31 in rubric) | 26 + 5 gates (32 in rubric) |
| **COV-002/COV-004 criterion** | Parent span sufficient | Parent span sufficient | Individual operation spans expected |
| **CDQ-002 criterion** | — | Pattern check (getTracer called) | Semantic check (name correct) |
| **CDQ-006 criterion** | — | Lightweight ops exempt | All computation needs guard |
| **Schema coverage split** | Not applied | Not applied | Applied (SCH-002 reinterpretation) |
| **Score variants** | Strict only | Strict only | Strict + adjusted + split |

**Recommendation for run-5:** Use per-file evaluation methodology consistently. Provide methodology-adjusted scores when comparing to run-3. The strict score is the primary metric; adjusted scores are for cross-run context.

---

## Run-3 Prediction Assessment

Run-3's baseline comparison predicted:

> "If [the stale-build fixes] resolve API-003, CDQ-008, and SCH-001, the quality pass rate should jump from 73% to ~85%."

### What Actually Happened

The 3 stale-build fixes did resolve:
- **API-003:** PASS (mega-bundle gone) ✓
- **CDQ-008:** PASS (consistent tracer naming) ✓
- **API-002:** PASS (no longer marks OTel API optional) — bonus improvement ✓
- **CDQ-007:** PASS (PII annotation in registry) — schema change, not agent fix ✓

These +4 improvements would have pushed the score to ~88% (23/26) IF nothing else changed. But the evaluation also found:

**Genuine new failures (4):** NDS-005, COV-001, RST-001, CDQ-002
**Methodology-driven failures (4):** COV-002, COV-004, COV-005, CDQ-006

The net result: +4 improvements, -8 new failures = 15/26 (58%) strict. Under adjusted scoring that neutralizes the 4 methodology changes: +4 improvements, -4 genuine failures = 19/26 (73%) — unchanged from run-3.

### Why the Prediction Was Wrong

1. **New files introduced new failures.** The summary subsystem files brought NDS-005 (expected-condition catches) and COV-005 (ad-hoc attributes) — failure classes that didn't exist in the run-3 codebase.
2. **Stricter evaluation found latent bugs.** CDQ-002 (unknown_service) existed in run-3 but wasn't captured. Per-file evaluation revealed it.
3. **More surface area = more opportunities for failures.** 16 instrumented files vs 11 means more files that can trigger rule-level failures.
4. **The prediction assumed the same files at the same quality.** In reality, run-4 processed 8 more files with different characteristics.

---

## Path to 85%

Under the methodology-adjusted + schema coverage split scoring (currently 19/26 = 73%), reaching 85% (22/26) requires fixing 3 specific orbweaver bugs:

| Fix | Rule | Orbweaver Finding | Complexity |
|-----|------|------------------|------------|
| Tracer name: 'commit-story' not 'unknown_service' | CDQ-002 | #9 | Low — prompt/config fix |
| Don't record expected-condition catches as errors | NDS-005 | #3 | Medium — agent needs catch-block classification |
| Add root span to index.js main() | COV-001 | #13 | Low — agent should always span entry points |

Under strict scoring (currently 15/26 = 58%), reaching 85% (22/26) additionally requires:
- COV-002 / COV-004: Individual operation spans (agent needs to span internal helpers)
- CDQ-006: isRecording() guards on all attribute computation
- RST-001: Don't span pure synchronous functions
- COV-005: Register ad-hoc attributes in schema evolution (depends on finding #1 fix)

---

## Timing and Cost

| Metric | Run-2 | Run-3 | Run-4 |
|--------|-------|-------|-------|
| Wall-clock (main) | Unknown | 35.7 min | ~80 min |
| Wall-clock (supplemental) | N/A | 16.7 min | N/A |
| Wall-clock (total) | Unknown | 52.4 min | ~80 min |
| Files processed | 21 | 21 + 3 supplemental | 29 |
| Per-file average | Unknown | ~102s/file (main) | ~166s/file |
| Cost (actual) | ~$5.50-6.50 | Not recorded | $5.84 |
| Cost (ceiling) | Unknown | Unknown | $67.86 |
| Cost ratio | Unknown | Unknown | 8.6% |

**Cost anomaly note:** The $5.84 actual cost (8.6% of ceiling) looks like good efficiency but is a symptom of broken schema evolution — the prompt was identical across all 29 files due to aggressive cache hits. With schema evolution working, run-5 should have higher costs (more cache misses as the schema changes between files). If cost remains <15% of ceiling, investigate whether the prompt is actually changing.

---

## Verdict

Run-4 demonstrates the orbweaver agent is **improving in capability** (more files, rescued persistent failures, API dependency model fixed) while the **evaluation is becoming more thorough** (per-file agents, schema coverage split, methodology-adjusted scoring). The gap between the strict score (58%) and adjusted score (73%) quantifies exactly how much of the apparent regression is evaluation methodology vs genuine quality issues.

**Three categories of work remain:**

1. **Infrastructure fixes (Critical):** Schema evolution (finding #1) and validation pipeline (finding #2) are architectural issues that affect every file. These must be fixed before run-5 to have a meaningful evaluation.

2. **Agent behavior fixes (High):** Expected-condition catch handling (finding #3), tracer library name (finding #9), and root span coverage (finding #13) are the 3 specific fixes needed to reach 85% under adjusted scoring.

3. **Evaluation methodology standardization:** Run-5 should establish per-file evaluation as the baseline and provide methodology-adjusted comparisons to runs 2-3. The schema coverage split should be a standard scoring dimension, not an ad-hoc adjustment.

The self-improving evaluation chain is working: each run's evaluation produces increasingly precise diagnostics. Run-2 found "API rules fail." Run-3 found "stale build is the root cause." Run-4 found "fresh build fixes API but reveals NDS-005, CDQ-002, and broken schema evolution." Run-5 should focus on whether schema evolution and validation pipeline fixes change the quality trajectory.
