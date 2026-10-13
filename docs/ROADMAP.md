# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- JS evaluation run-29: commit-story-v2, the first run on spiny-orb's new default agent model ([PRD #161](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/161)) — runs next; its 28 earlier runs give the best-known run-to-run variance reference, though any model effect it shows stays an observation to confirm rather than a conclusion. It also verifies run-28's RUN28-1 through RUN28-4 findings, none confirmed scheduled to land before it
- JS evaluation run-6: release-it — schema fidelity, span timing, and the LINT/NDS-003 remainder ([PRD #177](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/177)) — optional second model-change run, since run-5 ran on the last spiny-orb commit before the model change; all fifteen run-5 spiny-orb issues are sequenced after the Go provider, so the Conservative projection is the default
- Content Manager real instrumentation run: spiny-orb on a production project + template recommendation ([PRD #143](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/143)) — first run where instrument branch merges; includes Pino log-trace correlation, span-based metrics exploration, and template recommendation for repeatable real-instrumentation runs
- TS evaluation run-18: taze — SCH-003 generalization + CDQ-007 path sanitization ([PRD #168](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/168)) — primary goal: resolve SCH-003's count-cast pattern across the 5 files it broadened into and CDQ-007's unsanitized filesystem paths across 6 files; also verify IS SPA-002 orphan-span fix

## Long-term (blocked by language providers)
1. Move the Python and Go setup PRDs' run artifacts to the per-language path layout ([issue #179](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/179)) — must land before either PRD's run-1 starts; blocked by the same language providers
2. Python eval setup + Run-1: target selection from 3 candidates ([PRD #51](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/51)) — depends on Python provider landing
3. Go eval setup + Run-1: target selection from 3 candidates ([PRD #52](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/52)) — depends on Go provider landing
