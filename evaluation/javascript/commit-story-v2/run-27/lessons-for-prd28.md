// ABOUTME: Process observations from run-27 to inform PRD #28 template and milestone drafting.
# Lessons for PRD #28 — commit-story-v2 Run-27

Process observations captured during run-27. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

## Pre-Run Verification Summary (Step 13)

- **RUN26-1 (SCH-003) not fixed**: tracked in spiny-orb issue #1037 (open, no acceptance criteria checked, no related merged PR since run-26). Related backstop issue #948 (closed 2026-06-19) may cover this pattern in its coverage table but wasn't wired in — #1037 explicitly calls this out as unresolved investigation. Expect the gap to persist in run-27.
- **RUN26-2 (CDQ-007) not fixed**: tracked in spiny-orb issue #1035 (open, no acceptance criteria checked). Issue correctly identifies that the "just apply the fix" recommendation from run-26's handoff conflicts with an existing deliberate no-new-imports constraint in `src/agent/prompt.ts` — the real gap is PR-summary surfacing, not agent behavior. No fix landed yet.
- **Attribute-count undercounting (secondary goal) not fixed**: tracked in issue #1036 (open). Three merged PRs since run-26 (#1046, and its constituent commits `b1573b0`, `f3f52f2`, `e3c44b8`) fixed *dedup* bugs in attribute-extension counting (double-counting, inconsistent Set usage across three code paths) but did not address #1036's actual ask — distinguishing "new schema extensions" from "total setAttribute calls." Expect run-27's run-summary to still undercount for files that only reuse pre-registered attributes.
- **RUN21-6 watch (#927)**: still open, no run-24/25/26/27 update posted yet beyond run-23's "not re-investigated" note. No new instances found in run-27 pre-run checks; nothing to add.
- **spiny-orb version jumped to 2.0.0** since run-26 (was pre-1.0 dev version). No commit-story-v2-relevant behavior changes found in the version-bump or CI-fix commits (#1049, #1051, #1053) — unrelated to eval scope (npm publish workflow, CLI --version flag).
- **File inventory note**: PRD's "expect 31" was already stale before this run — run-26's own run-summary recorded 32 files seen (`failure-placeholder.js` was the file added between run-25 and run-26). Run-27 also sees 32; no new files. Future PRD drafts should pull the expected count from the immediately prior run's `run-summary.md`, not carry forward a hardcoded number across multiple runs.
- Datadog MCP required re-authentication this run (OAuth token had expired/was never completed); health checks passed cleanly afterward (31 spans/1h, 226 spans/7d, all matching main HEAD `8bea3922...`).
- Target repo (commit-story-v2) was left checked out on a stray `spiny-orb/instrument-1784657898322` branch (dated 2026-07-21, a day after run-26) — not run-26's own branch (`...1784302707982`) and not touched by run-27. Switched to `main` cleanly; no uncommitted tracked changes lost. Left the stray branch alone (not in scope to clean up).
- Push auth dry-run to a throwaway branch succeeded.

## Pre-Run Observations
