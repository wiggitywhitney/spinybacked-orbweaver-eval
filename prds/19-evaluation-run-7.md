# PRD #7: Evaluation Run-7 — Registry Expansion and Coverage Recovery

**Status:** Draft
**Created:** 2026-03-20
**GitHub Issue:** #19
**Depends on:** PRD #6 (run-6 complete, 16 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-6 scored 84% canonical (21/25) with 5/5 gates but only 5 files committed — a regression from run-5 (92%, 9 files) in both quality and coverage. The quality × files product has declined every run since run-3 (12.4 → 9.3 → 8.3 → 4.2). If this trend continues without intervention, run-7 could have ~3 files.

The dominant blocker is SCH-001: the Weaver registry defines exactly 1 span (`commit_story.context.collect_chat_messages`). The validator enforces strict registry conformance. When the agent needs a span name for a non-chat operation, it must choose between semantic accuracy (fails validator) or compliance (misleading name). 4/5 committed files chose compliance; all 6 partial files couldn't even do that — their operations are too far from "collect chat messages." SCH-001 is the SOLE blocker for journal-manager.js (9/10 functions pass).

Three COV-003 boundary gaps remain after DEEP-1's fix: per-item-failure-collection catches, swallow-and-continue catches, and try/finally without catch. These block index.js (3rd consecutive COV-001 failure), summarize.js, auto-summarize.js, summary-graph.js, and summary-detector.js.

Push authentication has failed 4 consecutive runs. HTTPS password auth doesn't work despite #183 being closed. A fundamentally different approach (SSH or credential helper) is needed.

The **dominant blocker peeling pattern** is now established: each run's top fix reveals the next blocker. Run-5 fixed COV-003 → SCH-001 emerged. Run-7 should fix SCH-001 → expect a new blocker to surface. Score projections must account for this.

### Primary Goal

Recover file coverage (target: 12-15 committed files) while restoring 92%+ quality score. The critical path is: registry expansion (~8 span definitions) → COV-003 boundary fixes (3 patterns) → push auth resolution.

### Secondary Goals

- Resolve SCH-001 semantic mismatch on all committed files (correct span names, not forced misuse)
- Verify regressions recover: auto-summarize.js, journal-paths.js (SCH-001), context-capture-tool.js, reflection-tool.js (RST-004/COV-004 precedence)
- Validate dominant blocker peeling pattern — what emerges behind SCH-001?
- Resolve PR summary accuracy (must reflect post-validation state)
- Track per-file delivery counts alongside percentage scores (established in run-5)

### Run-6 Scores (baseline for run-7 comparison)

| Dimension | Run-6 Canonical | Run-5 Canonical (for context) |
|-----------|----------------|-------------------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) |
| Coverage (COV) | 3/5 (60%) | 3/5 (60%) |
| Restraint (RST) | 3/4 (75%) | 4/4 (100%) |
| API-Only Dependency (API) | 3/3 (100%) | 3/3 (100%) |
| Schema Fidelity (SCH) | 3/4 (75%) | 4/4 (100%) |
| Code Quality (CDQ) | 7/7 (100%) | 7/7 (100%) |
| **Overall quality** | **21/25 (84%)** | **23/25 (92%)** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** |
| **Files committed** | **5/29** | **9/29** |
| **Cost** | **$9.72 (14.3% of ceiling)** | **$9.72 (14.3% of ceiling)** |
| **Cost/file** | **$1.94** | **$1.08** |

### Run-6 Quality Rule Failures (4 canonical)

| Rule | Category | Run-6 Classification |
|------|----------|---------------------|
| COV-001 | Entry point (index.js) has no span | Persistent (run-4, run-5, run-6) — 3 runs, different root cause each |
| COV-005 | server.js has zero attributes on span | Persistent (run-5, run-6) |
| RST-004 | git-collector.js unexported internals instrumented | New regression — SCH-001 cascade effect |
| SCH-001 | 4/5 files use mismatched span name from 1-span registry | New systemic (SYS-RUN6-1) — dominant blocker |

### Run-6 File Outcomes

| Outcome | Count | Files |
|---------|-------|-------|
| Committed with spans | 5 | claude-collector, git-collector, context-integrator, summary-manager (recovered), server |
| Correct skip (0 spans) | 14 | config, prompt files, filters, commit-analyzer (corrected) |
| Debatable skip | 3 | context-capture-tool, reflection-tool (RST-004/COV-004 tension), journal-paths (SCH-001 forced removal) |
| Partial (not committed) | 6 | journal-graph, summary-graph, summarize, auto-summarize, journal-manager, summary-detector |
| Persistent failure | 1 | index.js (COV-003 boundary + SCH-001) |

