# Source Cleanup — PRD

**Issue**: [#47](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/47)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11

## Overview

This repo was originally forked from commit-story-v2 and contains a tracked copy of its source code (`src/`, `tests/`, `semconv/`, `scripts/`, `package.json`, etc.). Evaluation runs 11–13 ran spiny-orb directly against `../commit-story-v2`, making the source code in this repo stale and unused. This PRD removes that source code so the eval repo contains only evaluation artifacts, PRDs, and docs.

`coverage/` and `node_modules/` are already gitignored — no git action needed for them.

## User Impact

- **Who benefits**: Anyone working in or navigating this repo — no more confusion about which `src/` is authoritative
- **What changes**: `src/`, `tests/`, and other commit-story-specific tracked files are removed; the repo structure matches the intended layout in `docs/language-extension-plan.md`
- **Why now**: PRD #43 (repo generalization) is complete; cleanup is the natural next step before adding new language targets

## Success Metrics

- **Primary**: `git ls-files src/ tests/` returns empty
- **Secondary**: `docs/research/source-cleanup-audit.md` exists, classifying every removed or retained file
- **Validation**: Instrument command runs cleanly against `../commit-story-v2` with output tee'd to `evaluation/commit-story-v2/run-N/` as before; no eval workflow step depends on local source

## Requirements

### Functional Requirements

- **Must Have**: Audit document classifying every tracked non-evaluation file before any removal
- **Must Have**: Any eval-originated changes (e.g., `src/instrumentation.js`, semconv additions) assessed and migrated upstream to commit-story-v2 if needed
- **Must Have**: Files removed via `git rm`, preserving history
- **Must Not**: Remove eval-specific files: `spiny-orb.yaml`, `.env.example`, eval-specific `scripts/` entries

### Non-Functional Requirements

- Each milestone committed separately; use `[skip ci]` for documentation-only commits
- Do not remove upstream code without first verifying it exists (or is no longer needed) in commit-story-v2 main
- The instrument command and eval workflow must remain functional throughout

## Implementation Milestones

- [x] **Audit: classify every tracked non-evaluation file**

  Read `docs/language-extension-plan.md` (the intended future repo structure is in the "Repo Generalization" section).

  The `upstream` remote in this repo points to `../commit-story-v2` — that is the canonical source. Use `git diff upstream/main -- <path>` to check divergence for any file.

  Run the following to list all tracked non-evaluation files:

  ```bash
  git ls-files src/ tests/ semconv/ scripts/ package.json package-lock.json vitest.config.js spiny-orb.yaml .env.example evaluation-run-2.log
  ```

  For each file or directory, classify it as one of:
  - **safe-to-remove**: identical to commit-story-v2 main (`git diff upstream/main -- <path>` shows no diff)
  - **needs-upstream-migration**: present here but not in commit-story-v2 main, or diverged in a way that should be preserved upstream
  - **eval-specific**: belongs only in the eval repo (e.g., `spiny-orb.yaml`, eval CI workflows)
  - **unknown**: needs manual investigation

  Known divergence to check specifically:
  - `src/instrumentation.js` — new file not on commit-story-v2 main at time of last sync; determine if it has since been added to commit-story-v2
  - `semconv/` files — differ from commit-story-v2 main; determine which version is authoritative
  - `tests/managers/journal-manager.test.js` — has diverged; check if changes were ever upstreamed
  - `scripts/` — some entries may be eval CI scripts (keep); others may be commit-story-specific (remove)
  - `.github/` workflows — check if any run tests against `src/`; note these for the CI update milestone

  Write findings to `docs/research/source-cleanup-audit.md`. The audit document must include:
  - Classification table using this format:

    | File/Directory | Classification | Rationale |
    |---|---|---|
    | src/instrumentation.js | needs-upstream-migration | Not present on commit-story-v2 main as of 2026-04-11 |

  - Summary of what needs upstream migration before removal
  - List of files classified eval-specific that must be retained
  - Any unknowns that require human review before proceeding

  Do not remove or migrate anything in this milestone. Commit the audit doc with `[skip ci]`.

  Success criteria: `docs/research/source-cleanup-audit.md` exists with a classification for every file listed above.

- [x] **Relocate eval-specific files within the repo before removal**

  *(Updated per Decision 3: no upstream migration needed — all eval-specific files stay in this repo but must move out of src/ and tests/ before git rm.)*

  The audit identified four eval-specific files that must be preserved but relocated out of the directories slated for removal:

  | Current path | Move to | Why |
  |---|---|---|
  | `src/instrumentation.js` | `evaluation/examples/instrumentation.js` | Eval OTel bootstrap; required by `spiny-orb.yaml` as `sdkInitFile` |
  | `tests/score-is.test.js` | `evaluation/is/score-is.test.js` | IS scoring test; import path (`../evaluation/is/score-is.js`) stays valid from new location |
  | `tests/fixtures/is/all-pass.jsonl` | `evaluation/is/fixtures/all-pass.jsonl` | IS scoring fixture |
  | `tests/fixtures/is/missing-service-name.jsonl` | `evaluation/is/fixtures/missing-service-name.jsonl` | IS scoring fixture |
  | `tests/fixtures/is/orphan-span.jsonl` | `evaluation/is/fixtures/orphan-span.jsonl` | IS scoring fixture |
  | `tests/fixtures/is/too-many-internal.jsonl` | `evaluation/is/fixtures/too-many-internal.jsonl` | IS scoring fixture |

  Use `git mv` for each move so history is preserved. After moving, update:
  - `spiny-orb.yaml`: change `sdkInitFile` from `src/instrumentation.js` to `evaluation/examples/instrumentation.js`
  - `tests/score-is.test.js` (at its new path): verify the relative import path `../evaluation/is/score-is.js` still resolves correctly from `evaluation/is/score-is.test.js`

  Do not remove any other files in this milestone.

  Commit with `[skip ci]`.

  Success criteria: All four eval-specific items exist at their new paths; `spiny-orb.yaml` `sdkInitFile` points to the new location; no eval files remain under `src/` or `tests/`.

- [x] **Remove source files from eval repo**

  *(Prerequisite: milestone 2 must be complete — eval-specific files must be relocated before running git rm. Updated per Decision 3.)*

  Using the audit classification, remove all files and directories classified `safe-to-remove` using `git rm -r`. Do not touch `eval-specific` files (they were already moved in milestone 2). There are no `unknown` files; the audit found none.

  After removal, verify:
  1. `git ls-files src/ tests/` returns empty
  2. `git ls-files semconv/` returns empty (or only eval-specific entries if any exist)
  3. The remaining `scripts/` entries are all eval-specific
  4. `package.json`, `package-lock.json`, `vitest.config.js` are removed (they are commit-story-specific)

  Commit with `[skip ci]`.

  Success criteria: No commit-story source files remain tracked in this repo.

- [x] **Update CI workflows and any scripts that referenced removed files**

  Check `.github/` workflows and `scripts/` for any step that runs `npm test`, `npm install`, references `src/`, `tests/`, or assumes a Node.js project structure. Update or remove those steps. The eval repo no longer has a package.json, so npm-based CI steps are invalid.

  Update `docs/language-extension-plan.md` line 75 (the note about `commit-story-v2-eval` → new repo name) — remove this note since the rename (PRD #43) and source cleanup (this PRD) are now complete.

  Commit with `[skip ci]` if docs-only, or without if CI config changed.

  Success criteria: No workflow or script references `npm test`, `src/`, or `tests/` in ways that assume they still exist here.

- [x] **Verify eval workflow runs end-to-end**

  Read `prds/37-evaluation-run-13.md` and locate the prerequisites or pre-run verification milestone. Step through each item, confirming it works without local source. If no explicit checklist exists in that PRD, verify these three things manually:
  1. The instrument command from `docs/language-extension-plan.md` can be assembled and would run without error (the target path `../commit-story-v2/src` exists; the output path `evaluation/commit-story-v2/run-N/` exists)
  2. No step in the eval workflow requires `npm install` or `npm test` in this repo
  3. The `spiny-orb.yaml` config still points at the correct target

  If any step breaks, document the fix and apply it before closing this milestone.

  This is a dry-run verification, not a live eval run — do not create a new spiny-orb instrument branch.

  Success criteria: Every step in the eval pre-run checklist can be completed without local source code.

## Dependencies and Constraints

- **Depends on**: PRD #43 (repo generalization) — must be merged before starting this PRD so the directory structure is stable
- **Must not block**: PRD #37 (eval run-13) — run-13 may proceed in `../commit-story-v2` independently; this PRD does not affect that workflow
- **Upstream repo**: commit-story-v2 (`upstream` remote points to `../commit-story-v2`) — no write access required; audit confirmed no upstream migration needed (Decision 3)

## Risks and Mitigations

- **Risk**: `src/instrumentation.js` is removed before being relocated, breaking spiny-orb.yaml and future eval runs
  - **Mitigation**: Milestone 2 relocates it to `evaluation/examples/instrumentation.js` and updates `spiny-orb.yaml` before any `git rm` runs (Decision 3)
- **Risk**: A CI workflow or script depends on the removed files
  - **Mitigation**: Dedicated CI update milestone with explicit grep for npm/src/tests references
- **Risk**: Unknown files are incorrectly removed
  - **Mitigation**: `unknown` classification blocks removal until resolved; audit must be complete before any `git rm`

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | Research/discovery milestone first | Known divergence (src/instrumentation.js, semconv) means removal without audit risks data loss | Removal blocked on audit completion |
| 2026-04-11 | coverage/ and node_modules/ excluded from PRD | Already gitignored; no git action needed | Scope reduced |
| 2026-04-13 | No upstream migration to commit-story-v2 needed | Audit found zero `needs-upstream-migration` files. `src/instrumentation.js` is eval infrastructure (OTLP/Datadog exporter, IS_SCORING_RUN support) — not commit-story application code; it must not go to commit-story-v2. All other diverged files have upstream as the canonical/improved version. | Milestone 2 scope changes: skip upstream PRs entirely; instead move eval-specific files to safe locations within this repo before `git rm`. Milestone 3 prerequisite: eval-specific files must be relocated first. |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Depends on PRD #43 merge |
