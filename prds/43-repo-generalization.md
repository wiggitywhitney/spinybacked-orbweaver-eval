# Repo Generalization — PRD

**Issue**: [#43](https://github.com/wiggitywhitney/commit-story-v2-eval/issues/43)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11

## Overview

The current repo (`commit-story-v2-eval`) is structured around a single JavaScript target. This PRD generalizes it into a multi-language, multi-target evaluation framework by restructuring the `evaluation/` directory, updating path references, and documenting the process for adding new language evaluation chains.

Full context for this work lives in `docs/language-extension-plan.md`. Read the "Repo Generalization" section before starting any milestone.

## User Impact

- **Who benefits**: Any agent or human setting up a new language/target evaluation chain (TypeScript, Python, Go)
- **What changes**: `evaluation/commit-story-v2/run-*/` directories move under a target-scoped path; PRD titles gain target names; `.claude/CLAUDE.md` gains a section that ensures future agents know to read `docs/language-extension-plan.md` before starting any new language eval chain
- **Why now**: Steps 2 and 3 of the plan land infrastructure in this repo — those PRDs need the correct structure to be in place first

## Success Metrics

- **Primary**: All existing evaluation runs are accessible at `evaluation/commit-story-v2/run-*/`; no broken path references remain
- **Secondary**: `.claude/CLAUDE.md` has an "Adding a New Language Evaluation Chain" section that references `docs/language-extension-plan.md` as the canonical source and instructs future agents to include it as the first milestone of any new Type C or Type D PRD
- **Validation**: A grep for old paths (`evaluation/commit-story-v2/run-`) returns no hits in any PRD file, CLAUDE.md, or script

## Requirements

### Functional Requirements

- **Must Have**: Move all `evaluation/commit-story-v2/run-*/` directories to `evaluation/commit-story-v2/run-*/`
- **Must Have**: Update all internal references to old evaluation paths in PRD files, CLAUDE.md, scripts, and docs
- **Must Have**: Update PRD titles and prior art references to include target name (`commit-story-v2`)
- **Must Have**: Document "how to add a new language eval" in `.claude/CLAUDE.md`, pointing to `docs/language-extension-plan.md` as the canonical reference and instructing that each new Type C/D PRD must include an explicit "read the plan doc" first milestone
- **Should Have**: Rename GitHub repo to `spinybacked-orbweaver-eval` (do last — changes remote URL)

### Non-Functional Requirements

- `docs/ROADMAP.md` already exists (created in PRD #41) — do not recreate it
- Each milestone committed separately; use `[skip ci]` for documentation-only commits
- The repo must remain functional (tests pass, git history intact) after each commit

## Implementation Milestones

- [x] **Move evaluation run directories to target-scoped path**

  Move all directories matching `evaluation/run-*/` into `evaluation/commit-story-v2/`. Use `git mv` (not `mv`) so git history is preserved. After moving, verify: (1) `ls evaluation/commit-story-v2/` shows all run directories, (2) `ls evaluation/` shows only `commit-story-v2/` and any non-run directories (e.g., `is/`), (3) `git status` shows the moves as renames not deletes+adds. Commit with `[skip ci]`.

  Success criteria: `evaluation/commit-story-v2/run-N/` exists for every run that previously existed at `evaluation/run-N/`. No run directories remain directly under `evaluation/`.

- [x] **Update all internal path references to use the new evaluation directory structure**

  Scan every PRD file in `prds/`, `.claude/CLAUDE.md`, any `.sh` scripts, and `docs/` for references to `evaluation/run-` and update them to `evaluation/commit-story-v2/run-`. Also check `docs/language-extension-plan.md` — it contains an example instrument command with the path `commit-story-v2-eval/evaluation/run-N/`. Update that example. After updating, run: `grep -r "evaluation/run-" prds/ .claude/ docs/ scripts/ 2>/dev/null` and confirm zero hits. Commit with `[skip ci]`.

  Success criteria: Zero grep hits for `evaluation/run-[0-9]` in any file outside of `evaluation/commit-story-v2/`.

- [x] **Update PRD titles to include target name**

  For each PRD file in `prds/` that describes a JavaScript evaluation run, update its title (the `# ...` heading) to include the target name: e.g., "Evaluation Run 13" → "JS Evaluation Run 13: commit-story-v2". Commit with `[skip ci]`.

  Note: File-path references (e.g., `evaluation/run-12/`) were already updated to `evaluation/commit-story-v2/run-12/` in the previous milestone. This milestone covers only the PRD title headings.

  Scope: Evaluation-run PRDs only — filenames matching `prds/*evaluation-run-*.md`. Infrastructure and research PRDs (like this one) do not get target names added. Do NOT update narrative prose references (e.g., "compared to run-12 results") — these remain as-is.

  Success criteria: Every evaluation-run PRD title includes `commit-story-v2`. Verify with: `grep -n "^# " prds/*evaluation-run-*.md`

- [x] **Document "how to add a new language eval" in .claude/CLAUDE.md**

  Add a new section to `.claude/CLAUDE.md` titled "Adding a New Language Evaluation Chain". Add it at the end of `.claude/CLAUDE.md`, after all existing sections. The section must cover:

  (1) Read `docs/language-extension-plan.md` completely before starting any work — it is the canonical reference for PRD types, milestone structure, user-facing checkpoints, prerequisites, and the exact instrument command. (This reference must appear explicitly in the CLAUDE.md section, not just as context here.)

  (2) Two prerequisites before starting: (a) the language provider must be merged to spiny-orb main; (b) `docs/research/eval-target-criteria.md` must exist with a verdict for the target language.

  (3) When creating a Type C PRD: use the "Type C: Setup + Run-1 PRD" section of `docs/language-extension-plan.md` as the structure reference, and the most recent JS eval run PRD as the milestone style reference. The **first milestone** of the new PRD must be: "Read `docs/language-extension-plan.md` completely before proceeding with any other milestone."

  (4) When creating a Type D PRD: use the immediately preceding eval run PRD as the structural model. The **first milestone** of the new PRD must be: "Read `docs/language-extension-plan.md` completely before proceeding." Include both user-facing checkpoints (Findings Discussion and Handoff pause) — exact wording is in the plan document.

  (5) Reference `docs/language-extension-plan.md` for full context, PRD taxonomy, and language candidate table.

  Keep the section concise — it should orient a new agent, not duplicate the full plan. Commit with `[skip ci]`.

  Success criteria: Section exists in `.claude/CLAUDE.md`; it references `docs/language-extension-plan.md` as the canonical source; it states both prerequisites; it explicitly instructs that the first milestone of any new Type C or Type D PRD must be "Read `docs/language-extension-plan.md` completely before proceeding."

- [ ] **Rename GitHub repo to spinybacked-orbweaver-eval**

  Do this milestone last — it changes the remote URL and requires updating git config. Steps: (1) run `gh repo rename spinybacked-orbweaver-eval` from the repo directory; (2) update the git remote: `git remote set-url origin https://github.com/wiggitywhitney/spinybacked-orbweaver-eval.git`; (3) verify with `git remote -v`; (4) update the repo URL in `.claude/CLAUDE.md` and `docs/ROADMAP.md` if they contain hardcoded references to the old repo name `commit-story-v2-eval`; (5) commit any reference updates with `[skip ci]` and push. Confirm the GitHub repo is accessible at the new URL before considering this done.

  Success criteria: `gh repo view wiggitywhitney/spinybacked-orbweaver-eval` succeeds; `git remote -v` shows the new URL; no file in the repo contains a hardcoded reference to `commit-story-v2-eval` (except in historical run summaries where the old name is part of a recorded artifact path).

## Dependencies and Constraints

- **Depends on**: `docs/language-extension-plan.md` (source of truth for structure decisions)
- **Blocks**: Step 2 (IS integration) PRD — IS infrastructure should land in the final directory structure, not the old one
- **Note**: `docs/ROADMAP.md` already exists (created in PRD #41) — do not recreate it

## Risks and Mitigations

- **Risk**: Path reference updates miss some files
  - **Mitigation**: Explicit grep validation step in the path-update milestone; grep for `evaluation/commit-story-v2/run-[0-9]` across the full repo
- **Risk**: Repo rename breaks git remote, making pushes fail
  - **Mitigation**: Rename milestone is last and explicitly includes the `git remote set-url` step as part of the milestone

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-09 | Generalize one repo (not separate repos per language) | Methodology evolves from artifacts; cross-language comparisons stay natural | All language eval chains live in one place |
| 2026-04-09 | Scope existing runs under `evaluation/commit-story-v2/` | Distinguishes JS runs from future TypeScript/Python/Go runs | File moves required; path refs must be updated |
| 2026-04-11 | ROADMAP.md excluded from this PRD's scope | Already created in PRD #41 | No duplicate work |
| 2026-04-11 | Drop PRD template files (Milestone 4) | `docs/language-extension-plan.md` already documents full Type C and Type D structure, the two user-facing checkpoints with exact wording, the instrument command, and prerequisites — templates would duplicate this and drift stale; the most recent eval run PRD is a better living reference | Milestone 4 removed; Milestone 5 updated to point to plan doc directly |
| 2026-04-11 | Reference `docs/language-extension-plan.md` in multiple places | Single reference risks agents missing it at the wrong moment; CLAUDE.md is the session-level trigger, but each future Type C/D PRD also needs an explicit "Step 0: read the plan doc" first milestone so the reference propagates forward automatically | Milestone 5 expanded to instruct that the CLAUDE.md entry must tell future agents to include the plan doc reference as the first milestone of every Type C/D PRD they create |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await start |