### Run-6 Spiny-Orb Findings (16 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN6-9 | SCH-001 single-span registry | Critical | Dominant blocker — blocks all partial files |
| RUN6-8 | COV-001 entry point (3rd run) | Critical | index.js: COV-003 boundary + SCH-001 |
| RUN6-2 | Push auth 4th failure | Critical | No PR created |
| RUN6-10 | DEEP-1 boundary gaps (3 patterns) | High | Blocks 5 files |
| RUN6-15 | PR summary doesn't reflect branch state | High | Misleads reviewers |
| RUN6-3 | SCH-001 semantic mismatch | High | 4/5 committed files wrong name |
| RUN6-11 | 5 files regressed from run-5 | High | auto-summarize, context-capture-tool, reflection-tool, journal-paths, commit-analyzer |
| RUN6-4 | Tally inflation | High | "23 succeeded" vs 5 committed |
| RUN6-5 | NDS-003 persists | Medium | 3+ partial files blocked |
| RUN6-16 | Advisory contradiction rate 76% | Medium | False positive advisories |
| RUN6-13 | RST-004 in git-collector | Medium | Unexported internals instrumented |
| RUN6-14 | COV-005 server.js zero attributes | Medium | No trace attributes |
| RUN6-7 | Reasoning reports not written to disk | Medium | No per-file decision visibility |
| RUN6-12 | 4/5 committed files wrong span names | Medium | Part of registry expansion |
| PR-1 | PR summary length (434 lines, 2 runs) | Medium | Needs compression |
| RUN6-1 | Laptop sleep kills API calls | Process | Use caffeinate |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| Push authentication failure | Run-3 | 4 runs | Persistent — 4th consecutive failure |
| NDS-003 blocks instrumentation-motivated refactors | Run-3 #4 | 4 runs | Agent still modifies original lines |
| CJS require() in ESM projects | Run-2 #62 | 5 runs | Open spec gap, not triggered in run-6 |
| Elision/null output bypass retry loop | Run-2 #63 | 5 runs | Likely improved but not directly tested |
| Spec gaps (#66-69) | Run-2 | 5 runs | Open — multiple specification gaps |
| DEEP-1 boundary gaps (3 patterns) | Run-5 (partial fix) | 2 runs | ENOENT covered, 3 patterns remain |
| PR summary accuracy | Run-5 | 2 runs | Regressed in run-6 |
| Advisory contradictions | Run-5 | 2 runs | 76% contradiction rate persists |

---

## Solution Overview

Four-phase approach (same structure as runs 5-6, with registry expansion as the primary focus):

1. **Pre-run verification** — Verify spiny-orb fixes landed (especially registry expansion, COV-003 boundaries, push auth), validate run prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` with registry expansion verification
3. **Structured evaluation** — Per-file evaluation with canonical methodology, plus regression tracking and superficial resolution re-verification
4. **Process refinements** — Encode methodology changes, draft PRD #8

### Key Inputs

- **Run-6 results**: `evaluation/run-6/` on branch `feature/prd-6-evaluation-run-6` (12 artifacts)
- **Evaluation rubric**: `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules, run-5/6 clarifications applied)
- **Rubric-codebase mapping**: `spinybacked-orbweaver/research/rubric-codebase-mapping.md`
- **Run-6 spiny-orb branch**: `spiny-orb/instrument-1773996478550` (local — push auth failed)
- **Run-6 actionable fix output**: `evaluation/run-6/actionable-fix-output.md` (this IS the handoff)
- **Run-6 findings**: `evaluation/run-6/spiny-orb-findings.md` (16 findings)
- **Run-6 lessons**: `evaluation/run-6/lessons-for-prd7.md`
- **Run-6 score projections**: `evaluation/run-6/actionable-fix-output.md` §7

---

## Success Criteria

