# Lessons for PRD #13

Observations collected during run-12 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

**Branch matters for rebuild**: The PRD said rebuild from `main`, but spiny-orb was on `feature/prd-371-javascript-provider-extraction` (15 commits ahead of main, PRD #371 JavaScript provider extraction). User confirmed: rebuild from whatever branch it's on. Future PRDs should say "rebuild from current branch" not "rebuild from main."

**No formal triage document**: Run-11 findings were acted on directly via merged PRs rather than a structured triage document. This is fine — the PR descriptions serve as the record. Tracking the PR numbers in pre-run-verification.md is sufficient.

**PRD #371 is a first-run architectural change**: The checker pipeline was refactored (LanguageProvider, JavaScriptProvider, B1/B2/B3 split). Run-12 is the first evaluation using this architecture. Unexpected behavior is possible. Document any deviations carefully.

**target-repo branch check**: commit-story-v2 was left on `spiny-orb/instrument-1774849971011` from run-11. Always verify target repo is on `main` before running instrument — add this to the run checklist as an explicit step.

## Run-Level Observations

<!-- Populated during and after Evaluation Run-12 -->

## Evaluation Process Observations

<!-- Populated during Per-File Evaluation and Rubric Scoring milestones -->
