# JavaScript Eval Setup + Run-1: Target Selection and Baseline

**Issue**: [#53](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/53)
**Status**: Draft
**Owner**: Whitney Lee
**Created**: 2026-04-11
**Last Updated**: 2026-04-11
**Type**: C (Setup + Run-1)

## Overview

commit-story-v2 was chosen as the JavaScript eval target by circumstance, not by evidence-based criteria. This PRD evaluates 3 JavaScript candidates (including commit-story-v2) against the rubric-coverage-based scorecard in `docs/research/eval-target-criteria.md`. If commit-story-v2 wins the evaluation, this PRD exits early — it's already set up and running with 12 runs of history. If a different candidate wins, this PRD proceeds with fork, setup, and Run-1 on the new target.

## Prerequisites / Gates

- **Gate 1 (provider):** JavaScript provider already exists in spiny-orb. No gate.
- **Gate 2 (research):** `docs/research/eval-target-criteria.md` must exist with 3 JavaScript candidates before this PRD can start.

### Eval Branch Convention

If this PRD proceeds past milestone 0 (i.e., a new target is selected), the feature branch **never merges to main**. The PR exists for CodeRabbit review only. When `/prd-done` runs at completion, close the issue without merging the eval branch. If milestone 0 selects commit-story-v2 (early exit), no eval branch is created.

## Success Metrics

- **Primary**: Best JS target selected with documented rationale based on rubric rule coverage
- **If early exit**: Decision documented; existing commit-story-v2 eval chain continues
- **If new target**: Run-1 produces complete evaluation artifacts; JavaScript baseline established

## Key Inputs

- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules across 6 dimensions: NDS, COV, RST, API, SCH, CDQ)
- **Candidate shortlist**: `docs/research/eval-target-criteria.md` (3 JS candidates)
- **Auto-instrumentation library list**: `~/Documents/Repositories/spinybacked-orbweaver/src/languages/javascript/ast.ts` (`KNOWN_FRAMEWORK_PACKAGES`, line ~124)
- **Language extension plan**: `docs/language-extension-plan.md` (Type C structure, instrument command, checkpoints)

## Implementation Milestones

- [x] **Step 0: Read `docs/language-extension-plan.md` completely before proceeding with any other milestone**

  Read the full document, paying particular attention to: (1) "Type C: Setup + Run-1 PRD" section — required milestone structure, operational details, exact instrument command; (2) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (3) eval branch convention (never merges to main). Also read `docs/research/eval-target-criteria.md` to understand the criteria scorecard and review the 3 JavaScript candidates.

  Success criteria: Can answer — what are the 3 JS candidates? What rubric rules does each exercise? What is the instrument command?

