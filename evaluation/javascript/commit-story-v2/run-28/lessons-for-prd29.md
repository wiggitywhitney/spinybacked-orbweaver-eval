// ABOUTME: Process observations from run-28 to inform PRD #29 template and milestone drafting.
# Lessons for PRD #29 — commit-story-v2 Run-28

Process observations captured during run-28. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

- **The instrument run happened out of PRD-milestone order.** `spiny-orb instrument` was run before "Collect skeleton documents" and "Pre-run verification" milestones were completed, and before `/prd-start` created the eval execution branch — the run's log and debug-dumps sat as untracked files on `main`'s working tree for hours before being picked up. This meant the PRD's pre-run Datadog health checks, push-auth dry-run, and trace-artifact pre-run capture could not be performed at all (not even retroactively). Recommend the template state explicitly, near the top of the "Evaluation run" milestone, that skeleton + pre-run verification are hard prerequisites the AI should confirm are complete before handing Whitney the instrument command — not just an ordering suggestion.
- **RUN27-2 (SCH-002) is now a case study in "validator fixed, agent behavior didn't."** The fix that shipped for #1055/#1056 clearly changed outcomes (a silent semantic-violation commit became a rejected partial), but the underlying agent mistake (reusing a key across unrelated meanings) still happens. Worth explicitly separating "validator catches the mistake" from "agent stops making the mistake" as two different maturity levels when writing handoff findings — conflating them undersells the real progress made and oversells the remaining gap.
- **RUN27-4 (CDQ-007)'s fix landed exactly the way run-27's handoff asked for** (an inline fallback rather than a per-file import), and it shows up cleanly in this run's log with zero raw-path instances. This is a good example for future handoffs of naming the shape of the fix, not just the bug, in your recommendation.

## Pre-Run Verification Summary (Retroactive, Step 13)

- RUN27-1/RUN27-2 (spiny-orb PR #1058, already noted in PRD #156's D-13) — confirmed still on main pre-run.
- RUN27-3 (#1037): no spiny-orb commit found referencing it since 2026-09-16. Status unchanged/unverified.
- RUN27-4 (#1035): confirmed fixed and closed (`5a0636c`, `0180486`, `dc59703`; issue removed from ROADMAP.md Short-term in `089ba6a`).
- Could not verify: Datadog pre-run health, push-auth dry-run, target-repo readiness checks, file inventory cross-check against run-27's count — all require being done before/during the run, which had already happened by the time this PRD execution branch was created.

## Post-Write-Up Correction

- **Fix-verification-by-log-grep missed a live SCH-003 recurrence.** The first pass of `run-summary.md` checked `spiny-orb-output.log`'s prose for `String(` and found nothing suspicious, and reported RUN27-3 as "no recurrence observed." A CodeRabbit CLI review of the PRD branch caught the actual discrepancy: `summarize.js`'s committed source sets `months_generated_count`/`months_failed_count` (both `type: int`) via `String(result.generated.length)`/`String(result.failed.length)` — present in both the debug dump and the instrument branch's committed file, just never spelled out in the log's narrative sections. **Recommend for PRD #29's template**: fix-verification for SCH-003 (and likely SCH-002) must grep/read the actual committed or debug-dumped source for every file touching a previously-registered numeric key, not just the log's Schema Extensions/Agent Notes sections — those sections describe *new* extensions and reasoning, not necessarily every `setAttribute` call on an *existing* key.
- **A local CodeRabbit review on the eval-artifact branch caught a real evaluation-quality bug, not just a style nit.** Worth normalizing as a standard second pass on any run-summary/findings write-up before reporting to Whitney, not just before opening a PR — this run's write-up was corrected before it caused a wrong recommendation to the spiny-orb team.

## Pre-Run Observations
