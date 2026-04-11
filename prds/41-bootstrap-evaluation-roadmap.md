# Bootstrap Evaluation Roadmap — PRD

**Issue**: [#41](https://github.com/wiggitywhitney/commit-story-v2-eval/issues/41)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-10
**Last Updated**: 2026-04-10

## Overview

The evaluation framework has a detailed execution plan in `docs/language-extension-plan.md` but no tracked PRDs for the planned steps and no `docs/ROADMAP.md` for the prd* skills to maintain. This PRD creates the three foundational PRDs and verifies they work as a coherent set.

`docs/ROADMAP.md` is initialized as part of this PRD's own creation (not a milestone). The milestones below focus on the PRD creation work.

## User Impact

- **Who benefits**: Any agent or human picking up future eval framework work — they have a clear, tracked roadmap with properly scoped PRDs
- **What changes**: Steps 1–3 become actionable PRDs with GitHub issues; the prd* skills can maintain the roadmap going forward
- **Why now**: Planning is complete. The execution roadmap is fully defined. Creating the PRDs unblocks all subsequent work.

## Success Metrics

- **Primary**: Three PRDs exist on main (Steps 1, 2, 3), each committed with `[skip ci]` and ready to start
- **Secondary**: ROADMAP.md entries for all three show actual issue numbers (not #TBD)
- **Validation**: All three PRD milestones have passed `/write-prompt` review and no coherence gaps exist between them

## Requirements

### Functional Requirements

- **Must Have**: PRDs for Step 1 (repo generalization), Step 2 (IS integration), Step 3 (eval target criteria research)
- **Must Have**: Each PRD's milestones reviewed and improved by `/write-prompt` before committing
- **Must Have**: ROADMAP.md updated with actual issue numbers for all three PRDs
- **Must Have**: Coherence verification pass confirming the PRDs interlock correctly
- **Should Have**: Each PRD's decision log pre-populated with key decisions from `docs/language-extension-plan.md`

### Non-Functional Requirements

- Each PRD committed to main individually with `[skip ci]` — do not batch into one commit
- Do not start any of the created PRDs (choose "commit for later" in `/prd-create`)
- Each PRD must reference `docs/language-extension-plan.md` so implementing agents know where the full context lives

## Implementation Milestones

- [ ] **Create PRD for Step 1: Repo generalization**

  Read the Step 1 entry in the Execution Roadmap section of `docs/language-extension-plan.md` and the Repo Generalization section for full scope. Then read the Planned Structure and Migration Work subsections — these define the specific deliverables. Use `/prd-create` to create the PRD interactively; answer its questions from the plan doc content. When `/prd-create` presents the draft milestones for review — before it prompts you to commit — run `/write-prompt` on the milestones section. Apply all High severity findings and any Medium severity findings that make instructions clearer or more actionable for an implementing agent. Then choose Option 2 in `/prd-create` — the skill commits and pushes to main with `[skip ci]` automatically. Do not start this PRD.

  Success criteria: PRD file exists at `prds/[issue-id]-repo-generalization.md`; milestones have passed `/write-prompt` review; `docs/ROADMAP.md` lists this PRD with its real issue number (verify — `/prd-create` updates this automatically).

- [ ] **Create PRD for Step 2: IS integration**

  Read the Step 2 entry in the Execution Roadmap section of `docs/language-extension-plan.md` for scope and key decisions. Then read `docs/research/instrumentation-score-integration.md` in full — this is completed prior research that defines the deliverables and key decisions for this PRD. Use `/prd-create` to create the PRD interactively. The PRD milestones must include: (1) build scoring script, (2) create `evaluation/is/otelcol-config.yaml`, (3) enable metrics in SDK bootstrap for IS scoring runs, (4) add IS scoring milestone to the Type D run template. When `/prd-create` presents the draft milestones for review — before it prompts you to commit — run `/write-prompt` on the milestones section. Apply all High severity findings and any Medium severity findings that make instructions clearer or more actionable. Then choose Option 2 in `/prd-create` — the skill commits and pushes to main with `[skip ci]` automatically. Do not start this PRD.

  Success criteria: PRD file exists; milestones include "Step 0: read `docs/research/instrumentation-score-integration.md`" before implementation begins; `docs/ROADMAP.md` lists this PRD with its real issue number (verify — `/prd-create` updates this automatically).

- [ ] **Create PRD for Step 3: Eval target criteria research spike**

  Read the Step 3 entry in the Execution Roadmap section of `docs/language-extension-plan.md` and the full "Research Spike: Ideal Eval Target Criteria" section, including the hypotheses table and research agent framing. Use `/prd-create` to create the PRD. The PRD must specify: (a) output path is `docs/research/eval-target-criteria.md`, (b) the research agent should use the `/research` skill, (c) the final milestone creates PRDs for Steps 5–7 (TypeScript, Python, Go eval setup) using the validated targets from the research output. When `/prd-create` presents the draft milestones for review — before it prompts you to commit — run `/write-prompt` on the milestones section. Apply all High severity findings and any Medium severity findings that make instructions clearer or more actionable. Then choose Option 2 in `/prd-create` — the skill commits and pushes to main with `[skip ci]` automatically. Do not start this PRD.

  Success criteria: PRD file exists; output path `docs/research/eval-target-criteria.md` is explicitly named; final milestone explicitly states it creates PRDs for Steps 5–7; `docs/ROADMAP.md` lists this PRD with its real issue number (verify — `/prd-create` updates this automatically).

- [ ] **Coherence verification**

  Read all three newly created PRDs in full. Check the following and fix any gaps found:

  1. Step 2 PRD milestones include "Step 0: Read `docs/research/instrumentation-score-integration.md`" before implementation work begins
  2. Step 3 PRD names `docs/research/eval-target-criteria.md` as its output path, matching the gate condition in Steps 5–7 of `docs/language-extension-plan.md`
  3. Step 3 PRD's final milestone explicitly creates PRDs for Steps 5–7 using the validated targets from the research output
  4. ROADMAP.md now has real issue numbers for all three PRDs. Remove the corresponding `#TBD` placeholder entries that were initialized in this PR — `prd-create` appends new entries rather than replacing them, so duplicates will exist until removed.
  5. No PRD depends on another PRD being merged first — each starts from main independently
  6. The dependencies section of each PRD accurately states what it depends on and what it unblocks

  If any gap is found, fix it in the relevant PRD file and commit the fix to main with `[skip ci]`.

## Dependencies and Constraints

- **Depends on**: `docs/language-extension-plan.md` (source of truth for scope of each step), `docs/research/instrumentation-score-integration.md` (input for Step 2 PRD)
- **Blocks**: Steps 1, 2, 3 cannot be started without their PRDs existing on main
- **Constraints**: Do not create PRDs for Steps 5–7 — those are created as output of Step 3 (eval target criteria research)

## Risks and Mitigations

- **Risk**: `/prd-create` commits before `/write-prompt` review if the timing is wrong
  - **Mitigation**: Run `/write-prompt` on the milestones when `/prd-create` presents its draft for review — before it prompts to commit. Then choose Option 2; the skill handles the commit and push with `[skip ci]` automatically.
- **Risk**: Coherence gaps between PRDs discovered late
  - **Mitigation**: Coherence verification milestone is explicit and runs last; gaps are fixed before this PRD closes

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-10 | Create PRDs for Steps 1–3 only, not Steps 5–7 | Steps 5–7 targets are not yet validated; Step 3 research will create those PRDs as its output | Steps 5–7 PRDs are higher quality when written post-research |
| 2026-04-10 | Initialize ROADMAP.md with #TBD entries for Steps 1–3 and TypeScript | Shows full planned work before PRDs exist; prd-create appends real entries alongside them; coherence check cleans up #TBD entries at the end | ROADMAP.md reflects planned work from day one |
| 2026-04-10 | Each PRD committed separately with [skip ci] | Allows ROADMAP.md to be updated with each real issue number; preserves audit trail | Three commits to main instead of one |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-10 | PRD created, ROADMAP.md initialized, branch created | Draft | Await CodeRabbit review, merge, then start implementation |
