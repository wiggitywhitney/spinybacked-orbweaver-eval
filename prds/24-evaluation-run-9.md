# PRD #9: Evaluation Run-9 — Push Auth Resolution and Schema Type Enforcement

**Status:** Draft
**Created:** 2026-03-21
**GitHub Issue:** #24
**Depends on:** PRD #8 (run-8 complete, 7 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-8 scored 92% canonical (23/25) with 12 files committed — tying run-5 for the highest quality score. COV and CDQ both reached 100% for the first time. Two quality failures remain:

1. **API-004**: `@opentelemetry/sdk-node` in peerDependencies (pre-existing on main since run-2 — target project fix, issues filed: commit-story-v2#50, commit-story-v2-eval#23)
2. **SCH-003**: Count attributes declared as `type: string` instead of `type: int` in agent-extensions.yaml. The prompt-only fix (PR #256) was insufficient — the agent prioritizes schema accumulator conformance over prompt guidance.

Push authentication has failed **6 consecutive runs**. Run-8 refined the root cause: the fail-fast fix (PR #251) correctly detects missing GITHUB_TOKEN, but when the token is present, validation uses `git ls-remote` (read access) which passes even without write permissions. The actual push then fails. Additionally, fix/260 (upstream tracking for `pushBranch`) is WIP and may compound the issue.

The **dominant blocker peeling pattern** has reached a plateau: Run-5 COV-003 → Run-6 SCH-001 → Run-7 COV-006/CDQ-005 → Run-8 SCH-003 + journal-graph.js regression. Severity is at the lowest level yet — SCH-003 is a type annotation issue that doesn't affect runtime behavior. No new blocking issue emerged behind COV-006.

### Primary Goal

Reach 24/25 quality while maintaining 12+ files committed, with a **successfully created PR** (break the 6-run streak). The critical path is: push auth write validation → count attribute type enforcement.

**Major change for run-9**: This evaluation runs against **commit-story-v2 proper** (the real upstream repo), not the eval copy. The real repo is `npm link`'d globally — `/opt/homebrew/bin/commit-story` symlinks to the local repo. Whatever branch is checked out runs live on every git commit across all repos. This means:
1. Instrumentation is tested on the actual codebase (not an eval fork)
2. Real telemetry can be validated in Datadog after instrumenting
3. The PR created by spiny-orb is a real instrumentation PR that could be merged
4. OTel SDK setup (devDependencies, Datadog exporter) must be configured on commit-story-v2 before the run — tracked in a separate PRD on that repo

### Secondary Goals

- Resolve journal-graph.js non-deterministic oscillation (committed in run-7, partial in run-8)
- Reduce advisory contradiction rate from ~91% to <30%
- Validate that API-004 target project fix landed (if commit-story-v2#50 is resolved)
- Track cost containment for partial files (journal-graph.js consumed 42% of output tokens)
- **Validate live telemetry**: After instrumentation, make a real commit and verify traces appear in Datadog APM
- **Demo readiness**: Run-9 doubles as demo preparation — CLI output, instrumented files, companion docs, and live traces should all be presentable

### Run-8 Scores (baseline for run-9 comparison)

| Dimension | Run-8 Canonical | Run-7 (for context) |
|-----------|----------------|---------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) |
| Coverage (COV) | 5/5 (100%) | 4/5 (80%) |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) |
| API-Only Dependency (API) | 2/3 (67%) | 2/3 (67%) |
| Schema Fidelity (SCH) | 3/4 (75%) | 4/4 (100%) |
| Code Quality (CDQ) | 7/7 (100%) | 6/7 (86%) |
| **Overall quality** | **23/25 (92%)** | **22/25 (88%)** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** |
| **Files committed** | **12/29** | **13/29** |
| **Cost** | **$4.00** | **$3.22** |
| **Cost/file** | **$0.33** | **$0.25** |
| **Quality x Files** | **11.0** | **11.4** |

### Run-8 Quality Rule Failures (2 canonical)

| Rule | Category | Classification |
|------|----------|---------------|
| API-004 | sdk-node in peerDependencies | Pre-existing (run-2 through run-8) |
| SCH-003 | Count attributes as string type | Persistent (prompt-only fix insufficient) |

### Run-8 Spiny-Orb Findings (7 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN8-3 | Push auth validates read not write — 6th consecutive failure | Critical | No PR created |
| RUN8-1 | Agent notes use bare rule codes without labels | Medium | UX clarity |
| RUN8-4 | Advisory contradiction rate ~91% | Medium | PR summary noise |
| RUN8-5 | journal-graph.js non-deterministic failure | Medium | File count regression |
| RUN8-6 | COV-004 advisories flag sync functions | Low | Advisory accuracy |
| RUN8-7 | NDS-005 advisory false positive on index.js | Low | Advisory accuracy |
| RUN8-2 | Verbose output lacks visual separation | Low | Output readability |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push authentication failure | Run-3 | 6 runs | Root cause refined in run-8 (read vs write validation) |
| API-004 sdk-node in peerDependencies | Run-2 | 7 runs | Target project fix needed (issues filed) |
| RUN7-7 span count self-report | Run-7 | 2 runs | Observationally improved, structurally unchanged (issue #253) |
| CJS require() in ESM projects | Run-2 #62 | 7 runs | Open spec gap, not triggered |

---

## Solution Overview

Same four-phase structure as runs 5-8:

1. **Pre-run verification** — Verify P0 fixes landed (push auth write validation, count type enforcement), validate run prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` with push auth verification
3. **Structured evaluation** — Per-file evaluation with canonical methodology
4. **Process refinements** — Encode methodology changes, draft PRD #10

### Key Inputs

- **Run-8 results**: `evaluation/run-8/` on branch `feature/prd-21-evaluation-run-8`
- **Evaluation rubric**: `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Run-8 actionable fix output**: `evaluation/run-8/actionable-fix-output.md` (the handoff)
- **Run-8 findings**: `evaluation/run-8/spiny-orb-findings.md` (7 findings)
- **Run-8 lessons**: `evaluation/run-8/lessons-for-prd9.md`

---

## Success Criteria

1. Push authentication resolved — PR successfully created (7th attempt, critical)
2. At least 12 files committed (no regression from run-8)
3. Quality score of 92%+ canonical (maintain or improve from run-8)
4. SCH-003 resolved — count attributes use `type: int`, no `String()` wrapping
5. No new regressions — all 12 run-8 committed files still committed
6. journal-graph.js committed (recover from run-8 regression)
7. Advisory contradiction rate <30% (down from ~91%)
8. Per-file span counts verified by post-hoc `startActiveSpan` counting (not agent self-report)
9. All evaluation artifacts generated from canonical methodology
10. Dominant blocker peeling tracked — document what emerges behind SCH-003
11. Cost within expected range (run-8 was $4.00; similar or lower expected)
12. Cross-document audit agent run at end of actionable-fix-output milestone

---

## Milestones

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/run-8/actionable-fix-output.md`. Compare what they filed vs what the eval recommended. Note any findings rejected.
  2. **Push auth verification (critical)**: Verify write-access validation before file processing. Test with `git push --dry-run`. Must distinguish read-only tokens from write tokens. Check if fix/260 (upstream tracking) is merged.
  3. **SCH-003 count attribute types**: Verify post-generation validator rejects `*_count` with `type` != `int`. Verify `force` attribute uses `type: boolean`.
  4. **Advisory contradiction fixes**: Check CDQ-006 trivial exemption, COV-004 sync detection, agent notes rule labels.
  5. **API-004 check**: Verify if `@opentelemetry/sdk-node` was removed from target project peerDependencies (commit-story-v2#50).
  6. Rebuild spiny-orb from **main branch** (verify branch before building).
  7. `spiny-orb --version` — record version.
  8. **File recovery expectations**: Predict run-9 outcomes with 50% discount. journal-graph.js non-deterministic — uncertain.
  9. Record which run-8 findings are verified fixed vs still open.
  10. Append observations to `evaluation/run-9/lessons-for-prd10.md`.

- [ ] **Collect lessons for PRD #10** — Create BOTH output documents at the START:
  1. Create `evaluation/run-9/spiny-orb-findings.md`.
  2. Create `evaluation/run-9/lessons-for-prd10.md`.
  3. Both updated throughout all subsequent milestones.

- [ ] **Evaluation run-9** — Execute `spiny-orb instrument` in the user's terminal:
  1. Clean codebase state from main.
  2. **Provide the exact command** for the user to run with `caffeinate -s` and vals/env setup.
  3. Record wall-clock start timestamp.
  4. Resume after run completes.
  5. **Push auth verification (critical)**: Did the PR get created? If push failed again (7th consecutive), escalate as fundamental blocker.
  6. **Cost sanity check**: Compare against run-8's $4.00. Check if partial file cost is contained.
  7. Record final tally using branch state.
  8. **Regression check**: Verify all 12 run-8 committed files still committed.
  9. **journal-graph.js check**: Did it commit this time? If partial again, document token consumption.
  10. **Dominant blocker peeling check**: With SCH-003 fixed, what's the new top issue?
  11. Append observations to findings and lessons documents.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure:
  1. File-level failures (if any).
  2. Run-level failures: push auth (verify fix or document continued failure).
  3. Unmasked bug detection for any changes.
  4. Regression root cause (if any).
  5. Document in `evaluation/run-9/failure-deep-dives.md`.

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking):
  1. Gate checks + per-run rules.
  2. Per-file quality rules on ALL 29 files (12+ committed + 16-17 skips).
  3. Apply all rubric clarifications including SCH-003 methodology correction from run-8.
  4. **MCP tool callback pattern**: Document evaluation outcome for context-capture-tool.js and reflection-tool.js (debatable skips).
  5. Branch state verification.
  6. **SCH-001 semantic quality**: Verify agent-invented span names are semantically correct.
  7. Structured output → `per-file-evaluation.md`.

- [ ] **PR artifact evaluation** — Evaluate PR quality:
  1. If PR exists: evaluate per-file table accuracy, span counts vs branch state.
  2. **PR summary length**: Target <200 lines.
  3. **Advisory contradiction rate**: Target <30%.
  4. **Rule code labels**: Verify in both validation output and agent notes.
  5. **Schema changes completeness**: Must include both attributes and span extensions.
  6. Document in `evaluation/run-9/pr-evaluation.md`.

- [ ] **Rubric scoring** — Synthesize dimension-level scores:
  1. Aggregate from per-file evaluation.
  2. Score with per-rule evidence and instance counts.
  3. Classify failures using consistent SCH-003 methodology from run-8.
  4. Emit `rubric-scores.md`.

- [ ] **Baseline comparison** — Compare run-9 vs runs 2-8:
  1. 8-run dimension trend.
  2. File outcome comparison with per-file trajectories.
  3. Quality x files product trend.
  4. Cost comparison (8-run trend).
  5. Dominant blocker peeling assessment.
  6. Score projection validation.
  7. Document in `evaluation/run-9/baseline-comparison.md`.

- [ ] **Actionable fix output** — Primary handoff deliverable:
  1. Remaining quality rule failures with evidence and acceptance criteria.
  2. Run-8 findings assessment (which fixed, which remain).
  3. Run-10 verification checklist.
  4. Score projection for run-10 with 50% discount.
  5. Priority action matrix.
  6. **Cross-document audit agent** (final step).
  7. Document in `evaluation/run-9/actionable-fix-output.md`.

- [ ] **Draft PRD #10** — Create on a separate branch from main:
  1. Run-9 scores as baselines.
  2. All items from `evaluation/run-9/lessons-for-prd10.md`.
  3. Carry forward unresolved findings.
  4. Priority recommendations only (no PRD/Issue classification).

---

## Evaluation Branch Lifecycle

Evaluation run branches are **never merged to main**. PRs are created for CodeRabbit review, then closed. PRD files for future runs go to main via separate branches.

---

## Process Improvements Encoded from Run-8

| Lesson | Where Encoded |
|--------|---------------|
| CDQ-005 vs SCH-003 reclassification — use correct rubric rule IDs | Per-file evaluation, rubric scoring |
| Advisory contradiction rate methodology needs consistent definitions | PR evaluation milestone |
| Spiny-orb branch hygiene — verify main before building | Pre-run verification step 6 |
| MCP tool callback pattern is debatable skip | Per-file evaluation step 4 |
| Schema accumulator propagation is root cause of SCH-003 | Problem statement, pre-run verification step 3 |
| `force` attribute is boolean but declared as string — separate type issue | Pre-run verification step 3 |
| journal-graph.js oscillation is non-deterministic | Evaluation run step 9 |
| Partial file cost containment needed (42% of tokens for zero value) | Evaluation run step 6 |
| Cross-document audit catches significant gaps (27 items in run-8) | Actionable fix step 6 |
| Push auth root cause refined: read vs write validation asymmetry | Pre-run verification step 2 |
| fix/260 upstream tracking WIP may compound push failure | Pre-run verification step 2 |

---

## Score Projections (from Run-8 Actionable Fix Output §7)

### Minimum (P0 fixes only: push auth + count types)

- **SCH-003**: FAIL → PASS (count types enforced by validator)
- **API-004**: Still FAIL (target project fix)
- **Expected score**: 24/25 (96%), **12+ files**
- **After 50% discount**: 23-24/25 (92-96%), **12+ files**

### Target (P0 + P1 fixes)

- All P0 fixes plus advisory improvements and journal-graph investigation
- **Expected score**: 24/25 (96%), **13+ files**
- **After 50% discount**: 23-24/25, **12-13 files**

### Stretch (P0 + P1 + P2 + API-004 fix)

- All fixes including target project peerDeps cleanup
- **Expected score**: 25/25 (100%), **13 files**
- **After 50% discount**: 24-25/25, **13 files**

### Calibration Notes

Run-8 projections were well-calibrated: minimum predicted 23-24/25 → actual 23/25 (within range). Files were 12 instead of 13+ (journal-graph regression). The 50% discount methodology remains validated for 3 consecutive runs.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Push auth still fails (7th consecutive) | Pre-run verification step 2 validates write access specifically. If still failing, evaluate without PR and consider SSH as alternative. |
| journal-graph.js oscillates to partial again | Evaluation run step 9 tracks this. Cost cap recommendation (max 50K tokens per file). |
| SCH-003 fix not landed | Pre-run verification step 3. If not fixed, score stays at 92%. |
| API-004 remains unfixed (target project responsibility) | Score ceiling is 24/25 until target project removes sdk-node. Issues filed. |
| Advisory contradiction rate still high | Pre-run verification step 4 checks CDQ-006 exemption. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-21 | Push auth write validation and schema type enforcement as primary focus | Run-8 push auth failed despite fail-fast fix; SCH-003 prompt-only fix was insufficient. Both need structural fixes. |
| 2026-03-21 | Track journal-graph.js oscillation with cost containment | Non-deterministic — can't guarantee fix, but can limit cost impact. |
| 2026-03-21 | Maintain SCH-003 reclassification from run-8 | Correct rubric rule mapping. Document clearly to avoid confusion. |
| 2026-03-21 | Advisory contradiction methodology needs standardization | Run-7 (23%) and run-8 (~91%) used different counting approaches. |

---

## Prior Art

- **PRD #8**: Run-8 evaluation (this repo, branch `feature/prd-21-evaluation-run-8`)
- **PRD #7**: Run-7 evaluation (branch `feature/prd-19-evaluation-run-7`)
- **PRD #6**: Run-6 evaluation (branch `feature/prd-6-evaluation-run-6`)
- **PRD #5**: Run-5 evaluation (branch `feature/prd-5-evaluation-run-5`)
- **evaluation/run-8/**: Full run-8 documentation (on branch `feature/prd-21-evaluation-run-8`)
  - `rubric-scores.md`: Canonical scoring data
  - `spiny-orb-findings.md`: 7 findings with acceptance criteria
  - `actionable-fix-output.md`: Fix instructions and score projections (the handoff)
  - `lessons-for-prd9.md`: Forward-looking improvements
  - `baseline-comparison.md`: 7-run trend analysis
  - `failure-deep-dives.md`: Root cause analysis
  - `pr-evaluation.md`: PR artifact quality assessment
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