- [x] **Milestone 0: Evaluate 3 JavaScript candidates and choose target**

  Read `docs/research/eval-target-criteria.md` Section 2.1 before cloning anything. The COV-006 overlap analysis and per-rule coverage table for all 3 JS candidates are already complete — do not redo them.

  **What the research already covers (do not repeat):**
  - COV-006 overlap: commit-story-v2 (Traceloop via langchain+MCP), release-it (undici in KFP), npm-check (none)
  - Full 24-rule differentiating coverage table with ✓/✗/🔍 for all 3 candidates
  - File counts, I/O types, licenses, star counts, IS scorability notes

  **What still requires local verification (do these for all 3 candidates):**
  1. Clone the repo
  2. Run the test suite 3 times — flaky tests disqualify; this cannot be pre-researched
  3. Confirm source file count from local clone matches the research doc's count
  4. Confirm no existing OTel instrumentation (grep for `@opentelemetry` and `startActiveSpan`)
  5. Note any caveats discovered during cloning that differ from the research

  Using the pre-researched comparison table from Section 2.1 and the local verification results above, make the final selection. Decision factors: rubric coverage (pre-researched in table), test reliability (local), confirmed file count (local), no existing OTel (local). Accept an above-30-file candidate only if the extra rules it exercises justify the longer runtime — document that justification. Prefer candidates from different GitHub orgs (same-org candidates share coding conventions).

  **If commit-story-v2 wins**: Document the rationale. This PRD exits early — commit-story-v2 is already set up with 12 runs of history. Mark all remaining milestones as skipped. The existing JavaScript eval chain (PRDs #37+) continues.

  **If a different candidate wins**: Pause and present the rationale to Whitney. Explain why the alternative exercises more rubric rules than commit-story-v2. Do not proceed until Whitney confirms. Note: existing commit-story-v2 eval history (runs 2-12) remains valid as prototype/development history regardless.

  Success criteria: One candidate selected with documented rubric-coverage rationale. Either early exit confirmed or Whitney's approval to proceed with new target.

- [x] **Add JavaScript auto-instrumentation libraries to spiny-orb**

  Work in `~/Documents/Repositories/spinybacked-orbweaver/` on a feature branch. Review and update `KNOWN_FRAMEWORK_PACKAGES` in `src/languages/javascript/ast.ts` (around line 124). Cross-reference against `@opentelemetry/auto-instrumentations-node` package list to ensure nothing major is missing. Run `npm test` to verify changes don't break anything. If new entries are needed, submit a PR to spiny-orb.

  Success criteria: KNOWN_FRAMEWORK_PACKAGES is current and complete for JavaScript. Any additions submitted as a PR with passing tests.

- [x] **Fork target repo and create eval directory structure**

  Fork the chosen candidate to Whitney's GitHub account. Create `evaluation/<target-name>/run-1/` directory in the eval repo with these skeleton files: `lessons-for-run2.md`, `spiny-orb-findings.md`. Reference `~/Documents/Repositories/commit-story-v2/spiny-orb.yaml` and `~/Documents/Repositories/commit-story-v2/semconv/` as the working examples for spiny-orb prerequisites.

  Success criteria: Forked repo exists; eval directory created with skeleton files.

- [x] **Add spiny-orb prerequisites to target repo**

  In the forked target repo, add all required spiny-orb configuration:
  1. Create `spiny-orb.yaml` configuration (adapt from commit-story-v2 reference)
  2. Create initial `semconv/` Weaver schema directory for the target's domain
  3. Create JavaScript OTel init file (`--import` flag with SDK setup using `@opentelemetry/sdk-node`). Add graceful shutdown: register `SIGTERM` and `SIGINT` handlers that call `sdk.shutdown()` and then `process.exit(0)` — do not intercept `process.exit()` directly
  4. Add OTel `@opentelemetry/api` as a peerDependency in package.json

  Success criteria: spiny-orb.yaml, semconv/, OTel init file, and peerDependency all present. Forked repo builds and tests pass.

- [x] **Create deliberately incomplete Weaver schema**

  The `semconv/` schema created in the previous milestone should deliberately omit some spans and attributes that a human would include. This tests whether spiny-orb identifies missing attributes and proposes schema extensions (SCH extension capability). The process: (1) first draft a complete schema covering all domain concepts, (2) then remove items to create the deliberately incomplete version, (3) document both the complete and incomplete versions so the eval can compare.

  **What to omit**: Domain-specific attributes that spiny-orb should be able to infer from reading the code — not trivial metadata like `service.version`. Good omissions: attributes for function parameters that appear in the code, span names for operations the code clearly performs, semantic attributes for external calls the code makes. Bad omissions: generic OTel attributes that don't require code understanding.

  Success criteria: Complete schema drafted first. At least 3 semantically meaningful omissions documented with rationale for why spiny-orb should be able to infer each one.

- [x] **Verify test suite runs clean on unmodified target**

  Run the test suite 3 times on the forked repo (after adding spiny-orb prerequisites but before any instrumentation). All tests must pass all 3 times.

  **release-it caveat**: `tag.gpgsign=true` in the global git config causes tag-creation tests to fail. Run tests with: `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test` where that file contains only `[user] email = test@test.com` and `name = Test User`. This workaround must be used for all test runs on this target.

  Success criteria: 3 consecutive clean test runs documented.

- [x] **Pre-run verification**

  Verify spiny-orb JavaScript provider and validate all run prerequisites:
  1. Verify target repo has `spiny-orb.yaml` and `semconv/` configured correctly
  2. Count `.js` files in source directories — record the file inventory
  3. Rebuild spiny-orb from current branch
  4. Verify push auth (`GITHUB_TOKEN` in environment)
  5. Record version info
  6. Append observations to `evaluation/<target-name>/run-1/lessons-for-run2.md`

  Success criteria: All prerequisites verified; file inventory recorded; spiny-orb built; push auth confirmed.

- [x] **Evaluation run-1**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** Copy the command template from `docs/language-extension-plan.md` (line ~72). Replace `commit-story-v2` with the chosen target name, `run-N` with `run-1`, and `src` with the target's source directory (check the forked repo's structure — it may be `src/`, `lib/`, or `.`).

  AI role: (1) confirm readiness, (2) save log output to `evaluation/<target-name>/run-1/spiny-orb-output.log`, (3) write `evaluation/<target-name>/run-1/run-summary.md`, (4) **push the eval branch to origin immediately** (`git push -u origin feature/prd-53-javascript-eval-setup`) — the branch holds the only copy of run-1 artifacts until PRD #57's backfill lands.

  Success criteria: Log saved; run-summary.md written with file counts, cost, timing, push/PR status.

