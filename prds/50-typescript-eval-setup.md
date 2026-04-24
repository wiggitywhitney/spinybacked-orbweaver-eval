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

- [x] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section — required milestone structure, operational details, exact instrument command; (2) "Language Candidates" table — confirm TypeScript provider status; (3) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (4) eval branch convention (never merges to main). Also read `docs/research/eval-target-criteria.md` to understand the criteria scorecard and review the 3 TypeScript candidates. Read `docs/research/instrumentation-score-integration.md` for TypeScript OTel bootstrap details (same as Node.js: `--import` flag with SDK setup).

  Success criteria: Can answer — what are the 3 TS candidates? What is the instrument command? What are the two checkpoints?

- [x] **Milestone 0: Evaluate 3 TypeScript candidates and choose target**

  Read `docs/research/eval-target-criteria.md` Section 2.2 before cloning anything. The COV-006 overlap analysis and per-rule coverage table for all 3 TS candidates are already complete — do not redo them.

  **What the research already covers (do not repeat):**
  - COV-006 overlap: taze (ofetch→undici, conditional on KFP update), changesets (none), wireit (none)
  - Full 24-rule differentiating coverage table with ✓/✗/🔍 for all 3 candidates
  - File counts (taze: 33, changesets: 25, wireit: 62), I/O types, licenses, star counts

  **What still requires local verification (do these for all 3 candidates):**
  1. Clone the repo
  2. Run the test suite once — must pass; this cannot be pre-researched
  3. Confirm source file count from local clone matches the research doc's count
  4. Confirm no existing OTel instrumentation (grep for `@opentelemetry` and `startActiveSpan`)
  5. Note any caveats discovered during cloning that differ from the research

  Using the pre-researched comparison table from Section 2.2 and the local verification results above, make the final selection. Decision factors: rubric coverage (pre-researched in table), test reliability (local), confirmed file count (local), no existing OTel (local). Accept an above-30-file candidate only if the extra rules it exercises justify the longer runtime — document that justification. Prefer candidates from different GitHub orgs (same-org candidates share coding conventions).

  Present the recommendation to Whitney with rationale. Do not proceed until Whitney confirms the selection.

  Success criteria: One candidate selected with documented rubric-coverage rationale. Whitney's approval obtained.

- [x] **Add TypeScript auto-instrumentation libraries to spiny-orb**

  Work in `~/Documents/Repositories/spinybacked-orbweaver/` on a feature branch. The TypeScript provider reuses the JavaScript `KNOWN_FRAMEWORK_PACKAGES` list in `src/languages/javascript/ast.ts` (around line 124) via the shared `detectOTelImports` import. Review whether any TypeScript-specific packages need to be added. Cross-reference against `@opentelemetry/auto-instrumentations-node` for coverage. Run `npm test` to verify. If new entries are needed, submit a PR to spiny-orb.

  Success criteria: KNOWN_FRAMEWORK_PACKAGES is current and complete for TypeScript usage. Any additions submitted as a PR with passing tests.

- [x] **Fork target repo and create eval directory structure**

  Fork taze (`antfu-collective/taze`) to `wiggitywhitney/taze`. Then:
  0. Confirm pnpm is installed: `pnpm --version`. If missing: `npm install -g pnpm@10` (taze requires pnpm; without it, install and test commands fail).
  1. Apply the test fix from the 2026-04-24 Decision Log: in `test/versions.test.ts`, relax the 'newest' mode assertions (lines ~71–75) from `expect(newest).toBe(getMaxSatisfying(...))` to `expect(getMaxSatisfying(...)).toBeTruthy()`. This eliminates the pre-existing live-registry test failure that would confuse checkpoint interpretation.
  2. Also add `@opentelemetry/api` to `devDependencies` so checkpoint tests can resolve the import after instrumentation adds `import { trace } from '@opentelemetry/api'` to source files: `pnpm add -D @opentelemetry/api`
  3. Commit both changes to fork main and push.
  4. Create `evaluation/taze/run-1/` directory in the eval repo with skeleton files: `lessons-for-run2.md`, `spiny-orb-findings.md`.

  Reference `~/Documents/Repositories/commit-story-v2/spiny-orb.yaml` and `~/Documents/Repositories/commit-story-v2/semconv/` as working examples for prerequisites.

  Success criteria: Forked repo exists with test fix and OTel devDep committed; eval directory created with skeleton files.

