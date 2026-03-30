# PRD #11: Evaluation Run-11 — Boolean Type Fix and Push Auth Token Resolution

**Status:** Draft
**Created:** 2026-03-24
**GitHub Issue:** #32
**Depends on:** PRD #10 (run-10 complete, 4 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-10 scored 92% canonical (23/25) with 12 files committed — an 8pp regression from run-9's perfect 100%. Two new quality failures emerged from LLM-generated code patterns:

1. **SCH-003**: Boolean attributes (`commit_story.summarize.force`, `commit_story.commit.is_merge`) declared as `type: string` in agent-extensions.yaml. The dual-layer count-type fix targets `*_count` → int but doesn't detect boolean values.
2. **CDQ-007**: Optional chaining (`?.length`) in `setAttribute` calls yields `undefined` when source is null/undefined. 6 instances in summary-graph.js without defined-value guards.

Push authentication failed for the **8th consecutive run**. Run-10 made significant progress — the URL swap mechanism now works (`GITHUB_TOKEN present=true`, `urlChanged=true, path=token-swap`) — but GitHub rejected the token: "Invalid username or token. Password authentication is not supported for Git operations." The token likely lacks write scope or is an incompatible type.

Additionally, summary-manager.js failed due to a transient Weaver CLI issue (registry resolve failure mid-run). This is infrastructure, not quality.

### Primary Goal

Restore **25/25 quality** while reaching **13 files** (recover summary-manager.js) and creating a **PR on GitHub** (break the 8-run push failure streak). The critical path is: token scope verification → boolean type detection → CDQ-007 guard.

**Target repo**: commit-story-v2 proper (same as runs 9-10).

### Secondary Goals

- Reduce journal-graph.js attempts from 3 to 1 (cost containment)
- PR schema changes section includes span extensions (RUN9-3 still partial)
- Advisory contradiction rate assessment
- Weaver CLI reliability (retry logic)
- Cost ≤$4.00

### Run-10 Scores (baseline for run-11 comparison)

| Dimension | Run-10 Canonical | Run-9 (for context) |
|-----------|-----------------|---------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) |
| Coverage (COV) | 5/5 (100%) | 5/5 (100%) |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) |
| API-Only Dependency (API) | 3/3 (100%) | 3/3 (100%) |
| Schema Fidelity (SCH) | 3/4 (75%) | 4/4 (100%) |
| Code Quality (CDQ) | 6/7 (86%) | 7/7 (100%) |
| **Overall quality** | **23/25 (92%)** | **25/25 (100%)** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** |
| **Files committed** | **12/30** | **12/29** |
| **Cost** | **$4.36** | **$3.97** |
| **Quality x Files** | **11.0** | **12.0** |

### Run-10 Quality Rule Failures (2 canonical)

| Rule | Category | Classification |
|------|----------|---------------|
| SCH-003 | Boolean attributes as string type | New (schema accumulator gap) |
| CDQ-007 | Optional chaining undefined values | New (code pattern) |

### Run-10 Spiny-Orb Findings (4 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN10-1 | Push auth: URL swap works but token rejected | Critical | No PR created (8th consecutive) |
| RUN10-2 | Weaver CLI fails on large registry | Medium | summary-manager.js failed |
| RUN10-3 | Schema accumulator declares boolean attrs as string | Medium | SCH-003 failure (2 files) |
| RUN10-4 | Optional chaining in setAttribute without guard | Low | CDQ-007 failure (1 file) |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push authentication failure | Run-3 | 8 runs | URL swap works, token rejected |
| RUN9-3 PR schema changes omits span extensions | Run-9 | 2 runs | Code merged but output still incomplete |
| RUN7-7 span count self-report | Run-7 | 4 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 #62 | 9 runs | Open spec gap, not triggered |

---

## Solution Overview

Same four-phase structure as runs 5-10:

1. **Pre-run verification** — Verify P0 fixes landed (push auth token, boolean type detection, CDQ-007 guard)
2. **Evaluation run** — Execute `spiny-orb instrument` with push auth verification
3. **Structured evaluation** — Per-file evaluation with canonical methodology
4. **Process refinements** — Encode methodology changes, draft PRD #12

### Two-Repo Workflow

