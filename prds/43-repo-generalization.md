# Repo Generalization — PRD

**Issue**: [#43](https://github.com/wiggitywhitney/commit-story-v2-eval/issues/43)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11

## Overview

The current repo (`commit-story-v2-eval`) is structured around a single JavaScript target. This PRD generalizes it into a multi-language, multi-target evaluation framework by restructuring the `evaluation/` directory, updating path references, creating PRD template files, and documenting the process for adding new language evaluation chains.

Full context for this work lives in `docs/language-extension-plan.md`. Read the "Repo Generalization" section before starting any milestone.

## User Impact

- **Who benefits**: Any agent or human setting up a new language/target evaluation chain (TypeScript, Python, Go)
- **What changes**: `evaluation/run-*/` directories move under a target-scoped path; PRD titles gain target names; template files give future agents a canonical starting point
- **Why now**: Steps 2 and 3 of the plan land infrastructure in this repo — those PRDs need the correct structure to be in place first

## Success Metrics

- **Primary**: All existing evaluation runs are accessible at `evaluation/commit-story-v2/run-*/`; no broken path references remain
- **Secondary**: `docs/templates/type-c-prd-template.md` and `docs/templates/type-d-prd-template.md` exist and are usable starting points
- **Validation**: A grep for old paths (`evaluation/run-`) returns no hits in any PRD file, CLAUDE.md, or script

## Requirements

### Functional Requirements

- **Must Have**: Move all `evaluation/run-*/` directories to `evaluation/commit-story-v2/run-*/`
- **Must Have**: Update all internal references to old evaluation paths in PRD files, CLAUDE.md, scripts, and docs
- **Must Have**: Update PRD titles and prior art references to include target name (`commit-story-v2`)
- **Must Have**: Create `docs/templates/` with Type C and Type D PRD template files
- **Must Have**: Document "how to add a new language eval" in `.claude/CLAUDE.md`
- **Should Have**: Rename GitHub repo to `spinybacked-orbweaver-eval` (do last — changes remote URL)

### Non-Functional Requirements

- `docs/ROADMAP.md` already exists (created in PRD #41) — do not recreate it
- Each milestone committed separately; use `[skip ci]` for documentation-only commits
- The repo must remain functional (tests pass, git history intact) after each commit

## Implementation Milestones

- [ ] **Move evaluation run directories to target-scoped path**

  Move all directories matching `evaluation/run-*/` into `evaluation/commit-story-v2/`. Use `git mv` (not `mv`) so git history is preserved. After moving, verify: (1) `ls evaluation/commit-story-v2/` shows all run directories, (2) `ls evaluation/` shows only `commit-story-v2/` and any non-run directories (e.g., `is/`), (3) `git status` shows the moves as renames not deletes+adds. Commit with `[skip ci]`.

  Success criteria: `evaluation/commit-story-v2/run-N/` exists for every run that previously existed at `evaluation/run-N/`. No run directories remain directly under `evaluation/`.

- [ ] **Update all internal path references to use the new evaluation directory structure**

  Scan every PRD file in `prds/`, `.claude/CLAUDE.md`, any `.sh` scripts, and `docs/` for references to `evaluation/run-` and update them to `evaluation/commit-story-v2/run-`. Also check `docs/language-extension-plan.md` — it contains an example instrument command with the path `commit-story-v2-eval/evaluation/run-N/`. Update that example. After updating, run: `grep -r "evaluation/run-" prds/ .claude/ docs/ scripts/ 2>/dev/null` and confirm zero hits (only `evaluation/commit-story-v2/run-` remains). Commit with `[skip ci]`.

  Success criteria: Zero grep hits for `evaluation/run-[0-9]` in any file outside of `evaluation/commit-story-v2/`.

- [ ] **Update PRD titles and prior art references to include target name**

  For each PRD file in `prds/` that describes a JavaScript evaluation run, update its title (the `# ...` heading) to include the target name: e.g., "Evaluation Run 13" → "JS Evaluation Run 13: commit-story-v2". Also update any "prior art" or "prior run" references within PRD files that use bare run numbers (e.g., "see run-12") to include the target path (e.g., "see `evaluation/commit-story-v2/run-12/`"). Commit with `[skip ci]`.

  Scope: update file-path references only (e.g., `evaluation/run-12/`, `run-12/run-summary.md`) to include the target path. Do NOT update narrative prose references (e.g., "compared to run-12 results", "similar to run-11 findings") — these remain as-is. Evaluation-run PRDs are those whose filenames match `prds/*evaluation-run-*.md` — infrastructure and research PRDs (like this one) do not get target names added. After updating, run: `grep -rn 'evaluation/run-[0-9]' prds/` and confirm zero hits.

  Success criteria: Every evaluation-run PRD title includes `commit-story-v2`. Zero hits from `grep -rn 'evaluation/run-[0-9]' prds/`.

- [ ] **Create PRD template files for Type C and Type D**

  Create `docs/templates/` directory. Create two template files:

  1. `docs/templates/type-d-prd-template.md` — a reusable template for recurring evaluation run PRDs. Base this on the most recent JS eval run PRD (`prds/37-evaluation-run-13.md`): strip out all run-specific content (specific issue numbers, run numbers, findings, scores) and replace with `[PLACEHOLDER]` markers. Preserve the milestone structure, the two user-facing checkpoints (Findings Discussion and Handoff pause), and the `[skip ci]` instructions. Add a "How to use this template" header that explains: (a) copy the file, (b) replace `[PLACEHOLDER]` values, (c) run `/write-prompt` on the milestones section before committing.

  2. `docs/templates/type-c-prd-template.md` — a reusable template for new language/target setup + Run-1 PRDs. Base this on the Type C PRD description in `docs/language-extension-plan.md` (the "Type C: Setup + Run-1 PRD" section). The template must include the "research spike dependency" note (check `docs/research/eval-target-criteria.md` before forking anything) and the exact instrument command from that section. Add a "How to use this template" header with the same instructions as above.

  Commit both files with `[skip ci]`.

  Both templates must include these standard PRD sections (with `[PLACEHOLDER]` where run-specific): Overview, User Impact, Success Metrics, Requirements, Implementation Milestones, Dependencies and Constraints, Risks and Mitigations, Decision Log, Progress Log.

  Success criteria: `docs/templates/type-c-prd-template.md` and `docs/templates/type-d-prd-template.md` exist; each has a "How to use this template" section and all nine standard PRD sections; the Type C template includes the research spike dependency check.

- [ ] **Document "how to add a new language eval" in .claude/CLAUDE.md**

  Add a new section to `.claude/CLAUDE.md` titled "Adding a New Language Evaluation Chain". Add it at the end of `.claude/CLAUDE.md`, after all existing sections. The section must cover: (1) prerequisite — TypeScript/Python/Go language provider must be merged to spiny-orb main before starting; (2) prerequisite — `docs/research/eval-target-criteria.md` must exist with a verdict for the target language; (3) create a Type C PRD using `docs/templates/type-c-prd-template.md` as the starting point; (4) create a Type D PRD using `docs/templates/type-d-prd-template.md` after Run-1 produces findings; (5) reference `docs/language-extension-plan.md` for full context and PRD taxonomy. Keep the section concise — it should orient a new agent, not duplicate the full plan. Commit with `[skip ci]`.

  Success criteria: Section exists in `.claude/CLAUDE.md`; it references both template files and the language-extension-plan; it clearly states the two prerequisites.

- [ ] **Rename GitHub repo to spinybacked-orbweaver-eval**

  Do this milestone last — it changes the remote URL and requires updating git config. Steps: (1) run `gh repo rename spinybacked-orbweaver-eval` from the repo directory; (2) update the git remote: `git remote set-url origin https://github.com/wiggitywhitney/spinybacked-orbweaver-eval.git`; (3) verify with `git remote -v`; (4) update the repo URL in `.claude/CLAUDE.md` and `docs/ROADMAP.md` if they contain hardcoded references to the old repo name `commit-story-v2-eval`; (5) commit any reference updates with `[skip ci]` and push. Confirm the GitHub repo is accessible at the new URL before considering this done.

  Success criteria: `gh repo view wiggitywhitney/spinybacked-orbweaver-eval` succeeds; `git remote -v` shows the new URL; no file in the repo contains a hardcoded reference to `commit-story-v2-eval` (except in historical run summaries where the old name is part of a recorded artifact path).

## Dependencies and Constraints

- **Depends on**: `docs/language-extension-plan.md` (source of truth for structure decisions)
- **Blocks**: Step 2 (IS integration) PRD — IS infrastructure should land in the final directory structure, not the old one
- **Note**: `docs/ROADMAP.md` already exists (created in PRD #41) — do not recreate it

## Risks and Mitigations

- **Risk**: Path reference updates miss some files
  - **Mitigation**: Explicit grep validation step in the path-update milestone; grep for `evaluation/run-[0-9]` across the full repo
- **Risk**: Repo rename breaks git remote, making pushes fail
  - **Mitigation**: Rename milestone is last and explicitly includes the `git remote set-url` step as part of the milestone

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-09 | Generalize one repo (not separate repos per language) | Methodology evolves from artifacts; cross-language comparisons stay natural | All language eval chains live in one place |
| 2026-04-09 | Scope existing runs under `evaluation/commit-story-v2/` | Distinguishes JS runs from future TypeScript/Python/Go runs | File moves required; path refs must be updated |
| 2026-04-11 | ROADMAP.md excluded from this PRD's scope | Already created in PRD #41 | No duplicate work |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await start |
