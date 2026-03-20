# PRD #6: Evaluation Run-6 — Coverage Recovery and Quality Retention

**Status:** Draft
**Created:** 2026-03-17
**GitHub Issue:** #17
**Depends on:** PRD #5 (run-5 complete, 22 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-5 scored 92% canonical (23/25) with 5/5 gates — the highest quality score across all evaluation runs. However, only 9 of 29 files were committed to the branch, down from 16 in run-4. The validation pipeline (introduced between runs) prevented low-quality instrumentation from being committed, trading coverage for quality. Five of the seven lost files were caused by validation infrastructure bugs, not agent quality problems.

Two canonical rule failures remain: COV-001 (entry point index.js has no span — persistent, 2 runs) and COV-005 (schema-uncovered files have zero attributes — new in run-5). Both are well-understood systemic bugs with clear fix paths.

The dominant systemic root cause is DEEP-1: COV-003's validator requires error recording on ALL catch blocks, including expected-condition handlers. The agent complies with COV-003, producing NDS-005b violations that block 5 partial files from committing. Fixing this single issue unblocks the most files.

Three run-4 rules that appear resolved in run-5 are actually superficial resolutions — the violating files were filtered by validation, not genuinely fixed. NDS-005 (8 latent violations in partial files), CDQ-003 (latent in partial files), and RST-001 (correct skip, but agent may re-over-instrument) will regress if validation is relaxed or files are recovered.

### Primary Goal

Recover file coverage (target: 14-16 committed files) while retaining 92%+ quality score. The critical path is: DEEP-1 (COV-003 exemption) → RUN-1 (oscillation detection) → DEEP-4 (duplicate JSDoc prevention) → EVAL-1 (schema-uncovered attribute strategy).

### Secondary Goals

- Verify superficial resolutions don't regress when files are recovered
- Validate that push authentication is finally resolved (3 consecutive failures)
- Establish the coverage-recovery methodology for future runs
- Track per-file delivery counts alongside percentage scores (run-5 lesson)

### Run-5 Scores (baseline for run-6 comparison)

| Dimension | Run-5 Canonical | Run-4 Canonical (for context) |
|-----------|----------------|-------------------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 1/2 (50%) |
| Coverage (COV) | 3/5 (60%) | 2/6 (33%) |
| Restraint (RST) | 4/4 (100%) | 3/4 (75%) |
| API-Only Dependency (API) | 3/3 (100%) | 3/3 (100%) |
| Schema Fidelity (SCH) | 4/4 (100%) | 2/4 (50%) |
| Code Quality (CDQ) | 7/7 (100%) | 4/7 (57%) |
| **Overall quality** | **23/25 (92%)** | **15/26 (58%)** |
| **Gates** | **5/5 (100%)** | **4/5 (80%)** |
| **Files committed** | **9/29** | **16/29** |
| **Spans committed** | **17** | **38** |
| **Cost** | **$9.72 (14.3% of ceiling)** | **$5.84 (8.6% of ceiling)** |

### Run-5 Quality Rule Failures (2 canonical + 4 latent)

| Rule | Category | Run-5 Classification |
|------|----------|---------------------|
| COV-001 | Entry point (index.js) has no span | Persistent (run-4 + run-5) — oscillation |
| COV-005 | Zero attributes on schema-uncovered files | Genuine new finding |
| NDS-005b | Expected-condition catches recorded as errors | Latent (8 violations in 3 partial files) |
| NDS-003 | Duplicate JSDoc comments | Latent (5 partial files) |
| CDQ-003 | recordException misuse on expected-condition path | Latent (partial files) |
| RST-001 | Over-instrumentation risk | Latent (correct skip in run-5, monitor) |

### Run-5 File Outcomes

| Outcome | Count | Files |
|---------|-------|-------|
| Committed (all rules pass) | 7 | claude-collector, git-collector, context-integrator, context-capture-tool, reflection-tool, journal-paths, commit-analyzer |
| Committed (COV-005 fail) | 2 | auto-summarize, server |
| Correctly skipped (0 spans) | 12 | config, 5 prompt files, guidelines/index, monthly-summary-prompt, message-filter, token-filter, 2 more |
| Partial (not committed) | 6 | journal-graph, summary-graph, sensitive-filter, journal-manager, summary-manager, summary-detector |
| Failed entirely | 2 | index.js (oscillation), summarize.js (COV-003 + SCH-002) |

