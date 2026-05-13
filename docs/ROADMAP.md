# Evaluation Framework Roadmap

Execution order within each tier matters. Items are listed in dependency order — complete earlier items before starting later ones. See `docs/language-extension-plan.md` for the full dependency chain (Steps 1-7).

## Short-term
- ~~JS evaluation run-13: NDS-003 truthy fix verification (PRD #37)~~ ✅ Complete
- ~~JS evaluation run-14: commit-story-v2 — smart rollback + type-safety verification (PRD #55)~~ ✅ Complete — 22/25, 12 files, IS 80/100, PR #65
- ~~JS evaluation run-15: commit-story-v2 — catch-block consistency + COV-004 audit (PRD #61)~~ ✅ Complete — 24/25, 14 files, IS 70/100, Q×F 13.4 (new record), PR #66
- ~~JS evaluation run-16: commit-story-v2 — summary-detector.js outer catch fix (PRD #86)~~ ✅ Complete — 22/25, 10 files, IS 80/100, Q×F 8.8, PR #68
- ~~JS evaluation run-17: commit-story-v2 — adaptive thinking budget fix verification (PRD #102)~~ ✅ Complete — 22/25, 10 files, IS 90/100, Q×F 8.8, PR #69; NDS-003 reconciler gap revealed; per-agent evaluation approach validated
- JS evaluation run-3: release-it — first committed baseline (PRD #77)
- TS evaluation run-14: taze — CDQ-006 isRecording guard verification (PRD #82)

## Medium-term (in order)
1. ~~Repo generalization (PRD #43)~~ ✅ Complete
2. ~~Source cleanup: remove commit-story source code from eval repo (PRD #47)~~ ✅ Complete
3. ~~IS integration: scoring script, OTel Collector config, Type D template update (PRD #44)~~ ✅ Complete
4. ~~Research spike: eval target criteria — redo scorecard + find 12 candidates (PRD #45)~~ ✅ Complete
5. ~~TypeScript eval setup + Run-1: taze — first TypeScript baseline (PRD #50)~~ ✅ Complete — 27/29 (93%), 14 files, Q×F 13.0, IS 60/100; run-14 PRD #82 queued
6. JavaScript eval setup + Run-1: target selection from 3 candidates (PRD #53) — JS provider already exists; sequenced after TypeScript eval

## Long-term (blocked by language providers)
7. Python eval setup + Run-1: target selection from 3 candidates (PRD #51) — depends on Python provider landing
8. Go eval setup + Run-1: target selection from 3 candidates (PRD #52) — depends on Go provider landing
