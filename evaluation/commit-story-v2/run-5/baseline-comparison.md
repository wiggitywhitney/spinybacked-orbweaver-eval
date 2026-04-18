# Baseline Comparison: Run-5 vs Run-4 vs Run-3 vs Run-2

**Date:** 2026-03-17
**Run-2:** SpinybackedOrbWeaver v1.0.0, 2026-03-12 (21 files)
**Run-3:** SpinybackedOrbWeaver (stale build), 2026-03-13 (21 files)
**Run-4:** SpinybackedOrbWeaver 0.1.0 (fresh build), 2026-03-16 (29 files)
**Run-5:** SpinybackedOrbWeaver 0.1.0 (schema evolution + validation pipeline), 2026-03-17 (29 files)

---

## Executive Summary

Run-5 achieved 92% canonical quality (23/25) with 5/5 gates — the highest quality score and first clean gate pass across all evaluation runs. However, this came at a significant coverage cost: only 9 files committed vs run-4's 16 (a 44% reduction). The validation pipeline (orbweaver PRD #156) traded coverage for quality — the 9 committed files are high-quality (7/9 pass every applicable rule), but 7 previously-instrumented files were filtered out.

**What run-5 proved:**
1. Schema evolution works end-to-end — all 17 committed span names use `commit_story.*` namespace (vs 22% deviation in run-4)
2. The validation pipeline catches real quality issues — NDS-002 gate failure resolved, all gates pass
3. Three high-priority agent behavior fixes landed (CDQ-002 tracer name, RST-001 skip decisions, SCH-001 naming)
4. But the pipeline over-filters — 5 of 7 lost files are caused by validation infrastructure bugs (COV-003/NDS-005b conflict, SCH-002 oscillation), not agent quality problems

**Run-4 predicted 85% target / 92% stretch.** Run-5 achieved 92% but through a different mechanism than projected — validation filtering + fixes rather than fixes alone on a stable file set. The prediction methodology needs revision: it assumed the file set would remain constant.

---

## Key Metrics Comparison

| Metric | Run-2 | Run-3 | Run-4 | Run-5 | Run-4→5 Change |
|--------|-------|-------|-------|-------|----------------|
| **Quality score (canonical)** | 74% (20/27) | 73% (19/26) | 58% strict / 73% adjusted | **92% (23/25)** | +34pp strict / +19pp adj |
| **Gate checks** | 4/4 pass | 4/4 pass | 4/5 pass | **5/5 pass** | NDS-002 FAIL→PASS |
| **Files in scope** | 21 | 21 | 29 | 29 | Unchanged |
| **Files committed on branch** | 10 | 11 | 16 | **9** | **-44%** |
| **Files correctly skipped** | 7 | 6 | 10 | 12 | +2 (improved skip decisions) |
| **Files failed/partial** | 4 | 4 | 3 | **8** (2 failed + 6 partial) | +5 (validation strictness) |
| **Total spans committed** | ~21 | 18 | 38 | **17** | **-55%** |
| **PR artifact** | Created (--no-pr) | Failed (push auth) | Failed (test failures) | **Failed (push auth)** | 3rd consecutive failure |
| **Test suite** | 320/320 | 320/320 | 32 failures | **Passing** | Resolved |
| **Schema evolution** | Unknown | Unknown | Broken | **Working** | Major fix |
| **Cost (actual)** | ~$5.50-6.50 | Not recorded | $5.84 | **$9.72** | +66% (expected) |
| **Cost (ceiling)** | Unknown | Unknown | $67.86 | $67.86 | Unchanged |
| **Cost ratio** | Unknown | Unknown | 8.6% | **14.3%** | +5.7pp |
| **Orbweaver version** | v1.0.0 | stale build | 0.1.0 | **0.1.0** | Same version, new fixes merged |

**Scoring methodology note:** Run-5 establishes per-file evaluation + schema coverage split as the canonical methodology. Runs 2-4 used various scoring approaches; the run-4 "adjusted + split" score (73%) is the most comparable to run-5's canonical score. Denominators differ: run-2 had 27 rules, runs 3-4 had 26, run-5 has 25 (COV-006 became N/A because journal-graph.js is not committed).

---

## Dimension-Level Trend Analysis (4-Run)

