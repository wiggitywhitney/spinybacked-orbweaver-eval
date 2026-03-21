# PRD #8: Evaluation Run-8 — Polish and Push Auth Resolution

**Status:** Draft
**Created:** 2026-03-20
**GitHub Issue:** #21
**Depends on:** PRD #7 (run-7 complete, 10 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-7 scored 88% canonical (22/25) with 13 files committed — the best file coverage ever and a simultaneous reversal of every negative trend (quality up, files up, cost down, product tripled). The system works. Three quality failures remain, all relatively minor:

1. **API-004**: `@opentelemetry/sdk-node` in peerDependencies (pre-existing on main since run-2 — target project fix, not spiny-orb)
2. **COV-006**: Span name collision — `commit_story.journal.generate_summary` reused across journal-graph.js and summary-graph.js for different operations (unmasked by SCH-001 fix)
3. **CDQ-005**: Count attributes declared as `type: string` instead of `type: int` in agent-extensions.yaml (unmasked by SCH-001 fix)

Push authentication has failed 5 consecutive runs. Root cause identified in run-7: `validateCredentials()` validates read access (`git ls-remote`), but push requires write access. For public repos, read succeeds without auth, so validation passes but push fails after processing all files.

The **dominant blocker peeling pattern** continues: Run-5 COV-003 → Run-6 SCH-001 → Run-7 COV-006/CDQ-005. Severity is decreasing — from "blocks all files" to "trace analysis inconvenience." Run-8 should fix COV-006/CDQ-005 → expect something even more minor to surface.

### Primary Goal

Reach 24/25+ quality while maintaining 13+ files committed, with a successfully created PR. The critical path is: push auth fail-fast → span name uniqueness → count attribute types.

### Secondary Goals

- Validate PR summary improvements (compression, span count accuracy, advisory grouping)
- Verify rule code labels appear in user-facing output
- Confirm no regressions from run-7's perfect file coverage
- Track dominant blocker peeling — what emerges behind COV-006/CDQ-005?
- Validate the 50% discount projection methodology (run-7 validated it; run-8 continues calibration)

### Run-7 Scores (baseline for run-8 comparison)

| Dimension | Run-7 Canonical | Run-6 (for context) |
|-----------|----------------|---------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) |
| Coverage (COV) | 4/5 (80%) | 3/5 (60%) |
| Restraint (RST) | 4/4 (100%) | 3/4 (75%) |
| API-Only Dependency (API) | 2/3 (67%) | 3/3 (100%) |
| Schema Fidelity (SCH) | 4/4 (100%) | 3/4 (75%) |
| Code Quality (CDQ) | 6/7 (86%) | 7/7 (100%) |
| **Overall quality** | **22/25 (88%)** | **21/25 (84%)** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** |
| **Files committed** | **13/29** | **5/29** |
| **Cost** | **$3.22 (4.7% of ceiling)** | **$9.72 (14.3%)** |
| **Cost/file** | **$0.25** | **$1.94** |
| **Quality x Files** | **11.4** | **4.2** |

### Run-7 Quality Rule Failures (3 canonical)

| Rule | Category | Run-7 Classification |
|------|----------|---------------------|
| API-004 | sdk-node in peerDependencies | Pre-existing (run-2 through run-7) |
| COV-006 | Span name collision across files | Unmasked by SCH-001 fix |
| CDQ-005 | Count attributes as string type | Unmasked by SCH-001 fix |

### Run-7 File Outcomes

| Outcome | Count | Files |
|---------|-------|-------|
| Committed with spans | 13 | claude-collector (1), git-collector (2), summarize (3), journal-graph (4), summary-graph (6), index (1), context-integrator (1), auto-summarize (3), journal-manager (2), summary-manager (3), server (1), journal-paths (1), summary-detector (5) |
| Correct skip (0 spans) | 16 | All prompt/guideline files (9), filters (3), config, commit-analyzer, context-capture-tool, reflection-tool |
| Partial (not committed) | 0 | — |
| Failed | 0 | — |

