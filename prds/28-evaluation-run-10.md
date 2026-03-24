# PRD #10: Evaluation Run-10 — Push Auth Resolution and Operational Reliability

**Status:** Draft
**Created:** 2026-03-23
**GitHub Issue:** #28
**Depends on:** PRD #9 (run-9 complete, 25/25 quality, 5 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-9 achieved the theoretical quality ceiling: **25/25 (100%)** with 12 files committed — the first perfect score across all evaluation runs. All 6 quality dimensions are at 100%. The dominant blocker peeling pattern has reached its endpoint (High → Medium → Low → None over 5 runs). There are no remaining quality rule failures.

The remaining issues are purely operational:

1. **Push auth failure (7th consecutive)**: The token-embedded URL swap (PRs #261, #272, #277) was merged but GITHUB_TOKEN never reached `pushBranch()`. Error shows bare `https://github.com/...` URL without `x-access-token:***@` prefix, confirming the `if (token)` guard at line 121 was falsy. Root cause: token likely not in the spiny-orb process environment (vals injection vs process inheritance).

2. **Reassembly validator rejects extension span names**: journal-graph.js failed because the reassembly validator's SCH-001 check looks up span names in the base registry only, not the agent-extensions.yaml written during the same run. Diagnostic output: `SCH-001 check failed: "commit_story.journal.generate_sections" at line 601: not found in registry span definitions.` This consumed 91.4K output tokens (50.7% of total) for zero committed value.

3. **Advisory contradiction rate 67%**: Improved from 91% in run-8 but still above the 30% target. COV-004 still flags MCP tool callback patterns; SCH-004 makes bad semantic matches (e.g., `generated_count` → `gen_ai.usage.output_tokens`).

### Primary Goal

Maintain **25/25 quality** while reaching **13 files** (recover journal-graph.js) and creating a **PR on GitHub** (break the 7-run push failure streak). The critical path is: GITHUB_TOKEN propagation fix → reassembly validator extension support.

**Target repo**: commit-story-v2 proper (same as run-9). The real repo is `npm link`'d globally — `/opt/homebrew/bin/commit-story` symlinks to the local repo.

### Secondary Goals

- Reduce advisory contradiction rate from 67% to <30%
- PR schema changes section includes span extensions (not just attributes)
- PR summary committed on instrument branch (not stranded as untracked file)
- No regressions — all 12 run-9 committed files still committed
- Cost ≤$4.00 (journal-graph.js should be cheaper with first-attempt success)
- Validate dominant blocker peeling — confirm quality remains at ceiling

### Run-9 Scores (baseline for run-10 comparison)

| Dimension | Run-9 Canonical | Run-8 (for context) |
|-----------|----------------|---------------------|
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
| **Cost/file** | **$0.33** | **$0.33** |
| **Quality x Files** | **12.0** | **11.0** |

### Run-9 Quality Rule Failures (0 canonical)

None. First perfect score.

### Run-9 Spiny-Orb Findings (5 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN9-1 | Push auth: GITHUB_TOKEN not reaching pushBranch() | Critical | No PR created (7th consecutive) |
| RUN9-2 | Reassembly validator rejects extension span names | High | journal-graph.js partial, 91.4K wasted tokens |
| RUN9-3 | PR schema changes section omits span extensions | Medium | Missing 26 span names from schema section |
| RUN9-5 | Advisory contradiction rate 67% | Medium | COV-004 on MCP tools + SCH-004 bad matches |
| RUN9-7 | PR summary should be on instrument branch | Medium | Summary stranded as untracked file when push fails |

### Additional Run-9 Findings (carried from prior runs)

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN8-6 COV-004 flags sync functions | Run-8 | 2 runs | Partially fixed (CDQ-006 trivial exemptions work, COV-004 still flags MCP tools) |
| RUN8-7 NDS-005 false positive on index.js | Run-8 | 2 runs | Open (not filed as spiny-orb issue) |
| RUN9-4 instrumentation.js excluded from processing | Run-9 | 1 run | Correct behavior, undocumented |
| RUN9-6 CLI telemetry setup lessons | Run-9 | 1 run | Documentation/template improvement |
| CJS require() in ESM projects | Run-2 #62 | 8 runs | Open spec gap, not triggered |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push authentication failure | Run-3 | 7 runs | Root cause narrowed to token propagation |
| RUN7-7 span count self-report | Run-7 | 3 runs | Observationally improved, structurally unchanged (issue #253) |
| CJS require() in ESM projects | Run-2 #62 | 8 runs | Open spec gap, not triggered |

---

## Solution Overview

Same four-phase structure as runs 5-9:

1. **Pre-run verification** — Verify P0 fixes landed (push auth token propagation, reassembly validator extension support), validate run prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` with push auth verification
3. **Structured evaluation** — Per-file evaluation with canonical methodology
4. **Process refinements** — Encode methodology changes, draft PRD #11

### Two-Repo Workflow

Run-10 operates across two repos (same as run-9).

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo. The run command, instrument branch, PR, and spiny-orb.yaml live here. |
| **commit-story-v2-eval** (evaluation) | `~/Documents/Repositories/commit-story-v2-eval` | Evaluation artifacts (per-file-evaluation.md, rubric-scores.md, etc.) live here. CLI output is copied here via `tee` or paste. |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent. Built from main before each run. |

### Key Inputs

- **Run-9 results** (eval repo): `evaluation/run-9/` on branch `feature/prd-24-evaluation-run-9`
- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Run-9 actionable fix output** (eval repo): `evaluation/run-9/actionable-fix-output.md` (the handoff)
- **Run-9 findings** (eval repo): `evaluation/run-9/spiny-orb-findings.md` (5 findings)
- **Run-9 lessons** (eval repo): `evaluation/run-9/lessons-for-prd10.md`
- **spiny-orb.yaml** (target repo): Must exist in commit-story-v2 — verify during pre-run
- **semconv/** (target repo): Weaver schema must exist in commit-story-v2 — verify during pre-run

---

## Success Criteria

1. Push authentication resolved — PR successfully created on commit-story-v2 (8th attempt, critical)
2. At least 13 files committed (recover journal-graph.js from run-9)
3. Quality score of 25/25 maintained (no regression from perfect score)
4. journal-graph.js committed (reassembly validator accepts extension span names)
5. No regressions — all 12 run-9 committed files still committed
6. Advisory contradiction rate <30% (down from 67%)
7. Per-file span counts verified by post-hoc `startActiveSpan` counting (not agent self-report)
8. All evaluation artifacts generated from canonical methodology
9. Dominant blocker peeling validated — confirm quality plateau at ceiling
10. Cost ≤$4.00 (journal-graph.js first-attempt success should reduce waste)
11. Cross-document audit agent run at end of actionable-fix-output milestone

---

## Milestones

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/run-9/actionable-fix-output.md` (eval repo). Compare what they filed vs what the eval recommended. Note any findings rejected.
  2. **Target repo readiness** (commit-story-v2): Verify commit-story-v2 is on `main` with clean working tree. Verify `spiny-orb.yaml` and `semconv/` exist. Verify `@opentelemetry/sdk-node` still in devDependencies (not peerDependencies).
  3. **Push auth verification (critical)**: Verify GITHUB_TOKEN propagation to `pushBranch()`. Check for diagnostic logging (recommended in RUN9-1). Test with `git push --dry-run` using token-embedded URL **in the commit-story-v2 repo**. Must confirm token is in process environment AND URL swap fires.
  4. **Reassembly validator verification (critical)**: Verify the reassembly validator's SCH-001 check resolves span names against the combined registry (base + agent-extensions.yaml). The extensions must be loaded before reassembly validation runs.
  5. **Advisory fixes**: Check COV-004 MCP tool callback pattern understanding, SCH-004 semantic matching accuracy, NDS-005 false positive on index.js.
  6. **PR summary improvements**: Check if PR schema changes include span extensions (RUN9-3) and PR summary is committed on instrument branch (RUN9-7).
  7. **File inventory**: Count .js files in commit-story-v2's `src/` directory. Record actual count for per-file evaluation.
  8. Rebuild spiny-orb from **main branch** (verify branch before building).
  9. `spiny-orb --version` — record version.
  10. **File recovery expectations**: Predict run-10 outcomes with 50% discount. journal-graph.js recovery should be deterministic (validator fix, not LLM-dependent).
  11. Record which run-9 findings are verified fixed vs still open.
  12. Append observations to `evaluation/run-10/lessons-for-prd11.md` (eval repo).

- [x] **Collect lessons for PRD #11** — Create BOTH output documents at the START:
  1. Create `evaluation/run-10/spiny-orb-findings.md`.
  2. Create `evaluation/run-10/lessons-for-prd11.md`.
  3. Both updated throughout all subsequent milestones.

- [x] **Evaluation run-10** — Execute `spiny-orb instrument` on **commit-story-v2** (not the eval repo):
  1. Ensure commit-story-v2 is on **main** with clean working tree: `cd ~/Documents/Repositories/commit-story-v2 && git checkout main && git status`.
  2. **Provide the exact command** for the user to run. The command must: (a) `cd` to commit-story-v2, (b) use `caffeinate -s`, (c) strip Datadog gateway headers, (d) inject secrets via vals using commit-story-v2's `.vals.yaml`, (e) point to spiny-orb binary, (f) `tee` output to the **eval repo's** `evaluation/run-10/spiny-orb-output.log`.
  3. Record wall-clock start timestamp.
  4. Resume after run completes. **Copy the user's pasted output** into the eval repo if `tee` wasn't used.
  5. **Push auth verification (critical)**: Did the PR get created **on commit-story-v2's GitHub repo**? Check GITHUB_TOKEN diagnostic log. If push failed again (8th consecutive), escalate as fundamental blocker — consider SSH key approach.
  6. **Cost sanity check**: Compare against run-9's $3.97. journal-graph.js should be cheaper with first-attempt success.
  7. Record final tally using branch state **on commit-story-v2**: `git diff --name-only main...<instrument-branch>`.
  8. **journal-graph.js check**: Did it commit this time? If still failing, document whether the reassembly validator fix was applied correctly.
  9. **Dominant blocker peeling check**: With quality at 100% and operational fixes applied, what's the new top issue?
  10. Append observations to findings and lessons documents (eval repo).

- [x] **Failure deep-dives** — For each failed file AND run-level failure:
  1. File-level failures (if any).
  2. Run-level failures: push auth (verify fix or document continued failure).
  3. Unmasked bug detection for any changes.
  4. Regression root cause (if any).
  5. Document in `evaluation/run-10/failure-deep-dives.md`.

- [x] **Per-file evaluation** — Full rubric on ALL files (no spot-checking):
  1. Gate checks + per-run rules. Run tests on **commit-story-v2** (the target repo).
  2. Per-file quality rules on ALL files discovered by spiny-orb (count from pre-run step 7).
  3. Apply all rubric clarifications from prior runs.
  4. **MCP tool callback pattern**: Document evaluation outcome for context-capture-tool.js and reflection-tool.js (debatable skips).
  5. Branch state verification.
  6. **SCH-001 semantic quality**: Verify agent-invented span names are semantically correct.
  7. Structured output → `per-file-evaluation.md`.

- [x] **PR artifact evaluation** — Evaluate PR quality:
  1. If PR exists: evaluate per-file table accuracy, span counts vs branch state.
  2. If PR not created: evaluate local summary against branch state.
  3. **PR summary length**: Target <200 lines.
  4. **Advisory contradiction rate**: Target <30%.
  5. **Rule code labels**: Verify in both validation output and agent notes.
  6. **Schema changes completeness**: Must include both attributes and span extensions.
  7. Document in `evaluation/run-10/pr-evaluation.md`.

- [x] **Rubric scoring** — Synthesize dimension-level scores:
  1. Aggregate from per-file evaluation.
  2. Score with per-rule evidence and instance counts.
  3. Classify failures (if any) using consistent methodology from runs 8-9.
  4. Emit `rubric-scores.md`.

- [x] **Baseline comparison** — Compare run-10 vs runs 2-9:
  1. 9-run dimension trend.
  2. File outcome comparison with per-file trajectories.
  3. Quality x files product trend.
  4. Cost comparison (9-run trend).
  5. Dominant blocker peeling assessment.
  6. Score projection validation.
  7. Document in `evaluation/run-10/baseline-comparison.md`.

- [x] **Actionable fix output** — Primary handoff deliverable:
  1. Remaining quality rule failures with evidence and acceptance criteria.
  2. Run-9 findings assessment (which fixed, which remain).
  3. Run-11 verification checklist.
  4. Score projection for run-11 with 50% discount.
  5. Priority action matrix.
  6. **Cross-document audit agent** (final step).
  7. Document in `evaluation/run-10/actionable-fix-output.md`.

- [x] **Draft PRD #11** — Create on a separate branch from main:
  1. Run-10 scores as baselines.
  2. All items from `evaluation/run-10/lessons-for-prd11.md`.
  3. Carry forward unresolved findings.
  4. Priority recommendations only (no PRD/Issue classification).

---

## Evaluation Branch Lifecycle

Evaluation run branches are **never merged to main**. PRs are created for CodeRabbit review, then closed. PRD files for future runs go to main via separate branches.

---

## Process Improvements Encoded from Run-9

| Lesson | Where Encoded |
|--------|---------------|
| Push auth pre-run verification was misleading (`git ls-remote` succeeds but push fails) | Pre-run verification step 3 (test actual push code path) |
| journal-graph.js root cause identified — reassembly validator rejects extensions | Pre-run verification step 4, evaluation run step 8 |
| API-004 evaluation depends on target repo (commit-story-v2 proper has sdk-node in devDeps) | Problem statement (API-004 no longer a quality issue) |
| Cost guard limits journal-graph.js attempts but per-attempt cost still high (91.4K tokens) | Evaluation run step 6, success criteria #10 |
| vals exec + GITHUB_TOKEN interaction requires URL embedding, not credential helper | Pre-run verification step 3 |
| Two-repo file parity confirmed (30 files, 29 processed — instrumentation.js excluded) | Pre-run verification step 7 |
| Handoff triage format validated (10/10 P0+P1 addressed, zero rejected) | Pre-run verification step 1 |
| 50% discount methodology conservative for quality projections (4 consecutive runs) | Score projections |
| Dominant blocker peeling reached endpoint — remaining issues are operational | Problem statement |
| CLI telemetry: SimpleSpanProcessor + process.exit interception for short-lived processes | RUN9-6 documentation (spiny-orb template improvement) |
| Dual import-in-the-middle versions break --import bootstrap with traceloop | RUN9-6 documentation |

---

## Score Projections (from Run-9 Actionable Fix Output §7)

### Minimum (P0 fixes only: push auth + reassembly validator)

- **Quality**: 25/25 (100%) maintained
- **Files**: 13 (journal-graph.js recovered)
- **Push/PR**: YES (if GITHUB_TOKEN fix works)
- **After 50% discount**: 25/25, 12-13 files, PR 50% likely

### Target (P0 + P1 fixes)

- All P0 fixes plus advisory improvements
- **Quality**: 25/25, **13 files**, PR created
- **Advisory rate**: <30%
- **After 50% discount**: 25/25, 12-13 files, PR likely

### Stretch (all fixes)

- **Quality**: 25/25, **13 files**, PR created, <10% advisory contradiction rate
- **After 50% discount**: 25/25, 13 files

### Calibration Notes

Run-9 projections were conservative: minimum predicted 23-24/25 → actual 25/25 (exceeded by 1-2 points). The 50% discount has been well-calibrated for 4 consecutive runs — quality always within range, file counts less reliable due to journal-graph.js oscillation. For run-10, quality is likely stable at 25/25 — main uncertainty is push auth (8th attempt, but with diagnostic logging) and journal-graph.js (validator fix is deterministic, not LLM-dependent).

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Push auth still fails (8th consecutive) | Pre-run step 3 validates full push code path, not just `git ls-remote`. Diagnostic logging should expose root cause. If still failing, consider SSH key approach as alternative to HTTPS token embedding. |
| Reassembly validator fix not landed | Pre-run step 4 verifies combined registry resolution. If not fixed, journal-graph.js stays partial, score stays 25/25 but files stay at 12. |
| Quality regression from 100% | Unlikely — no code changes affect quality rules. Any regression indicates a new bug type. Per-file evaluation catches regressions immediately. |
| Advisory contradiction rate still above 30% | Pre-run step 5 checks COV-004 and SCH-004 fixes. If not improved, document specific contradiction patterns for targeted fixing. |
| PR summary stranded if push fails again | RUN9-7 fix (commit summary on branch) should preserve it. If not implemented, manually copy from working directory. |
| Cost spike from journal-graph.js retries | If validator fix works, journal-graph.js should succeed first attempt (<20K tokens vs 91.4K). Cost guard still limits total attempts. |
| commit-story-v2 codebase changed since run-9 | Verify file count in pre-run step 7. If new files added, per-file evaluation uses actual count. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-23 | Operational reliability as primary focus (not quality improvement) | Quality hit 100% ceiling in run-9. Remaining issues are infrastructure/tooling. |
| 2026-03-23 | Push auth diagnostic logging as verification approach | Token propagation is the suspected root cause. Logging at pushBranch() entry confirms whether token is in process env. |
| 2026-03-23 | Reassembly validator extension fix as deterministic improvement | Unlike journal-graph.js "non-determinism" in runs 7-8, the root cause is now identified and fixable. |
| 2026-03-23 | Continue targeting commit-story-v2 proper | Established in run-9. Real repo enables Datadog trace validation and real PR creation. |
| 2026-03-23 | Maintain 50% discount for projections | Conservative but well-calibrated for 4 consecutive runs. Better to be conservative on projections. |

---

## Prior Art

- **PRD #9**: Run-9 evaluation (this repo, branch `feature/prd-24-evaluation-run-9`)
- **PRD #8**: Run-8 evaluation (branch `feature/prd-21-evaluation-run-8`)
- **PRD #7**: Run-7 evaluation (branch `feature/prd-19-evaluation-run-7`)
- **PRD #6**: Run-6 evaluation (branch `feature/prd-6-evaluation-run-6`)
- **PRD #5**: Run-5 evaluation (branch `feature/prd-5-evaluation-run-5`)
- **evaluation/run-9/**: Full run-9 documentation (on branch `feature/prd-24-evaluation-run-9`)
  - `rubric-scores.md`: Canonical scoring data (25/25, 100%)
  - `spiny-orb-findings.md`: 5 findings with acceptance criteria
  - `actionable-fix-output.md`: Fix instructions and score projections (the handoff)
  - `lessons-for-prd10.md`: Forward-looking improvements
  - `baseline-comparison.md`: 8-run trend analysis
  - `failure-deep-dives.md`: Root cause analysis
  - `pr-evaluation.md`: PR artifact quality assessment
  - `live-telemetry-validation.md`: Datadog trace validation (18 spans confirmed)
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
