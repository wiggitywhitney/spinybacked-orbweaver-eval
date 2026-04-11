# Python Eval Setup + Run-1 ~~: commitizen Baseline~~

> **NEEDS REVISION (2026-04-11):** This PRD was created before the decision to use 3 candidates per language with milestone 0 for target selection. It assumes commitizen is the target. It must be rewritten to: (1) remove the assumed target from the title, (2) add milestone 0 evaluating 3 Python candidates from eval-target-criteria.md, (3) add auto-instrumentation library expansion milestone for spiny-orb, (4) add deliberately incomplete Weaver schema milestone. See PRD #45 decision log for full context.

**Issue**: [#51](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/51)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Type**: C (Setup + Run-1)

## Overview

The eval framework has no Python evaluation chain. This PRD forks commitizen (commitizen-tools/commitizen) as the Python eval target, adds spiny-orb prerequisites, runs the first baseline evaluation (Run-1), and establishes the Python evaluation chain. commitizen was validated as "Pass" in `docs/research/eval-target-criteria.md` — MIT license, 3.4k stars, ~45-55 Python files, good I/O diversity (git subprocess, file I/O, template rendering), locally runnable with no infrastructure dependencies.

## Prerequisites / Gates

**Both gates must be met before this PRD can start. Do NOT evaluate these gates now — they exist for the future implementor.**

- **Gate 1 (provider):** The Python language provider must be merged to spiny-orb main. Check current status in `docs/language-extension-plan.md` "Language Candidates" table (currently "spinybacked-orbweaver PRD D (future)").
- **Gate 2 (research):** `docs/research/eval-target-criteria.md` must exist with a verdict for Python. Before forking anything, read that file to confirm the validated target for this language.

## User Impact

- **Who benefits**: The spiny-orb team — Python instrumentation quality can now be measured and tracked
- **What changes**: A third language evaluation chain exists alongside JavaScript and TypeScript
- **Why now**: Blocked until Python provider lands; this PRD is ready to start the moment it does

## Success Metrics

- **Primary**: Run-1 produces a complete set of evaluation artifacts in `evaluation/commitizen/run-1/`
- **Secondary**: Rubric scores establish the Python baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Requirements

### Functional Requirements

- **Must Have**: Forked commitizen repo with spiny-orb prerequisites (spiny-orb.yaml, semconv/, OTel bootstrap, dependencies)
- **Must Have**: Test suite passes on forked repo before instrumentation
- **Must Have**: Complete Run-1 evaluation with all standard artifacts
- **Must Have**: Both user-facing checkpoints completed (Findings Discussion + handoff pause)
- **Should Have**: IS scoring run (locally runnable — no infrastructure needed)
- **Should Have**: Run-2 PRD drafted (first Type D for Python chain)

### Non-Functional Requirements

- Evaluation feature branch (`feature/prd-51-python-eval-run-1`) never merges to main — PR exists for CodeRabbit review only
- Whitney runs `spiny-orb instrument` herself — AI does not run this command
- `GITHUB_TOKEN` must be in the environment for spiny-orb to create a PR

## Implementation Milestones

- [ ] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section — required milestone structure, operational details, exact instrument command; (2) "Language Candidates" table — confirm Python provider status and commitizen as the target; (3) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (4) eval branch convention (never merges to main). Also read `docs/research/eval-target-criteria.md` to confirm commitizen's "Pass" verdict.

  Note: Python OTel bootstrap differs from JavaScript. The language-extension-plan.md "SDK Bootstrap by Language" table in the IS integration research (`docs/research/instrumentation-score-integration.md`) documents Python-specific patterns: `opentelemetry-instrument` wrapper OR manual bootstrap module, atexit hook + explicit SIGTERM handler.

  Success criteria: Can answer — what is the exact instrument command (adapted for Python/commitizen)? What are the two checkpoints? What is the Python OTel bootstrap mechanism?

- [ ] **Fork target repo and create eval directory structure**

  Fork commitizen (`commitizen-tools/commitizen`) to Whitney's GitHub account. Create `evaluation/commitizen/run-1/` directory in the eval repo with skeleton documents: `lessons-for-run2.md`, `spiny-orb-findings.md`. commitizen is locally runnable (only needs a git repo) — no infrastructure provisioning needed unlike the TypeScript and Go targets.

  Success criteria: Forked repo exists; `evaluation/commitizen/run-1/` directory created with skeleton files.

- [ ] **Add spiny-orb prerequisites to target repo**

  In the forked commitizen repo, add all required spiny-orb configuration. Use the commit-story-v2 JavaScript setup as the conceptual reference (see `docs/language-extension-plan.md` "Language-specific prerequisites reference"), but adapt for Python's OTel ecosystem:

  1. Create `spiny-orb.yaml` configuration — adapt from commit-story-v2's config, updating paths and language settings for Python
  2. Create initial `semconv/` Weaver schema directory — adapt the registry structure for commitizen's domain (git operations, version management, changelog generation)
  3. Create Python OTel bootstrap module — use `opentelemetry-instrument` wrapper approach OR manual bootstrap module with `opentelemetry-sdk` and `opentelemetry-exporter-otlp-proto-http`. Include explicit SIGTERM handler (Python's atexit hook does not cover SIGTERM in containerized deployments — see `docs/research/instrumentation-score-integration.md` "CLI apps must flush spans" section)
  4. Add OTel dependencies: `opentelemetry-api` as a dependency (Python equivalent of peerDependency — check commitizen's dependency management approach, likely pyproject.toml)
  5. Add graceful shutdown handling: atexit hook + signal handlers for SIGTERM/SIGINT to flush spans before exit

  Success criteria: `spiny-orb.yaml` exists; `semconv/` directory with domain-appropriate registry; OTel bootstrap module with graceful shutdown; dependencies declared; forked repo still builds and tests pass after these additions.

- [ ] **Verify test suite runs clean on unmodified target**

  Run commitizen's test suite 3 times on the forked repo (after adding spiny-orb prerequisites but before any instrumentation changes). All tests must pass all 3 times — the deterministic reproducibility criterion from `docs/research/eval-target-criteria.md` requires this. If any test is flaky, document the failure and decide whether to proceed or investigate.

  commitizen requires Python >=3.10 and uses standard pytest. Check `pyproject.toml` for the test command.

  Success criteria: 3 consecutive clean test runs documented; no flaky tests; or flaky tests documented with mitigation decision.

- [ ] **Pre-run verification**

  Verify spiny-orb Python provider capabilities and validate all run prerequisites:
  1. Confirm Python language provider is on spiny-orb main (Gate 1 should already be met)
  2. Verify target repo has `spiny-orb.yaml` and `semconv/` configured correctly
  3. Count `.py` files in commitizen's source directories (commitizen/, commitizen/commands/, commitizen/cz/, etc.) — record the file inventory
  4. Rebuild spiny-orb from current branch (not necessarily main — rebuild from whatever branch it's on)
  5. Verify push auth (`GITHUB_TOKEN` in environment, dry-run push)
  6. Record version info and findings status
  7. Append observations to `evaluation/commitizen/run-1/lessons-for-run2.md`

  Success criteria: All prerequisites verified; file inventory recorded; spiny-orb built; push auth confirmed.

- [ ] **Evaluation run-1**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** The exact command is in `docs/language-extension-plan.md` — update the `run-N` placeholder and target repo path for commitizen.

  AI role in this milestone:
  1. Confirm readiness with Whitney (all pre-run checks passed)
  2. Once Whitney provides the log output, save it to `evaluation/commitizen/run-1/spiny-orb-output.log`
  3. Write `evaluation/commitizen/run-1/run-summary.md` from the log data

  Success criteria: Log saved; run-summary.md written with file counts, cost, timing, push/PR status.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents are started: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises or regressions. Keep it conversational, under 10 lines. Wait for her acknowledgment before proceeding to failure deep-dives.

  Success criteria: Whitney has acknowledged the findings overview.

- [ ] **Failure deep-dives**

  Root cause analysis for each failed file, each partial file, and each run-level failure. This is the first Python run — document any Python-specific failure patterns that differ from JavaScript runs (e.g., decorator handling, import patterns, class-based vs function-based code).

  Produces: `evaluation/commitizen/run-1/failure-deep-dives.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric evaluation on ALL processed files (no spot-checking). Evaluate all committed, partial, and correctly-skipped files against every applicable rubric rule.

  Produces: `evaluation/commitizen/run-1/per-file-evaluation.md` and `evaluation/commitizen/run-1/per-file-evaluation.json`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Evaluate the PR created by spiny-orb (if push succeeded). Assess PR summary accuracy, span count correctness, file status accuracy, and advisory note quality. If push failed, document the failure and evaluate any local PR summary artifacts.

  Produces: `evaluation/commitizen/run-1/pr-evaluation.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/pr-evaluation.md`

- [ ] **Rubric scoring**

  Synthesize dimension-level scores from the per-file evaluation. This is the first Python run — no prior baseline exists. Establish the Python baseline by documenting scores across all 6 dimensions (NDS, COV, RST, API, SCH, CDQ) plus gate status.

  Produces: `evaluation/commitizen/run-1/rubric-scores.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/rubric-scores.md`

- [ ] **Baseline comparison**

  This is the first Python run — no prior Python baseline exists. Document the initial baseline scores and compare against the most recent JavaScript run for cross-language context. Note any Python-specific failure patterns not seen in JavaScript runs (e.g., decorator instrumentation, class method handling, import-time side effects).

  Produces: `evaluation/commitizen/run-1/baseline-comparison.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/baseline-comparison.md` (adapt structure — focus on establishing baseline and cross-language comparison)

- [ ] **IS scoring run**

  commitizen is locally runnable — no Kind cluster needed. Configure OTel Collector with file exporter (use `evaluation/is/otelcol-config.yaml` if IS integration PRD is complete, otherwise create a minimal config). Set `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` to point at the Collector. Exercise commitizen's instrumented code by running `cz bump --dry-run` or `cz changelog` against a test git repo. Capture OTLP output and score against IS spec (~9 applicable rules).

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main. If it does, IS integration is complete — use the scoring script. If it does not exist, skip automated scoring and instead document the raw OTLP output for manual review.

  Produces: `evaluation/commitizen/run-1/is-scores.md`

- [ ] **Actionable fix output**

  Primary handoff deliverable for the spiny-orb team. At milestone completion:
  1. Run the cross-document audit agent: launch an Agent with prompt "Verify consistency across all evaluation artifacts in evaluation/commitizen/run-1/. Check that file counts, span counts, scores, and findings references match across run-summary.md, per-file-evaluation.md, rubric-scores.md, baseline-comparison.md, and failure-deep-dives.md. Report any discrepancies."
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable Python-specific patterns, what to watch for in run-2
  3. Print the absolute file path of `evaluation/commitizen/run-1/actionable-fix-output.md` (derive from current working directory)
  4. **Pause.** Do not proceed to Draft Run-2 PRD until Whitney confirms she has handed the document off to the spiny-orb team.

  Produces: `evaluation/commitizen/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on a separate branch from main (eval branches never merge). This becomes the first Type D PRD for the Python evaluation chain. Use the most recent JS eval run PRD as the milestone style reference. Carry forward both user-facing checkpoints (Findings Discussion + handoff pause) into the Run-2 PRD's milestone structure. Merge the PRD-only PR to main so `/prd-start` can pick it up.

  Success criteria: Run-2 PRD exists on main with proper milestone structure and both checkpoints.

## Dependencies and Constraints

- **Depends on**: Python language provider in spiny-orb (Gate 1)
- **Depends on**: `docs/research/eval-target-criteria.md` (Gate 2 — already satisfied)
- **Depends on**: IS integration PRD #44 (for automated IS scoring — soft dependency, can do manual scoring without it)
- **Blocks**: Python Run-2 PRD (drafted as final milestone)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Python provider may handle different code patterns than JavaScript (decorators, class methods, __init__) | First run is exploratory — document all Python-specific patterns |
| commitizen file count (~45-55) is at the upper end of the range | Many are small utility/init files that should be skipped — exercises skip judgment |
| No baseline for score prediction | This IS the baseline; use JavaScript run history for rough expectations only |
| Test suite may have flaky tests | Verify with 3 consecutive runs before instrumentation |

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | commitizen as Python target | Validated as "Pass" in eval-target-criteria.md; MIT, 3.4k stars, locally runnable, good I/O diversity | Target selection finalized |
| 2026-04-11 | No infrastructure needed for IS scoring | commitizen is locally runnable — OTel Collector + CLI invocation is sufficient | Simpler IS scoring workflow than TypeScript/Go targets |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await Gate 1 (Python provider) |
