# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- Source cleanup: remove commit-story source code from eval repo (PRD #47) — do now, no dependencies
- IS integration: scoring script, OTel Collector config, Type D template update (PRD #44) — do now, unblocked since PRD #43 complete
- **Once spiny-orb fixes land (#435–#438)**: JS evaluation run-14 commit-story-v2 (PRD #55) — verify smart rollback + type-safety fixes BEFORE moving to TypeScript or any new language

## Medium-term (in order)
1. Repo generalization (PRD #43) ✅
2. Source cleanup: remove commit-story source code from eval repo (PRD #47)
3. IS integration: scoring script, OTel Collector config, Type D template update (PRD #44) — depends on #43
4. Research spike: eval target criteria — redo scorecard + find 12 candidates (PRD #45) ✅
5. JS evaluation run-14: commit-story-v2 smart rollback + type-safety verification (PRD #55) — depends on spiny-orb fixes #435–#438
6. JavaScript eval setup + Run-1: target selection from 3 candidates (PRD #53) — depends on #45; JS provider already exists
7. TypeScript eval setup + Run-1: target selection from 3 candidates (PRD #50) — depends on #45 + TS provider; do AFTER run-14 confirms spiny-orb fixes

## Long-term (blocked by language providers)
7. Python eval setup + Run-1: target selection from 3 candidates (PRD #51) — depends on #45 + Python provider landing
8. Go eval setup + Run-1: target selection from 3 candidates (PRD #52) — depends on #45 + Go provider landing
