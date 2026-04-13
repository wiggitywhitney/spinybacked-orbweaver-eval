# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- JS evaluation run-13: NDS-003 truthy fix verification (PRD #37)

## Medium-term (in order)
1. Repo generalization (PRD #43)
2. Source cleanup: remove commit-story source code from eval repo (PRD #47)
3. ~~IS integration: scoring script, OTel Collector config, Type D template update (PRD #44)~~ ✅ Complete
4. Research spike: eval target criteria — redo scorecard + find 12 candidates (PRD #45) — no dependency on #43/#44
5. JavaScript eval setup + Run-1: target selection from 3 candidates (PRD #53) — depends on #45; JS provider already exists
6. TypeScript eval setup + Run-1: target selection from 3 candidates (PRD #50) — depends on #45 + TS provider landing

## Post-run-14 (unblocked, sequenced after run-14)
- Save all eval run artifacts to main with per-target run log (PRD #57) — backfill runs 2–14, wire into Type D template

## Long-term (blocked by language providers)
7. Python eval setup + Run-1: target selection from 3 candidates (PRD #51) — depends on #45 + Python provider landing
8. Go eval setup + Run-1: target selection from 3 candidates (PRD #52) — depends on #45 + Go provider landing
