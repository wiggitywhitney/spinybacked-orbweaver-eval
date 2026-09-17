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

## Pre-Run Observations
