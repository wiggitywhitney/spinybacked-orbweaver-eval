# Lessons for PRD #13

Observations collected during run-12 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

**Branch matters for rebuild**: The PRD said rebuild from `main`, but spiny-orb was on `feature/prd-371-javascript-provider-extraction` (15 commits ahead of main, PRD #371 JavaScript provider extraction). User confirmed: rebuild from whatever branch it's on. Future PRDs should say "rebuild from current branch" not "rebuild from main."

**No formal triage document**: Run-11 findings were acted on directly via merged PRs rather than a structured triage document. This is fine — the PR descriptions serve as the record. Tracking the PR numbers in pre-run-verification.md is sufficient.

**PRD #371 is a first-run architectural change**: The checker pipeline was refactored (LanguageProvider, JavaScriptProvider, B1/B2/B3 split). Run-12 is the first evaluation using this architecture. Unexpected behavior is possible. Document any deviations carefully.

**target-repo branch check**: commit-story-v2 was left on `spiny-orb/instrument-1774849971011` from run-11. Always verify target repo is on `main` before running instrument — add this to the run checklist as an explicit step.

## Run-Level Observations

**NDS-003 truthy check gap**: The PR #352 fix added `!== undefined`/`!= null` patterns to the NDS-003 allowlist, but truthy checks (`if (obj.property)`) are still flagged as non-instrumentation code. Two files were affected differently: index.js dropped the attribute entirely; journal-manager.js removed the guard and now sets attributes unconditionally with potential `undefined` values. Both outcomes are worse than the intended behavior (guard the attribute). A follow-up fix should add truthy-check guard patterns to the NDS-003 allowlist.

**API overload → partial commit**: summary-detector.js got 3/5 functions instrumented because the Anthropic API returned `overloaded_error` on 2 function-level calls. The partial was committed with what succeeded. This is an infrastructure reliability gap in spiny-orb (single provider, no model fallback), not an agent design issue and not a quality concern. Future runs should treat API overload partials the same as clean commits for rubric scoring purposes.

**summary-manager.js span count regression**: 9 spans in run-11 vs 3 in run-12. Needs per-file investigation to determine whether run-11 over-instrumented (and run-12 corrected it) or run-12 under-instrumented.

**journal-graph.js 3 attempts again**: Regressed from 2 (run-11) to 3 (run-10 baseline). This is still the most expensive single file. Root cause unknown — needs deeper analysis of what the validator catches on attempts 1 and 2.

**PRD #371 refactor held**: Zero failures across 30 files on the first run using the LanguageProvider/JavaScriptProvider/B1-B2-B3 architecture. The refactor did not introduce new failure modes.

**Duration and token increase**: 53.8 min vs 41.2 min in run-11; output tokens 208.1K vs 158.7K. Primary driver is likely journal-graph.js returning to 3 attempts (64.9K output tokens alone). Cost target ($4.00) likely not met.

## Evaluation Process Observations

1. **COV-004 now requires explicit justification when skipping exported async I/O functions**: The run-12 COV-004 failure (summary-manager.js) was caused by the agent applying "context propagation" reasoning to skip 6 exported async I/O functions. Future evaluations should flag any file where exported async functions were skipped without a rubric-grounded justification (RST-001 sync-only or RST-004 unexported).

2. **CDQ-007 and NDS-003 now produce quality failures, not just attribute dropping**: Run-11's CDQ-007/NDS-003 conflict produced attribute dropping (advisory quality concern). Run-12's conflict produced an actual CDQ-007 canonical failure (unconditional setAttribute from nullable fields). The root cause (truthy-check gap in NDS-003) is more urgent than previously assessed.

3. **summary-manager.js is an instrumentation oscillator**: Run-10 failed (Weaver CLI), run-11 succeeded with 9 spans, run-12 regressed to 3 spans. Watch this file carefully in future runs — it has the widest variation in span count.

4. **Two consecutive PR successes confirm token-swap mechanism stability**: PRs #60 (run-11) and #61 (run-12) both succeeded with the fine-grained PAT. Push auth is no longer a per-run checklist concern beyond the standard verification step.

5. **PRD #371 (LanguageProvider/JavaScriptProvider architecture) held through first evaluation**: Zero failures across 30 files in first run with the new architecture. The refactor did not introduce new failure modes. Consider removing the "new architecture risk" warning from future pre-run verification checklists.

6. **Cross-document audit agent caught 10 items**: Most were informational (score consistency verified) with a few real gaps (missing RUN12-4/5/6 narrative, undefined "50% discount" concept, advisory count evidence). The audit remains valuable at the actionable-fix-output milestone.

7. **Oscillation pattern is now a named concept**: Quality has oscillated 25→23→25→23 since run-9. Each fix introduces behavioral constraints that produce new failure modes. Documenting this in baseline-comparison.md helps set expectations for run-13.

8. **NDS-003 truthy-check gap is now P1 (was P1 in run-11 too but only partially fixed)**: PR #352 fixed strict-equality guards. Truthy guards remain unfixed. The gap has now produced CDQ-007 failures in 2 consecutive runs with different manifestations. It must be fully resolved before run-13.

9. **Add a Findings Discussion milestone to all future evaluation PRDs** (Decision 2026-04-09): After the evaluation run completes and run-summary is written, before writing failure-deep-dives/per-file-evaluation/etc., Claude should pause and surface key findings to Whitney at a high level — what regressed, what passed, what was interesting, notable patterns — and discuss them conversationally. Whitney cannot see the evaluation documents as they're being written and wants to be part of the analysis before the write-up proceeds. This must be a named milestone in PRD #13 and all subsequent evaluation PRDs, not an implicit step. See Decision Log entry 2026-04-09 in PRD #33.

10. **Two moments to surface findings to Whitney** (Decision 2026-04-09):
    - **Moment 1** (Findings Discussion milestone, between "Evaluation run" and "Failure deep-dives"): Right after the run completes, give Whitney a quick high-level overview — files committed, quality, cost, anything alarming. Raw signal before analysis. Wait for her acknowledgment before proceeding.
    - **Moment 2** (end of Actionable fix output milestone): After full analysis, give Whitney an interpreted summary — key failures, root causes, notable patterns, what to watch for. Then print the absolute file path of actionable-fix-output.md and pause until she confirms she's handed it off to the spiny-orb team. Do not proceed to Draft PRD until confirmed.
    Both moments are named steps in all future evaluation PRD milestones.
