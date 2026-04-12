# TypeScript Eval Setup + Run-1: Target Selection and Baseline

**Issue**: [#50](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/50)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Type**: C (Setup + Run-1)

## Overview

The eval framework has no TypeScript evaluation chain. This PRD evaluates 3 TypeScript candidates from the shortlist in `docs/research/eval-target-criteria.md`, selects the best one based on rubric rule coverage, forks it, adds spiny-orb prerequisites, and runs the first baseline evaluation (Run-1).

## Prerequisites / Gates

- **Gate 1 (provider):** The TypeScript language provider must be merged to spiny-orb main. Check current status in `docs/language-extension-plan.md` "Language Candidates" table.
- **Gate 2 (research):** `docs/research/eval-target-criteria.md` must exist with 3 TypeScript candidates before this PRD can start.

## Success Metrics

- **Primary**: Best TS target selected with documented rationale; Run-1 produces complete evaluation artifacts
- **Secondary**: Rubric scores establish the TypeScript baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Key Inputs

- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules across 6 dimensions: NDS, COV, RST, API, SCH, CDQ)
- **Candidate shortlist**: `docs/research/eval-target-criteria.md` (3 TS candidates)
- **Auto-instrumentation library list**: `spinybacked-orbweaver/src/languages/javascript/ast.ts` (`KNOWN_FRAMEWORK_PACKAGES`, line ~124 — shared by JS and TS providers)
- **Language extension plan**: `docs/language-extension-plan.md` (Type C structure, instrument command, checkpoints)
- **OTel bootstrap reference**: `docs/research/instrumentation-score-integration.md` (SDK bootstrap by language table)

## Implementation Milestones

- [ ] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section — required milestone structure, operational details, exact instrument command; (2) "Language Candidates" table — confirm TypeScript provider status; (3) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (4) eval branch convention (never merges to main). Also read `docs/research/eval-target-criteria.md` to understand the criteria scorecard and review the 3 TypeScript candidates. Read `docs/research/instrumentation-score-integration.md` for TypeScript OTel bootstrap details (same as Node.js: `--import` flag with SDK setup).

  Success criteria: Can answer — what are the 3 TS candidates? What is the instrument command? What are the two checkpoints?

- [ ] **Milestone 0: Evaluate 3 TypeScript candidates and choose target**

  Read the 3 TypeScript candidate assessments from `docs/research/eval-target-criteria.md`. For each candidate:
  1. Clone the repo
  2. Run the test suite 3 times (deterministic reproducibility check)
  3. Count `.ts` source files (excluding tests, configs, generated, `.d.ts`). Ideal: 30 or less.
  4. Check `package.json` dependencies against spiny-orb's `KNOWN_FRAMEWORK_PACKAGES` list (`spinybacked-orbweaver/src/languages/javascript/ast.ts` — shared by JS and TS providers) for auto-instrumentation library overlap (COV-006 testability)
  5. Map rubric rule coverage: for each of the 32 rubric rules, assess whether this candidate's code patterns can exercise it
  6. Note any caveats (already instrumented, infrastructure dependencies, etc.)

  Compare the 3 candidates. Pick the one that exercises the most rubric rules while staying at or below 30 source files. A candidate above 30 files is acceptable if the extra files exercise rubric rules that the smaller candidates cannot — document the justification. Prefer candidates from different GitHub authors/organizations — same-author candidates share coding style and reduce rubric diversity.

  Present the recommendation to Whitney with rationale. Do not proceed until Whitney confirms the selection.

  Success criteria: One candidate selected with documented rubric-coverage rationale. Whitney's approval obtained.

- [ ] **Add TypeScript auto-instrumentation libraries to spiny-orb**

  The TypeScript provider reuses the JavaScript `KNOWN_FRAMEWORK_PACKAGES` list via `detectOTelImports` import. Review whether any TypeScript-specific packages need to be added (e.g., TypeScript-only HTTP clients, TS-specific ORMs). Cross-reference against `@opentelemetry/auto-instrumentations-node` for coverage. If new entries are needed, submit a PR to spiny-orb.

  Success criteria: KNOWN_FRAMEWORK_PACKAGES is current and complete for TypeScript usage. Any additions submitted as a PR.

- [ ] **Fork target repo and create eval directory structure**

  Fork the chosen candidate to Whitney's GitHub account. Create `evaluation/<target-name>/run-1/` directory in the eval repo with skeleton documents: `lessons-for-run2.md`, `spiny-orb-findings.md`. If the chosen target requires infrastructure to exercise (e.g., k8s cluster), document the provisioning steps.

  Success criteria: Forked repo exists; eval directory created with skeleton files.

