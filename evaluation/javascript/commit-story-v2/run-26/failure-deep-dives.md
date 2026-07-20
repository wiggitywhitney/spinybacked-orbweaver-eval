// ABOUTME: Failure deep-dives for run-26 — run-level observations, since no generation/commit failures or partials occurred.
# Failure Deep-Dives — Run-26

**Run-26 result**: 14 committed, 0 failed, 0 partial, 18 correct skips.

No generation/commit failures and no partial commits. `debug-dumps/` is empty, confirming no failed, partial, or zero-span-but-committed files this run. Two evaluation-rule failures remained within otherwise-committed files (RUN26-1 SCH-003 on journal-manager.js and RUN26-2 CDQ-007 on journal-paths.js — see actionable-fix-output.md for detail); those are rubric-scoring failures within successfully committed spans, not generation/commit failures. All observations below are run-level.

---

## Run-Level Observations

### RUN25-1 Confirmed Fixed — summary-manager.js COV-004

Run-25's `isExpectedConditionCatch` false positive (negated ENOENT rethrow flagged as a non-graceful-degradation catch) is confirmed fixed. summary-manager.js committed all 9 exported async functions cleanly with 0 partial, versus run-25's 7 spans committed + 2 functions blocked as partial. This was the primary fix-verification target for run-26 (see run-summary.md Fix Verification table).

### PR Created Manually — Approval Pause, Not a spiny-orb Defect

The automated run paused at a live `Proceed? [y/N]` prompt for approximately 27.5 hours awaiting confirmation. Premature manual recovery during that pause — pushing the branch and creating PR #91 via `gh pr create --body-file spiny-orb-pr-summary.md`, per the PR Auto-Creation Failure Recovery convention (CLAUDE.md) — produced the apparent duplicate-PR failure. When the run was later resumed, it correctly detected the duplicate PR already on the remote.

This is not a spiny-orb push/PR sequencing bug; it's an eval-side timing issue from acting during an in-progress pause. It ends a streak of 6 consecutive AUTO push/PR runs (19–21, 23–25; run-22 never executed). No spiny-orb-side investigation is needed for this finding — see run-summary.md Key Findings and actionable-fix-output.md (RUN26-3) for the corrected narrative.

### ×3-Attempt Files — Root Cause Not Recoverable From Log

Three files required 3 attempts each: `git-collector.js`, `journal-graph.js`, `summary-detector.js`. All three ultimately committed successfully with no partial or failed spans. Per `--thinking` output, only Attempt 1's full reasoning is printed in the log for each file — retry attempts 2 and 3 are silent except for the final attempt-count in the success summary line. This matches the precedent noted in the run-12 style reference (journal-graph.js's 3-attempt regression): "Without deeper analysis of the agent reasoning reports, the exact cause is unknown."

`journal-graph.js` at 3 attempts continues a run-over-run pattern (2 attempts in some prior runs, 3 in others) and is separately tracked as "ninth consecutive success" in the Fix Verification table — the attempt count does not indicate a quality regression for this file, only cost.

No quality failures were found on any of these three files during per-file evaluation (see `per-file-evaluation.md`) that would meet the "committed files with ≥3 attempts AND quality failures" threshold for a dedicated deep-dive entry — attempt count alone, without an accompanying quality failure, does not warrant one per this milestone's scope.

### Cost and Token Usage Up vs Run-25

$11.15 vs run-25's $7.38 (+51%). Token usage: 340.3K/411.1K input/output vs 213.5K/286.7K. Exact per-file cost attribution isn't available in this run's PR summary output. The three ×3-attempt files (git-collector, journal-graph, summary-detector) are a supported partial explanation — extra attempts mean extra model calls. `failure-placeholder.js` newly appearing in the file inventory (32 files seen vs 31 in run-25) is an unverified hypothesis by contrast — it's a correct-skip file-count change, not confirmed to carry any cost weight — and should not be read as an established driver.