- [x] **Add spiny-orb prerequisites to target repo**

  In the forked target repo:
  1. Create `spiny-orb.yaml` configuration (adapt from commit-story-v2 reference, adjusting for TypeScript)
  2. Create initial `semconv/` Weaver schema directory for the target's domain
  3. Create TypeScript OTel init file — same mechanism as Node.js (`--import` flag with SDK setup using `@opentelemetry/sdk-node`). Include `@opentelemetry/exporter-trace-otlp-http`. Add graceful shutdown: register `SIGTERM` and `SIGINT` handlers that call `sdk.shutdown()` and then `process.exit(0)` — do not intercept `process.exit()` directly
  4. Add OTel `@opentelemetry/api` as a peerDependency in package.json

  Success criteria: All prerequisites present. Forked repo builds and tests pass.

- [x] **Create deliberately incomplete Weaver schema**

  The `semconv/` schema should deliberately omit some spans and attributes that a human would include. Tests whether spiny-orb identifies missing attributes and proposes schema extensions (SCH extension capability). The process: (1) first draft a complete schema covering all domain concepts, (2) then remove items to create the deliberately incomplete version, (3) document both versions so the eval can compare.

  **What to omit**: Domain-specific attributes that spiny-orb should be able to infer from reading the code — not trivial metadata like `service.version`. Good omissions: attributes for function parameters that appear in the code, span names for operations the code clearly performs. Bad omissions: generic OTel attributes that don't require code understanding.

  Success criteria: Complete schema drafted first. At least 3 semantically meaningful omissions documented with rationale.

  **Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md` — lists all 3 omitted attributes with the code location that makes each omission obvious to a human, and includes the complete YAML snippets that would appear in a full schema. Eval reviewers scoring SCH rules should read this file before interpreting spiny-orb's schema extension proposals.

- [x] **Verify test suite runs clean on unmodified target**

  Run test suite once after adding prerequisites but before instrumentation. It must pass.

  Success criteria: 1 clean test run documented.

- [x] **Pre-run verification**

  1. Verify TypeScript language provider is available: confirm `feature/prd-372-typescript-provider` is checked out in `~/Documents/Repositories/spinybacked-orbweaver/` and record the SHA. (Gate 1 waived — running from feature branch per 2026-04-24 decision.)
  2. Verify target repo has spiny-orb.yaml and semconv/ configured
  3. Count .ts files — record file inventory
  4. Rebuild spiny-orb from current branch
  5. Verify push auth: confirm `GITHUB_TOKEN_TAZE` resolves and has write access. Push to a non-existent branch (avoids false "fetch first" rejection if local is behind remote): `vals exec -i -f .vals.yaml -- bash -c 'git -C ~/Documents/Repositories/taze push --dry-run https://x-access-token:$GITHUB_TOKEN_TAZE@github.com/wiggitywhitney/taze.git HEAD:refs/heads/spiny-orb/auth-test'` — expect `[new branch] HEAD -> spiny-orb/auth-test`. Any auth error means wrong token; stop and regenerate per `~/.claude/rules/eval-github-pat.md`.
  6. Record version info
  7. Append observations to lessons-for-run2.md

  Success criteria: All prerequisites verified; file inventory recorded.

- [x] **Evaluation run-1**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** Copy the command template from `docs/language-extension-plan.md` (line ~72). Replace `commit-story-v2` with the chosen target name, `run-N` with `run-1`, and `src` with the target's source directory.
  AI role: (1) confirm readiness, (2) save log, (3) write run-summary.md, (4) **push the eval branch to origin immediately** (`git push -u origin feature/prd-50-typescript-eval-setup`) — the branch holds the only copy of run-1 artifacts until PRD #57's backfill lands.

  Success criteria: Log saved; run-summary.md written; eval branch on origin.

  **Run-1 result (2026-04-24)**: Run aborted at file 3/33. All 3 processed files failed NDS-001 (TypeScript compilation errors). Two distinct root causes: (1) no-function files (re-exports, pure sync utilities) routed through agent instead of skipped pre-agent; (2) `startActiveSpan()` return type incompatible with void synchronous methods. A third cause was cross-file optional property access rejected by tsc. Consecutive-failure abort threshold stopped the run before the remaining 30 files were reached. 0 files committed, no PR created. Artifacts: `spiny-orb-output.log`, `run-summary.md`. See `spiny-orb-findings.md` for P1 findings filed against the TS provider.

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

  1. **Prerequisites**: OTel Collector running with `evaluation/is/otelcol-config.yaml` (see `evaluation/is/README.md` for install and start instructions). No metrics-exporter override needed — MET rules are marked `not_applicable` by the scorer regardless.
  2. **Action**: Run the target app with the Collector as OTLP receiver; collect `evaluation/is/eval-traces.json`; run `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/<target-name>/run-1/is-score.md`
  3. **Output**: `evaluation/<target-name>/run-1/is-score.md` is written by the command above.
  4. **Note for k8s repos**: IS scoring requires a running cluster; see `evaluation/is/README.md` for the Kind-based workflow
  Produces: `evaluation/<target-name>/run-1/is-score.md`

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
| 2026-04-24 | Build from `feature/prd-372-typescript-provider` (not main) | Spiny-orb team needs eval results to close C7 before merging to main — chicken-and-egg. Document branch SHA in pre-run verification. | Gate 1 ("provider merged to main") waived for this run; update gate wording for future PRDs once pattern is established. |
| 2026-04-24 | 1 passing test suite run is sufficient for candidate validation | 3× reproducibility check is a methodology default; for known-stable CLI tools with vitest suites, 1× is sufficient to confirm no infrastructure failures | Milestone 0 test validation step updated to 1 run. |
| 2026-04-24 | taze (antfu-collective/taze) selected as TypeScript eval target | Best I/O diversity of the 3 candidates: HTTP (ofetch to npm/JSR registry) + file (package.json, yaml, lockfiles) + subprocess (package manager commands). 33 source files. Runner-up: changesets (25 files, subprocess+file only, no HTTP). wireit not evaluated (62 files, too long a runtime). | Fork, prerequisites, schema, and eval run all target `wiggitywhitney/taze`. |
| 2026-04-24 | Fix taze's live-registry test in the fork rather than excluding it | `test/versions.test.ts > getMaxSatisfying` fails because the 'newest' mode assertions compare `tags.next` to `getMaxSatisfying()` but the function's implementation has diverged from what `tags.next` returns on live npm. Fix: relax 'newest' assertions from strict equality (`expect(newest).toBe(...)`) to existence checks (`expect(...).toBeTruthy()`). pnpm (required by taze) installed globally via `npm install -g pnpm@10`. | Fork milestone must apply this test fix before verifying clean test run. |
| 2026-04-24 | Schema design documentation goes in `semconv/SCHEMA_DESIGN.md` in the fork, with explicit pointers in the PRD milestone and in `spiny-orb-findings.md` | Eval reviewers scoring SCH rules need to know what was deliberately omitted. PROGRESS.md alone is insufficient — reviewers read the PRD and the run-1 findings file, not PROGRESS.md. Without pointers in those two places, the comparison is effectively undiscoverable. | All Type C PRDs (#51, #52, #53) and `docs/language-extension-plan.md` updated with the same pointer pattern. |
| 2026-04-24 | `spiny-orb.yaml` requires an explicit `language: <id>` field to activate the correct provider | Without it, `coordinate()` defaults to `JavaScriptProvider` for file discovery regardless of target language — surfaced during Run-1 first attempt (exited immediately with "No JavaScript files found in .../taze/src"). Also: `targetType: short-lived` is required for CLI tools that exit after running; without it the default `long-lived` may select the wrong span processor. | `language: typescript` and `targetType: short-lived` added to `~/Documents/Repositories/taze/spiny-orb.yaml`. All Type C PRDs (#51, #52, #53) and `docs/language-extension-plan.md` updated to include these fields in the spiny-orb.yaml setup step. |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created (revised from initial Cluster Whisperer-assumed version) | Draft | Await Gates 1 and 2 |
| 2026-04-24 | Weaver schema expanded (fetch/write groups, 3 deliberate omissions); taze test suite verified clean (16 files, 73 tests) | In Progress | Pre-run verification |
| 2026-04-24 | Run-1 attempted — aborted at 3/33 files (NDS-001 TypeScript failures). Key findings: language: field required in spiny-orb.yaml; no-function pre-agent detection missing; startActiveSpan void type incompatibility; consecutive-failure abort too aggressive. | In Progress | Findings Discussion — run findings surfaced even without committed output |
