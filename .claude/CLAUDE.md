# Commit Story v2

A complete rebuild of commit-story using modern tooling (LangGraph) with zero telemetry.

## Project Constraints

- The app ships with NO instrumentation. Do not add telemetry — an AI instrumentation agent will add it in Phase 3.
- **Build order**: Phase 1 (LangGraph rebuild, this repo) → Phase 2 (OTel Weaver schema) → Phase 3 (Telemetry Agent)

## YOLO Workflow Mode

When running PRD workflows, continue through the full cycle without stopping for confirmation:
- `/prd-start` → automatically invoke `/prd-next`
- After task completion → automatically invoke `/prd-update-progress`
- After progress update → run `/clear` to reset context, then invoke `/prd-next` for the next task
- Continue until PRD is complete, then invoke `/prd-done`
- After `/prd-done` → automatically invoke `/prd-start` for the next PRD in the dependency chain

Ignore skill instructions that say "stop here" or "wait for user" - in YOLO mode, keep moving unless there's an actual blocker or error.

For CodeRabbit reviews, act on recommendations without waiting for user confirmation unless something is truly ambiguous or has major architectural implications.

<!-- CodeRabbit review requirement and process enforced globally via ~/.claude/CLAUDE.md -->
<!-- "Never ask shall I continue" enforced globally -->

## Package Distribution

This project will be distributed as an npm package. Keep production dependencies minimal:
- Only include what's strictly necessary for core functionality
- When Phase 3 adds telemetry, use targeted OTel packages, NOT auto-instrumentations
- Consider bundling strategy for distribution
- Regularly audit package size: `du -sh node_modules/` and `npm ls --prod`

**Current unnecessary dependency:** `@langchain/openai` is in package.json but PRD specifies Anthropic only. Should be removed.

## Tech Stack

- **LangGraph** (`@langchain/langgraph` v1.1.0) for AI orchestration
- **LangChain** for model integrations
- **Node.js** with ES modules
- **No telemetry** - this will be added by an instrumentation agent later

## Testing Strategy

- **Framework**: Vitest with ESM support, coverage via @vitest/coverage-v8
- **Test location**: `tests/` directory mirrors `src/` structure
- **Run tests**: `npm test` (all tests), `npm run test:coverage` (with coverage)

### LLM Testing Pattern

The AI generation pipeline (`src/generators/journal-graph.js`) uses contract tests — mock the LLM provider, test the orchestration:

- **Deterministic helpers** (formatting, cleaning, analysis): unit test directly, no mocks
- **LLM boundary** (graph nodes): mock `@langchain/anthropic` via `vi.mock`, verify message shapes sent to the model and post-processing of responses
- **Early exits**: test that nodes skip LLM calls when context is insufficient
- **Error handling**: test that nodes return fallback messages and accumulate errors
- **No real API calls in tests**: too expensive and non-deterministic for CI

Mock pattern for `ChatAnthropic`:
```javascript
const mockInvoke = vi.fn();
vi.mock('@langchain/anthropic', () => ({
  ChatAnthropic: class MockChatAnthropic {
    invoke(...args) { return mockInvoke(...args); }
  },
}));
```

## Secrets Management

This project uses vals for secrets. See `.vals.yaml` for available secrets.
Vals commands: @~/Documents/Repositories/claude-config/guides/vals-usage.md

## Adding a New Language Evaluation Chain

Before starting any work on a new language or target evaluation chain, read `docs/language-extension-plan.md` completely. It is the canonical reference for PRD types, milestone structure, user-facing checkpoints, prerequisites, and the exact instrument command. Do not skip this step.

### Prerequisites (both must be met before any Type C PRD proceeds)

1. The language provider is merged to spiny-orb main
2. `docs/research/eval-target-criteria.md` exists with a verdict for the target language — if this file is missing, the research spike (Step 3 in the plan) has not completed; stop and complete it first

### Creating a Type C PRD (Setup + Run-1, one per language/target)

