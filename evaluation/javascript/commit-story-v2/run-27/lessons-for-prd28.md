// ABOUTME: Process observations from run-27 to inform PRD #28 template and milestone drafting.
# Lessons for PRD #28 — commit-story-v2 Run-27

Process observations captured during run-27. Populated incrementally as the run progresses.

## Target-Specific Findings

*(Findings specific to commit-story-v2 that do not belong in the template)*

## Stranded Template Edit — "step 3b" Reference is Broken

Both run-26's (PRD #144) and run-27's (PRD #153) "Post-run Datadog verification" milestones **originally** said "Follow `docs/language-extension-plan.md` step 3b" — but no "step 3b" exists in the current mainline template (confirmed 2026-09-03 via `grep` and `git log`). **PRD #153's copy has since been corrected** (during this run) to read "*(steps below are self-contained — do not go looking for a "step 3b"...)*" — the wording below describes the discovery, not PRD #153's current state; PRD #144 (run-26, already merged/archived) still carries the original broken pointer as historical record. Root cause: the step-3b addition (`git log --all --oneline --grep="step 3b"` → commit `31f9dc4`) was committed on PRD #140's (run-25) **eval execution branch**, which by this project's own convention (`docs/language-extension-plan.md` Eval Branch Convention) never merges to main. The edit updated that branch's local copy of the template and was never carried to main. A separate, unrelated mainline commit (`f00f8c5`) added step 9.6 ("Correlated signals check") the same day — a different check, at a different point in the process (after IS scoring, not right after Findings Discussion) — which is not a substitute.

This went undetected for two runs because the milestone's own inline steps (1-4) are fully self-contained, so the broken pointer never blocked execution — it just silently pointed nowhere.

**Recommend at the template-update checkpoint**: either (a) re-add the step-3b content to `docs/language-extension-plan.md` proper (on a branch that actually merges to main — the PRD-drafting branch, not an eval execution branch), with correct sequential numbering, or (b) stop citing "step 3b" in future run PRDs and treat the milestone's own inline steps as the sole source of truth for this check.

**Broader risk worth flagging generally**: any `docs/language-extension-plan.md` edit made on an eval execution branch will silently never reach main. Worth a one-line caution in the template's own "Eval Branch Convention" section: template changes belong on the PRD-drafting branch or a dedicated docs branch, never on an eval execution branch.

## Generalizable Process Improvements

*(Observations about the eval process itself that may warrant template updates)*

- **D-6 had the instrument-branch-identification attribute backwards, and D-9 inherited the same mistake.** Post-run Datadog verification in run-27 initially followed D-6's instruction to check `git.commit.sha` and reported "instrument branch not observed" — a false negative. `git.commit.sha` on commit-story-v2 spans is the *journaled* commit (domain data: which commit's diff commit-story summarized), not the running code's own branch identity. Re-checking against `vcs.ref.head.revision` found direct, exhaustive instrument-branch evidence (every incremental instrument commit from the run had matching spans). This is the same attribute run-26's own post-run verification note already used successfully — D-6 (written in run-25) and run-26's actual practice were quietly contradicting each other for two runs, and nobody caught it because run-26's post-run check happened to use the right attribute anyway, just without updating D-6 to match. Corrected as PRD #153's D-10. **Recommend**: update `docs/language-extension-plan.md` step 6's guidance (and anywhere else it names `git.commit.sha` for branch-identification purposes) to `vcs.ref.head.revision`, and cascade the correction to content-manager (#143), the only other organic/dogfooded target that inherited D-9's original (wrong) attribute.

- **A new unattended-prompt pause pattern, distinct from D-7's `Proceed? [y/N]`**: run-27's actual instrumentation work finished in well under an hour, but the process then sat overnight (21h 21m total duration) at an interactive `PROGRESS.md` update confirmation (`[a]ccept/[e]dit/[s]kip`) waiting for terminal input. Same failure *shape* as D-7 (unattended run looks stalled at a live prompt), but a different prompt than the push `Proceed?` confirmation D-7 documents.
- **This prompt's text is invisible in the piped log.** `spiny-orb-output.log` (captured via `tee`) jumps directly from `pushBranch: urlChanged=true...` to `Completed in 21h 21m 7.7s` — the interactive block itself never appears in the log, only the raw terminal saw it. Checking `spiny-orb-output.log` alone during a live run gives no signal that this kind of prompt is blocking; only `ps` showing a low-but-nonzero CPU process hints at "alive but blocked" rather than crashed or hung. Recommend adding this as an explicit case to `docs/language-extension-plan.md` step 3 alongside D-7 — before declaring a run stalled, check for *any* live interactive prompt (not just push confirmation), and note that piped-log inspection cannot rule this out.

## Pre-Run Verification Summary (Step 13)

- **RUN26-1 (SCH-003) not fixed**: tracked in spiny-orb issue #1037 (open, no acceptance criteria checked, no related merged PR since run-26). Related backstop issue #948 (closed 2026-06-19) may cover this pattern in its coverage table but wasn't wired in — #1037 explicitly calls this out as unresolved investigation. Expect the gap to persist in run-27.
- **RUN26-2 (CDQ-007) not fixed**: tracked in spiny-orb issue #1035 (open, no acceptance criteria checked). Issue correctly identifies that the "just apply the fix" recommendation from run-26's handoff conflicts with an existing deliberate no-new-imports constraint in `src/agent/prompt.ts` — the real gap is PR-summary surfacing, not agent behavior. No fix landed yet.
- **Attribute-count undercounting (secondary goal) not fixed**: tracked in issue #1036 (open). One merged PR since run-26 (#1046, comprising commits `b1573b0`, `f3f52f2`, `e3c44b8`) fixed *dedup* bugs in attribute-extension counting (double-counting, inconsistent Set usage across three code paths) but did not address #1036's actual ask — distinguishing "new schema extensions" from "total setAttribute calls." Expect run-27's run-summary to still undercount for files that only reuse pre-registered attributes.
- **RUN21-6 watch (#927)**: still open, no run-24/25/26/27 update posted yet beyond run-23's "not re-investigated" note. No new instances found in run-27 pre-run checks; nothing to add.
- **spiny-orb version jumped to 2.0.0** since run-26 (was pre-1.0 dev version). No commit-story-v2-relevant behavior changes found in the version-bump or CI-fix commits (#1049, #1051, #1053) — unrelated to eval scope (npm publish workflow, CLI --version flag).
- **File inventory note**: PRD's "expect 31" was already stale before this run — run-26's own run-summary recorded 32 files seen (`failure-placeholder.js` was the file added between run-25 and run-26). Run-27 also sees 32; no new files. Future PRD drafts should pull the expected count from the immediately prior run's `run-summary.md`, not carry forward a hardcoded number across multiple runs.
- Datadog MCP required re-authentication this run (OAuth token had expired/was never completed); health checks passed cleanly afterward (31 spans/1h, 226 spans/7d, all matching main HEAD `8bea3922...`).
- Target repo (commit-story-v2) was left checked out on a stray `spiny-orb/instrument-1784657898322` branch (dated 2026-07-21, a day after run-26) — not run-26's own branch (`...1784302707982`) and not touched by run-27. Switched to `main` cleanly; no uncommitted tracked changes lost. Left the stray branch alone (not in scope to clean up).
- Push auth dry-run to a throwaway branch succeeded.

## Pre-Run Observations
