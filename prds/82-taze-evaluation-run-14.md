# PRD #82: TS Evaluation Run-14: taze — CDQ-006 isRecording Guard Verification

**Status:** Ready
**Created:** 2026-05-03
**GitHub Issue:** [#82](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/82)
**Depends on:** PRD #50 (taze run-13 complete, actionable fix output delivered, 5 findings filed)

---

## Problem Statement

Run-13 scored 27/29 (93%) quality with 14 committed files, 0 run failures (no NDS-001/NDS-002 blocks, no rollbacks), and 19 correct skips — the first perfect TypeScript eval run. Two quality-rule failures remain in the rubric score:

1. **CDQ-006 FAIL** (5 files, 8 instances): Inline O(n) computations (`reduce()`, `filter()`, `Object.keys()`) passed directly to `span.setAttribute()` without `span.isRecording()` guards. The CDQ-006 validator catches all of these; the advisory pass failed to result in fixes. Spiny-orb issue #728 addresses the advisory pass gap.

2. **SCH-003 FAIL** (2 files, 3 instances): Schema type mismatches in `semconv/agent-extensions.yaml` — the agent inferred correct types (int, boolean) but the schema declares `type: string`. This is an eval team fix, not a spiny-orb issue.

Additionally:
- IS Score: 60/100 — four failures (RES-001 missing `service.instance.id`, SPA-001 164 INTERNAL spans, SPA-002 orphan span, SPA-005 spans < 5ms)
- Advisory contradiction rate: ~78% (vs ~44% in JS chain) — TypeScript-specific judge calibration issues (#729, #730)

### Primary Goal

Verify that spiny-orb #728 (CDQ-006 advisory pass gap) reduces the 5-of-14-file violation rate. Apply the schema type fix (TAZE-RUN1-1) before the run so SCH-003 does not recur.

**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze, `~/Documents/Repositories/taze`)

### Secondary Goals

- IS RES-001: add `service.instance.id` to `examples/instrumentation.js`
- Advisory contradiction rate improves from ~78%
- Confirm `checkSyntax()` moduleResolution fix remains active

### Run-13 Scores (baseline for run-14 comparison)

| Dimension | Run-13 |
|-----------|--------|
| NDS | 4/4 (100%) |
| COV | 6/6 (100%) |
| RST | 5/5 (100%) |
| API | 3/3 (100%) |
| SCH | 3/4 (75%) |
| CDQ | 6/7 (86%) |
| **Overall quality** | **27/29 (93%)** |
| **Gates** | **2/2 (100%)** |
| **Files committed** | **14** |
| **Correct skips** | **19** |
| **Cost** | **$4.93** |
| **Q×F** | **13.0** |
| **IS Score** | **60/100** |
| **Push/PR** | **YES (#8)** |

### Run-13 Findings (carry-forward)

| # | Title | Priority | spiny-orb issue |
|---|-------|----------|-----------------|
| TAZE-RUN1-1 | SCH-003: schema type fix (eval team) | Low | — |
| TAZE-RUN1-2 | CDQ-006: isRecording guard (spiny-orb prompt) | Low | #728 |
| TAZE-RUN1-3 | Advisory contradiction ~78% | Low | #729, #730 (gated on 2+ runs) |
| TAZE-RUN1-4 | Pre-scan LLM tokens on uninstrumentable files | Info | #714 |
| TAZE-RUN1-5 | IS RES-001: no service.instance.id | Low | — |
| TAZE-RUN1-6 | IS SPA-001: 164 INTERNAL spans design discussion | Low | #731 (gated on 2+ runs) |

---

## Solution Overview

Same four-phase structure as run-13:

1. **Pre-run verification** — Apply fixes, verify spiny-orb changes landed, validate prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` on taze
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #83

### Eval Branch Convention

The eval execution branch (`feature/prd-82-taze-evaluation-run-14`) **never has its eval-run changes merged to main**. The PR to main is docs-only (landing the PRD file); after that PR merges, the branch continues as the eval execution branch. Eval artifacts are copied to main separately via `git checkout` in step 13. When `/prd-done` runs at completion, close issue #82 without merging or deleting the eval branch.

### Key Inputs

- **Run-13 results**: `evaluation/taze/run-13/` (on `main` if PRD #50 "Copy artifacts to main" step ran; on branch `feature/prd-50-typescript-eval-setup` otherwise)
- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`
- **Run-13 actionable fix output**: `evaluation/taze/run-13/actionable-fix-output.md`
- **Run-13 findings**: `evaluation/taze/run-13/spiny-orb-findings.md`
- **Run-13 lessons**: `evaluation/taze/run-13/lessons-for-run14.md`
- **Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## Success Criteria

1. CDQ-006 violations drop from 8 to 0 (if #728 lands) or same pattern documented with cause
2. SCH-003 does not recur (schema type fix applied before run)
3. Quality score ≥ 27/29 (at minimum, no regression)
4. Push/PR succeeds
5. IS RES-001 passes (service.instance.id added)
6. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
7. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [ ] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to: (1) Type D structure and step sequence; (2) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (3) eval branch convention (never merges to main); (4) step 13 (copy artifacts to main before closing); (5) step 9.5 (SPA-001 calibration note for CLI apps — taze had 164 INTERNAL spans in run-13; treat this as structural, not a regression). **Do not mark this complete until you have read all five sections.**

- [ ] **Collect skeleton documents** — Create `evaluation/taze/run-14/` directory with `lessons-for-run15.md` and `spiny-orb-findings.md` skeleton files. Create `evaluation/taze/run-log.md` (this is the first taze Type D run; the file does not yet exist). Must run before pre-run verification.

- [ ] **Pre-run verification** — Verify fixes and validate prerequisites:

  1. **Schema type fix** (TAZE-RUN1-1 — eval team fix before the run): In `~/Documents/Repositories/taze`, on the `main` branch, update `semconv/agent-extensions.yaml`: change `taze.config.sources_found` → `type: int`, `taze.cache.hit` → `type: boolean`, `taze.cache.changed` → `type: boolean`. Commit and push to fork main: `git -C ~/Documents/Repositories/taze commit -am "fix: correct semconv type declarations for run-14" && git -C ~/Documents/Repositories/taze push`.
  2. **IS RES-001 fix** (TAZE-RUN1-5 — eval team fix): In `~/Documents/Repositories/taze`, add `service.instance.id: randomUUID()` to `resourceFromAttributes()` in `examples/instrumentation.js`. Import `randomUUID` from `node:crypto`. Commit and push to fork main.
  3. **spiny-orb #728** (CDQ-006 advisory pass gap): Check whether #728 is merged to spiny-orb main. Record the current spiny-orb SHA. If #728 is not yet merged, document the expected behavior: CDQ-006 violations will likely recur at a similar rate to run-13.
  4. **checkSyntax() moduleResolution gate**: Confirm that spiny-orb's per-file tsc check reads the project's `tsconfig.json` moduleResolution. This fix was required for run-4 (bundler vs NodeNext). If the fix regressed, NDS-001 will fire on every taze file.
  5. **Target repo readiness**: Verify taze fork on `main`, clean working tree, `spiny-orb.yaml` present, `pnpm test` passes.
  6. **Push auth**: Dry-run push to verify `GITHUB_TOKEN_TAZE` still works. Use a non-existent branch to avoid "rejected: fetch first":
     ```bash
     vals exec -i -f .vals.yaml -- bash -c 'git -C ~/Documents/Repositories/taze push --dry-run https://x-access-token:$GITHUB_TOKEN_TAZE@github.com/wiggitywhitney/taze.git HEAD:refs/heads/spiny-orb/auth-test'
     ```
  7. **File inventory**: Count `.ts` files in `~/Documents/Repositories/taze/src/` — should be 33.
  8. Rebuild spiny-orb: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm run build`
  9. Record spiny-orb SHA, Node version, and pnpm version. Append to `evaluation/taze/run-14/lessons-for-run15.md`.

- [ ] **Evaluation run-14** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** Run from `~/Documents/Repositories/taze`:

  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-14/debug 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-14/spiny-orb-output.log'
  ```

  AI role: (1) create the `debug/` directory before Whitney runs; (2) confirm readiness; (3) once Whitney provides the log, save it and write `evaluation/taze/run-14/run-summary.md`; (4) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/taze/spiny-orb-pr-summary.md --repo wiggitywhitney/taze --head <instrument-branch> --title "..."`. **After saving artifacts and committing, push the eval branch to origin immediately.**

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) quality score, (3) cost, (4) push/PR status, (5) CDQ-006 violation count vs run-13 (was 8 across 5 files), (6) top 1-2 surprises. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [ ] **Failure deep-dives** — For each failed or partially committed file and run-level failure.
  Produces: `evaluation/taze/run-14/failure-deep-dives.md`
  Style reference: `docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL processed files (committed + correct skips). Evaluate all rules across all files.
  Produces: `evaluation/taze/run-14/per-file-evaluation.md`
  Style reference: `docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation** — Evaluate PR summary quality.
  Produces: `evaluation/taze/run-14/pr-evaluation.md`
  Style reference: `docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring** — Synthesize dimension-level scores. First TypeScript run with prior baseline to compare against.
  Produces: `evaluation/taze/run-14/rubric-scores.md`
  Style reference: `docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **IS scoring run**

  **IS scoring gotchas from run-13**: (1) Docker blocked by Datadog MDM policy — download `otelcol-contrib` binary directly from GitHub releases (darwin_arm64); (2) OTel SDK packages (`@opentelemetry/sdk-node`, `exporter-trace-otlp-http`, `sdk-trace-base`, `resources`) are not in taze devDependencies — temporarily install via `pnpm add -D` for the IS scoring run, then revert with `git restore package.json pnpm-lock.yaml`; (3) taze CLI modes are `default | major | minor | patch | latest | newest | next` (no "check" subcommand); (4) Run 3-4 modes to enrich trace data.

  1. **Prerequisites**: OTel Collector running with `evaluation/is/otelcol-config.yaml` — use binary if Docker is unavailable (see `evaluation/is/README.md` for binary download instructions and Datadog Agent port conflict). Stop Datadog Agent first: `datadog-agent stop`.
  2. **Setup**: Find the instrument branch name from the end of `evaluation/taze/run-14/spiny-orb-output.log` (look for `Branch:` in the final summary box) or run `gh pr list --repo wiggitywhitney/taze --json number,headRefName`. In `~/Documents/Repositories/taze`, run: `git fetch && git checkout <instrument-branch> -- src/ examples/`. Build: `pnpm build`. Install SDK packages temporarily: `pnpm add -D @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-trace-base @opentelemetry/resources`.
  3. **Action**: Run several taze modes with the Collector receiving: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/taze.mjs <mode>` (e.g., `default`, `major`, `latest`). Then: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/taze/run-14/is-score.md`
  4. **Restore**: `git restore package.json pnpm-lock.yaml` in the taze fork; `git checkout main`; restart Datadog Agent: `datadog-agent start`.
  Produces: `evaluation/taze/run-14/is-score.md`

- [ ] **Baseline comparison** — Compare run-14 vs run-13 (only prior TS run). Note improvements on CDQ-006 and SCH-003 specifically.
  Produces: `evaluation/taze/run-14/baseline-comparison.md`
  Style reference: `docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison: (1) add a row for run-14 to the taze run history table in `README.md` with quality score, gates, files, spans, cost, push/PR status, and IS score; (2) update the "next run" sentence below the taze run history table to reference run-15 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable.

  Read style reference: `docs/templates/eval-run-style-reference/actionable-fix-output.md`. Read `evaluation/taze/run-13/actionable-fix-output.md` as prior example. Source documents (all in `evaluation/taze/run-14/`): `run-summary.md`, `per-file-evaluation.md`, `pr-evaluation.md`, `rubric-scores.md`, `baseline-comparison.md`, `is-score.md`, `spiny-orb-findings.md`, `lessons-for-run15.md`.

  Assess each run-13 finding:
  - TAZE-RUN1-1 (SCH-003): Should be RESOLVED — schema type fix applied in pre-run
  - TAZE-RUN1-2 (CDQ-006): Verify — compare violation count vs run-13. If #728 landed, expect 0 violations
  - TAZE-RUN1-3 (advisory ~78%): Still gated — report rate but do not close until 2+ runs confirm trend
  - TAZE-RUN1-5 (IS RES-001): Should be RESOLVED — service.instance.id fix applied in pre-run
  - TAZE-RUN1-6 (IS SPA-001): Still gated on 2+ CLI runs

  1. Write `evaluation/taze/run-14/actionable-fix-output.md`.
  2. *(User-facing checkpoint 2)* Interpreted summary for Whitney: failures, root causes, run-13 finding resolutions, what to watch in run-15.
  3. Print absolute path of `actionable-fix-output.md`. **Pause** until Whitney confirms handoff to spiny-orb team.
  Produces: `evaluation/taze/run-14/actionable-fix-output.md`

- [ ] **Draft PRD #83** — Create on a separate branch from main. Use this PRD as the milestone style reference. Carry forward both user-facing checkpoints. Merge the PRD-only PR to main.

- [ ] **Copy artifacts to main** — After PRD #83 is drafted but before `/prd-done`: switch to main, pull, then run:
  ```bash
  git checkout feature/prd-82-taze-evaluation-run-14 -- evaluation/taze/run-14/
  ```
  Commit to main with message `eval: save taze run-14 artifacts to main [skip ci]`. Update `evaluation/taze/run-log.md` with a new row for run-14 (create the file if it doesn't exist — use `evaluation/commit-story-v2/run-log.md` as the column format reference). Push to origin/main. Then return to the eval branch and run `/prd-done`.

---

## Score Projections (from Run-13 Actionable Fix Output §8)

### Conservative (no fixes land before run-14)

- **Quality**: 27/29 (93%) — SCH-003 recurs (schema unchanged), CDQ-006 recurs (prompt unchanged)
- **Files**: 14
- **Cost**: ~$4.50–5.50
- **IS Score**: ~60

### Target (P1 schema fix + CDQ-006 prompt fix both land)

- **Quality**: 29/29 (100%) — both failures resolved
- **Files**: 14
- **Cost**: ~$4.50
- **IS Score**: ~67 (RES-001 fixed)
- **Q×F**: ~14.0

### Stretch (all fixes + IS improvements)

- **Quality**: 29/29 (100%)
- **Files**: 14
- **IS Score**: ~80

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| spiny-orb #728 not yet landed | Pre-run step 3 checks. If not merged, CDQ-006 violations likely recur. Document and file as second-run confirmation. |
| Schema type fix introduces unexpected failures | Apply to fork main before run; run `pnpm test` to verify no regressions. |
| checkSyntax() moduleResolution fix regressed | Pre-run step 4 confirms. If regressed, NDS-001 fires on all files — stop and report. |
| IS Docker blocked again | Use otelcol-contrib binary download (arm64, GitHub releases) — documented in IS scoring gotchas above. |
| GITHUB_TOKEN_TAZE expired | Pre-run step 6 dry-run catches this. Regenerate per `~/.claude/rules/eval-github-pat.md` if needed. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-03 | Apply schema type fix (TAZE-RUN1-1) in pre-run, not as a spiny-orb issue | The agent inferred correct types; the schema YAML was authored incorrectly. Fix the schema before run-14 so SCH-003 doesn't recur and CDQ-006 is the clean primary variable. |
| 2026-05-03 | Apply IS RES-001 fix (service.instance.id) in pre-run | One-line SDK bootstrap fix; no instrumentation impact; makes IS score more meaningful for run-14 comparison. |
| 2026-05-03 | Create evaluation/taze/run-log.md in this PRD's milestone 2 | First Type D taze PRD — the file does not yet exist. Use commit-story-v2/run-log.md column format. |