| Dimension | Run-2 | Run-3 | Run-4 (strict) | Run-5 (canonical) | Trend |
|-----------|-------|-------|-----------------|-------------------|-------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) | 1/2 (50%) | **2/2 (100%)** | Recovered |
| Coverage (COV) | 4/6 (67%) | 6/6 (100%) | 2/6 (33%) | **3/5 (60%)** | Improving from run-4 trough |
| Restraint (RST) | 5/5 (100%) | 4/4 (100%) | 3/4 (75%) | **4/4 (100%)** | Recovered |
| API-Only Dependency (API) | 0/3 (0%) | 1/3 (33%) | 3/3 (100%) | **3/3 (100%)** | Stable at ceiling |
| Schema Fidelity (SCH) | 3/4 (75%) | 2/4 (50%) | 2/4 (50%) | **4/4 (100%)** | **Best ever** |
| Code Quality (CDQ) | 6/7 (86%) | 4/7 (57%) | 4/7 (57%) | **7/7 (100%)** | **Best ever** |

### Dimension Narratives

**NDS (100% → 100% → 50% → 100%):** Run-4's NDS-005 regression (expected-condition catches recorded as errors on 3 files) is resolved in scoring — those files were not committed in run-5. However, the underlying agent behavior is NOT fixed. 8 NDS-005b violations exist in partial file working-tree diffs. This is a "superficial resolution" — if the validation pipeline is relaxed to commit partial files (finding PR-4), NDS-005 will regress.

**COV (67% → 100% → 33% → 60%):** The most volatile dimension across runs, driven by methodology changes (COV-002/COV-004 criteria), file set changes (new files introduce new failure types), and the persistent COV-001 regression (index.js entry point has no span since run-4). Run-5's 60% is an improvement from run-4's 33% strict, but lower than run-3's 100% (different methodology). The two remaining failures (COV-001: entry point, COV-005: zero attributes on schema-uncovered files) are the only 2 canonical failures in the entire rubric.

**RST (100% → 100% → 75% → 100%):** Recovered. Run-4's RST-001 failure (token-filter.js over-instrumented with spans on pure sync functions) is resolved — token-filter.js is correctly skipped in run-5. This represents a genuine improvement in the agent's skip decisions, not just filtering.

**API (0% → 33% → 100% → 100%):** Stable at ceiling for the second consecutive run. The stale-build cycle (runs 2-3) is fully behind. API dependency management is a solved problem.

