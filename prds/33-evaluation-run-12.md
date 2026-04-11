# PRD #12: Evaluation Run-12 — Attribute Completeness and Cost Optimization

**Status:** Draft
**Created:** 2026-03-30
**GitHub Issue:** #34
**Depends on:** PRD #11 (run-11 complete, 5 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-11 achieved perfect 25/25 quality and created the first successful PR in 9 runs. However, five findings remain:

1. **RUN11-5 (Medium)**: CDQ-007/NDS-003 conflict causes the agent to drop optional attributes rather than guard them. The NDS-003 validator treats `if (value !== undefined) { span.setAttribute(...) }` as non-instrumentation code, forcing the agent to either drop the attribute or use ternary workarounds. This reduces attribute completeness.
2. **RUN11-1 (Low)**: Advisory contradiction rate is 45% (target: <30%). SCH-004 judge halluccinates semantic equivalence. CDQ-006 judge ignores trivial-conversion exemption.
3. **RUN11-2 (Low)**: journal-graph.js still requires 2 attempts (stretch goal was 1).
4. **RUN11-3 (Low)**: Redundant span.end() calls in summary-graph.js early-exit paths.
5. **RUN11-4 (Low)**: Cost $4.25 exceeds $4.00 target by $0.25.

### Primary Goal

Maintain **25/25 quality** and **13 files** while improving attribute completeness (resolve CDQ-007/NDS-003 conflict) and reducing cost to ≤$4.00.

**Target repo**: commit-story-v2 proper (same as runs 9-11).

### Secondary Goals

- Advisory contradiction rate <30%
- journal-graph.js first-attempt success
- No redundant span.end() in early-exit paths
- PR created successfully (verify push auth stability)

### Run-11 Scores (baseline for run-12 comparison)

| Dimension | Run-11 Canonical | Run-10 (for context) |
|-----------|-----------------|---------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) |
| Coverage (COV) | 5/5 (100%) | 5/5 (100%) |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) |
| API-Only Dependency (API) | 3/3 (100%) | 3/3 (100%) |
| Schema Fidelity (SCH) | 4/4 (100%) | 3/4 (75%) |
| Code Quality (CDQ) | 7/7 (100%) | 6/7 (86%) |
| **Overall quality** | **25/25 (100%)** | **23/25 (92%)** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** |
| **Files committed** | **13/30** | **12/30** |
| **Cost** | **$4.25** | **$4.36** |
| **Quality x Files** | **13.0** | **11.0** |
| **Push/PR** | **YES (PR #60)** | **NO** |

### Run-11 Findings (5 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN11-1 | Advisory contradiction rate 45% | Low | Output quality |
| RUN11-2 | journal-graph.js requires 2 attempts | Low | Cost |
| RUN11-3 | Redundant span.end() in 2 files | Low | Code style |
| RUN11-4 | Cost $4.25 exceeds $4.00 target | Low | Cost |
| RUN11-5 | CDQ-007/NDS-003 conflict causes attribute dropping | Medium | Attribute completeness |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN7-7 span count self-report | Run-7 | 5 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 #62 | 10 runs | Open spec gap, not triggered |

---

## Solution Overview

Same four-phase structure as runs 5-11:

1. **Pre-run verification** — Verify fixes landed, validate prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with canonical methodology
4. **Process refinements** — Encode methodology changes, draft PRD #13

### Two-Repo Workflow

Same as runs 9-11.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **commit-story-v2-eval** (evaluation) | `~/Documents/Repositories/commit-story-v2-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-11 results** (eval repo): `evaluation/commit-story-v2/run-11/` on branch `feature/prd-32-evaluation-run-11`
- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Run-11 actionable fix output** (eval repo): `evaluation/commit-story-v2/run-11/actionable-fix-output.md`
- **Run-11 findings** (eval repo): `evaluation/commit-story-v2/run-11/spiny-orb-findings.md` (5 findings)
- **Run-11 lessons** (eval repo): `evaluation/commit-story-v2/run-11/lessons-for-prd12.md`

---

## Success Criteria

1. Quality score of 25/25 maintained
2. At least 13 files committed (no regressions)
3. Push/PR succeeds (verify stability)
4. Attribute completeness improved (fewer dropped optional attrs)
5. Cost ≤$4.00
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology
8. No regressions from run-11
9. Cross-document audit agent run at end of actionable-fix-output milestone

---

## Milestones

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-11/actionable-fix-output.md`.
  2. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist.
  3. **Push auth stability check**: Verify token still works (dry-run push).
  4. **RUN11-5 NDS-003 validator fix**: Check if defined-value guards are now recognized as instrumentation patterns.
  5. **Advisory judge improvements**: Check if SCH-004/CDQ-006 false positive rates improved.
  6. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  7. Rebuild spiny-orb from **main branch**.
  8. Record version and findings status.
  9. Append observations to `evaluation/commit-story-v2/run-12/lessons-for-prd13.md` (created in milestone 2; if running milestones in order, create the file first).

- [ ] **Collect lessons for PRD #13** — Create skeleton documents at START. Must run before pre-run verification step 9 (which appends to the lessons file).

- [ ] **Evaluation run-12** — Execute `spiny-orb instrument` on commit-story-v2.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure.

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking).

- [ ] **PR artifact evaluation** — Evaluate PR quality.

- [ ] **Rubric scoring** — Synthesize dimension-level scores.

- [ ] **Baseline comparison** — Compare run-12 vs runs 2-11.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion, run the cross-document audit agent to verify consistency across all run-12 evaluation artifacts before finalizing.

- [ ] **Draft PRD #13** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up.

---

## Score Projections (from Run-11 Actionable Fix Output §7)

### Minimum (no fixes)

- **Quality**: 25/25 (100%) — no known quality failures
- **Files**: 13
- **Push/PR**: YES
- **After 50% discount**: 24-25/25, 12-13 files, PR likely

### Target (P1 fix: NDS-003 validator update)

- **Quality**: 25/25, attributes more complete
- **Files**: 13
- **Cost**: ≤$4.00 if journal-graph.js hits 1 attempt
- **After 50% discount**: 25/25, 13 files

### Stretch (all fixes)

- **Quality**: 25/25, full attribute coverage
- **Files**: 13
- **Cost**: ~$3.50
- **Advisory contradiction rate**: <30%
- **After 50% discount**: 25/25, 13 files

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| LLM variation introduces new failure type | 50% discount accounts for this. Run-11 showed CDQ-007/NDS-003 conflict — new patterns may emerge. |
| Push auth regresses | Pre-run step 3 verifies. Token should be stable (fine-grained PAT). |
| NDS-003 validator fix not landed | If not fixed, attribute dropping continues. Score still 25/25 but completeness reduced. |
| Cost increases | journal-graph.js first-attempt success would save ~$0.30. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-30 | CDQ-007/NDS-003 conflict as P1 | Medium priority — affects completeness, not correctness. Score is 25/25 either way. |
| 2026-03-30 | Advisory judge fixes as P2 | Low priority — advisories are informational only. |
| 2026-03-30 | Cost target maintained at $4.00 | Run-11 was $4.25 — close but achievable with fewer retry attempts. |

---

## Prior Art

- **PRD #11**: Run-11 evaluation (this repo, branch `feature/prd-32-evaluation-run-11`)
- **evaluation/commit-story-v2/run-11/**: Full run-11 documentation
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
