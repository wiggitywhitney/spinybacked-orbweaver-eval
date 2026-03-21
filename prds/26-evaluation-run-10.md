# PRD #10: Evaluation Run-10 — Push Auth Resolution and Operational Reliability

**Status:** Draft
**Created:** 2026-03-21
**GitHub Issue:** TBD
**Depends on:** PRD #9 (run-9 complete, 5 findings documented, actionable fix output delivered)

---

## Problem Statement

Run-9 achieved 25/25 (100%) quality — the first perfect score across all evaluation runs. All 6 quality dimensions reached 100% simultaneously. The dominant blocker peeling pattern has exhausted all quality issues: High (run-5) → Medium (run-7) → Low (run-8) → None (run-9).

However, two operational failures persist:

1. **Push authentication**: 7 consecutive failures. Run-9's diagnostic logging revealed the root cause — `GITHUB_TOKEN` is not reaching the `pushBranch()` function despite being injected by `vals exec`. The URL swap code (PR #272) was never exercised because `if (token)` was falsy.

2. **Reassembly validator bug**: journal-graph.js remains partial because the SCH-001 reassembly check validates span names against the base registry only, rejecting extension span names declared during the same run. This is now a known, deterministic bug — not the "non-deterministic oscillation" previously assumed.

The **evaluation is operationally complete** from a quality standpoint. Run-10's goal is operational reliability: PR delivery and file coverage recovery.

### Primary Goal

Deliver a **PR on commit-story-v2** (break the 7-run streak) with **13 committed files** (recover journal-graph.js) while maintaining 25/25 quality.

### Secondary Goals

- Advisory contradiction rate <30% (currently 67%)
- PR schema changes include span extensions (currently attrs only)
- Live telemetry validated in Datadog APM
- Cost reduction from journal-graph.js first-attempt success

### Run-9 Scores (baseline for run-10 comparison)

| Dimension | Run-9 | Run-8 (for context) |
|-----------|-------|---------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) |
| Coverage (COV) | 5/5 (100%) | 5/5 (100%) |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) |
| API-Only Dependency (API) | 3/3 (100%) | 2/3 (67%) |
| Schema Fidelity (SCH) | 4/4 (100%) | 3/4 (75%) |
| Code Quality (CDQ) | 7/7 (100%) | 7/7 (100%) |
| **Overall quality** | **25/25 (100%)** | **23/25 (92%)** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** |
| **Files committed** | **12/29** | **12/29** |
| **Cost** | **$3.97** | **$4.00** |
| **Quality x Files** | **12.0** | **11.0** |

### Run-9 Findings (5 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN9-1 | Push auth: GITHUB_TOKEN not reaching pushBranch() | Critical | No PR (7th consecutive) |
| RUN9-2 | Reassembly validator rejects extension span names | High | journal-graph.js partial |
| RUN9-3 | PR schema changes section omits span extensions | Medium | Missing 26 span names |
| RUN9-4 | instrumentation.js excluded from processing | Low | Correct behavior, undocumented |
| RUN9-5 | Advisory contradiction rate 67% | Medium | COV-004 on MCP tools + SCH-004 mismatches |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push auth failure | Run-3 | 7 runs | Root cause identified in run-9 (token not in process env) |
| RUN7-7 span count self-report | Run-7 | 3 runs | Observationally improved, structurally unchanged |
| CJS require() in ESM projects | Run-2 | 8 runs | Open spec gap, not triggered |

---

## Solution Overview

Same four-phase structure as runs 5-9. Since quality is at 100%, the focus shifts to operational fixes.

### Two-Repo Workflow

Same as run-9 — target commit-story-v2 proper, evaluate in commit-story-v2-eval.

### Key Inputs

- **Run-9 results** (eval repo): `evaluation/run-9/` on branch `feature/prd-24-evaluation-run-9`
- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Run-9 actionable fix output** (eval repo): `evaluation/run-9/actionable-fix-output.md`
- **Run-9 findings** (eval repo): `evaluation/run-9/spiny-orb-findings.md` (5 findings)
- **Run-9 lessons** (eval repo): `evaluation/run-9/lessons-for-prd10.md` (14 lessons)

