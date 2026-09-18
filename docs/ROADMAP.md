# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- Content Manager real instrumentation run: spiny-orb on a production project + template recommendation ([PRD #143](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/143)) — first run where instrument branch merges; includes Pino log-trace correlation, span-based metrics exploration, and template recommendation for repeatable real-instrumentation runs
- JS evaluation run-5: release-it — LINT/NDS-003 indentation conflict resolution ([PRD #100](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/100))
- JS evaluation run-28: commit-story-v2 — COV-003 recurrence + SCH-002/SCH-003 AST checks + CDQ-007 shared-helper verification ([PRD #156](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/156)) — COV-003 and SCH-002 already fixed (spiny-orb PR #1058) as of PRD creation; SCH-003 and CDQ-007 remain open verification targets
- JS evaluation run-29: commit-story-v2 — SCH-003 bidirectional check + CDQ-006/CDQ-007 consistency + PII severity investigation ([PRD #161](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/161)) — verifies run-28's RUN28-1 through RUN28-4 findings; none confirmed scheduled to land before this run per spiny-orb's own roadmap tiers
- TS evaluation run-17: taze — COV-005 packument.ts + SCH-003 + CDQ-006 resolution verification ([PRD #147](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/147)) — primary goal: close COV-005 (packument.ts) and verify SCH-003 String() cast pattern fix

## Long-term (blocked by language providers)
1. Python eval setup + Run-1: target selection from 3 candidates ([PRD #51](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/51)) — depends on Python provider landing
2. Go eval setup + Run-1: target selection from 3 candidates ([PRD #52](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/52)) — depends on Go provider landing