**SCH (75% → 50% → 50% → 100%):** The standout improvement. SCH-001 (span naming) improved from 22% deviation to 0% deviation — schema evolution propagation (PR #170) and prompt naming guidance (PR #175) resolved the persistent naming inconsistency that failed in every prior run. SCH-002 (attribute keys) passes under schema coverage split — covered files are fully compliant, uncovered files have zero attributes (N/A for SCH-002, captured as COV-005). The "100%" is genuine for covered files but masks the zero-attribute problem on uncovered files.

**CDQ (86% → 57% → 57% → 100%):** All 7 CDQ rules pass. CDQ-002 (tracer name) was the highest-impact single fix — 16 files used 'unknown_service' in run-4, all 9 committed files use 'commit-story' in run-5 (orbweaver PR #165). CDQ-003 and CDQ-006 resolutions are a mix of methodology clarification (CDQ-006 cheap computation exemption) and filtering (CDQ-003 violating file not committed).

---

## Gate Check Comparison

| Gate | Run-2 | Run-3 | Run-4 | Run-5 | Trend |
|------|-------|-------|-------|-------|-------|
| NDS-001 (Compilation) | PASS | PASS | PASS | PASS | Stable |
| NDS-002 (Tests pass) | PASS | PASS | **FAIL** | **PASS** | Recovered |
| NDS-003 (Instrumentation-only) | PASS | PASS | PASS | PASS | Stable |
| API-001 (API-only imports) | PASS | PASS | PASS | PASS | Stable |
| NDS-006 (Module system) | N/A | N/A | PASS | PASS | Stable (new in run-4) |

Run-5 is the first clean gate pass across all evaluation runs. Run-4's NDS-002 failure (32 test failures from function-level fallback missing tracer imports) is resolved by the validation pipeline's per-file syntax and test checks before commit.

---

## File Outcome Comparison

### All Files Across Runs

| File | Run-2 | Run-3 | Run-4 | Run-5 | Trajectory |
|------|-------|-------|-------|-------|------------|
| claude-collector.js | Instrumented (1) | Instrumented (1) | Instrumented (1) | Instrumented (1) | **Stable** |
| git-collector.js | Instrumented (2) | Instrumented (3) | Instrumented (3) | Instrumented (3) | **Stable** |
| journal-graph.js | Failed | Failed | **Instrumented (4)** | Partial (1 func) | **Regressed** — DEEP-2b |
| guidelines/index.js | Instrumented (1) | Instrumented (1) | Skipped (0) | Skipped (0) | Correct skip from run-4 |
| index.js | Instrumented (1) | Instrumented (1) | Instrumented (2) | **Failed** | **Regressed** — RUN-1 |
| context-integrator.js | Failed | Failed | **Instrumented (1)** | Instrumented (1) | **Stable** (rescued run-4) |
| message-filter.js | Instrumented (1) | Instrumented (1) | Instrumented (1) | **Skipped (0)** | Correct skip (pure sync) |
| sensitive-filter.js | Failed | Failed | Partial (2) | Partial (0) | Marginal improvement |
| token-filter.js | Instrumented (2) | Instrumented (2) | Instrumented (3) | **Skipped (0)** | Correct skip (RST-001 fix) |
| journal-manager.js | Failed | Failed | Partial (0) | Partial (1 func) | Marginal improvement |
| mcp/server.js | Instrumented (1) | Instrumented (1) | Instrumented (1) | Instrumented (1) | **Stable** |
| context-capture-tool.js | Instrumented (2) | Instrumented (2) | Instrumented (2) | Instrumented (2) | **Stable** |
| reflection-tool.js | Instrumented (2) | Instrumented (2) | Instrumented (2) | Instrumented (2) | **Stable** |
| journal-paths.js | Instrumented (1) | Instrumented (1) | Instrumented (1) | Instrumented (1) | **Stable** |
| commit-analyzer.js | Failed | Instrumented (3) | Instrumented (3) | Instrumented (3) | **Stable** (rescued run-3) |
| config.js | Skipped (0) | Skipped (0) | Skipped (0) | Skipped (0) | **Stable** |
| 5 prompt files (run-2 scope) | Skipped | Skipped | Skipped | Skipped | **Stable** |
| **Summary subsystem (run-4+):** | | | | | |
| summarize.js | — | — | Instrumented (3) | **Failed** | **Regressed** — DEEP-1 |
| auto-summarize.js | — | — | Instrumented (3) | Instrumented (3) | **Stable** |
| summary-manager.js | — | — | Instrumented (3) | Partial (9 func) | **Regressed** — DEEP-1 |
| summary-detector.js | — | — | Instrumented (5) | Partial (4 func) | **Regressed** — DEEP-1 |
| summary-graph.js | — | — | Partial (6) | Partial (11 func) | Improved (more functions) |
| monthly-summary-prompt.js | — | — | Skipped (0) | Skipped (0) | **Stable** |
| 3 more prompt files (run-4+) | — | — | Skipped | Skipped | **Stable** |

### File Outcome Summary

| Outcome | Run-2 | Run-3 | Run-4 | Run-5 | Trend |
|---------|-------|-------|-------|-------|-------|
| Committed on branch | 10 | 11 | 16 | **9** | -44% from run-4 |
| Correctly skipped | 7 | 6 | 10 | **12** | +2 (improved skip decisions) |
| Failed / Partial | 4 | 4 | 3 | **8** | +5 (validation strictness) |
| **Total** | **21** | **21** | **29** | **29** | Unchanged |

### File Trajectory Classification

| Category | Count | Files |
|----------|-------|-------|
| **Stable committed** (3+ consecutive runs) | 7 | claude-collector, git-collector, context-integrator, server, context-capture-tool, reflection-tool, journal-paths |
| **Stable committed** (new in run-5 scope) | 1 | commit-analyzer (stable since run-3 rescue), auto-summarize |
| **Improved skip decisions** | 2 | message-filter (over-instrumented run-2→4), token-filter (RST-001 in run-4) |
| **Regressed: validation infrastructure** | 5 | journal-graph (DEEP-2b), index (RUN-1), summarize (DEEP-1), summary-manager (DEEP-1), summary-detector (DEEP-1) |
| **Persistent problem** | 2 | sensitive-filter (3 runs), journal-manager (4 runs) |
| **Improving partial** | 1 | summary-graph (6 func run-4 → 11 func run-5) |

**Key insight:** The 5 regressions are all caused by the new validation pipeline infrastructure (PRs #171, #173), not agent quality degradation. The agent's instrumentation decisions are generally sound — the validator is rejecting correct behavior in some cases (COV-003/NDS-005b conflict) and causing convergence failures in others (SCH-002 oscillation).

---

## Failure Classification

### Resolved from Run-4 (9 quality rules + 1 gate)

| Rule | Run-4 Status | Run-5 Status | Resolution Type |
|------|-------------|-------------|-----------------|
| NDS-002 (gate) | FAIL (32 test failures) | PASS | **Genuine fix** — validation pipeline prevents uncommitted tracer errors |
| NDS-005 | FAIL (3 files) | PASS | **Superficial** — violating files filtered out, behavior unchanged |
| COV-002 | FAIL (methodology) | PASS | **Methodology** — canonical methodology: internal helpers N/A |
| COV-004 | FAIL (methodology) | PASS | **Methodology** — canonical methodology resolves coverage debate |
| RST-001 | FAIL (token-filter) | PASS | **Genuine fix** — improved skip decisions |
| SCH-001 | FAIL (8/37 names) | PASS | **Genuine fix** — schema evolution + naming guidance |
| SCH-002 | FAIL (11 ad-hoc attrs) | PASS (split) | **Mixed** — covered files compliant, uncovered have zero attrs |
| CDQ-002 | FAIL (unknown_service) | PASS | **Genuine fix** — orbweaver PR #165 |
| CDQ-003 | FAIL (summarize.js) | PASS | **Superficial** — violating file not committed |
| CDQ-006 | FAIL (toISOString) | PASS | **Methodology** — cheap computation exemption |

**Genuine fixes: 4** (NDS-002, RST-001, SCH-001, CDQ-002). These represent real quality improvement.
**Methodology changes: 3** (COV-002, COV-004, CDQ-006). Scoring criteria refined, not agent behavior.
**Superficial resolutions: 3** (NDS-005, SCH-002, CDQ-003). Underlying behavior unchanged — validation filtering hides the problem.

### Persistent from Run-4 (1 rule)

| Rule | Evidence | Trajectory |
|------|----------|------------|
| COV-001 | index.js entry point has no span. Run-4: on branch but missing root span. Run-5: failed instrumentation entirely (SCH-002 oscillation). | **Worse** — from partial to failed |

### Genuine New Findings (1 rule)

| Rule | Evidence | Root Cause |
|------|----------|------------|
| COV-005 | auto-summarize.js (3 spans, 0 attrs) and server.js (1 span, 0 attrs). Run-4: wrong-registry attributes. Run-5: zero attributes. | Agent strips all attributes to pass SCH-002 on schema-uncovered files |

---

## Schema Evolution Impact Assessment

Schema evolution was completely broken in run-4 (all extensions rejected as unparseable). Run-5 is the first evaluation with working schema evolution. This is the most significant infrastructure change between runs.

### Direct Impact

| Metric | Run-4 (evolution broken) | Run-5 (evolution working) | Change |
|--------|--------------------------|---------------------------|--------|
| Agent-extensions.yaml | Not created | 14 extensions registered | New |
| Span naming compliance (SCH-001) | 78% (29/37 compliant) | **100% (17/17)** | +22pp |
| Ad-hoc attributes (SCH-002 strict) | 11 ad-hoc keys in 3 files | 0 ad-hoc keys | Full resolution |
| Cross-file naming consistency | No propagation (broken) | `commit_story.*` propagated across all files | Working |

### Indirect Impact

Schema evolution working changed the failure landscape:

1. **SCH-002 validation now active.** In run-4, the agent could add any attribute names without schema feedback. In run-5, the SCH-002 validator rejects non-registry attributes during the fix loop. This caused: index.js oscillation failure (RUN-1), summarize.js failure (18 SCH-002 violations), and zero attributes on schema-uncovered files (EVAL-1).

2. **Naming consistency achieved but at a coverage cost.** The `commit_story.*` namespace propagates correctly, but files that need attributes not in the registry (summarize metrics, auto-summarize details) can't add them without triggering SCH-002 violations.

3. **Cost increased as expected.** $9.72 (14.3% of ceiling) vs $5.84 (8.6%) in run-4. The increased cost reflects more cache misses as the schema changes between files — exactly what broken evolution prevented in run-4. The cost ratio is now within the expected range (10-20% of ceiling).

### Assessment

Schema evolution working is a clear infrastructure improvement. The SCH dimension jumped from 50% to 100%, and naming consistency (the most persistent single-rule failure across all runs) is resolved. The trade-off is that SCH-002 validation now actively blocks files — a known risk flagged in the PRD. The next priority is improving the agent's ability to satisfy SCH-002 on schema-uncovered files (finding EVAL-1) and preventing oscillation failures (finding RUN-1).

---

## Handoff Process Assessment

Run-4 established the recommendation-document handoff process. Run-5 evaluates whether the orbweaver AI correctly triaged the findings.

### Triage Results

All 13 run-4 findings were filed by the orbweaver AI — **none rejected**. The AI right-sized work correctly:

| Action | Count | Details |
|--------|-------|---------|
| Issue filed | 11 | Findings #3-5, #8-13, plus #7 folded into PRD |
| PRD filed | 1 | Finding #2 (validation pipeline — multi-milestone effort) |
| Downgraded from PRD to Issue | 1 | Finding #1 (schema evolution — simpler fix than projected) |
| Bonus issues filed during implementation | 3 | PRs #172, #173, #174 (discovered while fixing other issues) |
| **Total PRs merged before run-5** | **13** | All findings addressed |

### What the Orbweaver AI Got Right

- **Batched related prompt fixes** into a single PR (#165): findings #3, #9, #12, #13 — all prompt-guidance changes.
- **Combined schema evolution + naming** into PR #170: findings #1 and #10 share a root cause.
- **Folded finding #7** (LOC-aware test cadence) into PRD #156 — correct, both share the validation pipeline root cause.
- **Downgraded finding #1** from PRD to Issue — the schema evolution fix was a parser change, not a multi-milestone effort. This was the right call.
- **Discovered 3 additional bugs** during implementation (PRs #172-174) — proactive quality improvement beyond the handoff scope.

### What Didn't Work

- **Finding #3 (expected-condition catches):** Fixed via prompt guidance only — no automated validator. The underlying behavior persists: 8 NDS-005b violations in run-5 partial files. The fix was necessary but insufficient.
- **Finding #13 (index.js root span):** Prompt guidance added, but index.js failed instrumentation entirely in run-5 due to SCH-002 oscillation. The fix targeted the wrong layer — the problem isn't that the agent doesn't know to add a root span, it's that the agent can't satisfy SCH-002 on this file.
- **Push authentication (run-3 #12):** 3rd consecutive failure. The orbweaver AI did not address this because it was framed as an environmental issue. Run-5 confirms it's a tool-level issue (HTTPS vs SSH authentication).

### Process Retrospective

The recommendation-document approach is working well. Key strengths:
- The orbweaver AI verifies findings against its own codebase — it caught finding #1's complexity overestimate
- Batching related fixes reduces PR churn
- Bonus discovery (3 additional bugs) shows the AI is investigating deeply, not just checking boxes

Areas for improvement:
- Prompt-only fixes need validation in the handoff (finding #3 should have included "add automated validator" as acceptance criteria)
- Environmental/infrastructure issues need explicit ownership assignment (push auth has been open for 3 runs)
- Include failing file reproductions in the handoff so the orbweaver AI can use them as acceptance test cases

---

## Run-4 Score Projection Validation

Run-4's `actionable-fix-output.md` § 9 projected three tiers for run-5:

| Tier | Projected Score | Projected Mechanism | Actual | Assessment |
|------|----------------|---------------------|--------|------------|
| **Minimum** | 62-65% | Schema evolution + validation pipeline fixes | Exceeded | Both working, plus more |
| **Target** | 85% (22/26) | + CDQ-002, NDS-005, COV-001 fixes | Exceeded | CDQ-002 ✓, NDS-005 filtered, COV-001 still fails |
| **Stretch** | 92% (24/26) | + SCH-001, RST-001 fixes | **Matched** | SCH-001 ✓, RST-001 ✓, achieved 92% (23/25) |

### What the Projections Got Right

- **CDQ-002 fix impact:** Projected single highest-impact fix. Confirmed — 16→0 failing files.
- **SCH-001 fix dependency on schema evolution:** Projected as schema-evolution-dependent. Confirmed — with evolution working, naming is 100% consistent.
- **RST-001 resolution:** Projected as "don't span pure sync functions." Confirmed — token-filter correctly skipped.

### What the Projections Got Wrong

- **Assumed stable file set.** The projections assumed 16 committed files would remain committed. Run-5 has 9. The score was reached through validation filtering, not through fixing rules on the same files.
- **COV-001 assumed simple fix.** Projected "agent should always span entry points" (Low complexity). Actual: SCH-002 oscillation makes the fix much harder than projected — it's a convergence problem, not a knowledge problem.
- **NDS-005 assumed genuine fix.** Projected "agent needs catch-block classification." Actual: prompt guidance was added but has no automated enforcement. The validation pipeline filters out violating files instead.
- **Denominator changed.** Projected 26 applicable rules. Actual: 25 (COV-006 became N/A). The stretch projection of 24/26 = 92% maps to 23/25 = 92% — same percentage, different fraction.

### Projection Methodology Lessons for PRD #6

1. **Model file set changes explicitly.** Include a "file set assumptions" section with each tier.
2. **Distinguish "fix" from "filter."** A rule can move from FAIL to PASS via (a) genuine fix, (b) methodology change, or (c) filtering. Only (a) is durable.
3. **Track latent failures.** Rules that "resolved" via filtering should be tracked as latent — they will regress if the pipeline changes.
4. **Anticipate new failure modes from fixes.** Schema evolution working introduced SCH-002 oscillation — a failure mode that couldn't exist when evolution was broken.

---

## Cost Comparison

| Metric | Run-2 | Run-3 | Run-4 | Run-5 |
|--------|-------|-------|-------|-------|
| **Actual cost** | ~$5.50-6.50 | Not recorded | $5.84 | **$9.72** |
| **Ceiling** | Unknown | Unknown | $67.86 | $67.86 |
| **Cost ratio** | Unknown | Unknown | 8.6% | **14.3%** |
| **Files processed** | 21 | 21+3 | 29 | 29 |
| **Per-file cost** | ~$0.29 | Unknown | $0.20 | **$0.34** |
| **Retries** | None | 3 supplemental | None | Multiple (validation loop) |

### Interpretation

Run-5's 66% cost increase ($5.84 → $9.72) is expected and healthy:

1. **Schema evolution working = more cache misses.** In run-4, the prompt was identical for all 29 files because extensions were rejected (100% cache hits). In run-5, the schema changes between files as extensions are registered, forcing fresh LLM calls.

2. **Validation retries add cost.** Complex files (summary-graph, summary-manager) went through multiple retry cycles, each requiring a full re-analysis. Per-file cost breakdown isn't available (finding RUN-5), but the 6 partial + 2 failed files likely consumed disproportionate cost.

3. **14.3% of ceiling is within expected range.** The run-4 analysis flagged <15% as a diagnostic signal for broken schema evolution. Run-5's 14.3% is at the boundary — schema evolution is working but the cost is still lower than expected for full cache-miss behavior. This suggests some caching is still effective (files processing the same subsystem share similar prompts).

4. **Run-4's $5.84 was anomalously low.** The cost should have been higher but broken schema evolution caused identical prompts → cache hits. Run-5's cost is closer to what a healthy run should look like.

---

## Cross-Run Trend Analysis

### Consistently Strong (All 4 Runs)

| Rule | Status | Note |
|------|--------|------|
| NDS-001 (Compilation) | PASS | Agent never produces syntax errors in committed code |
| NDS-003 (Instrumentation-only) | PASS (gate) | Business logic never modified in committed code |
| API-001 (API-only imports) | PASS | Source files only import `@opentelemetry/api` |
| CDQ-001 (Spans closed) | PASS | `startActiveSpan` callback pattern prevents leaks |
| CDQ-005 (Async context) | PASS | Callback pattern handles automatically |
| RST-002, RST-003, RST-004 | PASS | No trivial accessors, no duplicate wrappers, I/O exemption correct |

### Improving Trajectory

| Rule/Metric | Trajectory | Current Status |
|-------------|------------|----------------|
| API dimension | 0% → 33% → 100% → 100% | Solved — stable at ceiling |
| SCH-001 (span naming) | FAIL → FAIL → FAIL → **PASS** | Resolved after 3 consecutive failures |
| CDQ-002 (tracer name) | (not captured) → (not captured) → FAIL → **PASS** | Resolved — high-impact fix |
| Gate pass rate | 100% → 100% → 80% → **100%** | Recovered — first ever clean pass |
| Skip decision quality | Over-instrumented filters | Correctly skipping pure sync files | Improving |

### Persistent Problems

| Item | Runs Affected | Current Status |
|------|--------------|----------------|
| COV-001 (entry point) | Run-4 (on branch, no root span), Run-5 (failed entirely) | **Getting worse** — from partial to failed |
| Push authentication | Runs 3, 4, 5 | **3rd consecutive failure** — never delivered a PR |
| journal-manager.js | Runs 2, 3, 4, 5 | Marginal improvement (partial in run-4/5 vs failed in run-2/3) |

### New Challenges from Run-5

| Challenge | Root Cause | Impact |
|-----------|-----------|--------|
| SCH-002 oscillation | Validation loop can't converge on schema-compliant attributes | 2 failed files (index.js, summarize.js) |
| COV-003/NDS-005b conflict | Validator requires error recording on expected-condition catches | 5 of 8 problematic files |
| Zero attributes on uncovered files | Agent strips all attributes to pass SCH-002 | COV-005 failure on 2 committed files |
| Function-level fallback scope | Only processes exported functions; has code synthesis bugs | journal-graph regressed from 4 spans to 1 |

---

## Quality vs Coverage Visualization

```text
Run  Quality (canonical)  Committed Files    Spans
 2   ████████████████ 74%     10 ▓▓▓▓▓▓▓▓▓▓          ~21
 3   ███████████████  73%     11 ▓▓▓▓▓▓▓▓▓▓▓          18
 4   ████████████     58%     16 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     38
 5   ████████████████████ 92%  9 ▓▓▓▓▓▓▓▓▓             17
```

Run-5 demonstrates the quality-coverage tradeoff: highest quality, lowest coverage. The validation pipeline enforces quality at the cost of breadth. The ideal trajectory for run-6 is to move both metrics upward — more files committed at the same quality level. This requires fixing the validation infrastructure bugs (DEEP-1, RUN-1) rather than relaxing quality standards.

---

## Summary: What Changed Between Runs

### Run-4 → Run-5 Infrastructure Changes

| Change | PR | Impact on Results |
|--------|-----|-------------------|
| Schema evolution fixed | PR #170 | SCH-001 PASS, SCH-002 PASS, cost increase (+66%) |
| Validation pipeline added | PRD #156, PR #171 | NDS-002 PASS, but 5 file regressions |
| SCH validation during fix loop | PR #173 | SCH-002 oscillation failures (new failure mode) |
| Prompt naming guidance | PR #175 | Consistent `commit_story.*` naming |
| Tracer name in prompt | PR #165 | CDQ-002 PASS (highest-impact single fix) |
| Expected-condition guidance | PR #165 | Prompt-only, no validator — behavior unchanged |
| Skip sync function guidance | PR #165 | RST-001 PASS (token-filter correctly skipped) |
| Root span guidance | PR #165 | COV-001 still FAIL (SCH-002 oscillation blocks) |

### Net Assessment

Run-5 proves the orbweaver agent can produce high-quality instrumentation when the infrastructure supports it. The 7 committed schema-covered files are essentially perfect (100% across all dimensions). The remaining work is:

1. **Fix validation infrastructure bugs** (DEEP-1 COV-003 exemption, RUN-1 oscillation handling) to recover the 5 regressed files
2. **Improve function-level fallback** (DEEP-2, DEEP-2b) to recover journal-graph and other partial files
3. **Guide attribute addition on schema-uncovered files** (EVAL-1) to resolve COV-005
4. **Fix push authentication** (persistent across 3 runs) to finally deliver a PR artifact

The self-improving evaluation chain continues to work: run-4 identified 13 findings → all merged → run-5 shows 4 genuine fixes, reveals 3 new infrastructure challenges. Each run's diagnostics are increasingly precise.
