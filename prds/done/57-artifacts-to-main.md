# Eval Artifacts to Main — PRD

**Issue**: [#57](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/57)
**Status**: Complete
**Owner**: Whitney Lee
**Created**: 2026-04-13
**Last Updated**: 2026-04-13

## Overview

All evaluation artifacts currently live on eval branches that never merge to main. Cross-run analysis — for example, tracing how a specific file performed across runs 9–13 — requires branch-hopping through closed PRs. There is no persistent record of run history on main.

This PRD adds a repeatable end-of-run step: copy all generated artifacts to main at `evaluation/<target>/run-N/` (no curation — everything), update a per-target run log, and wire this into the Type D template so it happens automatically after every future run.

## User Impact

- **Who benefits**: Every agent or human doing cross-run analysis on any target language/repo
- **What changes**: All artifacts from every run are accessible on main without branch-hopping. A compact run log on main gives at-a-glance history per target.
- **Why now**: After run-14, we have enough history on commit-story-v2 to make the backfill worthwhile. Wiring this in now means every future run — JS, TypeScript, Python, Go — lands on main automatically.

## Success Metrics

- **Primary**: `evaluation/commit-story-v2/run-14/per-file-evaluation.md` exists on main
- **Secondary**: `evaluation/commit-story-v2/run-log.md` exists on main with one row per run (2 through 14)
- **Validation**: A `git log --oneline main -- evaluation/commit-story-v2/` shows one commit per run

## Requirements

### Functional Requirements

- **Must Have**: All artifacts from every eval run copied to `evaluation/<target>/run-N/` on main (no curation — per-file-evaluation.md, failure-deep-dives.md, rubric-scores.md, baseline-comparison.md, pr-evaluation.md, actionable-fix-output.md, run-summary.md, spiny-orb-output.log, lessons-for-prdN.md, is-score.md when present)
- **Must Have**: `evaluation/<target>/run-log.md` on main — a compact Markdown table updated each run: run number, date, score, committed file count, Q×F, push/PR status, top 1–2 findings
- **Must Have**: The artifact copy happens before the eval branch is closed by `/prd-done`, using `git checkout <eval-branch> -- evaluation/<target>/run-N/` from main
- **Must Have**: Type D milestone template updated to include artifact copy + run-log update as the final step before "Draft next PRD"
- **Must Have**: All existing commit-story-v2 run artifacts backfilled to main (runs 2–14, using their existing eval branches)

### Non-Functional Requirements

- Artifact copy is a direct commit to main (no PR, no branch — same as PRD-only commits)
- Commit message format: `eval: save run-N artifacts to main [skip ci]`
- The run log is human-readable and machine-greppable — one row per run, no narrative prose

## Implementation Milestones

- [x] **Define the artifact copy convention and create the run-log format**

  Establish the exact convention before any code changes. Write the following to `docs/eval-artifacts-convention.md`:
  1. Which files get copied: all files in `evaluation/<target>/run-N/` on the eval branch (the glob is `evaluation/<target>/run-N/**`). No exclusions — copy everything including logs.
  2. How to copy: from main, run `git checkout <eval-branch> -- evaluation/<target>/run-N/` then commit to main. This cherry-picks the directory without merging the branch.
  3. Commit message: `eval: save run-N artifacts to main [skip ci]`
  4. Run log location: `evaluation/<target>/run-log.md` on main (one file per target, not per run)
  5. Run log row format: `| N | YYYY-MM-DD | score/total | files_committed | Q×F | push_status | Top finding 1; Top finding 2 |`

  Also create `evaluation/commit-story-v2/run-log.md` on main with the correct header row and column descriptions, but no data rows yet (those come in the backfill milestone).

  Success criteria: `docs/eval-artifacts-convention.md` exists and documents the five items above; `evaluation/commit-story-v2/run-log.md` exists with the header row.

- [x] **Backfill commit-story-v2 runs 2–14**

  For each run from 2 through 14, in order:
  1. On main: `git checkout <eval-branch> -- evaluation/commit-story-v2/run-N/`
  2. Verify only files under `evaluation/commit-story-v2/run-N/` are staged — do NOT stage anything else
  3. `git commit -m "eval: save run-N artifacts to main [skip ci]"`
  4. Add one row to `evaluation/commit-story-v2/run-log.md` and commit immediately: `git commit -m "eval: update run-log for run-N [skip ci]"`

  To find eval branches: `git branch -r | grep 'prd.*evaluation-run'`; also check `git branch -a` for local-only branches. Run-1 had a flat structure before generalization (pre-PRD #43) — skip run-1 if `evaluation/commit-story-v2/run-1/` does not exist on the branch.

  If a branch was deleted or unavailable, add the row with available data from PROGRESS.md and PRD files, mark the artifact path as unavailable: `| N | YYYY-MM-DD | score/total | files | Q×F | push | Top findings | — (branch unavailable) |`

  Success criteria: `evaluation/commit-story-v2/run-log.md` has one row per available run (runs where a branch existed); `evaluation/commit-story-v2/run-N/` directories exist on main for all those runs.

- [x] **Add artifact copy as the final step in the Type D milestone template**

  Open `docs/language-extension-plan.md` and find the Type D section. After "Draft next PRD" (step 12), add a new final step:

  > 13. **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/<target>/run-N/` to copy all artifacts. Commit to main with message `eval: save run-N artifacts to main [skip ci]`. Update `evaluation/<target>/run-log.md` with a new row for this run. Push. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

  Also update the Eval Branch Convention note in that same section to say: "Before closing with `/prd-done`, run step 13 to copy artifacts to main."

  Cascade this step to any open eval run PRDs that come **after run-14** and do not yet have this step. **Do NOT add this step to PRD #55** — run-14 intentionally uses the old workflow; its artifacts land on main via the backfill in Milestone 2 of this PRD (Decision 2026-04-13). Commit with `[skip ci]`.

  Success criteria: `docs/language-extension-plan.md` Type D section has 13 steps; all open eval run PRDs include the artifact copy step; the Eval Branch Convention note references step 13.

## Dependencies and Constraints

- **Depends on**: PRD #37 (run-13) and PRD #55 (run-14) being complete — backfill includes through run-14
- **Depends on**: Eval branches existing for runs 2–14 (some may have been deleted)
- **Blocks**: Clean cross-run analysis for all future languages

## Risks and Mitigations

- **Risk**: Some eval branches were deleted after PR close, making backfill impossible for those runs
  - **Mitigation**: Note missing runs in the run log as "branch unavailable" with metadata from PROGRESS.md and PRD files; partial backfill is better than none
- **Risk**: `spiny-orb-output.log` is large (200–500KB per run), making the main branch history heavier
  - **Mitigation**: Still copy it — the audit value outweighs the size cost. Git handles text files of this size well. Revisit if repo size becomes a concern.
- **Risk**: Forgetting to run the artifact copy step before `/prd-done` closes the branch
  - **Mitigation**: Step 13 in the Type D template is explicitly ordered before `/prd-done`; if a branch is closed before copying, files can still be recovered via `git checkout <branch-sha> -- path`

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-13 | Copy all artifacts, no curation | Per-file analysis across runs requires full artifacts; markdown files are tiny (<500KB/run); no decision overhead per run | Everything lands on main; ~7MB total for 14 runs |
| 2026-04-13 | After run-14, not before | Backfilling all 14 runs at once gives complete history from day one; run-14 is time-sensitive for spiny-orb fix verification | Run-14 uses old workflow; PRD #57 cleans up after |
| 2026-04-13 | Separate commit per run, not one big commit | Per-run traceability: `git log -- evaluation/commit-story-v2/run-9/` returns exactly one commit | Slightly more backfill work; much cleaner history |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-13 | PRD created | Draft | Start after run-14 completes |
| 2026-04-18 | Milestones 2 and 3 complete — all runs 2–14 backfilled to main, run-log populated, Type D template updated | Complete | Run /prd-done |