### Run-7 Spiny-Orb Findings (10 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN7-4 | Push auth 5th failure — read vs write validation | Critical | No PR created (5th consecutive) |
| RUN7-2 | Opaque rule codes in user-facing output | High | Users can't interpret agent decisions |
| RUN7-3 | No user-facing documentation | High | No docs for rules, architecture, output |
| RUN7-1 | Verbose output truncates, buries status | Medium | Status info buried in note stream |
| RUN7-5 | Span name collision across files | Medium | Trace analysis ambiguity |
| RUN7-6 | Count attributes as string type | Medium | Numeric queryability lost |
| RUN7-7 | auto-summarize span count inflated in PR | Medium | 6 claimed, 3 actual |
| RUN7-8 | Schema Changes omits span extensions | Medium | Reviewer can't see full schema evolution |
| RUN7-9 | Agent Notes is compliance dump (180 lines) | Medium | PR summary too verbose |
| RUN7-10 | CDQ-006 advisories repeat 28x | Medium | Noisy advisory section |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push authentication failure | Run-3 | 5 runs | Root cause identified (RUN7-4), fix pending |
| API-004 sdk-node in peerDependencies | Run-2 | 6 runs | Pre-existing, requires target project fix |
| CJS require() in ESM projects | Run-2 #62 | 6 runs | Open spec gap, not triggered |
| Elision/null output bypass retry loop | Run-2 #63 | 6 runs | Likely improved, not directly tested |
| Spec gaps (#66-69) | Run-2 | 6 runs | Open |

---

## Solution Overview

Same four-phase structure as runs 5-7, with polish as the primary focus:

1. **Pre-run verification** — Verify P0 fixes landed (push auth, span uniqueness, count types), validate run prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` with push auth verification
3. **Structured evaluation** — Per-file evaluation with canonical methodology, regression tracking
4. **Process refinements** — Encode methodology changes, draft PRD #9

### Key Inputs

- **Run-7 results**: `evaluation/run-7/` on branch `feature/prd-19-evaluation-run-7`
- **Evaluation rubric**: `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Run-7 spiny-orb branch**: `spiny-orb/instrument-1774017389972` (local — push failed)
- **Run-7 actionable fix output**: `evaluation/run-7/actionable-fix-output.md` (the handoff)
- **Run-7 findings**: `evaluation/run-7/spiny-orb-findings.md` (10 findings)
- **Run-7 lessons**: `evaluation/run-7/lessons-for-prd8.md`

---

## Success Criteria

1. Push authentication resolved — PR successfully created (6th attempt, non-negotiable)
2. At least 13 files committed (no regression from run-7)
3. Quality score of 92%+ canonical (24/25+, recovering from run-7's 88%)
4. COV-006 resolved — no span name collisions across files
5. CDQ-005 resolved — count attributes use `type: int`, no `String()` wrapping
6. No new regressions — all 13 run-7 committed files still committed
7. PR summary ≤200 lines (down from 331)
8. Advisory contradiction rate <15% (down from 23%)
9. Per-file span counts in PR match branch state (auto-summarize corrected)
10. All evaluation artifacts generated from canonical JSON
11. Dominant blocker peeling tracked — document what emerges behind COV-006/CDQ-005
12. Cost within expected range (run-7 was $3.22; similar or lower expected)
13. Cross-document audit agent run at end of actionable-fix-output milestone

---

## Milestones

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/run-7/actionable-fix-output.md`. Compare what they filed vs what the eval recommended. Note any findings rejected.
  2. **Push auth verification (critical)**: Verify fail-fast before file processing when GITHUB_TOKEN is missing or write access unavailable. Test with `git push --dry-run`. Log must show GITHUB_TOKEN detection at startup. HTTPS-only is still broken — verify token-embedded URL or SSH.
  3. **COV-006 span name uniqueness**: Verify cross-file span name collision detection is in place (validator or post-run check).
  4. **CDQ-005 count attribute types**: Verify agent declares count attributes as `type: int` and passes raw numbers (no `String()` wrapping).
  5. **PR summary improvements**: Check for rule code labels (RUN7-2), note compression (RUN7-9), advisory grouping (RUN7-10), span extension visibility (RUN7-8), span count accuracy (RUN7-7).
  6. **API-004 check**: Verify if `@opentelemetry/sdk-node` was removed from target project peerDependencies (this is a target project fix).
  7. Rebuild spiny-orb: `cd spinybacked-orbweaver && npm run prepare` — verify build timestamp.
  8. `spiny-orb --version` — record version.
  9. **File recovery expectations**: Predict run-8 outcomes. With run-7 at 100% success, expect no regression. Apply 50% discount for unmasked bug risk.
  10. Record which run-7 findings are verified fixed vs still open.
  11. Append observations to `evaluation/run-8/lessons-for-prd9.md`.

- [x] **Collect lessons for PRD #9** — Create BOTH output documents at the START:
  1. Create `evaluation/run-8/spiny-orb-findings.md`.
  2. Create `evaluation/run-8/lessons-for-prd9.md`.
  3. Both updated throughout all subsequent milestones.

- [ ] **Evaluation run-8** — Execute `spiny-orb instrument` in the user's terminal:
  1. Clean codebase state from main.
  2. **Provide the exact command** for the user to run with `caffeinate -s` and vals/env setup.
  3. Record wall-clock start timestamp.
  4. Resume after run completes.
  5. **Push auth verification (critical)**: Did the PR get created? If push failed again (6th consecutive), this is a fundamental workflow blocker — evaluate without PR but escalate strongly.
  6. **Cost sanity check**: Compare against run-7's $3.22.
  7. Record final tally using branch state.
  8. **Regression check**: Verify all 13 run-7 committed files still committed.
  9. **Dominant blocker peeling check**: With COV-006/CDQ-005 fixed, what's the new top issue?
  10. Append observations to findings and lessons documents.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure:
  1. File-level failures (if any).
  2. Run-level failures: push auth (verify fix or document continued failure).
  3. Unmasked bug detection for any changes.
  4. Regression root cause (if any).
  5. Document in `evaluation/run-8/failure-deep-dives.md`.

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking):
  1. Gate checks + per-run rules.
  2. Per-file quality rules on ALL 29 files (13+ committed + 16 skips).
  3. Apply all rubric clarifications.
  4. **Schema coverage split methodology update**: With sparse-registry advisory mode, reassess what "schema-covered" means. All files are effectively "schema-uncovered" when registry has 0 pre-defined spans.
  5. Branch state verification.
  6. **SCH-001 semantic quality**: Verify agent-invented span names are semantically correct.
  7. Structured output → `per-file-evaluation.json` and `per-file-evaluation.md`.

- [ ] **PR artifact evaluation** — Evaluate PR quality:
  1. If PR exists: evaluate per-file table accuracy, span counts vs branch state.
  2. **PR summary length**: Target <200 lines.
  3. **Advisory contradiction rate**: Target <15%.
  4. **Rule code labels**: Verify human-readable labels on all codes.
  5. **Schema changes completeness**: Must include both attributes and span extensions.
  6. Document in `evaluation/run-8/pr-evaluation.md`.

- [ ] **Rubric scoring** — Synthesize dimension-level scores:
  1. Aggregate from `per-file-evaluation.json`.
  2. Score with per-rule evidence and instance counts.
  3. Classify failures.
  4. Emit `rubric-scores.json` and `rubric-scores.md`.

- [ ] **Baseline comparison** — Compare run-8 vs runs 2-7:
  1. 7-run dimension trend.
  2. File outcome comparison with per-file trajectories.
  3. Quality x files product trend (target: maintain or exceed 11.4).
  4. Cost comparison (7-run trend).
  5. Dominant blocker peeling assessment.
  6. Score projection validation.
  7. Document in `evaluation/run-8/baseline-comparison.md`.

- [ ] **Actionable fix output** — Primary handoff deliverable:
  1. Remaining quality rule failures with evidence and acceptance criteria.
  2. Run-7 findings assessment (which fixed, which remain).
  3. Run-9 verification checklist.
  4. Score projection for run-9 with 50% discount.
  5. Priority action matrix.
  6. **Cross-document audit agent** (final step).
  7. Document in `evaluation/run-8/actionable-fix-output.md`.

- [ ] **Draft PRD #9** — Create on a separate branch from main:
  1. Run-8 scores as baselines.
  2. All items from `evaluation/run-8/lessons-for-prd9.md`.
  3. Carry forward unresolved findings.
  4. Priority recommendations only (no PRD/Issue classification).

---

## Evaluation Branch Lifecycle

Evaluation run branches are **never merged to main**. PRs are created for CodeRabbit review, then closed. PRD files for future runs go to main via separate branches.

---

## Process Improvements Encoded from Run-7

| Lesson | Where Encoded |
|--------|---------------|
| Evaluate ALL files, never spot-check a subset | Per-file evaluation milestone step 2 |
| PRD assumed registry expansion; actual fix was validator tolerance | Problem statement, schema decisions |
| Schema coverage split needs methodology update for sparse registries | Per-file evaluation step 4 |
| Dominant blocker peeling confirmed for 3rd time (severity decreasing) | Success criteria #11, evaluation run step 9 |
| Every negative trend reversed simultaneously in run-7 | Problem statement context |
| 50% discount projection methodology validated | Success criteria, actionable fix step 4 |
| Cross-document audit catches significant gaps (25 items in run-7) | Actionable fix step 6 |
| Push auth root cause: read vs write validation asymmetry | Pre-run verification step 2 |
| Agent invents good span names without registry guidance | Problem statement context |
| Advisory contradiction rate improved from 76% to 23% | PR evaluation step 3, success criteria #8 |
| 95% cache hit rate drives cost reduction | Evaluation run step 6 |

---

## Score Projections (from Run-7 Actionable Fix Output §7)

### Minimum (P0 fixes only: push auth + span collision + count types)

- **COV-006**: FAIL → PASS
- **CDQ-005**: FAIL → PASS
- **API-004**: Still FAIL (target project fix)
- **Expected score**: 24/25 (96%), **13+ files**
- **After 50% discount**: 23-24/25 (92-96%), **13+ files**

### Target (P0 + P1 fixes)

- All P0 fixes plus PR summary improvements
- **Expected score**: 24/25 (96%), **13-15 files**
- **After 50% discount**: 23-24/25, **13+ files**

### Stretch (P0 + P1 + P2 + API-004 fix)

- All fixes including user docs and target project peerDeps cleanup
- **Expected score**: 25/25 (100%), **13-15 files**
- **After 50% discount**: 24-25/25, **13+ files**

### Calibration Notes

Run-7 projections were well-calibrated: minimum predicted 21-23/25 with 6-8 files → actual 22/25 with 13 files. Score was within range; files exceeded projection. The 50% discount methodology is validated. For run-8, file count uncertainty is low since we're maintaining coverage, not recovering.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Push auth still fails (6th consecutive) | Pre-run verification step 2 validates fail-fast behavior. If still failing, evaluate without PR and escalate as blocking. |
| Regressions from run-7 (13 files → fewer) | Evaluation run step 8 tracks all 13. If any regress, full root cause analysis. |
| COV-006/CDQ-005 fixes not landed | Pre-run verification steps 3-4. If not fixed, score stays at 88%. |
| New blocker emerges (dominant blocker peeling) | Expected but severity is decreasing. Evaluation run step 9 tracks this. |
| API-004 remains unfixed (target project responsibility) | Score ceiling is 24/25 until target project removes sdk-node from peerDeps. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Polish and push auth as primary focus | Run-7 achieved best coverage ever. Remaining issues are polish-level. Push auth is the only critical blocker. |
| 2026-03-20 | Evaluate ALL files, no spot-checking | Run-7 feedback: spot-checking is insufficient for trustworthy evaluation. |
| 2026-03-20 | Schema coverage split methodology update needed | Sparse-registry advisory mode makes "schema-covered" vs "schema-uncovered" less meaningful. |
| 2026-03-20 | 50% discount methodology validated | Run-7 projections were within range. Continue using for run-8. |
| 2026-03-20 | Inherit all run-5/6/7 methodology decisions | Per-file canonical evaluation, instance counts, systemic bug classification, cross-document audit — all continued. |

---

## Prior Art

- **PRD #7**: Run-7 evaluation (this repo, branch `feature/prd-19-evaluation-run-7`)
- **PRD #6**: Run-6 evaluation (branch `feature/prd-6-evaluation-run-6`)
- **PRD #5**: Run-5 evaluation (branch `feature/prd-5-evaluation-run-5`)
- **PRD #4**: Run-4 evaluation (branch `feature/prd-4-evaluation-run-4`)
- **evaluation/run-7/**: Full run-7 documentation (on branch `feature/prd-19-evaluation-run-7`)
  - `rubric-scores.json`, `rubric-scores.md`: Canonical scoring data
  - `spiny-orb-findings.md`: 10 findings with acceptance criteria
  - `actionable-fix-output.md`: Fix instructions and score projections (the handoff)
  - `lessons-for-prd8.md`: Forward-looking improvements
  - `baseline-comparison.md`: 6-run trend analysis
  - `failure-deep-dives.md`: Root cause analysis
  - `pr-evaluation.md`: PR artifact quality assessment
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