- [ ] **Add spiny-orb prerequisites to target repo**

  In the forked target repo:
  1. Create `spiny-orb.yaml` configuration (adapt from commit-story-v2 reference, adjusting for TypeScript)
  2. Create initial `semconv/` Weaver schema directory for the target's domain
  3. Create TypeScript OTel init file — same mechanism as Node.js (`--import` flag with SDK setup using `@opentelemetry/sdk-node`). Include `@opentelemetry/exporter-trace-otlp-http`. Add graceful shutdown (intercept `process.exit()`, SIGTERM/SIGINT handlers, flush spans)
  4. Add OTel `@opentelemetry/api` as a peerDependency in package.json

  Success criteria: All prerequisites present. Forked repo builds and tests pass.

- [ ] **Create deliberately incomplete Weaver schema**

  The `semconv/` schema should deliberately omit some spans and attributes that a human would include. Tests whether spiny-orb identifies missing attributes and proposes schema extensions (SCH extension capability). The process: (1) first draft a complete schema covering all domain concepts, (2) then remove items to create the deliberately incomplete version, (3) document both versions so the eval can compare.

  **What to omit**: Domain-specific attributes that spiny-orb should be able to infer from reading the code — not trivial metadata like `service.version`. Good omissions: attributes for function parameters that appear in the code, span names for operations the code clearly performs. Bad omissions: generic OTel attributes that don't require code understanding.

  Success criteria: Complete schema drafted first. At least 3 semantically meaningful omissions documented with rationale.

- [ ] **Verify test suite runs clean on unmodified target**

  Run test suite 3 times after adding prerequisites but before instrumentation. All must pass.

  Success criteria: 3 consecutive clean test runs documented.

- [ ] **Pre-run verification**

  1. Verify TypeScript language provider is on spiny-orb main
  2. Verify target repo has spiny-orb.yaml and semconv/ configured
  3. Count .ts files — record file inventory
  4. Rebuild spiny-orb from current branch
  5. Verify push auth (GITHUB_TOKEN)
  6. Record version info
  7. Append observations to lessons-for-run2.md

  Success criteria: All prerequisites verified; file inventory recorded.

- [ ] **Evaluation run-1**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.**
  AI role: (1) confirm readiness, (2) save log, (3) write run-summary.md.

  Success criteria: Log saved; run-summary.md written.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  Raw overview for Whitney. Under 10 lines. Wait for acknowledgment.

- [ ] **Failure deep-dives**

  Produces: `evaluation/<target-name>/run-1/failure-deep-dives.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/run-12/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/<target-name>/run-1/per-file-evaluation.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/run-12/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Produces: `evaluation/<target-name>/run-1/pr-evaluation.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/run-12/pr-evaluation.md`

- [ ] **Rubric scoring**

  First TypeScript run — establish baseline.
  Produces: `evaluation/<target-name>/run-1/rubric-scores.md`
  Style reference: `git show feature/prd-33-evaluation-run-12:evaluation/run-12/rubric-scores.md`

- [ ] **Baseline comparison**

  No prior TypeScript baseline. Compare against most recent JS run for cross-language context.
  Produces: `evaluation/<target-name>/run-1/baseline-comparison.md`

- [ ] **IS scoring run**

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main. If yes, use scoring script. If no, document raw OTLP output.
  Produces: `evaluation/<target-name>/run-1/is-scores.md`

- [ ] **Actionable fix output**

  1. Run cross-document audit agent.
  2. *(User-facing checkpoint 2)* Interpreted summary for Whitney.
  3. Print absolute path. **Pause** until Whitney confirms handoff.
  Produces: `evaluation/<target-name>/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on separate branch from main. First Type D PRD for TypeScript chain. Carry forward both checkpoints.

## Dependencies and Constraints

- **Depends on**: TypeScript language provider in spiny-orb (Gate 1)
- **Depends on**: `docs/research/eval-target-criteria.md` with 3 TS candidates (Gate 2)
- **Blocks**: TypeScript Run-2 PRD

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| All 3 candidates have issues during validation | Research provided 3 specifically to handle this; worst case, expand search |
| TypeScript provider has different failure modes than JS | First run is exploratory; document all TS-specific patterns |
| No baseline for score prediction | This IS the baseline; use JS history for rough expectations |

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | 3 candidates evaluated in milestone 0, not pre-selected | Target selection happens during implementation with hands-on validation | Milestone 0 added |
| 2026-04-11 | Auto-instrumentation library expansion is a milestone | TS reuses JS KNOWN_FRAMEWORK_PACKAGES; verify completeness | Contribution to spiny-orb |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created (revised from initial Cluster Whisperer-assumed version) | Draft | Await Gates 1 and 2 |