### Run-5 Spiny-Orb Findings (22 new + 1 persistent)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| DEEP-1 | COV-003 expected-condition exemption | Critical | Unblocks 5 partial files — dominant root cause |
| RUN-1 | Oscillation detection in fix/retry | Critical | Recovers index.js entry point |
| DEEP-4 | Duplicate JSDoc prevention | High | Unblocks 5 partial files |
| EVAL-1 | Schema-uncovered file attribute strategy | High | Fixes last 2 canonical failures |
| DEEP-6 | Entry point special handling | High | Prevents entry point single point of failure |
| PR-4 | Partial file commits (function-level) | High | Coverage multiplier when N of M functions pass |
| DEEP-2/2b | Function-level fallback quality | Medium | Two bugs: corrupted imports + exported-only scope |
| DEEP-7 | Whole-file syntax check after assembly | Medium | Catch synthesis bugs in import merging |
| RUN-2 | Validation regression tracking | Medium | Prevent validation from blocking previously-passing files |
| Push auth | Push authentication failure | Medium | 3rd consecutive failure — persistent |
| RUN-4 | Retry budget configuration | Medium | Run duration from validation retries |
| PR-3 | auto_summarize span names not registered | Medium | Data consistency gap |
| PRE-1 | npm package name collision | Medium | Resolved — renamed to `spiny-orb` (#177) |
| NDS-005b | LLM failure fallback boundary | Medium | Eval/CodeRabbit disagree on classification |
| DEEP-5 | SDK init skip for libraries | Low | Cosmetic |
| DEEP-8 | Date object in setAttribute | Low | Minor type mismatch |
| RUN-3 | Summary tally omits partial files | Low | Operator visibility |
| RUN-5 | No timestamps or per-file cost breakdown | Low | Observability |
| PRE-2 | Span-type extension namespace rejection | Low | Schema edge case |
| EVAL-2 | @traceloop in peerDependencies | Low | Library packaging |
| PR-1/PR-2 | PR summary quality issues | Low | Length + contradicted advisories |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push authentication failure | Run-3 | 3 runs | Persistent — 3rd consecutive failure |
| NDS-003 blocks instrumentation-motivated refactors | Run-3 #4 | 3 runs | Open design tension, not a bug |
| CJS require() in ESM projects | Run-2 #62 | 4 runs | Open spec gap |
| Elision/null output bypass retry loop | Run-2 #63 | 4 runs | Likely improved but not directly tested |
| Spec gaps (#66-69) | Run-2 | 4 runs | Open — multiple specification gaps |
| Per-retry visibility (snapshots) | Run-5 | 1 run | Partial diffs capture final state only |

---

## Solution Overview

Four-phase approach (same structure as run-5, with coverage recovery as the primary focus):

1. **Pre-run verification** — Verify spiny-orb fixes landed (especially DEEP-1, RUN-1, DEEP-4), validate push capability, confirm file recovery expectations
2. **Evaluation run** — Execute `spiny-orb instrument` with coverage recovery focus
3. **Structured evaluation** — Per-file evaluation with canonical methodology (established in run-5), plus superficial resolution regression tracking
4. **Process refinements** — Encode any methodology changes discovered during evaluation

### Key Inputs

- **Run-5 results**: `evaluation/run-5/` on branch `feature/prd-5-evaluation-run-5` (14 artifacts)
- **Evaluation rubric**: `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules, run-5 clarifications applied)
- **Rubric-codebase mapping**: `spinybacked-orbweaver/research/rubric-codebase-mapping.md`
- **Run-5 orbweaver branch**: `orbweaver/instrument-1773706515431` (local — push auth failed)
- **Run-5 actionable fix output**: `evaluation/run-5/actionable-fix-output.md` (this IS the handoff — run-5 decision)
- **Run-5 findings**: `evaluation/run-5/orbweaver-findings.md` (22 new findings)
- **Run-5 lessons**: `evaluation/run-5/lessons-for-prd6.md`
- **Run-5 score projections**: `evaluation/run-5/actionable-fix-output.md` §7

---

## Success Criteria

1. Push authentication resolved — PR successfully created (draft allowed only if test failures are documented; failed/no PR is a failure)
2. At least 14 files committed (up from 9) — validates coverage recovery
3. Quality score of 92%+ canonical retained (no regression from coverage recovery)
4. Superficial resolutions tracked: NDS-005, CDQ-003, RST-001 verified in recovered files
5. COV-001 resolved — index.js entry point has a root span
6. COV-005 improved — at least 1 schema-uncovered file has domain-relevant attributes
7. No new latent systemic bugs introduced by coverage recovery
8. All evaluation artifacts generated from canonical JSON (per-file-evaluation.json, rubric-scores.json)
9. Score projections include file delivery counts alongside percentages
10. Cross-document audit agent run at end of actionable-fix-output milestone
11. Oscillation detection verified — no file enters fix/retry loop > 3 times without escalation
12. Cost sanity check: if actual < 15% of ceiling, investigate prompt change rate (carried from run-5)

---

## Milestones

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/run-5/actionable-fix-output.md` (the handoff). Compare what they filed vs what the eval recommended. Note any findings the spiny-orb team rejected and why.
  2. **DEEP-1 verification (critical)**: Verify COV-003 validator has expected-condition catch exemption. Test against `src/commands/summarize.js` — the simplest reproduction of DEEP-1. If this fails, STOP — DEEP-1 is the blocking prerequisite.
  3. **RUN-1 verification (critical)**: Verify fix/retry loop has oscillation detection. Test against `src/index.js` — the file that oscillated in run-5. If this fails, note expected impact on file recovery.
  4. **DEEP-4 verification**: Verify duplicate JSDoc prevention. Check that agent preserves existing JSDoc without generating a duplicate.
  5. **Push capability test**: Run `git push --dry-run` to verify push access. If push auth was addressed, confirm the mechanism (SSH, GITHUB_TOKEN, or `--push-command`).
  6. Rebuild spiny-orb: `cd spinybacked-orbweaver && npm run prepare` — verify build timestamp is after all fix merges.
  7. `spiny-orb --version` — record version for evaluation log.
  8. **File recovery expectations**: Based on which fixes landed, predict which of the 8 failed/partial files should recover. Create a pre-run expectation table.
  9. **Superficial resolution tracking setup**: For NDS-005, CDQ-003, RST-001 — document what "genuine resolution" looks like for each rule. These must be evaluated in any recovered files.
  10. Verify codebase is clean: `git status` on main, no leftover spiny-orb branches.
  11. Record which run-5 findings are verified fixed vs still open — this determines the expected score ceiling.
  12. Append any pre-run observations to `evaluation/run-6/lessons-for-prd7.md`.

- [x] **Collect lessons for PRD #7** — Create BOTH output documents at the START and append throughout all subsequent milestones:
  1. Create `evaluation/run-6/spiny-orb-findings.md`. Use findings vocabulary from the start.
  2. Create `evaluation/run-6/lessons-for-prd7.md`. Sections: Rubric Gaps, Process Improvements, Evaluation Methodology, Rubric-Codebase Mapping Corrections, Schema Decisions, Carry-Forward Items.
  3. Both documents are updated throughout all subsequent milestones. Every milestone has explicit "append to findings/lessons" steps.

- [x] **Evaluation run-6** — Execute `spiny-orb instrument` with coverage recovery focus:
  1. Clean codebase state: start from main branch with evaluation config (spiny-orb.yaml, instrumentation.js, semconv/).
  2. Run in foreground: `spiny-orb instrument src/ --verbose -y`
  3. Record wall-clock start timestamp.
  4. **Schema evolution health check (after file 3)**: Compare schemaHashBefore vs schemaHashAfter. Should show evolution (confirmed working in run-5).
  5. **Oscillation monitoring (real-time)**: Watch for any file entering fix/retry > 3 times. If oscillation detection (RUN-1) is working, the file should fail gracefully, not loop.
  6. **Cost sanity check (after file 10)**: If actual cost < 15% of ceiling, verify the prompt is changing between files.
  7. Monitor for failures in real-time — note error messages for failure deep-dives.
  8. Record wall-clock end timestamp.
  9. If any files failed due to token budget, run supplemental passes with `maxTokensPerFile: 150000`.
  10. Verify PR was created successfully. If tests failed, verify draft PR was created. If push failed (4th consecutive), escalate — this is no longer acceptable.
  11. Capture all output to `evaluation/run-6/spiny-orb-output.log`.
  12. Record final tally: files instrumented / correctly skipped / failed / partial.
  13. **Coverage recovery check**: Compare file tally against pre-run expectation table. Which files recovered? Which didn't? Any surprises?
  14. **Branch deliverable check**: Verify all files reported as instrumented have actual changes on the branch: `git diff main..spiny-orb-branch --stat`.
  15. Append any run observations to `evaluation/run-6/lessons-for-prd7.md` and `evaluation/run-6/spiny-orb-findings.md`.

- [x] **Failure deep-dives** — For each failed file AND each run-level failure:
  1. **File-level failures**: For each failed/partial file: read spiny-orb output log, identify validation rules that blocked instrumentation, map to spiny-orb findings (run-5 and run-6), assess whether spiny-orb fixes helped.
  2. **Run-level failures**: Push failures, test suite failures, schema evolution issues, commit noise — all get deep-dive treatment.
  3. **Failure trajectory update**: For persistent failures (files that failed in runs 2-5): update the trajectory. Is the root cause the same or different each run? Track per-file failure history across all runs.
  4. **Unmasked bug detection**: For files recovered by DEEP-1/RUN-1/DEEP-4 fixes — check for NEW failure modes that were previously masked. Run-5 warned about this risk.
  5. For new failures: file findings in `evaluation/run-6/spiny-orb-findings.md`.
  6. Document in `evaluation/run-6/failure-deep-dives.md`.
  7. Append to `evaluation/run-6/lessons-for-prd7.md` and `evaluation/run-6/spiny-orb-findings.md`.

- [x] **Per-file evaluation** — Full rubric applied to all files using canonical methodology:
  1. **Gate checks + per-run rules (single agent)**: NDS-001, NDS-002, NDS-003, NDS-006, API-001, API-002, API-003, API-004, CDQ-008.
  2. **Per-file quality rules (per-file agents)**: Each agent gets rubric + one file's diff + Weaver schema + registry. Rules: NDS-004, NDS-005, COV-001 through COV-006, RST-001 through RST-005, SCH-001 through SCH-004, CDQ-001 through CDQ-007.
  3. **Apply run-5 rubric clarifications**: CDQ-002 semantic check, CDQ-006 cheap computation exemption, NDS-005 sub-classification (NDS-005a/NDS-005b).
  4. **Schema coverage split**: Classify each file as schema-covered or schema-uncovered. For uncovered files, evaluate SCH-002 on invention quality (same as run-5).
  5. **Superficial resolution regression check**: For every file recovered from run-5's partial/failed set, explicitly evaluate NDS-005, CDQ-003, and RST-001. Document whether these are genuinely resolved or still latent.
  6. **Branch state verification**: Evaluate `git diff main..spiny-orb-branch` — do NOT trust the agent's self-reported per-file status.
  7. Zero-span files: verify correct skip decisions.
  8. Failed files: evaluate against NDS rules only.
  9. **NDS-005b boundary cases**: Apply the run-5 boundary refinement — LLM failure fallbacks use `span.addEvent('llm.fallback')` instead of `recordException`. NDS-005b applies to normal control flow catches, NOT genuine-failure-with-graceful-recovery catches.
  10. Structured output format: `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}`
  11. Emit as `evaluation/run-6/per-file-evaluation.json` (canonical) and render `evaluation/run-6/per-file-evaluation.md`.
  12. Append to `evaluation/run-6/lessons-for-prd7.md` and `evaluation/run-6/spiny-orb-findings.md`.

- [x] **PR artifact evaluation** — Evaluate the PR as a first-class deliverable:
  1. If PR exists: evaluate description quality, per-file table accuracy, span counts, agent decision notes.
  2. **Verify per-file table claims against branch state.** Run-4 and run-5 both found discrepancies.
  3. **PR summary length check**: Run-5 PR was ~430 lines. Check if improvements landed (key decisions summary, grouped zero-span notes).
  4. **Advisory contradiction check**: Run-5 found 28/34 advisories contradicted skip decisions. Check if advisory engine consumes skip decisions.
  5. Assess: Does the PR help a reviewer understand what the agent did and make informed merge decisions?
  6. If draft PR (test failures): evaluate the "Test Failures" section.
  7. If PR was lost (push failure): document and escalate — 4th consecutive failure is unacceptable.
  8. Document in `evaluation/run-6/pr-evaluation.md`.
  9. Append to `evaluation/run-6/lessons-for-prd7.md` and `evaluation/run-6/spiny-orb-findings.md`.

- [x] **Rubric scoring** — Synthesize per-file findings into dimension-level scores:
  1. Aggregate from `evaluation/run-6/per-file-evaluation.json`.
  2. Score each dimension with per-rule evidence AND per-file instance counts (files passing/failing each rule).
  3. Apply schema coverage split scoring as standard.
  4. Classify each failure as persistent, new regression, genuine new finding, superficial resolution regression, or methodology-driven.
  5. Apply systemic bug classification where applicable.
  6. **Single canonical score** using per-file evaluation + schema coverage split. Provide methodology-adjusted comparison ONLY for backward compatibility with runs 2-5.
  7. **Include file delivery count alongside percentage score** (run-5 lesson: "92% with 9 files" vs "92% with 16 files" are very different outcomes).
  8. Emit as `evaluation/run-6/rubric-scores.json` (canonical) and render `evaluation/run-6/rubric-scores.md`.
  9. Append to `evaluation/run-6/lessons-for-prd7.md` and `evaluation/run-6/spiny-orb-findings.md`.

- [x] **Baseline comparison and synthesis** — Compare run-6 vs run-5 vs run-4 vs run-3 vs run-2:
  1. Dimension-level trend analysis (5-run).
  2. File outcome comparison: improved / regressed / same. Track per-file delivery history across all runs.
  3. Failure classification: resolved / persistent / new / unmasked.
  4. **Coverage recovery assessment**: Key question for run-6 — did DEEP-1/RUN-1/DEEP-4 fixes recover the expected files? Track actual vs predicted recovery.
  5. **Superficial resolution assessment**: Did NDS-005, CDQ-003, RST-001 genuinely resolve or regress in recovered files?
  6. **Quality vs coverage trend**: Plot quality score vs file delivery count across all runs. Run-5 traded coverage for quality; run-6 should recover coverage without sacrificing quality.
  7. Assessment of run-5 score projections (§7 of actionable-fix-output.md): did the 3-tier prediction hold?
  8. **Cost comparison**: 5-run trend. Validate cost-to-file-count ratio.
  9. Document in `evaluation/run-6/baseline-comparison.md`.
  10. Append to `evaluation/run-6/lessons-for-prd7.md`.

- [ ] **Actionable fix output** — Produce fix instructions for remaining failures (this IS the handoff — run-5 decision). **This is the primary deliverable of the entire evaluation run.** The document must be self-contained so the spiny-orb Weaver has everything at its fingertips — synthesize ALL findings from every run-6 artifact (per-file eval, failure deep-dives, lessons, spiny-orb-findings, PR eval, rubric scores, baseline comparison). Reference evaluation files by path so the spiny-orb team can drill down when needed, but the document itself should be sufficient without reading them:
  1. For each remaining quality rule failure: what's wrong, evidence, desired outcome, acceptance criteria.
  2. For each remaining failed file: root cause, desired outcome, finding cross-references.
  3. Assessment of run-5 findings: which were fixed, which remain, any new findings.
  4. Run-6 rubric gap assessment.
  5. Run-7 verification checklist.
  6. Score projection for run-7 (3-tier: minimum/target/stretch with explicit assumptions AND file delivery counts).
  7. Priority action matrix with acceptance criteria.
  8. Superficial resolution tracking update.
  9. Carry-forward items update.
  10. Port failing files as test cases (update from run-5 list — remove recovered files, add any new failures).
  11. **Cross-document audit agent** (final step): Read ALL evaluation documents (findings, lessons, per-file eval, rubric scores, baseline comparison, failure deep-dives, PR eval) and cross-reference against the actionable fix output. Flag any items that appear in source documents but are missing from the actionable fix output. Run-5 audit agent caught 22 missing items.
  12. Generate from canonical JSON artifacts to prevent drift.
  13. Document in `evaluation/run-6/actionable-fix-output.md`.
  14. Final review of `evaluation/run-6/lessons-for-prd7.md` and `evaluation/run-6/spiny-orb-findings.md`.

- [ ] **Draft PRD #7 for next evaluation run** — Create PRD #7 on a separate branch from main:
  1. Run-6 scores as baselines (include file delivery counts).
  2. All items from `evaluation/run-6/lessons-for-prd7.md`.
  3. Carry forward unresolved findings from `evaluation/run-6/actionable-fix-output.md`.
  4. Encode process lessons.
  5. Validate run-6 score projections against actual results and update projection methodology.
  6. Create on a separate branch from main and PR to main — evaluation branches are never merged.
  7. Actionable-fix-output milestone must include cross-document audit agent step.
  8. Provide priority recommendations only — do NOT include PRD/Issue classification for findings (run-5 decision).

---

## Evaluation Branch Lifecycle

Evaluation run branches (feature/prd-N-evaluation-run-*) are **never merged to main**. PRs are created so CodeRabbit can review the evaluation artifacts, but the PR is closed after review, not merged. The evaluation data lives only on the feature branch.

**Implications for PRD drafting:** When a milestone says "draft PRD #N+1," that file must be created on main via a separate branch and PR — it cannot ride on the evaluation branch.

**Implications for rubric/schema changes:** Any rubric updates, schema changes, or evaluation methodology changes that need to persist across runs must be committed to the appropriate repo independently of the evaluation branch.

---

## Evaluation Architecture

Carried forward from run-5 — canonical methodology established.

### Agent Structure

**Agent 1: Gate + Per-Run Rules**
- Needs cross-file context (package.json, all diffs, all tracer names)
- Rules: NDS-001, NDS-002, NDS-003, NDS-006, API-001, API-002, API-003, API-004, CDQ-008
- Input: all instrumented file diffs, package.json diff, test results

**Per-File Agents (one per instrumented file)**
- Each gets: rubric + one file's diff + Weaver schema + registry + schema-covered/uncovered classification
- Rules: NDS-004, NDS-005 (with NDS-005a/NDS-005b sub-classification), COV-001 through COV-006, RST-001 through RST-005, SCH-001 through SCH-004, CDQ-001 through CDQ-007 (with CDQ-002 semantic check, CDQ-006 cheap computation exemption)
- Output: structured `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}`

**Synthesis Agent**
- Aggregates per-file findings
- Applies systemic bug classification
- Resolves conflicts between per-file agents
- Produces dimension-level scores with instance counts
- **New for run-6**: Flags superficial resolution regressions explicitly

---

## Process Improvements Encoded from Run-5

| Lesson | Where Encoded |
|--------|---------------|
| Actionable-fix-output IS the handoff — no separate document | Actionable fix output milestone |
| Priority recommendations only — no PRD/Issue classification | Actionable fix output milestone, Draft PRD #7 milestone |
| Cross-document audit agent at end of actionable-fix-output | Actionable fix output milestone, step 11 |
| Include file delivery counts in score projections | Success criteria #9, rubric scoring step 7, actionable fix output step 6 |
| Superficial resolution tracking (3 rules from run-5) | Per-file evaluation step 5, rubric scoring step 4, actionable fix output step 8 |
| Oscillation detection as first-class failure class | Evaluation run step 5, pre-run verification step 3 |
| Quality vs coverage is the primary tradeoff | Problem statement, success criteria #2 + #3 |
| Unmasked bug risk when recovering files | Failure deep-dives step 4 |
| Every prompt-only fix needs a validator | Pre-run verification step 2 (DEEP-1 checks this) |
| Always use local binary path (not npx) | Pre-run verification step 6 |
| Save partial file diffs before discarding | Process improvement from run-5 |
| Avoid shell command substitution for timestamps | Process improvement from run-5 |
| Schema evolution health check after first 3 files | Evaluation run step 4 |
| Cost sanity check (< 15% of ceiling → investigate) | Evaluation run step 6 |
| Branch state verification (diff, not self-report) | Per-file evaluation step 6 |
| Run-level failures get deep-dive treatment | Failure deep-dives step 2 |
| Per-file evaluation as canonical methodology | Established in run-5, continued |
| Schema coverage split as standard scoring dimension | Established in run-5, continued |
| Instance counts alongside rule-level scores | Established in run-5, continued |
| Systemic bug classification | Established in run-5, continued |
| CDQ-002 semantic check standardization | Established in run-5, continued |
| CDQ-006 cheap computation exemption | Established in run-5, continued |
| NDS-005 expected-condition sub-classification | Established in run-5, continued |
| 3-tier score projections | Established in run-5, continued |
| Each PRD drafts the next on main | Established in run-5, continued |

---

## Score Projections (from Run-5 Actionable Fix Output § 7)

These are the run-5 projections. Run-6 should validate them and update the projection methodology.

### Minimum (fix oscillation detection only — RUN-1)

Fix only the fix/retry oscillation detection:
- **COV-001:** index.js avoids oscillation, gets a root span → FAIL → PASS
- **COV-005:** No change — uncovered files still have zero attributes
- **File count:** 10 committed (index.js recovered) — marginal improvement
- **Expected score:** 24/25 = **96%** canonical

### Target (fix dominant systemic bugs — RUN-1, DEEP-1, DEEP-4)

Fix oscillation detection + COV-003 expected-condition exemption + duplicate JSDoc:
- **COV-001:** FAIL → PASS (index.js recovers)
- **COV-005:** Partially improved — some recovered files may have attributes
- **File count:** ~14-16 committed (recover summarize.js, summary-manager.js, summary-detector.js, journal-manager.js, summary-graph.js, journal-graph.js)
- **NDS-005:** PASS (genuine) — no latent violations
- **NDS-003:** PASS (genuine) — no duplicate JSDoc
- **Expected score:** 24-25/25 = **96-100%** canonical

### Stretch (target + schema-uncovered attribute strategy — EVAL-1)

Additionally fix the schema extension workflow for uncovered files:
- **COV-005:** FAIL → PASS (auto-summarize and server have domain-relevant attributes)
- **File count:** ~15-17 committed
- **Expected score:** 25/25 = **100%** canonical

### Calibration Notes (from run-5)

Run-4 projections had mixed accuracy:
- **Stretch target (92%) matched numerically** but through a different mechanism (fewer files, not better files)
- **The file-set assumption was wrong** — run-4 assumed 16 committed files would remain committed; run-5 had only 9
- **Run-6 target projection is higher confidence** because systemic root causes (SYS-3, SYS-4) are well-understood with clear fixes and precisely identified affected files

Risk: If fixing SYS-3 reveals new failure modes in recovered files ("unmasked bug" risk), actual score may be lower than projected.

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| DEEP-1 not fixed — COV-003 exemption not implemented | Pre-run verification step 2 (blocking). If not fixed, STOP — coverage recovery impossible without it. |
| Oscillation detection (RUN-1) not fixed | Pre-run verification step 3. Without it, index.js stays failed. Other files can still recover via DEEP-1/DEEP-4. |
| Push auth fails again (4th consecutive) | Pre-run push verification step 5. Escalate if not resolved — 4 failures is unacceptable. |
| Recovered files introduce new failure modes ("unmasked bugs") | Failure deep-dives step 4 explicitly checks for this. Score projections account for the risk in the target tier. |
| Superficial resolutions regress in recovered files | Per-file evaluation step 5 explicitly tracks NDS-005, CDQ-003, RST-001 in recovered files. |
| DEEP-4 not fixed — duplicate JSDoc blocks partial files | Pre-run verification step 4. Without it, 5 partial files remain blocked (NDS-003 violation). |
| Score projections wrong due to file-set changes | Score projections include file delivery counts alongside percentages. Pre-run expectation table (step 8) sets concrete file recovery targets. |
| Quality drops as more files commit | This is the "coverage recovery" challenge. Monitor: quality per committed file, not just aggregate. If quality drops below 85%, prioritize quality over coverage. |
| Schema evolution introduces new naming inconsistencies in recovered files | SCH-001/SCH-002 evaluated on all committed files. Schema-uncovered files classified and tracked separately. |
| Cost increase from more files passing validation | Expected — more files = more API calls. Cost sanity check ensures it's proportional. |

---

## Handoff Process

Run-6 uses the same handoff process as run-5:

1. **Evaluation produces findings** — `evaluation/run-6/spiny-orb-findings.md` with evidence links, priority, and acceptance criteria
2. **Actionable fix output IS the handoff** — `evaluation/run-6/actionable-fix-output.md` includes acceptance criteria, priority matrix, carry-forwards, and is written directly to the spiny-orb maintainer (run-5 decision: no separate handoff document needed)
3. **Target repo team triages** — The spiny-orb team reads the actionable fix output, verifies claims against their codebase, and right-sizes work (PRD vs Issue — their decision, not eval's)
4. **Triage report** — The spiny-orb team produces a triage report documenting which findings were confirmed, rejected, or reclassified
5. **Run-7 validates** — The next evaluation run checks whether the triage and fixes were effective

---

## Rubric Gaps to Consider (from Run-5)

These gaps were identified during run-5 evaluation and should be considered for formalization before or during run-6:

| Gap | Description | Source |
|-----|-------------|--------|
| COV-003 expected-condition exemption | Expected-condition catches (file-not-found, empty result) should not require recordException | DEEP-1, lessons-for-prd6 |
| NDS-005b boundary for LLM failures | Is a catch that handles LLM failure with graceful recovery an "expected condition"? | NDS-005b boundary, CodeRabbit feedback |
| Entry point coverage scope (COV-001) | Should COV-001 apply to all exported entry points or just the main() function? | DEEP-6, lessons-for-prd6 |
| Schema-uncovered attribute strategy | How to score attributes on files with no registry definitions | EVAL-1, lessons-for-prd6 |
| Validation-caused regressions | Should there be a rule for "validation pipeline blocked a previously-passing file"? | RUN-2, lessons-for-prd6 |
| Per-item error recording in loops | Batch operations where one item fails: span shows ERROR even if most items succeed | lessons-for-prd6 |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-17 | Coverage recovery as primary goal | Run-5 achieved 92% quality but only 9 files. The critical path (DEEP-1 → RUN-1 → DEEP-4) has clear fixes that should recover 5-7 files without sacrificing quality. |
| 2026-03-17 | Inherit all run-5 methodology decisions | Per-file evaluation as canonical, schema coverage split, instance counts, systemic bug classification, 3-tier projections — all established in run-5 and continued without change. |
| 2026-03-17 | Actionable-fix-output IS the handoff (inherited from run-5) | Run-5 decision: separate handoff document is redundant. |
| 2026-03-17 | Priority recommendations only — no PRD/Issue classification (inherited from run-5) | Eval provides priority; spiny-orb team right-sizes work. |
| 2026-03-17 | Cross-document audit agent (inherited from run-5) | Run-5 audit caught 22 missing items. Required at end of actionable-fix-output milestone. |
| 2026-03-17 | Track superficial resolutions explicitly | 3 rules from run-5 passed only because violating files were filtered. Run-6 must verify these when files are recovered. |
| 2026-03-17 | Escalate push auth if still failing | 3 consecutive failures. A 4th is unacceptable — needs explicit ownership and resolution mechanism. |
| 2026-03-19 | Rename all forward-looking references from orbweaver to spiny-orb | CLI, config file, and npm package renamed per spinybacked-orbweaver#177. Repo name unchanged. Historical branch names and run-5 artifact filenames preserved. |

---

## Prior Art

- **PRD #5**: Run-5 evaluation (this repo, branch `feature/prd-5-evaluation-run-5`)
- **PRD #4**: Run-4 evaluation (this repo, branch `feature/prd-4-evaluation-run-4`)
- **PRD #3**: Run-3 evaluation (this repo)
- **PRD #2**: Run-2 evaluation (this repo)
- **evaluation/run-5/**: Full run-5 documentation (on branch `feature/prd-5-evaluation-run-5`)
  - `per-file-evaluation.json`: Canonical per-file evaluation data
  - `rubric-scores.json`: Canonical rubric scoring data
  - `orbweaver-findings.md`: 22 findings with acceptance criteria
  - `actionable-fix-output.md`: Fix instructions with score projections (also serves as handoff)
  - `lessons-for-prd6.md`: Forward-looking improvements (primary input for this PRD)
  - `baseline-comparison.md`: Run-5 vs run-4 vs run-3 vs run-2
  - `failure-deep-dives.md`: Root cause analysis
  - `pr-evaluation.md`: PR artifact quality assessment
- **evaluation/run-4/**: Full run-4 documentation (on branch `feature/prd-4-evaluation-run-4`)
- **evaluation/run-3/**: Full run-3 documentation
- **evaluation/run-2/**: Full run-2 documentation
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
- **spinybacked-orbweaver/research/rubric-codebase-mapping.md**: Rule-to-code mapping
