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

<!-- Populated during Per-File Evaluation and Rubric Scoring milestones -->