1. Push authentication resolved — PR successfully created (4 consecutive failures is unacceptable; must work in run-7)
2. At least 12 files committed (up from 5) — validates registry expansion impact
3. Quality score of 92%+ canonical restored (regression recovery from run-6's 84%)
4. SCH-001 resolved — all committed files use semantically correct span names
5. COV-001 resolved — index.js entry point has a root span (4th attempt)
6. journal-manager.js commits — SCH-001 was sole blocker, highest-ROI fix
7. Regressions recovered: auto-summarize.js and journal-paths.js commit again
8. No new systemic bugs introduced by registry expansion
9. All evaluation artifacts generated from canonical JSON (per-file-evaluation.json, rubric-scores.json)
10. Score projections include file delivery counts alongside percentages, with 50% discount for unmasked bug risk
11. Dominant blocker peeling tracked — document what emerges behind SCH-001
12. PR summary reflects post-validation branch state (not pre-validation intentions)
13. Cross-document audit agent run at end of actionable-fix-output milestone
14. Tally reflects branch state — "N files committed with spans" not "N succeeded"
15. Cost sanity check: if actual < 15% of ceiling, investigate prompt change rate

---

## Milestones

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/run-6/actionable-fix-output.md`. Compare what they filed vs what the eval recommended. Note any findings the spiny-orb team rejected and why.
  2. **SCH-001 verification (critical)**: Verify Weaver registry has ≥8 span definitions covering commit-story domain operations (CLI, git, context, journal, summary, auto-summarize, MCP server, summary-detector). If <5 definitions, STOP — registry expansion is the blocking prerequisite.
  3. **COV-003 boundary verification (critical)**: Verify expected-condition exemption covers all 4 patterns: ENOENT-style (DEEP-1), per-item-failure-collection, swallow-and-continue, try/finally. Test against `src/index.js` (swallow-and-continue) and `src/commands/summarize.js` (per-item-collection). If boundary gaps remain, note expected impact on file recovery.
  4. **Push capability test**: Verify push auth uses SSH, credential helper, or `--push-command`. Test with `git push --dry-run`. HTTPS password auth is confirmed broken — do NOT accept HTTPS-only fix.
  5. **RST-004/COV-004 precedence check**: Verify rubric or rubric-codebase mapping provides definitive answer for unexported async functions with file I/O (context-capture-tool.js, reflection-tool.js).
  6. **NDS-003 verification**: Check if return-value capture pattern is fixed (agent preserves original lines byte-for-byte during instrumentation).
  7. **PR summary post-validation check**: Verify PR summary regeneration occurs after all validation retries complete.
  8. **Tally accuracy check**: Verify tally reports committed-with-spans count, not "succeeded" count.
  9. Rebuild spiny-orb: `cd spinybacked-orbweaver && npm run prepare` — verify build timestamp is after all fix merges.
  10. `spiny-orb --version` — record version for evaluation log.
  11. **File recovery expectations**: Based on which fixes landed, predict which of the 7 partial/failed files and 4 regressed files should recover. Create a pre-run expectation table. **Apply 50% discount for unmasked bug risk** (run-6 lesson: projections are systematically optimistic).
  12. **Superficial resolution tracking setup**: For any file recovering from partial→committed, plan to verify NDS-005, CDQ-003, RST-001 (methodology validated in run-6 on summary-manager.js).
  13. **Validator-evaluator alignment check**: Verify SCH-001 definition is consistent between validator and evaluator. Run-6 found they diverge (validator: strict registry conformance; evaluator: quality guideline). One must change.
  14. Verify codebase is clean: `git status` on main, no leftover spiny-orb branches.
  15. Record which run-6 findings are verified fixed vs still open — this determines the expected score ceiling.
  16. Append any pre-run observations to `evaluation/run-7/lessons-for-prd8.md`.

- [ ] **Collect lessons for PRD #8** — Create BOTH output documents at the START and append throughout all subsequent milestones:
  1. Create `evaluation/run-7/spiny-orb-findings.md`. Use findings vocabulary from the start.
  2. Create `evaluation/run-7/lessons-for-prd8.md`. Sections: Rubric Gaps, Process Improvements, Evaluation Methodology, Rubric-Codebase Mapping Corrections, Schema Decisions, Carry-Forward Items.
  3. Both documents are updated throughout all subsequent milestones. Every milestone has explicit "append to findings/lessons" steps.

- [ ] **Evaluation run-7** — Execute `spiny-orb instrument` in the user's terminal (not through Claude Code):
  1. Clean codebase state: start from main branch with evaluation config (spiny-orb.yaml, instrumentation.js, semconv/).
  2. **Provide the exact command** for the user to run in their own terminal: `caffeinate -s spiny-orb instrument src/ --verbose -y 2>&1 | tee evaluation/run-7/spiny-orb-output.log`. The user runs this — Claude does NOT execute it. (Run-6 lesson: 30+ minute command, buffered stdout, laptop sleep risk.)
  3. Record wall-clock start timestamp.
  4. **Resume after run completes**: User notifies Claude when the run finishes. Claude reads the output log and resumes evaluation.
  5. **Schema evolution health check**: Compare schemaHashBefore vs schemaHashAfter. With registry expansion, should show significant evolution.
  6. **Registry utilization check (new)**: How many of the new registry span definitions did the agent actually use? If <50%, investigate why.
  7. **Cost sanity check**: If actual cost < 15% of ceiling, verify the prompt is changing between files.
  8. Monitor for failures in output log — note error messages for failure deep-dives.
  9. Record wall-clock end timestamp. Compare against run-6 (~2 hours actual processing).
  10. If any files failed due to token budget, run supplemental passes with `maxTokensPerFile: 150000`.
  11. Verify PR was created successfully. If push failed (5th consecutive), this is a critical escalation — the evaluation workflow is fundamentally broken without PR creation.
  12. Record final tally using branch state: files committed with spans / correct skips / partial not committed / failed.
  13. **Coverage recovery check**: Compare file tally against pre-run expectation table (with 50% discount already applied). Which files recovered? Which didn't? Any surprises?
  14. **Regression check**: Verify all 5 run-6 committed files are still committed. Track the 4 run-6 regressions (auto-summarize, context-capture-tool, reflection-tool, journal-paths).
  15. **Branch deliverable check**: Verify all files reported as instrumented have actual changes on the branch: `git diff main..spiny-orb-branch --stat`.
  16. **Dominant blocker peeling check (new)**: With SCH-001 fixed, what's the new top blocker for remaining partial files? Document this explicitly.
  17. Append any run observations to `evaluation/run-7/lessons-for-prd8.md` and `evaluation/run-7/spiny-orb-findings.md`.

- [ ] **Failure deep-dives** — For each failed file AND each run-level failure:
  1. **File-level failures**: For each failed/partial file: read spiny-orb output log, identify validation rules that blocked instrumentation, map to spiny-orb findings (run-6 and run-7), assess whether spiny-orb fixes helped.
  2. **Run-level failures**: Push failures, test suite failures, schema evolution issues, commit noise — all get deep-dive treatment.
  3. **Failure trajectory update**: For persistent failures (files that failed in runs 2-6): update the trajectory. Is the root cause the same or different each run? Track per-file failure history across all runs.
  4. **Unmasked bug detection**: For files recovered by registry expansion / COV-003 fixes — check for NEW failure modes that were previously masked by SCH-001. Run-6 confirmed this pattern (SCH-001 was unmasked by DEEP-1 fix). Expect it again.
  5. **Regression root cause**: For any files that regressed from run-6 to run-7 — full root cause analysis. Is the regression caused by spiny-orb changes or evaluation methodology changes?
  6. For new failures: file findings in `evaluation/run-7/spiny-orb-findings.md`.
  7. Document in `evaluation/run-7/failure-deep-dives.md`.
  8. Append to `evaluation/run-7/lessons-for-prd8.md` and `evaluation/run-7/spiny-orb-findings.md`.

- [ ] **Per-file evaluation** — Full rubric applied to all files using canonical methodology:
  1. **Gate checks + per-run rules (single agent)**: NDS-001, NDS-002, NDS-003, NDS-006, API-001, API-002, API-003, API-004, CDQ-008.
  2. **Per-file quality rules (per-file agents)**: Each agent gets rubric + one file's diff + Weaver schema + registry. Rules: NDS-004, NDS-005, COV-001 through COV-006, RST-001 through RST-005, SCH-001 through SCH-004, CDQ-001 through CDQ-007.
  3. **Apply rubric clarifications**: CDQ-002 semantic check, CDQ-006 cheap computation exemption, NDS-005 sub-classification (NDS-005a/NDS-005b).
  4. **Schema coverage split**: Classify each file as schema-covered or schema-uncovered. With registry expansion, most files should be schema-covered. Track coverage ratio improvement.
  5. **Superficial resolution re-check**: For every file recovered from partial/failed/regressed, explicitly evaluate NDS-005, CDQ-003, and RST-001. Run-6 verified these on summary-manager.js; expand sample with newly recovered files.
  6. **Branch state verification**: Evaluate `git diff main..spiny-orb-branch` — do NOT trust the agent's self-reported per-file status.
  7. Zero-span files: verify correct skip decisions. **For debatable skips (RST-004/COV-004 tension)**: apply whatever precedence rule the rubric now specifies.
  8. Failed files: evaluate against NDS rules only.
  9. **SCH-001 semantic quality check (new)**: For all committed files, verify span names are semantically correct (not just registry-compliant). Run-6's compliance-over-accuracy problem should be resolved by registry expansion.
  10. **NDS-005b boundary cases**: Apply the run-5 boundary refinement — LLM failure fallbacks use `span.addEvent('llm.fallback')` instead of `recordException`.
  11. Structured output format: `{rule_id} | {pass|fail} | {file_path}:{line_number} | {actionable_message}`
  12. Emit as `evaluation/run-7/per-file-evaluation.json` (canonical) and render `evaluation/run-7/per-file-evaluation.md`.
  13. Append to `evaluation/run-7/lessons-for-prd8.md` and `evaluation/run-7/spiny-orb-findings.md`.

- [ ] **PR artifact evaluation** — Evaluate the PR as a first-class deliverable:
  1. If PR exists: evaluate description quality, per-file table accuracy, span counts, agent decision notes.
  2. **Verify per-file table claims against branch state.** Runs 4-6 all found discrepancies.
  3. **PR summary post-validation check (new)**: Verify span names, statuses, and schema extensions match committed code. Run-6's summary was generated pre-validation and was severely misleading.
  4. **PR summary length check**: Run-5 and run-6 were both ~430 lines. Check if compression landed (target: <200 lines).
  5. **Advisory contradiction check**: Check if advisory engine consumes skip decisions. Run-5 and run-6 both found 70%+ contradiction rates.
  6. **Tally accuracy check (new)**: Verify the tally reflects branch state (committed-with-spans count), not "succeeded" count. Run-6 reported "23 succeeded" with 5 committed.
  7. Assess: Does the PR help a reviewer understand what the agent did and make informed merge decisions? (Run-6 was 2/5; target 3/5+.)
  8. If draft PR (test failures): evaluate the "Test Failures" section.
  9. If PR was lost (push failure): document and escalate — 5th consecutive failure demands fundamental workflow change.
  10. Document in `evaluation/run-7/pr-evaluation.md`.
  11. Append to `evaluation/run-7/lessons-for-prd8.md` and `evaluation/run-7/spiny-orb-findings.md`.

- [ ] **Rubric scoring** — Synthesize per-file findings into dimension-level scores:
  1. Aggregate from `evaluation/run-7/per-file-evaluation.json`.
  2. Score each dimension with per-rule evidence AND per-file instance counts (files passing/failing each rule).
  3. Apply schema coverage split scoring as standard. With registry expansion, the split should shift significantly toward "covered."
  4. Classify each failure as persistent, new regression, genuine new finding, superficial resolution regression, unmasked (revealed by SCH-001 fix), or methodology-driven.
  5. Apply systemic bug classification where applicable.
  6. **Single canonical score** using per-file evaluation + schema coverage split. Provide methodology-adjusted comparison ONLY for backward compatibility with runs 2-6.
  7. **Include file delivery count alongside percentage score** (established in run-5).
  8. Emit as `evaluation/run-7/rubric-scores.json` (canonical) and render `evaluation/run-7/rubric-scores.md`.
  9. Append to `evaluation/run-7/lessons-for-prd8.md` and `evaluation/run-7/spiny-orb-findings.md`.

- [ ] **Baseline comparison and synthesis** — Compare run-7 vs runs 2-6:
  1. Dimension-level trend analysis (6-run).
  2. File outcome comparison: improved / regressed / same. Track per-file delivery history across all runs.
  3. Failure classification: resolved / persistent / new / unmasked.
  4. **Registry expansion impact assessment (new)**: Key question for run-7 — did expanding the registry recover the expected files? How many new span definitions were actually used?
  5. **Dominant blocker peeling assessment**: What emerged behind SCH-001? Is the pattern predictable?
  6. **Superficial resolution assessment**: Verify NDS-005, CDQ-003, RST-001 on all newly recovered files.
  7. **Quality vs coverage trend**: Plot quality score vs file delivery count across all runs. Run-7 should show both metrics improving (reversing the run-6 decline).
  8. Assessment of run-6 score projections: did the 3-tier prediction hold? Validate the 50% discount methodology.
  9. **Cost comparison**: 6-run trend. Validate cost-to-file-count ratio. With more files, cost/file should decrease.
  10. Document in `evaluation/run-7/baseline-comparison.md`.
  11. Append to `evaluation/run-7/lessons-for-prd8.md`.

- [ ] **Actionable fix output** — Produce fix instructions for remaining failures (this IS the handoff). **This is the primary deliverable of the entire evaluation run.** The document must be self-contained so the spiny-orb Weaver has everything at its fingertips — synthesize ALL findings from every run-7 artifact:
  1. For each remaining quality rule failure: what's wrong, evidence, desired outcome, acceptance criteria.
  2. For each remaining failed file: root cause, desired outcome, finding cross-references.
  3. Assessment of run-6 findings: which were fixed, which remain, any new findings.
  4. Run-7 rubric gap assessment.
  5. Run-8 verification checklist.
  6. Score projection for run-8 (3-tier: minimum/target/stretch with explicit assumptions AND file delivery counts). **Apply 50% discount for unmasked bug risk** (calibrated from run-5→6 projection miss).
  7. Priority action matrix with acceptance criteria.
  8. Superficial resolution tracking update.
  9. Carry-forward items update.
  10. Port failing files as test cases (update from run-6 list — remove recovered files, add any new failures).
  11. **Cross-document audit agent** (final step): Read ALL evaluation documents and cross-reference against the actionable fix output. Flag any items that appear in source documents but are missing. Run-5 audit caught 22 missing items.
  12. Generate from canonical JSON artifacts to prevent drift.
  13. Document in `evaluation/run-7/actionable-fix-output.md`.
  14. Final review of `evaluation/run-7/lessons-for-prd8.md` and `evaluation/run-7/spiny-orb-findings.md`.

- [ ] **Draft PRD #8 for next evaluation run** — Create PRD #8 on a separate branch from main:
  1. Run-7 scores as baselines (include file delivery counts).
  2. All items from `evaluation/run-7/lessons-for-prd8.md`.
  3. Carry forward unresolved findings from `evaluation/run-7/actionable-fix-output.md`.
  4. Encode process lessons.
  5. Validate run-7 score projections against actual results and update projection methodology.
  6. Create on a separate branch from main and PR to main — evaluation branches are never merged.
  7. Actionable-fix-output milestone must include cross-document audit agent step.
  8. Provide priority recommendations only — do NOT include PRD/Issue classification for findings (established in run-5).

---

## Evaluation Branch Lifecycle

Evaluation run branches (feature/prd-N-evaluation-run-*) are **never merged to main**. PRs are created so CodeRabbit can review the evaluation artifacts, but the PR is closed after review, not merged. The evaluation data lives only on the feature branch.

**Implications for PRD drafting:** When a milestone says "draft PRD #N+1," that file must be created on main via a separate branch and PR — it cannot ride on the evaluation branch.

**Implications for rubric/schema changes:** Any rubric updates, schema changes, or evaluation methodology changes that need to persist across runs must be committed to the appropriate repo independently of the evaluation branch.

---

## Evaluation Architecture

Carried forward from runs 5-6 — canonical methodology established.

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
- Flags superficial resolution regressions explicitly
- **New for run-7**: Flags unmasked bugs from SCH-001 fix explicitly

---

## Process Improvements Encoded from Run-6

| Lesson | Where Encoded |
|--------|---------------|
| Run instrument command in user's terminal, not Claude Code | Evaluation run milestone, step 2 |
| Use `caffeinate -s` to prevent laptop sleep | Evaluation run milestone, step 2 |
| Handoff triage process validated (2 cycles) | No change needed — process works |
| Check for tool renames during pre-run verification | Pre-run verification (general hygiene) |
| "Succeeded" classification is misleading — use branch state | Success criteria #14, PR evaluation step 6, evaluation run step 12 |
| Function-level fallback masks failures as successes | Evaluation run step 12 (branch state tally) |
| Validator-evaluator conflict on SCH-001 | Pre-run verification step 13 |
| Score projections were completely wrong — apply 50% discount | Success criteria #10, actionable fix output step 6 |
| Superficial resolution tracking works well (validated on summary-manager) | Per-file evaluation step 5 |
| Dominant blocker peeling pattern established | Success criteria #11, evaluation run step 16 |
| SCH-001 is new dominant blocker — registry expansion highest ROI | Pre-run verification step 2 |
| COV-003 boundary gaps remain (3 patterns) | Pre-run verification step 3 |
| 5 files regressed from run-5 — track regressions explicitly | Evaluation run step 14 |
| PR summary must reflect post-validation state | PR evaluation step 3, success criteria #12 |
| Committed file semantic quality (compliance vs accuracy) | Per-file evaluation step 9 |
| CI acceptance gate config issue (#225) persists | Pre-run verification (check if resolved) |
| Acceptance test fixtures are gold standard for verification | Pre-run verification (check fixture results) |
| Quality × files product declining — registry expansion reverses this | Problem statement, quality vs coverage trend |
| Each PRD drafts the next on main | Established in run-5, continued |
| Actionable-fix-output IS the handoff | Established in run-5, continued |
| Priority recommendations only — no PRD/Issue classification | Established in run-5, continued |
| Cross-document audit agent at end of actionable-fix-output | Established in run-5, continued |
| Per-file evaluation as canonical methodology | Established in run-5, continued |
| Schema coverage split as standard scoring dimension | Established in run-5, continued |
| Instance counts alongside rule-level scores | Established in run-5, continued |
| Systemic bug classification | Established in run-5, continued |
| 3-tier score projections with file delivery counts | Established in run-5, continued |

---

## Score Projections (from Run-6 Actionable Fix Output §7)

These are the run-6 projections. Run-7 should validate them and update the projection methodology.

### Minimum (registry expansion only)

Add ~8 span definitions to the Weaver registry. No COV-003 boundary fixes.

- **SCH-001:** FAIL → PASS (all committed files get correct names)
- **RST-004:** Likely PASS (agent can instrument exported functions with correct names)
- **COV-001:** Still FAIL (index.js needs COV-003 boundary fix too)
- **COV-005:** Still FAIL (server.js needs prompt improvement)
- **File recovery:** journal-manager.js commits (SCH-001 sole blocker). journal-paths.js likely recovers. auto-summarize.js partially recovers.
- **Expected score:** 23/25 (92%), **8-10 files**
- **After 50% discount:** 21-23/25, **6-8 files**
- **Risk:** New blocker may emerge behind SCH-001

### Target (registry + COV-003 boundaries + push fix)

Expand registry + fix all 3 COV-003 boundary patterns + resolve push auth.

- **SCH-001:** FAIL → PASS
- **RST-004:** FAIL → PASS
- **COV-001:** FAIL → PASS (index.js recovers)
- **COV-005:** Still FAIL (separate fix needed)
- **File recovery:** index.js, journal-manager.js, journal-paths.js, auto-summarize.js, summarize.js commit. Partial files improve significantly.
- **Expected score:** 24/25 (96%), **12-15 files**
- **After 50% discount:** 22-24/25, **8-12 files**
- **Risk:** NDS-003 blocks some partial files. Unmasked bugs behind SCH-001.

### Stretch (target + NDS-003 + COV-005 + PR summary)

Fix everything: registry, COV-003, push, NDS-003, COV-005, PR summary.

- **All failures resolved**
- **File recovery:** All 6 partial files commit. context-capture-tool and reflection-tool may recover if RST-004/COV-004 precedence clarified.
- **Expected score:** 25/25 (100%), **15-18 files**
- **After 50% discount:** 23-25/25, **10-14 files**
- **Risk:** Unknown unknowns. Dominant-blocker peeling pattern suggests something new will surface.

### Calibration Notes

Run-5 projected 96-100% with 14-16 files. Actual run-6: 84% with 5 files. All three tiers catastrophically missed. Root causes:
1. Fixed blockers revealed new blockers (SCH-001 unmasked by DEEP-1)
2. Projections assumed no new dominant blockers would emerge
3. Validation strictness increased (SCH-001 enforcement)

The 50% discount is applied to account for the dominant-blocker peeling pattern. The minimum tier is the most reliable prediction. Even discounted, actual results may be lower if the newly emerged blocker is more severe than SCH-001.

---

## Rubric Gaps to Consider (from Run-6)

| Gap | Description | Source |
|-----|-------------|--------|
| COV-003 boundary expansion (3 patterns) | Per-item-failure-collection, swallow-and-continue, try/finally not exempted | DEEP-1 boundary, RUN6-10 |
| SCH-001 validator vs evaluator definition | Validator: strict registry conformance. Evaluator: quality guideline. Must align. | lessons-for-prd7, RUN6-3 |
| RST-004 vs COV-004 precedence | Unexported async functions with file I/O: which rule wins? | lessons-for-prd7, RUN6-11 |
| Validation-caused regression rule | auto-summarize committed in run-5, partial in run-6 due to stricter validation | lessons-for-prd7 |
| SCH-001 single-span registry perverse incentive | Agent forced to choose between accuracy and compliance | lessons-for-prd7, RUN6-9 |
| Tally should reflect branch state | "Succeeded" vs "committed" are very different; tally misleads | lessons-for-prd7, RUN6-4 |

---

## Rubric-Codebase Mapping Corrections Needed (from Run-6)

| Correction | Source |
|-----------|--------|
| Test count outdated: mapping says 320/11 files, actual is 534/22 files | lessons-for-prd7 |
| SCH-001 needs validator alignment note (soft guideline vs strict enforcement) | lessons-for-prd7 |
| RST-004 function list needs definitive precedence answer for context-capture-tool/reflection-tool | lessons-for-prd7 |

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Registry expansion insufficient — too few span definitions | Pre-run verification step 2 (blocking). Target ≥8 definitions. |
| COV-003 boundary gaps still unfixed | Pre-run verification step 3. Without them, index.js + 4 other files stay blocked. |
| Push auth fails again (5th consecutive) | Pre-run verification step 4. Must use SSH or credential helper, not HTTPS. If still failing, evaluate without PR and escalate. |
| Dominant blocker peeling — new blocker emerges behind SCH-001 | Expected. Evaluation run step 16 explicitly tracks this. Score projections apply 50% discount. |
| Recovered files introduce new failure modes ("unmasked bugs") | Failure deep-dives step 4 checks for this. Established pattern from run-5→6. |
| Regressions from run-6 not recovered | Evaluation run step 14 tracks all 4 regressions explicitly. |
| Validator-evaluator SCH-001 conflict persists | Pre-run verification step 13. If not resolved, document evaluation-side workaround. |
| Laptop sleep during instrumentation | Evaluation run step 2: user runs command with `caffeinate -s`. |
| Score projections still too optimistic despite 50% discount | Minimum tier is anchor. Track projection accuracy across runs to improve methodology. |
| Quality drops as more files commit | Monitor quality per committed file, not just aggregate. If quality < 85%, prioritize quality over coverage. |
| PR summary still inaccurate | PR evaluation step 3. If still pre-validation, document as persistent finding. |
| Cost increase from more files passing validation | Expected — more files = more API calls. Cost sanity check ensures proportionality. |

---

## Handoff Process

Run-7 uses the same handoff process as runs 5-6:

1. **Evaluation produces findings** — `evaluation/run-7/spiny-orb-findings.md` with evidence links, priority, and acceptance criteria
2. **Actionable fix output IS the handoff** — `evaluation/run-7/actionable-fix-output.md` includes acceptance criteria, priority matrix, carry-forwards, and is written directly to the spiny-orb maintainer
3. **Target repo team triages** — The spiny-orb team reads the actionable fix output, verifies claims against their codebase, and right-sizes work (PRD vs Issue — their decision, not eval's)
4. **Triage report** — The spiny-orb team produces a triage report documenting which findings were confirmed, rejected, or reclassified
5. **Run-8 validates** — The next evaluation run checks whether the triage and fixes were effective

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-20 | Registry expansion as primary goal | SCH-001 is the dominant blocker (every partial file). Adding ~8 span definitions is the highest-ROI fix — journal-manager.js commits immediately. |
| 2026-03-20 | Inherit all run-5/6 methodology decisions | Per-file evaluation as canonical, schema coverage split, instance counts, systemic bug classification, 3-tier projections with file counts — all established and continued. |
| 2026-03-20 | Apply 50% discount to all score projections | Run-5 projections catastrophically missed (predicted 96-100%/14-16 files, actual 84%/5 files). Dominant blocker peeling pattern means every fix reveals the next blocker. |
| 2026-03-20 | User runs instrument command in their terminal | Run-6 lesson: 30+ min command, buffered stdout, laptop sleep risk. Use `caffeinate -s` and let user monitor directly. |
| 2026-03-20 | Push auth must use SSH or credential helper | HTTPS password auth has failed 4 consecutive runs. A 5th failure is unacceptable. |
| 2026-03-20 | Track dominant blocker peeling as first-class concern | Pattern established: run-5 COV-003 → run-6 SCH-001 → run-7 ???. Each fix reveals the next. |

---

## Prior Art

- **PRD #6**: Run-6 evaluation (this repo, branch `feature/prd-6-evaluation-run-6`)
- **PRD #5**: Run-5 evaluation (this repo, branch `feature/prd-5-evaluation-run-5`)
- **PRD #4**: Run-4 evaluation (this repo, branch `feature/prd-4-evaluation-run-4`)
- **PRD #3**: Run-3 evaluation (this repo)
- **PRD #2**: Run-2 evaluation (this repo)
- **evaluation/run-6/**: Full run-6 documentation (on branch `feature/prd-6-evaluation-run-6`)
  - `per-file-evaluation.json`: Canonical per-file evaluation data
  - `rubric-scores.json`: Canonical rubric scoring data
  - `spiny-orb-findings.md`: 16 findings with acceptance criteria
  - `actionable-fix-output.md`: Fix instructions with score projections (also serves as handoff)
  - `lessons-for-prd7.md`: Forward-looking improvements (primary input for this PRD)
  - `baseline-comparison.md`: Run-6 vs runs 2-5
  - `failure-deep-dives.md`: Root cause analysis
  - `pr-evaluation.md`: PR artifact quality assessment
- **evaluation/run-5/**: Full run-5 documentation (on branch `feature/prd-5-evaluation-run-5`)
- **evaluation/run-4/**: Full run-4 documentation (on branch `feature/prd-4-evaluation-run-4`)
- **evaluation/run-3/**: Full run-3 documentation
- **evaluation/run-2/**: Full run-2 documentation
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
- **spinybacked-orbweaver/research/rubric-codebase-mapping.md**: Rule-to-code mapping