Same as runs 9-10.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **commit-story-v2-eval** (evaluation) | `~/Documents/Repositories/commit-story-v2-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-10 results** (eval repo): `evaluation/run-10/` on branch `feature/prd-28-evaluation-run-10`
- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Run-10 actionable fix output** (eval repo): `evaluation/run-10/actionable-fix-output.md`
- **Run-10 findings** (eval repo): `evaluation/run-10/spiny-orb-findings.md` (4 findings)
- **Run-10 lessons** (eval repo): `evaluation/run-10/lessons-for-prd11.md`

---

## Success Criteria

1. Push authentication resolved — PR successfully created on commit-story-v2 (9th attempt)
2. At least 13 files committed (recover summary-manager.js from transient failure)
3. Quality score of 25/25 restored (SCH-003 and CDQ-007 both fixed)
4. Boolean attributes declared with correct types
5. No `?.` in setAttribute value arguments without guard
6. No regressions — all 12 run-10 committed files still committed
7. Per-file span counts verified by post-hoc counting
8. All evaluation artifacts generated from canonical methodology
9. Cost ≤$4.00
10. Cross-document audit agent run at end of actionable-fix-output milestone

---

## Milestones

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/run-10/actionable-fix-output.md`.
  2. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist.
  3. **Push auth token verification (critical)**: Before anything else, verify GITHUB_TOKEN scopes. Run `curl -sI -H "Authorization: token $GITHUB_TOKEN" https://api.github.com` and check `X-OAuth-Scopes` header (the `-I` flag is required to see response headers). Must include `repo` scope. Test direct push: `git push --dry-run https://x-access-token:$GITHUB_TOKEN@github.com/wiggitywhitney/commit-story-v2.git`.
  4. **SCH-003 boolean type fix**: Verify schema accumulator detects boolean values and declares `type: boolean`.
  5. **CDQ-007 guard fix**: Verify post-generation check flags `?.` in setAttribute value arguments.
  6. **Weaver CLI reliability**: Check if retry logic was added for Weaver commands.
  7. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  8. Rebuild spiny-orb from **main branch**.
  9. Record version and findings status.
  10. Append observations to `evaluation/run-11/lessons-for-prd12.md`.

- [ ] **Collect lessons for PRD #12** — Create skeleton documents at START.

- [ ] **Evaluation run-11** — Execute `spiny-orb instrument` on commit-story-v2.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure.

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking).

- [ ] **PR artifact evaluation** — Evaluate PR quality.

- [ ] **Rubric scoring** — Synthesize dimension-level scores.

- [ ] **Baseline comparison** — Compare run-11 vs runs 2-10.

- [ ] **Actionable fix output** — Primary handoff deliverable.

- [ ] **Draft PRD #12** — Create on a separate branch from main.

---

## Score Projections (from Run-10 Actionable Fix Output §7)

### Minimum (P0 fixes only: push auth + boolean types)

- **Quality**: 24/25 (96%) — SCH-003 fixed, CDQ-007 still open
- **Files**: 13 (summary-manager.js recovered)
- **Push/PR**: YES (if token scopes fixed)
- **After 50% discount**: 23-24/25, 12-13 files, PR 50% likely

### Target (P0 + P1 fixes)

- **Quality**: 25/25 (100%), **13 files**, PR created
- **After 50% discount**: 24-25/25, 12-13 files, PR likely

### Stretch (all fixes)

- **Quality**: 25/25, **13 files**, PR created, journal-graph.js first-attempt
- **After 50% discount**: 25/25, 13 files

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Push auth token still rejected (9th) | Pre-run step 3 verifies token scopes explicitly. If classic PAT lacks `repo` scope, regenerate. |
| Boolean type fix not landed | Pre-run step 4 verifies. If not fixed, SCH-003 remains, score stays 23-24/25. |
| New failure types emerge | Quality oscillation at Low severity tier is expected for LLM-generated code. 50% discount accounts for this. |
| Weaver CLI fails again | Retry logic should mitigate. If still fails, it's infrastructure not quality. |
| journal-graph.js still requires 3 attempts | Cost guard limits impact. First-attempt success would save ~$1.30. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | Push auth token scopes as first verification step | 8 consecutive failures. URL swap mechanism is working. The blocker is the token itself. |
| 2026-03-24 | Boolean type detection as separate fix from count types | Same underlying bug class (schema accumulator type inference) but different detection logic needed. |
| 2026-03-24 | Quality oscillation at Low severity expected | LLM-generated code introduces variation. New patterns can trigger new low-severity failures even when prior failures are fixed. |

---

## Prior Art

- **PRD #10**: Run-10 evaluation (this repo, branch `feature/prd-28-evaluation-run-10`)
- **evaluation/run-10/**: Full run-10 documentation
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
