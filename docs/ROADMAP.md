# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- Content Manager real instrumentation run: spiny-orb on a production project + template recommendation ([PRD #143](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/143)) — first run where instrument branch merges; includes Pino log-trace correlation, span-based metrics exploration, and template recommendation for repeatable real-instrumentation runs
- JS evaluation run-3: release-it — first committed baseline ([PRD #77](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/77))
- JS evaluation run-5: release-it — LINT/NDS-003 indentation conflict resolution ([PRD #100](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/100))
- JS evaluation runs 18–22: commit-story-v2 — queued runs ([PRDs #104](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/104), [#107](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/107), [#113](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/113), [#115](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/115))
- JS evaluation run-26: commit-story-v2 — COV-004 ENOENT fix verification ([PRD #144](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/144))
- TS evaluation run-17: taze — COV-005 packument.ts + SCH-003 + CDQ-006 resolution verification ([PRD #147](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/147)) — primary goal: close COV-005 (packument.ts) and verify SCH-003 String() cast pattern fix

## Medium-term (in order)
1. JavaScript eval setup + Run-1: target selection from 3 candidates ([PRD #53](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/53)) — JS provider already exists; sequenced after TypeScript eval

## Long-term (blocked by language providers)
2. Python eval setup + Run-1: target selection from 3 candidates ([PRD #51](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/51)) — depends on Python provider landing
3. Go eval setup + Run-1: target selection from 3 candidates ([PRD #52](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/52)) — depends on Go provider landing