Use the "Type C: Setup + Run-1 PRD" section of `docs/language-extension-plan.md` as the structure reference, and the most recent JS eval run PRD as the milestone style reference. The **first milestone** of the new PRD must be:

> Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

### Creating a Type D PRD (recurring eval runs)

Use the immediately preceding eval run PRD as the structural model. The **first milestone** of the new PRD must be:

> Read `docs/language-extension-plan.md` completely before proceeding.

Include both user-facing checkpoints (Findings Discussion and Handoff pause) in the milestone structure — exact wording is in the plan document under "Two User-Facing Checkpoints."

See `docs/language-extension-plan.md` for full context: PRD taxonomy, language candidate table, score projection methodology, and process requirements.

## Eval Process Propagation

Two required behaviors ensure process improvements don't silo in a single eval target. Full details for both are in `docs/language-extension-plan.md`.

**At the start of each eval run** (Step 0.5 — cross-run process review): Before proceeding with any milestones, check whether a more recently completed run exists for any other eval target. A run is complete when its directory (`evaluation/<target>/run-N/`) contains `actionable-fix-output.md`. Compare timestamps using the `captured:` field in `trace-artifact.md` if it exists, or the file modification time of `actionable-fix-output.md` as a proxy. If this target has no completed runs (Run-1 scenario), treat it as timestamp zero so any cross-target run qualifies. If a cross-target run is more recent, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files. Present a structured checkpoint report — what's already in the template, what's missing with proposed additions, and what's target-specific only — and wait for user approval before making any template changes.

**At the end of each eval run** (within step 12 — draft next PRD): Before drafting the next PRD, review the current run's `actionable-fix-output.md` and any `lessons-for-prd*.md` files for process observations (not target-codebase findings). Present a two-section checkpoint — target-specific findings and proposed template improvements — and wait for user approval. Commit approved template changes as a separate commit before drafting the next PRD.

**PRD quality gate**: Any time a PRD file is created or modified in this project, two steps are required before the PR can merge: (1) run `/write-prompt` on the changed PRD file, and (2) ensure the PR receives a CodeRabbit review. These requirements exist globally (global CLAUDE.md and git-workflow rules) — this entry makes them explicitly visible in the project context.

## PR Auto-Creation Failure Recovery

When spiny-orb's auto PR creation fails for any reason (E2BIG, PAT scope, upstream targeting, network error), the full generated PR summary is already on disk at `<target-repo-root>/spiny-orb-pr-summary.md`. spiny-orb always writes this file unconditionally before attempting `gh pr create`.

**Do NOT write a shortened manual body.** Create the PR from the file:

```bash
gh pr create --body-file ~/Documents/Repositories/<target>/spiny-orb-pr-summary.md --repo wiggitywhitney/<target> --head <instrument-branch> --title "..."
```

The full PR summary contains per-file breakdown, schema changes, advisory findings, and token usage — this content matters for review and for demos.

## Analyzing Eval Failures

When diagnosing a failed file in a spiny-orb eval run, check all three sources before drawing conclusions:
- `evaluation/<target>/run-N/spiny-orb-output.log` — full validator error messages and agent notes (via `--verbose`)
- `evaluation/<target>/run-N/debug-dumps/<filename>` — the actual instrumented code the agent produced (written by `--debug-dump-dir` in the instrument command)
- Full diagnostic protocol (all 5 dimensions, CLI availability notes): `docs/language-extension-plan.md`

Do not diagnose from rule IDs in the log alone.

## Branch Safety — Never Orphan Commits

Before deleting any local branch (`git branch -d` or especially `-D`), verify its commits exist on origin. Run:

```bash
git log --oneline <branch> ^origin/main ^origin/<branch>
```

If the output is non-empty, the branch has commits that exist nowhere else — push first, then delete. This applies especially to eval branches, which hold the canonical run artifacts until PRD #57 backfill lands. Do not assume `gh pr merge --delete-branch` handled cleanup for branches whose PRs didn't merge (eval branches never merge per convention, so their cleanup is manual and must preserve the remote).