---

## Success Criteria

1. Push authentication resolved — PR created on commit-story-v2 GitHub repo (8th attempt)
2. journal-graph.js committed (reassembly validator accepts extension span names)
3. Quality score 25/25 maintained (no regression)
4. At least 13 files committed (recover journal-graph.js)
5. Advisory contradiction rate <30%
6. PR schema changes include span extensions
7. Live telemetry validated in Datadog APM
8. No new regressions
9. All evaluation artifacts generated from canonical methodology
10. Cost reduced (journal-graph.js first-attempt success should save ~$1.50)

---

## Milestones

- [ ] **Pre-run verification** — Verify fixes and validate prerequisites:
  1. Handoff triage review: compare spiny-orb team's triage vs run-9 recommendations.
  2. Push auth verification (critical): verify GITHUB_TOKEN diagnostic logging is present. Test end-to-end push with `pushBranch()` (not just `git ls-remote`).
  3. Reassembly validator: verify SCH-001 check resolves against base + extensions.
  4. Advisory fixes: verify COV-004 MCP tool pattern fix, SCH-004 semantic matching improvement.
  5. PR schema changes: verify span extensions included in schema changes section.
  6. File inventory on commit-story-v2.
  7. Rebuild spiny-orb from main.
  8. Record version.
  9. File recovery expectations with 50% discount.
  10. Record findings status.
  11. Append observations to lessons doc.

- [ ] **Collect lessons for PRD #11** — Create output documents at the START.

- [ ] **Evaluation run-10** — Execute spiny-orb instrument on commit-story-v2.

- [ ] **Live telemetry validation** — If not completed in run-9, verify traces in Datadog APM.

- [ ] **Failure deep-dives** — Analyze any failures.

- [ ] **Per-file evaluation** — Full rubric on ALL files.

- [ ] **PR artifact evaluation** — Evaluate PR quality (if PR created).

- [ ] **Rubric scoring** — Synthesize dimension-level scores.

- [ ] **Baseline comparison** — Compare run-10 vs runs 2-9.

- [ ] **Actionable fix output** — Primary handoff deliverable.

- [ ] **Draft PRD #11** — If needed. May be final run if operational issues are resolved.

---

## Score Projections (from Run-9 Actionable Fix Output §7)

### Minimum (P0 fixes only: push auth + reassembly validator)

- **Quality**: 25/25 (100%) maintained
- **Files**: 13 (journal-graph.js recovered)
- **Push/PR**: YES
- **After 50% discount**: 25/25, 12-13 files, PR 50% likely

### Target (P0 + P1 fixes)

- All P0 fixes plus advisory improvements
- **Quality**: 25/25, **13 files**, PR created, advisory rate <30%
- **After 50% discount**: 25/25, 12-13 files, PR likely

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Push auth still fails (8th consecutive) | Diagnostic logging will expose root cause. If token is missing, try SSH as fallback. |
| Reassembly validator fix not landed | journal-graph.js stays partial. Score still 25/25, files stay at 12. |
| Quality regresses from 25/25 | Unlikely — all rules pass on stable files. Only risk is new behavior in spiny-orb. |
| Advisory rate still above 30% | P1 fixes address root causes (COV-004 MCP pattern, SCH-004 semantics). |

---

## Process Improvements Encoded from Run-9

| Lesson | Where Encoded |
|--------|---------------|
| Pre-run verification should test actual code paths, not components | Pre-run step 2 |
| NDS-005b catch-rethrow is standard OTel pattern (PASS) | Rubric clarification |
| MCP tool callback pattern is recognized skip category | Rubric clarification |
| Dominant blocker peeling exhausted — focus on operational reliability | Problem statement, primary goal |
| 50% discount was conservative in run-9 — quality stable at ceiling | Score projections |
| Handoff format validated over 3 runs — no structural changes needed | Key inputs |
| Push auth needs end-to-end testing | Pre-run step 2 |

---

## Prior Art

- **PRD #9**: Run-9 evaluation (branch `feature/prd-24-evaluation-run-9`)
- **evaluation/run-9/**: Full documentation on branch `feature/prd-24-evaluation-run-9`
