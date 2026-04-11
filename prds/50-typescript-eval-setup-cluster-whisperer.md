# TypeScript Eval Setup + Run-1 ~~: Cluster Whisperer Baseline~~

> **NEEDS REVISION (2026-04-11):** This PRD was created before the decision to use 3 candidates per language with milestone 0 for target selection. It assumes Cluster Whisperer is the target. It must be rewritten to: (1) remove the assumed target from the title, (2) add milestone 0 evaluating 3 TS candidates from eval-target-criteria.md, (3) add auto-instrumentation library expansion milestone for spiny-orb, (4) add deliberately incomplete Weaver schema milestone. See PRD #45 decision log for full context.

**Issue**: [#50](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/50)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Type**: C (Setup + Run-1)

## Overview

The eval framework has no TypeScript evaluation chain. This PRD forks Cluster Whisperer as the TypeScript eval target, adds spiny-orb prerequisites, runs the first baseline evaluation (Run-1), and establishes the TypeScript evaluation chain. Cluster Whisperer was validated as "Conditional Pass" in `docs/research/eval-target-criteria.md` — the k8s dependency adds IS scoring complexity but is not a blocker.

## Prerequisites / Gates

**Both gates must be met before this PRD can start. Do NOT evaluate these gates now — they exist for the future implementor.**

- **Gate 1 (provider):** The TypeScript language provider must be merged to spiny-orb main. Check current status in `docs/language-extension-plan.md` "Language Candidates" table (currently "spinybacked-orbweaver PRD B (in progress)").
- **Gate 2 (research):** `docs/research/eval-target-criteria.md` must exist with a verdict for TypeScript. Before forking anything, read that file to confirm the validated target for this language.

## User Impact

- **Who benefits**: The spiny-orb team — TypeScript instrumentation quality can now be measured and tracked
- **What changes**: A second language evaluation chain exists alongside JavaScript, enabling cross-language quality comparison
- **Why now**: Blocked until TypeScript provider lands; this PRD is ready to start the moment it does

## Success Metrics

- **Primary**: Run-1 produces a complete set of evaluation artifacts in `evaluation/cluster-whisperer/run-1/`
- **Secondary**: Rubric scores establish the TypeScript baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Requirements

### Functional Requirements

- **Must Have**: Forked Cluster Whisperer repo with spiny-orb prerequisites (spiny-orb.yaml, semconv/, OTel init, peerDependencies)
- **Must Have**: Test suite passes on forked repo before instrumentation
- **Must Have**: Complete Run-1 evaluation with all standard artifacts (run-summary, failure deep-dives, per-file evaluation, PR evaluation, rubric scores, baseline comparison, actionable fix output)
- **Must Have**: Both user-facing checkpoints completed (Findings Discussion + handoff pause)
- **Should Have**: IS scoring run with Kind cluster infrastructure
- **Should Have**: Run-2 PRD drafted (first Type D for TypeScript chain)

### Non-Functional Requirements

- Evaluation feature branch (`feature/prd-50-typescript-eval-run-1`) never merges to main — PR exists for CodeRabbit review only
- Whitney runs `spiny-orb instrument` herself — AI does not run this command
- `GITHUB_TOKEN` must be in the environment for spiny-orb to create a PR

## Implementation Milestones

- [ ] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section — required milestone structure, operational details, exact instrument command; (2) "Language Candidates" table — confirm TypeScript provider status and Cluster Whisperer as the target; (3) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (4) eval branch convention (never merges to main). Also read `docs/research/eval-target-criteria.md` to confirm Cluster Whisperer's "Conditional Pass" verdict and note the k8s dependency caveat for IS scoring.

  Success criteria: Can answer — what is the exact instrument command? What are the two checkpoints? Why does the eval branch never merge?

- [ ] **Fork target repo and create eval directory structure**

  Fork Cluster Whisperer (`wiggitywhitney/cluster-whisperer`) to Whitney's GitHub account if not already forked. Create `evaluation/cluster-whisperer/run-1/` directory in the eval repo with skeleton documents: `lessons-for-run2.md`, `spiny-orb-findings.md`. Cluster Whisperer requires a Kubernetes cluster to exercise — verify that a Kind cluster can be provisioned locally and document the provisioning steps for IS scoring runs.

  Success criteria: Forked repo exists; `evaluation/cluster-whisperer/run-1/` directory created with skeleton files; Kind cluster provisioning verified.

- [ ] **Add spiny-orb prerequisites to target repo**

  In the forked Cluster Whisperer repo, add all required spiny-orb configuration. Use the commit-story-v2 JavaScript setup as the working reference (see `docs/language-extension-plan.md` "Language-specific prerequisites reference"), adapting for TypeScript:

  1. Create `spiny-orb.yaml` configuration — adapt from commit-story-v2's config, updating paths and language settings for TypeScript
  2. Create initial `semconv/` Weaver schema directory — adapt the registry structure from `commit-story-v2/semconv/` for Cluster Whisperer's domain (k8s cluster management concepts)
  3. Create TypeScript OTel init file — TypeScript compiles to JavaScript, so the mechanism is the same as Node.js (`--import` flag with SDK setup using `@opentelemetry/sdk-node`). Include `@opentelemetry/exporter-trace-otlp-http` for trace export
  4. Add OTel `@opentelemetry/api` as a peerDependency in package.json
  5. Add graceful shutdown handling to OTel SDK init file (intercept `process.exit()`, handle SIGTERM/SIGINT, flush spans before exit — same pattern as commit-story-v2's `instrumentation.js`)

  Success criteria: `spiny-orb.yaml` exists; `semconv/` directory with domain-appropriate registry; OTel init file with graceful shutdown; peerDependency declared; forked repo still builds and tests pass after these additions.

- [ ] **Verify test suite runs clean on unmodified target**

  Run Cluster Whisperer's test suite 3 times on the forked repo (after adding spiny-orb prerequisites but before any instrumentation changes). All tests must pass all 3 times — the deterministic reproducibility criterion from `docs/research/eval-target-criteria.md` requires this. If any test is flaky, document the failure and decide whether to proceed (skip the flaky test) or investigate an alternative target.

  Success criteria: 3 consecutive clean test runs documented; no flaky tests; or flaky tests documented with mitigation decision.

- [ ] **Pre-run verification**

  Verify spiny-orb TypeScript provider capabilities and validate all run prerequisites:
  1. Confirm TypeScript language provider is on spiny-orb main (Gate 1 should already be met)
  2. Verify target repo has `spiny-orb.yaml` and `semconv/` configured correctly
  3. Count `.ts` files in Cluster Whisperer's source directories — record the file inventory
  4. Rebuild spiny-orb from current branch (not necessarily main — rebuild from whatever branch it's on)
  5. Verify push auth (`GITHUB_TOKEN` in environment, dry-run push)
  6. Record version info and findings status
  7. Append observations to `evaluation/cluster-whisperer/run-1/lessons-for-run2.md`

  Success criteria: All prerequisites verified; file inventory recorded; spiny-orb built; push auth confirmed.

- [ ] **Evaluation run-1**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** The exact command is in `docs/language-extension-plan.md` — update the `run-N` placeholder and target repo path for Cluster Whisperer.

  AI role in this milestone:
  1. Confirm readiness with Whitney (all pre-run checks passed)
  2. Once Whitney provides the log output, save it to `evaluation/cluster-whisperer/run-1/spiny-orb-output.log`
  3. Write `evaluation/cluster-whisperer/run-1/run-summary.md` from the log data

  Success criteria: Log saved; run-summary.md written with file counts, cost, timing, push/PR status.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents are started: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises or regressions. Keep it conversational, under 10 lines. Wait for her acknowledgment before proceeding to failure deep-dives.

  Success criteria: Whitney has acknowledged the findings overview.

- [ ] **Failure deep-dives**

  Root cause analysis for each failed file, each partial file, and each run-level failure (push failures, token issues, etc.). This is the first TypeScript run — document any TypeScript-specific failure patterns that differ from JavaScript runs.

  Produces: `evaluation/cluster-whisperer/run-1/failure-deep-dives.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric evaluation on ALL processed files (no spot-checking). Evaluate all committed, partial, and correctly-skipped files against every applicable rubric rule. Use the canonical per-file agent methodology from the JavaScript evaluation chain.

  Produces: `evaluation/cluster-whisperer/run-1/per-file-evaluation.md` and `evaluation/cluster-whisperer/run-1/per-file-evaluation.json`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Evaluate the PR created by spiny-orb (if push succeeded). Assess PR summary accuracy, span count correctness, file status accuracy, and advisory note quality. If push failed, document the failure and evaluate any local PR summary artifacts.

  Produces: `evaluation/cluster-whisperer/run-1/pr-evaluation.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/pr-evaluation.md`

- [ ] **Rubric scoring**

  Synthesize dimension-level scores from the per-file evaluation. This is the first TypeScript run — no prior baseline exists. Establish the TypeScript baseline by documenting scores across all 6 dimensions (NDS, COV, RST, API, SCH, CDQ) plus gate status.

  Produces: `evaluation/cluster-whisperer/run-1/rubric-scores.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/rubric-scores.md`

- [ ] **Baseline comparison**

  This is the first TypeScript run — no prior TypeScript baseline exists. Document the initial baseline scores and compare against the most recent JavaScript run for cross-language context (e.g., which rubric dimensions are stronger/weaker for TypeScript vs JavaScript). Note any TypeScript-specific failure patterns not seen in JavaScript runs.

  Produces: `evaluation/cluster-whisperer/run-1/baseline-comparison.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/baseline-comparison.md` (adapt structure — this run has no prior TypeScript data, so focus on establishing the baseline and cross-language comparison)

- [ ] **IS scoring run**

  Provision a Kind cluster, configure OTel Collector with file exporter (use `evaluation/is/otelcol-config.yaml` if IS integration PRD is complete, otherwise create a minimal config), exercise Cluster Whisperer's instrumented code against the cluster, capture OTLP output, and score against the IS spec (~9 applicable rules). Document all infrastructure setup steps for reproducibility in future runs.

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main. If it does, IS integration is complete — use the scoring script. If it does not exist, skip automated scoring and instead document the raw OTLP output for manual review. Note this in the milestone status.

  Produces: `evaluation/cluster-whisperer/run-1/is-scores.md`

- [ ] **Actionable fix output**

  Primary handoff deliverable for the spiny-orb team. At milestone completion:
  1. Run the cross-document audit agent: launch an Agent with prompt "Verify consistency across all evaluation artifacts in evaluation/cluster-whisperer/run-1/. Check that file counts, span counts, scores, and findings references match across run-summary.md, per-file-evaluation.md, rubric-scores.md, baseline-comparison.md, and failure-deep-dives.md. Report any discrepancies."
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable TypeScript-specific patterns, what to watch for in run-2
  3. Print the absolute file path of `evaluation/cluster-whisperer/run-1/actionable-fix-output.md` (derive from current working directory)
  4. **Pause.** Do not proceed to Draft Run-2 PRD until Whitney confirms she has handed the document off to the spiny-orb team.

  Produces: `evaluation/cluster-whisperer/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on a separate branch from main (eval branches never merge). This becomes the first Type D PRD for the TypeScript evaluation chain. Use the most recent JS eval run PRD as the milestone style reference. Carry forward both user-facing checkpoints (Findings Discussion + handoff pause) into the Run-2 PRD's milestone structure. Merge the PRD-only PR to main so `/prd-start` can pick it up.

  Success criteria: Run-2 PRD exists on main with proper milestone structure and both checkpoints.

## Dependencies and Constraints

- **Depends on**: TypeScript language provider in spiny-orb (Gate 1)
- **Depends on**: `docs/research/eval-target-criteria.md` (Gate 2 — already satisfied)
- **Depends on**: IS integration PRD #44 (for automated IS scoring — soft dependency, can do manual scoring without it)
- **Blocks**: TypeScript Run-2 PRD (drafted as final milestone)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Cluster Whisperer k8s dependency adds IS scoring complexity | Kind cluster provisioning is routine; document setup steps for reproducibility |
| TypeScript provider may have different failure modes than JavaScript | First run is exploratory — document all TypeScript-specific patterns for future runs |
| No baseline for score prediction | This IS the baseline; use JavaScript run history for rough expectations only |
| Test suite may have flaky tests | Verify with 3 consecutive runs before instrumentation; document any flaky tests |

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | Cluster Whisperer as TypeScript target | Validated as "Conditional Pass" in eval-target-criteria.md; k8s dependency noted but not blocking | Target selection finalized |
| 2026-04-11 | IS scoring milestone included | Cluster Whisperer requires Kind cluster for IS scoring — dedicated milestone documents infrastructure setup | IS scoring workflow defined |
| 2026-04-11 | Eval branch convention applies | Per language-extension-plan.md: eval branches never merge to main; PRs for CodeRabbit review only | Branch management |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await Gate 1 (TypeScript provider) |
