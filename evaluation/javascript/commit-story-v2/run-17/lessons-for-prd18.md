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

**Cost ceiling unchanged at $70.20 (same as run-16)**: `ceilingToDollars()` in `cost-formatting.ts` computes: `fileCount × maxTokensPerFile × 1.3 (thinkingHeadroom)`, priced at both input and output rates. The 1.3× `DEFAULT_THINKING_HEADROOM` was explicitly added to account for thinking tokens billed but not visible in summarized responses — so the ceiling was designed with thinking in mind before explicit budget caps existed. The ceiling is unchanged because neither `maxTokensPerFile` (100,000) nor the headroom multiplier changed. Whether 1.3× remains the right headroom now that thinking is capped at `budget_tokens = Math.floor(max_tokens * 0.65)` (up to 65,000/file) vs the old uncapped adaptive model is an open question. Run-17 actual cost data vs the $70.20 ceiling will be informative: if actual cost is well below $70.20 while still succeeding, the 1.3× estimate is conservative; if run-17 costs more than run-16's $12.29, the fix didn't help as much as expected.

## Scoring Observations

<!-- Patterns noticed during per-file evaluation and rubric scoring -->

## IS Scoring Notes

<!-- IS run observations; remember SPA-001 always fails (>10 INTERNAL spans structural mismatch) -->

## Advisory Pass Rollback Verification (spiny-orb team ask)

The validation pipeline diagram shows: if a file passes blocking checks, goes through the advisory improvement pass, and the re-validation introduces NEW blocking failures → "Prior passing file committed" (rollback to the clean version). Whitney flagged this for verification.

**Why it matters**: If the rollback isn't firing correctly, files could silently be committed with the broken advisory-pass version instead of the clean prior version. This wouldn't show up in the FAILED count — it would degrade committed file quality invisibly.

**What we know from run-17**: The four failures (journal-graph.js, context-capture-tool.js, reflection-tool.js, index.js) all failed INITIAL blocking checks — they never reached the advisory pass, so this mechanism isn't the cause of those failures. But the question stands for the 10 committed files: did any of them have an advisory pass that introduced blocking failures? Was the rollback triggered? Was it correct?

**Ask for the spiny-orb team**: Verify the advisory improvement pass rollback path. Specifically: (1) does the rollback correctly restore the prior passing file when the advisory improvement re-run introduces blocking failures? (2) Add or confirm a test covering this path. (3) If there's a logging gap (no observable signal when rollback fires), add one.

## What to Watch in Run-18

<!-- Primary goals and watch items for the next run -->
