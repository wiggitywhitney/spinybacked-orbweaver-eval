# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- ~~JS evaluation run-13: NDS-003 truthy fix verification (PRD #37)~~ ✅ Complete
- JS evaluation run-14: commit-story-v2 baseline with LLM judge + TS provider (PRD #55) — waiting on spiny-orb: LLM judge (PRD #431) + TypeScript provider (#372) merging to main

## Medium-term (in order)
1. ~~Repo generalization (PRD #43)~~ ✅ Complete
2. ~~Source cleanup: remove commit-story source code from eval repo (PRD #47)~~ ✅ Complete
3. ~~IS integration: scoring script, OTel Collector config, Type D template update (PRD #44)~~ ✅ Complete
4. ~~Research spike: eval target criteria — redo scorecard + find 12 candidates (PRD #45)~~ ✅ Complete
5. TypeScript eval setup + Run-1: target selection from 3 candidates (PRD #50) — TS provider landing in spiny-orb (in progress)
6. JavaScript eval setup + Run-1: target selection from 3 candidates (PRD #53) — JS provider already exists; sequenced after TypeScript eval

## Post-run-14 (unblocked, sequenced after run-14)
- Save all eval run artifacts to main with per-target run log (PRD #57) — backfill runs 2–14, wire into Type D template

## Long-term (blocked by language providers)
7. Python eval setup + Run-1: target selection from 3 candidates (PRD #51) — depends on Python provider landing
8. Go eval setup + Run-1: target selection from 3 candidates (PRD #52) — depends on Go provider landing
