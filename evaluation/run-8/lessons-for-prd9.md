# Lessons for PRD #9 — Run-8

Forward-looking improvements identified during evaluation run-8. These feed directly into PRD #9 (run-9 evaluation).

---

## Rubric Gaps

*(Gaps in the 32-rule rubric discovered during run-8 evaluation)*

## Process Improvements

- **Spiny-orb branch hygiene matters for eval builds.** Found spiny-orb on `fix/260-pushbranch-upstream-tracking` instead of main. WIP changes on main could contaminate evaluation results. Pre-run verification should explicitly check and enforce building from main.
- **RUN7-7 span count accuracy is still based on agent self-report.** The fix (PR #257) truncated notes and grouped advisories, but `spansAdded` still comes from the LLM's `spanCategories` sum, not post-hoc `startActiveSpan` counting. Issue #253 remains open. Watch for inaccurate span counts in run-8.
- **CDQ-005 fix is prompt-only (no runtime validator).** If the LLM ignores the SCH-003 guidance for count types, the issue will recur. Consider whether a post-generation check is worth adding.
- **fix/260 upstream tracking not merged.** The `pushBranch()` upstream tracking fix is WIP. If `gh pr create` fails because it can't detect the pushed branch, this will be the cause.

## Evaluation Methodology

*(Changes to the evaluation approach itself)*

## Rubric-Codebase Mapping Corrections

*(Updates needed to rubric-codebase-mapping.md)*

## Schema Decisions

## Carry-Forward Items
