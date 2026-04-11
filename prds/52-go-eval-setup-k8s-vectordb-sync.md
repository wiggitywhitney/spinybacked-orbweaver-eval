# Go Eval Setup + Run-1 ~~: k8s-vectordb-sync Baseline~~

> **NEEDS REVISION (2026-04-11):** This PRD was created before the decision to use 3 candidates per language with milestone 0 for target selection. It assumes k8s-vectordb-sync is the target. It must be rewritten to: (1) remove the assumed target from the title, (2) add milestone 0 evaluating 3 Go candidates from eval-target-criteria.md, (3) add auto-instrumentation library expansion milestone for spiny-orb, (4) add deliberately incomplete Weaver schema milestone. See PRD #45 decision log for full context.

**Issue**: [#52](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/52)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Type**: C (Setup + Run-1)

## Overview

The eval framework has no Go evaluation chain. This PRD forks k8s-vectordb-sync as the Go eval target, adds spiny-orb prerequisites, runs the first baseline evaluation (Run-1), and establishes the Go evaluation chain. k8s-vectordb-sync was validated as "Conditional Pass" in `docs/research/eval-target-criteria.md` — the k8s dependency adds IS scoring complexity (requires Kind cluster AND vector database setup) but is not a blocker.

## Prerequisites / Gates

**Both gates must be met before this PRD can start. Do NOT evaluate these gates now — they exist for the future implementor.**

- **Gate 1 (provider):** The Go language provider must be merged to spiny-orb main. Check current status in `docs/language-extension-plan.md` "Language Candidates" table (currently "spinybacked-orbweaver PRD E (future)").
- **Gate 2 (research):** `docs/research/eval-target-criteria.md` must exist with a verdict for Go. Before forking anything, read that file to confirm the validated target for this language.

## User Impact

- **Who benefits**: The spiny-orb team — Go instrumentation quality can now be measured and tracked
- **What changes**: A fourth language evaluation chain exists alongside JavaScript, TypeScript, and Python
- **Why now**: Blocked until Go provider lands; this PRD is ready to start the moment it does

## Success Metrics

- **Primary**: Run-1 produces a complete set of evaluation artifacts in `evaluation/k8s-vectordb-sync/run-1/`
- **Secondary**: Rubric scores establish the Go baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Requirements

### Functional Requirements

- **Must Have**: Forked k8s-vectordb-sync repo with spiny-orb prerequisites (spiny-orb.yaml, semconv/, OTel bootstrap, dependencies)
- **Must Have**: Test suite passes on forked repo before instrumentation
- **Must Have**: Complete Run-1 evaluation with all standard artifacts
- **Must Have**: Both user-facing checkpoints completed (Findings Discussion + handoff pause)
- **Should Have**: IS scoring run (requires Kind cluster + vector DB — most complex IS scoring of all targets)
- **Should Have**: Run-2 PRD drafted (first Type D for Go chain)

### Non-Functional Requirements

- Evaluation feature branch (`feature/prd-52-go-eval-run-1`) never merges to main — PR exists for CodeRabbit review only
- Whitney runs `spiny-orb instrument` herself — AI does not run this command
- `GITHUB_TOKEN` must be in the environment for spiny-orb to create a PR

## Implementation Milestones

- [ ] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section — required milestone structure, operational details, exact instrument command; (2) "Language Candidates" table — confirm Go provider status and k8s-vectordb-sync as the target; (3) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (4) eval branch convention (never merges to main). Also read `docs/research/eval-target-criteria.md` to confirm k8s-vectordb-sync's "Conditional Pass" verdict and note the k8s + vector DB dependency caveat.

  Note: Go OTel bootstrap differs significantly from JavaScript and Python. Read `docs/research/instrumentation-score-integration.md` "SDK Bootstrap by Language" table for Go-specific patterns: `setupOTelSDK()` in `main()`, `defer shutdown(ctx)` + explicit `os/signal.Notify` handlers (defer alone does not cover `os.Exit`, `log.Fatal*`, or unhandled signals).

  Success criteria: Can answer — what is the exact instrument command (adapted for Go/k8s-vectordb-sync)? What are the two checkpoints? What is the Go OTel bootstrap mechanism? Why does `defer` alone not suffice for graceful shutdown?

- [ ] **Fork target repo and create eval directory structure**

  Fork k8s-vectordb-sync (`wiggitywhitney/k8s-vectordb-sync`) to Whitney's GitHub account if not already forked. Create `evaluation/k8s-vectordb-sync/run-1/` directory in the eval repo with skeleton documents: `lessons-for-run2.md`, `spiny-orb-findings.md`. k8s-vectordb-sync requires both a Kubernetes cluster AND a vector database to exercise — document the full infrastructure provisioning steps (Kind cluster + vector DB deployment) for IS scoring runs.

  Success criteria: Forked repo exists; `evaluation/k8s-vectordb-sync/run-1/` directory created with skeleton files; infrastructure provisioning steps documented.

- [ ] **Add spiny-orb prerequisites to target repo**

  In the forked k8s-vectordb-sync repo, add all required spiny-orb configuration. Use the commit-story-v2 JavaScript setup as the conceptual reference (see `docs/language-extension-plan.md` "Language-specific prerequisites reference"), but adapt for Go's OTel ecosystem:

  1. Create `spiny-orb.yaml` configuration — adapt from commit-story-v2's config, updating paths and language settings for Go
  2. Create initial `semconv/` Weaver schema directory — adapt the registry structure for k8s-vectordb-sync's domain (k8s operations, vector database synchronization, embedding operations)
  3. Create Go OTel bootstrap function — implement `setupOTelSDK()` using `go.opentelemetry.io/otel/sdk/trace` and OTLP exporter. Must be called in `main()` with `defer shutdown(ctx)` AND explicit `os/signal.Notify` handlers for SIGTERM/SIGINT (defer alone does not cover `os.Exit()`, `log.Fatal*`, or unhandled signals — see `docs/research/instrumentation-score-integration.md`)
  4. Add OTel dependencies to `go.mod`: `go.opentelemetry.io/otel` (API only — per global CLAUDE.md OpenTelemetry Packaging rules, libraries depend on the API, not the SDK)
  5. Add graceful shutdown: `defer shutdown(ctx)` + `os/signal.Notify` for SIGTERM/SIGINT to flush spans before exit

  Success criteria: `spiny-orb.yaml` exists; `semconv/` directory with domain-appropriate registry; OTel bootstrap function with graceful shutdown; API dependency declared in go.mod; forked repo still builds and tests pass after these additions.

- [ ] **Verify test suite runs clean on unmodified target**

  Run k8s-vectordb-sync's test suite 3 times on the forked repo (after adding spiny-orb prerequisites but before any instrumentation changes). All tests must pass all 3 times. Note: some tests may require a running k8s cluster — if so, provision a Kind cluster for test runs and document the setup.

  Success criteria: 3 consecutive clean test runs documented; no flaky tests; infrastructure requirements for testing documented.

- [ ] **Pre-run verification**

  Verify spiny-orb Go provider capabilities and validate all run prerequisites:
  1. Confirm Go language provider is on spiny-orb main (Gate 1 should already be met)
  2. Verify target repo has `spiny-orb.yaml` and `semconv/` configured correctly
  3. Count `.go` files in k8s-vectordb-sync's source directories (excluding `_test.go` files) — record the file inventory
  4. Rebuild spiny-orb from current branch (not necessarily main — rebuild from whatever branch it's on)
  5. Verify push auth (`GITHUB_TOKEN` in environment, dry-run push)
  6. Record version info and findings status
  7. Append observations to `evaluation/k8s-vectordb-sync/run-1/lessons-for-run2.md`

  Success criteria: All prerequisites verified; file inventory recorded; spiny-orb built; push auth confirmed.

- [ ] **Evaluation run-1**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** The exact command is in `docs/language-extension-plan.md` — update the `run-N` placeholder and target repo path for k8s-vectordb-sync.

  AI role in this milestone:
  1. Confirm readiness with Whitney (all pre-run checks passed)
  2. Once Whitney provides the log output, save it to `evaluation/k8s-vectordb-sync/run-1/spiny-orb-output.log`
  3. Write `evaluation/k8s-vectordb-sync/run-1/run-summary.md` from the log data

  Success criteria: Log saved; run-summary.md written with file counts, cost, timing, push/PR status.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents are started: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises or regressions. Keep it conversational, under 10 lines. Wait for her acknowledgment before proceeding to failure deep-dives.

  Success criteria: Whitney has acknowledged the findings overview.

- [ ] **Failure deep-dives**

  Root cause analysis for each failed file, each partial file, and each run-level failure. This is the first Go run — document any Go-specific failure patterns that differ from JavaScript runs (e.g., goroutine/channel patterns, interface handling, struct method receivers, error return patterns).

  Produces: `evaluation/k8s-vectordb-sync/run-1/failure-deep-dives.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric evaluation on ALL processed files (no spot-checking). Evaluate all committed, partial, and correctly-skipped files against every applicable rubric rule.

  Produces: `evaluation/k8s-vectordb-sync/run-1/per-file-evaluation.md` and `evaluation/k8s-vectordb-sync/run-1/per-file-evaluation.json`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Evaluate the PR created by spiny-orb (if push succeeded). Assess PR summary accuracy, span count correctness, file status accuracy, and advisory note quality. If push failed, document the failure and evaluate any local PR summary artifacts.

  Produces: `evaluation/k8s-vectordb-sync/run-1/pr-evaluation.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/pr-evaluation.md`

- [ ] **Rubric scoring**

  Synthesize dimension-level scores from the per-file evaluation. This is the first Go run — no prior baseline exists. Establish the Go baseline by documenting scores across all 6 dimensions (NDS, COV, RST, API, SCH, CDQ) plus gate status.

  Produces: `evaluation/k8s-vectordb-sync/run-1/rubric-scores.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/rubric-scores.md`

- [ ] **Baseline comparison**

  This is the first Go run — no prior Go baseline exists. Document the initial baseline scores and compare against the most recent JavaScript run for cross-language context. Note any Go-specific failure patterns not seen in JavaScript runs (e.g., goroutine context propagation, interface-based dispatch, error return value instrumentation).

  Produces: `evaluation/k8s-vectordb-sync/run-1/baseline-comparison.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/commit-story-v2/run-12/baseline-comparison.md` (adapt structure — focus on establishing baseline and cross-language comparison)

- [ ] **IS scoring run**

  k8s-vectordb-sync requires the most complex IS scoring setup of all targets: Kind cluster + vector database. Provision a Kind cluster, deploy the vector database, configure OTel Collector with file exporter (use `evaluation/is/otelcol-config.yaml` if IS integration PRD is complete, otherwise create a minimal config), exercise k8s-vectordb-sync's instrumented code against the live infrastructure, capture OTLP output, and score against IS spec (~9 applicable rules). Document all infrastructure setup steps for reproducibility.

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main. If it does, IS integration is complete — use the scoring script. If it does not exist, skip automated scoring and instead document the raw OTLP output for manual review.

  Produces: `evaluation/k8s-vectordb-sync/run-1/is-scores.md`

- [ ] **Actionable fix output**

  Primary handoff deliverable for the spiny-orb team. At milestone completion:
  1. Run the cross-document audit agent: launch an Agent with prompt "Verify consistency across all evaluation artifacts in evaluation/k8s-vectordb-sync/run-1/. Check that file counts, span counts, scores, and findings references match across run-summary.md, per-file-evaluation.md, rubric-scores.md, baseline-comparison.md, and failure-deep-dives.md. Report any discrepancies."
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable Go-specific patterns, what to watch for in run-2
  3. Print the absolute file path of `evaluation/k8s-vectordb-sync/run-1/actionable-fix-output.md` (derive from current working directory)
  4. **Pause.** Do not proceed to Draft Run-2 PRD until Whitney confirms she has handed the document off to the spiny-orb team.

  Produces: `evaluation/k8s-vectordb-sync/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on a separate branch from main (eval branches never merge). This becomes the first Type D PRD for the Go evaluation chain. Use the most recent JS eval run PRD as the milestone style reference. Carry forward both user-facing checkpoints (Findings Discussion + handoff pause) into the Run-2 PRD's milestone structure. Merge the PRD-only PR to main so `/prd-start` can pick it up.

  Success criteria: Run-2 PRD exists on main with proper milestone structure and both checkpoints.

## Dependencies and Constraints

- **Depends on**: Go language provider in spiny-orb (Gate 1)
- **Depends on**: `docs/research/eval-target-criteria.md` (Gate 2 — already satisfied)
- **Depends on**: IS integration PRD #44 (for automated IS scoring — soft dependency, can do manual scoring without it)
- **Blocks**: Go Run-2 PRD (drafted as final milestone)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| k8s + vector DB infrastructure adds significant IS scoring complexity | Document setup steps; Kind + vector DB deployment is routine but adds failure modes |
| Go provider may handle different patterns than JavaScript (goroutines, interfaces, error returns) | First run is exploratory — document all Go-specific patterns |
| No baseline for score prediction | This IS the baseline; use JavaScript run history for rough expectations only |
| Test suite may require running k8s cluster | Provision Kind cluster for testing; document infrastructure requirements |

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | k8s-vectordb-sync as Go target | Validated as "Conditional Pass" in eval-target-criteria.md; k8s + vector DB dependency noted | Target selection finalized |
| 2026-04-11 | Most complex IS scoring workflow | k8s-vectordb-sync requires Kind cluster + vector DB — dedicated IS milestone with full infrastructure docs | Infrastructure setup documented for reproducibility |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await Gate 1 (Go provider) |
