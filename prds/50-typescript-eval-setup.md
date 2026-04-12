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

### Eval Branch Convention

The feature branch for this PRD **never merges to main**. The PR exists for CodeRabbit review only. When `/prd-done` runs at completion, close the issue without merging the eval branch.

## Success Metrics

- **Primary**: Best TS target selected with documented rationale; Run-1 produces complete evaluation artifacts
- **Secondary**: Rubric scores establish the TypeScript baseline for future runs
- **Validation**: All evaluation artifacts pass cross-document audit; both user-facing checkpoints completed

## Key Inputs

- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules across 6 dimensions: NDS, COV, RST, API, SCH, CDQ)
- **Candidate shortlist**: `docs/research/eval-target-criteria.md` (3 TS candidates)
- **Auto-instrumentation library list**: `~/Documents/Repositories/spinybacked-orbweaver/src/languages/javascript/ast.ts` (`KNOWN_FRAMEWORK_PACKAGES`, line ~124 — shared by JS and TS providers)
- **Language extension plan**: `docs/language-extension-plan.md` (Type C structure, instrument command, checkpoints)
- **OTel bootstrap reference**: `docs/research/instrumentation-score-integration.md` (SDK bootstrap by language table)

## Implementation Milestones

- [ ] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section — required milestone structure, operational details, exact instrument command; (2) "Language Candidates" table — confirm TypeScript provider status; (3) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (4) eval branch convention (never merges to main). Also read `docs/research/eval-target-criteria.md` to understand the criteria scorecard and review the 3 TypeScript candidates. Read `docs/research/instrumentation-score-integration.md` for TypeScript OTel bootstrap details (same as Node.js: `--import` flag with SDK setup).

  Success criteria: Can answer — what are the 3 TS candidates? What is the instrument command? What are the two checkpoints?

- [ ] **Milestone 0: Evaluate 3 TypeScript candidates and choose target**

  Read `docs/research/eval-target-criteria.md` Section 2.2 before cloning anything. The COV-006 overlap analysis and per-rule coverage table for all 3 TS candidates are already complete — do not redo them.

  **What the research already covers (do not repeat):**
  - COV-006 overlap: taze (ofetch→undici, conditional on KFP update), changesets (none), wireit (none)
  - Full 24-rule differentiating coverage table with ✓/✗/🔍 for all 3 candidates
  - File counts (taze: 33, changesets: 25, wireit: 62), I/O types, licenses, star counts

  **What still requires local verification (do these for all 3 candidates):**
  1. Clone the repo
  2. Run the test suite 3 times — flaky tests disqualify; this cannot be pre-researched
  3. Confirm source file count from local clone matches the research doc's count
  4. Confirm no existing OTel instrumentation (grep for `@opentelemetry` and `startActiveSpan`)
  5. Note any caveats discovered during cloning that differ from the research

  Using the pre-researched comparison table from Section 2.2 and the local verification results above, make the final selection. Decision factors: rubric coverage (pre-researched in table), test reliability (local), confirmed file count (local), no existing OTel (local). Accept an above-30-file candidate only if the extra rules it exercises justify the longer runtime — document that justification. Prefer candidates from different GitHub orgs (same-org candidates share coding conventions).

  Present the recommendation to Whitney with rationale. Do not proceed until Whitney confirms the selection.

  Success criteria: One candidate selected with documented rubric-coverage rationale. Whitney's approval obtained.

- [ ] **Add TypeScript auto-instrumentation libraries to spiny-orb**

  Work in `~/Documents/Repositories/spinybacked-orbweaver/` on a feature branch. The TypeScript provider reuses the JavaScript `KNOWN_FRAMEWORK_PACKAGES` list in `src/languages/javascript/ast.ts` (around line 124) via the shared `detectOTelImports` import. Review whether any TypeScript-specific packages need to be added. Cross-reference against `@opentelemetry/auto-instrumentations-node` for coverage. Run `npm test` to verify. If new entries are needed, submit a PR to spiny-orb.

  Success criteria: KNOWN_FRAMEWORK_PACKAGES is current and complete for TypeScript usage. Any additions submitted as a PR with passing tests.

- [ ] **Fork target repo and create eval directory structure**

  Fork the chosen candidate to Whitney's GitHub account. Create `evaluation/<target-name>/run-1/` directory in the eval repo with these skeleton files: `lessons-for-run2.md`, `spiny-orb-findings.md`. Reference `~/Documents/Repositories/commit-story-v2/spiny-orb.yaml` and `~/Documents/Repositories/commit-story-v2/semconv/` as the working examples for prerequisites. If the chosen target requires infrastructure (e.g., k8s cluster), document the provisioning steps.

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

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** Copy the command template from `docs/language-extension-plan.md` (line ~72). Replace `commit-story-v2` with the chosen target name, `run-N` with `run-1`, and `src` with the target's source directory.
  AI role: (1) confirm readiness, (2) save log, (3) write run-summary.md.

  Success criteria: Log saved; run-summary.md written.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  Raw overview for Whitney. Under 10 lines. Wait for acknowledgment.

- [ ] **Failure deep-dives**

  Produces: `evaluation/<target-name>/run-1/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/<target-name>/run-1/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Produces: `evaluation/<target-name>/run-1/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring**

  First TypeScript run — establish baseline.
  Produces: `evaluation/<target-name>/run-1/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **Baseline comparison**

  No prior TypeScript baseline. Compare against most recent JS run for cross-language context. Compare: overall rubric score, per-dimension scores (NDS/COV/RST/API/SCH/CDQ), file counts, skip rate, and cost. Highlight dimensions where scores differ.
  Produces: `evaluation/<target-name>/run-1/baseline-comparison.md`

- [ ] **IS scoring run**

  **Conditional:** Check if `evaluation/is/otelcol-config.yaml` exists on main. If yes, use scoring script. If no, skip IS scoring entirely and write `is-scores.md` containing only: "IS scoring deferred — infrastructure not yet on main (PRD #44)."
  Produces: `evaluation/<target-name>/run-1/is-scores.md`

- [ ] **Actionable fix output**

  1. Run cross-document audit agent.
  2. *(User-facing checkpoint 2)* Interpreted summary for Whitney.
  3. Print absolute path. **Pause** until Whitney confirms handoff.
  Produces: `evaluation/<target-name>/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on separate branch from main (eval branches never merge). Use Type D structure from `docs/language-extension-plan.md` and `prds/37-evaluation-run-13.md` as the milestone style reference. First Type D PRD for TypeScript chain. Carry forward both checkpoints. Merge the PRD-only PR to main.

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
