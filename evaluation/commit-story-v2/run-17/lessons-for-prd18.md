# Lessons for PRD #18

Run-17 observations to carry forward into the next evaluation run PRD.

## Process Observations

<!-- Add process-level notes as the run unfolds -->

## Pre-run Verification Findings

**spiny-orb version**: 1.0.0 (SHA c60f79d, main branch)

**Commits since run-16 (dc5a2aa)**:
- PR #852 (feature/848): RUN16-1 fix — adaptive thinking → enabled with budget cap; raised MIN_OUTPUT_BUDGET
  - File-level: `Math.floor(max_tokens * 0.65)` thinking budget (35% output reserved)
  - Per-function: `max_tokens - 4096` thinking budget (4096 output reserved)
  - Additional fixes: sanitize maxTokens, clamp thinkingBudget ≥ 1, propagate isPerFunctionCall to advisory call
- PR #851 (feature/849): RUN16-2 + RUN16-3 fix — live-check JSON suppressed from stdout; 0-span passthrough
  - 0-span short-circuit in instrument-with-retry.ts line 1144-1160: writes original file unchanged
  - Compliance report removed from terminal output (instrument-handler.ts)
- PR #850: Documentation only (run-16 findings in PRD #845 and ROADMAP)

**PRD #845 status** (technicalNode NDS-003 oscillation): NOT STARTED. The targeted content-aware diff fix has not landed. PRs #840 and #842 (NDS-003 reconcilers) were already in main at run-16 time and did not resolve technicalNode oscillation. Conservative scenario (24/25) expected.

**Push auth**: Verified ✅ (dry-run to non-existent branch succeeded)

**Target repo**: commit-story-v2 on main, clean working tree, spiny-orb.yaml + semconv/ present, 30 JS files in src/

## Evaluation Run Observations

<!-- Notes from the instrument run itself -->

## Scoring Observations

<!-- Patterns noticed during per-file evaluation and rubric scoring -->

## IS Scoring Notes

<!-- IS run observations; remember SPA-001 always fails (>10 INTERNAL spans structural mismatch) -->

## What to Watch in Run-18

<!-- Primary goals and watch items for the next run -->
