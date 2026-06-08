# PRD #122: Eval Process Propagation

**GitHub Issue**: [#122](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/122)
**Status**: In Progress
**Priority**: Medium
**Created**: 2026-06-08

---

## Problem

Process improvements discovered during eval runs (especially commit-story-v2) don't reliably propagate to other eval targets or future runs. The template (`docs/language-extension-plan.md`) can be updated manually, but:

- Open target-specific PRDs (taze, release-it) don't pick up template changes once written
- There's no mechanism for an agent running a taze or release-it eval to notice that a more recent commit-story-v2 run surfaced a process improvement
- The "draft next PRD" step doesn't include any obligation to update the template with what was learned
- Target PRDs are currently self-contained — they duplicate process steps that should live only in the template

The result: process advances silo in whichever target runs most frequently, and other targets drift.

---

## Solution Overview

Three structural changes to `docs/language-extension-plan.md`, plus a one-time backport:

1. **Establish template-as-source-of-truth contract** — make explicit that the template owns all generic process steps, and target-specific PRDs own only what differs per target
2. **Add cross-run process review as a named milestone** in the Type D sequence — the agent reads the template, reads its own target's most recent run, checks for more recent runs from other targets, and surfaces process improvements as a user-facing checkpoint with proposed template edits (user must approve)
3. **Add template-update step to the "draft next PRD" phase** — when closing out a run and drafting the next PRD, the agent also proposes updates to `language-extension-plan.md` as a user-facing checkpoint
4. **One-time backport** — update all currently open eval run PRDs to include the new cross-run review milestone

---

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| D-1 | Template is source of truth for process; most-recent-run is source of truth for style/format only | Conflating them risks propagating one-off run workarounds as canonical process |
| D-2 | Target PRDs own only target-specific content (organic/non-organic, IS scoring gotchas, prior run findings) | Generic process steps belong in the template; self-contained PRDs cause drift |
| D-3 | Cross-run process review is a named milestone, not ad-hoc | Discovering the most recent cross-target run and diffing process is too much cognitive load to leave as an implied task |
| D-4 | Template updates require user-facing checkpoint — not autonomous | An agent running a taze eval could rewrite template guidance based on taze-specific observations that don't generalize |
| D-5 | Do NOT hardcode commit-story-v2 as "where process improvements get validated first" | True now but not true forever; the structure should work for any target that runs most frequently |
| D-6 | Structural fix (template changes) must be completed before the one-time backport | So the backport uses the finalized structure, not an intermediate state |

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely, paying attention to the current Type D step sequence and the "draft next PRD" phase
  2. `prds/115-evaluation-run-22.md` — most recent fully-implemented Type D PRD, for milestone style reference
  3. This PRD's Decision Log (above) — all six decisions must be understood before editing any files
  **Do not mark complete until all three are read.**

- [ ] **Milestone 1 — Establish template-as-source-of-truth contract in `language-extension-plan.md`.**

  Read `docs/language-extension-plan.md` completely first. Locate the Type D section. Identify the first substantive subsection or step under the Type D heading — the new content goes immediately before it, as its own subsection. Match the heading level and formatting style of adjacent sections in the file. The new section should state:
  - The template owns all generic process steps — if a step appears in both the template and a target PRD, the template version is authoritative
  - Target-specific PRDs own: the organic/non-organic distinction, IS scoring gotchas for that target, prior run actionable findings, and the target's instrument command
  - Target PRDs should reference the template for process steps rather than duplicating them
  - The most recently completed run for a target is the style/format reference only — it is not authoritative for process decisions

  Success criterion: a future AI reading only the template and target PRD can determine which document governs each piece of guidance. **Do NOT duplicate generic process steps in a target PRD — reference the template instead.**

- [ ] **Milestone 2 — Add cross-run process review milestone to the Type D sequence in `language-extension-plan.md`.**

  Insert a new named step early in the Type D sequence: after Step 0 bootstrap reading, and before the step that covers verifying the target repo and tooling are ready (find this step semantically — its name in the file may vary). The step must direct the implementing agent to:

  1. Read `docs/language-extension-plan.md` completely (the current template)
  2. Read the most recently completed run for this target. A run is considered complete when its directory (`evaluation/<target>/run-N/`) contains `actionable-fix-output.md` — that file is the final artifact of the per-file evaluation phase. Find the highest run-N directory that has this file.
  3. Determine whether a more recently completed run exists from any OTHER eval target — check `evaluation/commit-story-v2/`, `evaluation/taze/`, `evaluation/release-it/` run directories using the same completion signal (presence of `actionable-fix-output.md`). If a more recent cross-target run exists, read its `actionable-fix-output.md` and `lessons-for-prd*.md`. If no cross-target run is more recent, note this in the report and proceed without that input.
  4. Compare what was found against the current PRD's milestone structure and the template's step sequence
  5. **User-facing checkpoint**: report findings to the user as a structured list with three sections: (a) process improvements already in the template, (b) process improvements missing from the template with proposed additions, (c) target-specific findings that do not belong in the template. For each item in (b), write out the exact proposed template text, not just a description.
  6. After user approves: make the approved template edits to `language-extension-plan.md` and update the current PRD's remaining milestones if affected. Do NOT make changes without approval.

  Success criterion: the step is explicit enough that an agent starting cold can execute it without additional guidance. The user-facing checkpoint is clearly named as such.

- [ ] **Milestone 3 — Add template-update step to the "draft next PRD" phase in `language-extension-plan.md`.**

  Find the step in the Type D sequence that covers creating the PRD for the next run of this target (find it semantically — its exact name in the file may vary). Expand it to include:

  1. Before drafting the next PRD: review the current run's `actionable-fix-output.md` and `lessons-for-prd*.md` for process observations (not just findings about the target codebase, but about the eval process itself — e.g., a step that was confusing, a gap in instructions, a new tool or technique that worked well)
  2. **User-facing checkpoint**: present proposed updates to `language-extension-plan.md` based on those observations. Distinguish between: (a) target-specific findings that don't belong in the template, and (b) generalizable process improvements that should be in the template
  3. After user approves: commit the template updates as a separate commit from the next PRD draft, so the two changes are independently reviewable

  Success criterion: the checkpoint is clearly scoped — the agent knows what qualifies as a template-worthy improvement vs. a target-specific finding.

- [ ] **Milestone 4 — One-time backport: update all currently open eval run PRDs.**

  After Milestones 1–3 are committed, update each open eval run PRD to include the new cross-run process review milestone from Milestone 2. The open PRDs to update are:
  - `prds/82-taze-evaluation-run-14.md`
  - `prds/100-evaluation-run-5-release-it.md`
  - `prds/115-evaluation-run-22.md` (if not yet complete)
  - Any other open eval run PRDs found in `prds/` at the time of implementation

  For each PRD: insert the cross-run process review milestone after the Step 0 bootstrap reading milestone. Keep all target-specific content (IS scoring steps, organic/non-organic notes, prior run findings) intact — this milestone is an addition, not a replacement.

  Run `/write-prompt` on each updated PRD before committing.

  Success criterion: every open eval run PRD has the cross-run review milestone and a user-facing checkpoint for template updates.

- [ ] **Milestone 5 — Update `PROGRESS.md` and `docs/ROADMAP.md`.**

  Add PROGRESS.md entries for each milestone as it completes (not batched at the end). Remove the ROADMAP.md entry for PRD #122 when done.

---

## Out of Scope

- Automating discovery of the most recent cross-target run — this is a deliberate manual step with a user checkpoint
- Changing which target is "primary" for process validation — commit-story-v2 happens to run most often now, but the structure should work for any target
- Retroactively updating closed/completed eval run PRDs — only open PRDs are in scope for the backport

---

## Success Criteria

1. `docs/language-extension-plan.md` explicitly states the template-vs-target-PRD ownership contract
2. Every future Type D eval run has a named cross-run process review milestone that surfaces improvements and gates on user approval before template changes
3. Every future "draft next PRD" phase includes a template-update checkpoint
4. All currently open eval run PRDs contain the cross-run review milestone
5. No process improvement discovered in one target's run can be silently lost — it either lands in the template (with user approval) or is explicitly noted as target-specific

