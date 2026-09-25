# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- Content Manager real instrumentation run: spiny-orb on a production project + template recommendation ([PRD #143](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/143)) — first run where instrument branch merges; includes Pino log-trace correlation, span-based metrics exploration, and template recommendation for repeatable real-instrumentation runs
- JS evaluation run-5: release-it — LINT/NDS-003 indentation conflict resolution ([PRD #100](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/100))
- JS evaluation run-29: commit-story-v2 — SCH-003 bidirectional check + CDQ-006/CDQ-007 consistency + PII severity investigation ([PRD #161](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/161)) — verifies run-28's RUN28-1 through RUN28-4 findings; none confirmed scheduled to land before this run per spiny-orb's own roadmap tiers
- TS evaluation run-18: taze — SCH-003 generalization + CDQ-007 path sanitization ([PRD #168](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/168)) — primary goal: resolve SCH-003's count-cast pattern across the 5 files it broadened into and CDQ-007's unsanitized filesystem paths across 6 files; also verify IS SPA-002 orphan-span fix

## Long-term (blocked by language providers)
1. Python eval setup + Run-1: target selection from 3 candidates ([PRD #51](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/51)) — depends on Python provider landing
2. Go eval setup + Run-1: target selection from 3 candidates ([PRD #52](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/52)) — depends on Go provider landing
