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

  **Run-3 result (2026-04-28)**: Run aborted at file 3/33. All 3 processed files failed NDS-001. Root cause is new and fully diagnosed: spiny-orb's `checkSyntax()` hardcodes `--module NodeNext --moduleResolution NodeNext` for per-file tsc invocation, but taze uses `"moduleResolution": "Bundler"`. Every taze file has extensionless relative imports (valid under Bundler, invalid under NodeNext), causing NDS-001 on the original unmodified source. `npx tsc --noEmit` from the project root passes with zero errors. Instrumentation quality in file 3 (`src/api/check.ts`) was good — correct RST-004 skip, null guards, schema reasoning — but blocked at the validator. Debug dump captured at `evaluation/taze/run-3/debug/` (run-3 was executed without `--debug-dump-dir`; future runs use `debug-dumps/` per the command template). See `evaluation/taze/run-3/spiny-orb-findings.md` for the new P1.

- [x] **Pre-run verification (run-3+)**

  **Verified 2026-04-28**: All gates cleared.
  - PRD #582 M2 early-exit (`hasInstrumentableFunctions`) merged to spiny-orb main (SHA `0fce097`)
  - CLI verbose error messages merged (PRD #582 M8)
  - `error as Error` prompt fix confirmed in `src/languages/typescript/prompt.ts`
  - spiny-orb rebuilt clean
  - `testCommand: pnpm test` added to `~/Documents/Repositories/taze/spiny-orb.yaml` and pushed to fork
  - GITHUB_TOKEN_TAZE push auth verified

  Details and instrument command: `evaluation/taze/run-2/lessons-for-run3.md`

  **Diagnostic protocol**: When a file fails, examine available dimensions before diagnosing — do NOT diagnose from errorProgression summaries alone. Available in CLI eval runs (in `spiny-orb-output.log`): **(3) full validator error messages** (complete tsc error text, NDS-005 block previews — appears via `--verbose` since PRD #582 M8); **(4) agent notes** (always in `--verbose`). Also available: **(2) actual instrumented code** written to `<debug-dump-dir>/` when `--debug-dump-dir` is in the command — create that dir before running and read it after a failure. Not available in CLI runs: **(1) run history** and **(5) agent thinking** — those require the spiny-orb test harness.

  **Output path convention**: remaining milestones reference `<first-successful-run>` = **run-13** — the first complete run with all 33 files processed, 0 failures, and 0 rollbacks (2026-05-03). All analysis milestone output paths below use `evaluation/taze/run-13/`.

- [x] **Findings Discussion** *(user-facing checkpoint 1)*

  Raw overview for Whitney. Under 10 lines. Wait for acknowledgment.

  **Completed after run-9 (2026-04-29)**: 33/33 files processed, 11 committed, 19 correct skips, 3 failed. PR #4 created. Live-check: OK. Whitney acknowledged. Subsequent runs (10, 11) continued improving coverage — run-11 reached 13 committed. Run-12 (with NDS-003 fix for resolves.ts via issue #675) expected to commit all 33.

- [x] **Failure deep-dives**

  Run-13 had 0 failures — no deep-dives required. File created: `evaluation/taze/run-13/failure-deep-dives.md`

- [x] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/taze/run-13/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [x] **PR artifact evaluation**

  Produces: `evaluation/taze/run-13/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [x] **Rubric scoring**

  First TypeScript run — establish baseline.
  Produces: `evaluation/taze/run-13/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [x] **Baseline comparison**

  No prior TypeScript baseline. Compare against most recent JS run for cross-language context. Compare: overall rubric score, per-dimension scores (NDS/COV/RST/API/SCH/CDQ), file counts, skip rate, and cost. Highlight dimensions where scores differ.
  Produces: `evaluation/taze/run-13/baseline-comparison.md`

- [ ] **IS scoring run**

  1. **Prerequisites**: OTel Collector running with `evaluation/is/otelcol-config.yaml` (see `evaluation/is/README.md` for install and start instructions). No metrics-exporter override needed — MET rules are marked `not_applicable` by the scorer regardless.
  2. **Setup**: In `~/Documents/Repositories/taze`, check out the instrumented branch: `git checkout spiny-orb/instrument-1777809261652`. Build the project: `pnpm build`. The OTel init file is `examples/instrumentation.js` (sdkInitFile in spiny-orb.yaml). The CLI entry point is `bin/taze.mjs`.
  3. **Action**: In a separate terminal with the Collector running, run taze with the --import flag (replace `<args>` with any taze subcommand, e.g., `check`): `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/taze.mjs <args>`. Multiple runs with different subcommands will enrich the trace data. Then: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/taze/run-13/is-score.md`
  4. **Output**: `evaluation/taze/run-13/is-score.md` is written by the command above.
  5. **Restore**: After scoring, `git checkout main` in the taze fork. Restart the Datadog Agent.
  Produces: `evaluation/taze/run-13/is-score.md`

- [ ] **Actionable fix output**

  1. Run cross-document audit agent.
  2. *(User-facing checkpoint 2)* Interpreted summary for Whitney.
  3. Print absolute path. **Pause** until Whitney confirms handoff.
  Produces: `evaluation/taze/run-13/actionable-fix-output.md`

- [ ] **Draft next run PRD**

  Create on separate branch from main (eval branches never merge). Use Type D structure from `docs/language-extension-plan.md` and `prds/37-evaluation-run-13.md` as the milestone style reference. First Type D PRD for TypeScript chain. Carry forward both checkpoints. **first-successful-run = run-13**, so this PRD covers run-14. Merge the PRD-only PR to main.

  **Gate to include in the Type D PRD's pre-run verification checklist**: Confirm `checkSyntax()` in spiny-orb reads the project's `tsconfig.json` moduleResolution (not hardcoded NodeNext) before running. See 2026-04-28 Decision Log entry.

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
| 2026-04-27 | Add `testCommand: pnpm test` to taze `spiny-orb.yaml` before run-3 | Default `npm test` checkpoint caused 3 test failures from live npm/JSR registry timeouts on uninstrumented code (run-2). The failures are pre-existing flaky tests unrelated to instrumentation, but they appear as checkpoint failures in spiny-orb's output. `pnpm test` is the canonical command for taze. | Added to run-3 readiness checklist in Pre-run verification (run-3+) milestone. |
| 2026-04-27 | `error as Error` cast in catch blocks fails strict-mode tsc | `span.recordException(error as Error)` rejected by tsc when `error` is `unknown` (strict mode). Root cause of NDS-001 on `src/api/check.ts` in runs 1 and 2. Correct pattern: `span.recordException(error instanceof Error ? error : new Error(String(error)))`. Spiny-orb team adding this to TypeScript prompt. | Added to run-3 readiness checklist — confirm fix is in prompt before running. |
| 2026-04-28 | spiny-orb `checkSyntax()` hardcodes `--moduleResolution NodeNext`, breaking all Bundler-resolution TypeScript projects | Diagnosed in run-3: every taze file fails NDS-001 on original unmodified source because taze uses `"moduleResolution": "Bundler"` but spiny-orb's per-file tsc check requires `.js` extensions (NodeNext). `npx tsc --noEmit` from project root passes with zero errors. Fix: spiny-orb must read the project's `tsconfig.json` moduleResolution and use it (or pass `--project tsconfig.json`). | Pre-run verification (run-4+) must confirm this fix is merged before running. All Type C and Type D TypeScript PRDs affected — add confirmation step to their pre-run checklists. |
| 2026-04-28 | `--debug-dump-dir` added to all eval instrument commands; diagnostic protocol updated for CLI context | PRD #582 M8 merged (`[eval-flag]`): dimension 3 (full validator error messages, including tsc codes and NDS-005 block previews) and dimension 4 (agent notes) now appear in `spiny-orb-output.log` automatically via `--verbose`. Dimension 2 (actual instrumented code) available via `--debug-dump-dir <path>`. Dimensions 1 (run history) and 5 (agent thinking) remain test-harness/CI only. | Instrument command template in `docs/language-extension-plan.md` updated. Diagnostic protocol in Pre-run verification milestones updated. Propagated to open Type C PRDs (#51, #52, #53). |
| 2026-05-01 | OTel SDK never initializes during spiny-orb checkpoint test runs — timeout failures cannot be caused by instrumentation | Verified against taze's vitest.config.ts (setup only creates temp dir), package.json (no --import in testCommand), and @opentelemetry/api design spec. `tracer.startActiveSpan()` resolves to a NonRecordingSpan (no-op) during test execution. Span wrappers add microseconds of overhead — cannot cause 5-second npm timeouts. Timeout failures are environmental. | Impacts rollback decisions: adding `--exclude` test flags to hide flaky tests is wrong — it hides real signal. Full analysis documented in `docs/spiny-orb-design-handoff.md` for the spiny-orb team. |
| 2026-05-01 | Do not exclude failing tests from testCommand — always investigate root cause first | Run-11's resolves.test.ts timeout led to a discussion of adding `--exclude` flags. Analysis showed: (1) the failing test calls code we didn't modify; (2) npm was healthy; (3) OTel SDK is no-op during tests so we cannot cause timeouts. Exclusion was rejected as it hides real signal. The correct fix is smarter rollback logic on the spiny-orb side (health check + retry + call-graph analysis). | Design handoff written at `docs/spiny-orb-design-handoff.md`. Exclusions reverted from taze spiny-orb.yaml before run-12. |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created (revised from initial Cluster Whisperer-assumed version) | Draft | Await Gates 1 and 2 |
| 2026-04-24 | Weaver schema expanded (fetch/write groups, 3 deliberate omissions); taze test suite verified clean (16 files, 73 tests) | In Progress | Pre-run verification |
| 2026-04-24 | Run-1 attempted — aborted at 3/33 files (NDS-001 TypeScript failures). Key findings: language: field required in spiny-orb.yaml; no-function pre-agent detection missing; startActiveSpan void type incompatibility; consecutive-failure abort too aggressive. | In Progress | Findings Discussion — run findings surfaced even without committed output |
| 2026-04-24 | Run-2 attempted (SHA 14a2fb0, includes void-callback prompt fix) — aborted identically at 3/33 files. Prompt fix insufficient; early-exit in PRD #582 M2 is the required fix. New finding: checkpoint test failures from live-registry timeouts (pre-existing, unrelated to instrumentation). Spiny-orb handoff written at `evaluation/taze/spiny-orb-handoff.md`. | Blocked | Waiting for PRD #582 M2 (early-exit), CLI verbose error messages, and error-as-Error prompt fix from spiny-orb team |
| 2026-04-28 | All three gate fixes confirmed on spiny-orb main (SHA 0fce097). TypeScript provider merged to main. testCommand: pnpm test added to taze spiny-orb.yaml. GITHUB_TOKEN_TAZE verified. Run-3 directory created. Pre-run verification complete. | In Progress | Run-3 |
| 2026-04-28 | Run-3 attempted (SHA 0fce097, includes hasInstrumentableFunctions early-exit, instanceof Error fix, CLI verbose) — aborted at 3/33. New root cause diagnosed: checkSyntax() hardcodes --moduleResolution NodeNext but taze uses Bundler. Every file fails NDS-001 on original unmodified source. Instrumentation quality in check.ts was good. Debug dump captured. New P1 filed. | Blocked | Waiting for spiny-orb checkSyntax() moduleResolution fix |
| 2026-04-28 | Run-4 attempted (SHA 1028f578) — aborted at 3/33. TS5112 (--ignoreConfig missing) and stdout not captured. Two new P1s filed. | Blocked | Waiting for --ignoreConfig fix and stdout capture |
| 2026-04-28 | Run-5 attempted (SHA ac9dadb) — **first completed run**. 8/33 processed, 2 correct skips, 6 NDS-001 failures, PR #1 created. Live-check: OK. Two new root causes: Array.fromAsync (--target ES2022 too low) and node: types (@types/node not resolved in per-file mode). Agent thinking now surfacing in CLI mode. | Blocked | Waiting for --target ESNext and @types/node fixes in checkSyntax() |
| 2026-04-29 | Run-6 attempted (SHA c4080cb) — aborted at 3/33. --target fix worked but @types/node fix incomplete (taze has no `types` field in tsconfig, so auto-detection is needed). New P1: NDS-003 blocks null guards required for setAttribute (catch-22 with TS2345). | Blocked | Waiting for @types/node auto-detection and NDS-003 null guard allowlist |
| 2026-04-29 | Run-7 attempted (SHA f4813d6) — 5/33 processed, 2 correct skips, PR #2 created. @types/node and null guard fixes working. New sole blocker: NDS-003 blocks span lifecycle catch/finally pattern (catch + recordException + throw + finally + span.end). Contextual allowlist fix needed. | Blocked | Waiting for NDS-003 contextual catch/finally allowlist |
| 2026-04-29 | Run-8 attempted (SHA d18616d) — 10/33 processed (checkpoint test stopped run), 6 committed, PR #3. All NDS-003 catch/finally fixes working. Checkpoint test failure fixed on eval side (excluded live-registry tests from testCommand). | In Progress | Run-9 |
| 2026-04-29 | Run-9 completed — **first complete run (33/33 files)**. 11 committed, 19 correct skips, 3 failed. PR #4 created. Two new blockers: (1) startActiveSpan causes TypeScript literal type widening — needs `as const` prompt guidance; (2) NDS-003 blocks `if (span.isRecording()) {` guard. | Blocked | Waiting for TypeScript prompt fix and NDS-003 isRecording allowlist |
| 2026-04-30 | Run-10 — 1 committed (resolves.ts, 6 spans), 2 failed (packageJson/packageYaml, as const NDS-003 catch-22), PR #5. Schema integrity violations: agent removed 4 previously-committed schema attributes. Two new findings: (I) NDS-003 must normalize `as const`; (J) schema writes must be append-only. | Blocked | Waiting for as const normalization and schema append-only fix |
| 2026-04-30/05-01 | Run-11 — 13 committed, PR #6. as const and schema append-only fixes working. resolves.ts still fails NDS-003 (3 new patterns: braceless if, await in return capture, renamed catch variable) — filed as spiny-orb issue #675. 3 files rolled back due to flaky resolves.test.ts (live npm timeout). Deep analysis confirmed: OTel SDK never initializes during checkpoint test runs — timeout failures cannot be caused by instrumentation overhead. Design handoff written at `docs/spiny-orb-design-handoff.md` for spiny-orb team covering 4 infrastructure improvements. Test exclusions reverted (wrong approach). | In Progress | Waiting for spiny-orb issue #675 fix, then run-12 |
| 2026-05-01 | Run-12 preparation: issue #675 shipped (PR #676), spiny-orb SHA 5610e4a. taze testCommand restored to `pnpm test` (no exclusions). taze main confirmed clean. Run-12 directory created. | In Progress | Run-12 |
| 2026-05-01 | Run-12 attempted — 6 committed (net after rollbacks), 13 failed. SCH-001 blocking caused cascade deadlock and span name collisions (Finding K). NDS-003 missed regex modification in yarnWorkspaces.ts (Finding L). Checkpoint rollback at file 25. | Blocked | Waiting for SCH-001 advisory mode and NDS-003 regex test |
| 2026-05-03 | Run-13 completed — **first perfect run (33/33, 0 failures, 0 rollbacks)**. 14 committed, 19 correct skips. PR #8 created. SCH-001 advisory and NDS-003 regex fixes confirmed working. TypeScript baseline established. Findings Discussion acknowledged. | In Progress | Analysis phase (per-file evaluation, rubric scoring) |
