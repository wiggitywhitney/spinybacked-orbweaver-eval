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

- **CDQ-005 vs SCH-003 reclassification matters.** Run-7 scored the count type issue under CDQ (finding ID "CDQ-005"). But the rubric rule CDQ-005 is "Async Context Maintained." The count type issue correctly belongs under SCH-003 ("Attribute Values Conform to Registry Types"). This reclassification shifts numbers between dimensions without changing the total. Document this clearly to avoid confusion about apparent regressions.
- **Advisory contradiction rate methodology needs refinement.** Run-8 counted ~91% contradiction rate but the counting methodology differs from run-7's 23%. Need consistent definitions: "contradictions of correct agent decisions" vs "all incorrect advisories" vs "advisories where the recommendation is wrong."
- **per-file-evaluation.json not generated this run.** The PRD specifies JSON output alongside markdown. Consider whether JSON is needed for run-9 or if markdown is sufficient.

## Rubric-Codebase Mapping Corrections

- **MCP tool callback pattern needs classification.** context-capture-tool.js and reflection-tool.js export sync registration functions containing async I/O callback handlers. Current evaluation says "correct skip (debatable)." The rubric-codebase mapping should document this pattern and its expected evaluation outcome.

## Schema Decisions

- **Schema accumulator propagation is the root cause of SCH-003.** The first file's type choice propagates to all subsequent files. A post-generation validator or accumulator seeding would fix this more reliably than prompt guidance.
- **`force` attribute is boolean but declared as string.** This is a separate type mismatch from the count attribute issue. The agent seems to default to `type: string` for all new attributes unless the base registry provides a pattern.

## Carry-Forward Items

- Push auth: 6 consecutive failures. Root cause refined (read vs write validation). fix/260 (upstream tracking) may be a contributing factor.
- API-004: Target project fix needed. Issues filed: commit-story-v2#50, commit-story-v2-eval#23.
- journal-graph.js: Non-deterministic oscillation between committed and partial. Cost concern ($1.45 / 42% of output tokens for zero value).
- Advisory contradiction rate: ~91%. Primary drivers: CDQ-006 trivial exemption not implemented, COV-004 flags sync functions, SCH-004 semantic similarity too aggressive.
- RUN7-7: Span count mechanism unchanged (agent self-report). Issue #253 still open.