- [x] **Findings Discussion** *(user-facing checkpoint 1)*

  After run-summary.md is written, before any evaluation documents: report to Whitney with a raw overview. Conversational, under 10 lines. Wait for acknowledgment.

  Success criteria: Whitney has acknowledged the findings overview.

- [x] **Failure deep-dives**

  Root cause analysis for each failed/partial file and run-level failures.
  Produces: `evaluation/<target-name>/run-1/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [x] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/<target-name>/run-1/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [x] **PR artifact evaluation**

  Produces: `evaluation/<target-name>/run-1/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [x] **Rubric scoring**

  Produces: `evaluation/<target-name>/run-1/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [x] **Baseline comparison**

  If this is a new JS target, compare against commit-story-v2's most recent run for cross-target context. Compare: overall rubric score, per-dimension scores (NDS/COV/RST/API/SCH/CDQ), file counts, skip rate, and cost. Highlight dimensions where the new target scores differ by more than 1 point.
  Produces: `evaluation/<target-name>/run-1/baseline-comparison.md`

- [x] **IS scoring run**

  1. **Prerequisites**: OTel Collector running with `evaluation/is/otelcol-config.yaml` (see `evaluation/is/README.md` for install and start instructions). No metrics-exporter override needed — MET rules are marked `not_applicable` by the scorer regardless.
  2. **Action**: Run the target app with the Collector as OTLP receiver; collect `evaluation/is/eval-traces.json`; run `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/<target-name>/run-1/is-score.md`
  3. **Output**: `evaluation/<target-name>/run-1/is-score.md` is written by the command above.
  4. **Note for k8s repos**: IS scoring requires a running cluster; see `evaluation/is/README.md` for the Kind-based workflow
  Produces: `evaluation/<target-name>/run-1/is-score.md`

- [x] **Actionable fix output**

  1. Run cross-document audit agent: launch an Agent to verify consistency across all run-1 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Interpreted summary for Whitney.
  3. Print absolute file path of actionable-fix-output.md.
  4. **Pause** until Whitney confirms handoff.
  Produces: `evaluation/<target-name>/run-1/actionable-fix-output.md`

- [ ] **Draft Run-2 PRD**

  Create on a separate branch from main (eval branches never merge). Use Type D structure from `docs/language-extension-plan.md` and `prds/37-evaluation-run-13.md` as the milestone style reference. Carry forward both user-facing checkpoints. Merge the PRD-only PR to main so `/prd-start` can pick it up.
  Success criteria: Run-2 PRD PR merged to main with proper milestone structure and both checkpoints.

## Dependencies and Constraints

- **Depends on**: `docs/research/eval-target-criteria.md` with 3 JS candidates (Gate 2)
- **Depends on**: IS integration PRD #44 (soft dependency for automated IS scoring)
- **Blocks**: JavaScript Run-2 PRD

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| commit-story-v2 wins and this PRD is mostly a formality | Early exit path makes this low-cost. The formal evaluation still adds value by documenting why commit-story-v2 is the right choice. |
| A better JS target is found but switching loses 12 runs of history | Existing runs remain valid as prototype history. New target starts fresh with Run-1. |
| New target has unexpected issues during setup | 3 candidates means fallback options exist without another research cycle. |

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2026-04-11 | JS gets its own Type C PRD with early exit | commit-story-v2 should be formally evaluated, not assumed correct. Early exit if it wins keeps this low-cost. | PRD created |
| 2026-04-11 | commit-story-v2 must be one of the 3 candidates | 12 runs of history is valuable; it should compete on merit, not be excluded | Candidate shortlist includes it |
| 2026-04-18 | release-it selected as new JS eval target | Local verification: release-it passes 3/3 test runs (262/264 tests, 0 failures) with GIT_CONFIG_GLOBAL override to disable tag.gpgsign. npm-check disqualified (util.isDate Node.js compat failure). commit-story-v2 also passes 3/3 runs. Both score 25 exercisable rubric rules. release-it preferred per research doc (best I/O diversity, different domain, ~31 min runtime vs ~40 min). Decision to run both as parallel JS eval chains — release-it as new target (this PRD), commit-story-v2 continuing its existing chain. | All remaining milestones proceed for release-it. Test caveat: run tests with GIT_CONFIG_GLOBAL pointing to a minimal config without tag.gpgsign. |

## Progress Log

| Date | Update | Status | Next Steps |
|------|--------|--------|------------|
| 2026-04-11 | PRD created | Draft | Await Gate 2 (3 JS candidates in eval-target-criteria.md) |
| 2026-04-18 | Step 0 and Milestone 0 complete; release-it selected | In Progress | Fork release-it, create eval directory structure |
| 2026-04-18 | KNOWN_FRAMEWORK_PACKAGES expanded in spiny-orb (PR #506); release-it forked to wiggitywhitney/release-it; evaluation/release-it/run-1/ created with skeleton files | In Progress | Add spiny-orb prerequisites to release-it fork |
| 2026-04-18 | spiny-orb prerequisites added to wiggitywhitney/release-it: spiny-orb.yaml, semconv/ schema (attributes.yaml + registry_manifest.yaml), examples/instrumentation.js OTel init, @opentelemetry/api peerDependency. Tests: 262/264 pass, 0 failures. | In Progress | Create deliberately incomplete Weaver schema |
| 2026-04-18 | Deliberately incomplete Weaver schema created. schema-complete.yaml documents all 4 omitted attributes (release_it.git.tag_annotation, release_it.github.release_name, release_it.github.release_url, release_it.npm.publish_path). schema-omissions.md explains each omission with code citations. semconv/attributes.yaml in forked repo is confirmed incomplete. | In Progress | Verify test suite runs clean on unmodified target |
| 2026-04-18 | Test suite baseline confirmed: 3/3 clean runs (262/264 pass, 0 fail, 2 consistently skipped). Skips: "should not roll back with risky config" and "should truncate long body" — stable, unrelated to instrumentation. | In Progress | Pre-run verification |
| 2026-04-18 | Pre-run verification complete. 23 .js files in lib/. spiny-orb rebuilt from main (SHA a02004f, includes PR #506 KNOWN_FRAMEWORK_PACKAGES). GITHUB_TOKEN resolves via vals. Versions: Node v25.8.0, spiny-orb 1.0.0, release-it 20.0.0. .vals.yaml copied to release-it fork and .gitignored. File inventory and instrument command recorded in lessons-for-run2.md. | In Progress | Evaluation run-1 |
| 2026-04-18 | Evaluation run-1 complete (partial — 5/23 files processed). Run halted at file 5 due to checkpoint test failure (gpgsign issue: spiny-orb runs `npm test` without GIT_CONFIG_GLOBAL override). 2 files failed LINT oscillation (config.js, index.js). PR creation failed (PAT lacks createPellRequest permission). Cost: $0.68. run-summary.md written. | In Progress | Findings Discussion → resolve 3 run-2 blockers |
| 2026-04-20 | Full run-1 evaluation complete: failure-deep-dives, per-file-evaluation, pr-evaluation, rubric-scores, baseline-comparison, is-score, actionable-fix-output all written. Checkpoint 2 handoff confirmed. 8 spiny-orb findings filed (2 P1, 2 P2, 2 P3 + audit meta-recommendation). | In Progress | Draft Run-2 PRD |
