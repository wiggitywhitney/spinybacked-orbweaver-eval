# PRD #68: JavaScript Evaluation Run-2: release-it — First Complete Baseline Run

**Status:** Draft
**Created:** 2026-04-20
**GitHub Issue:** #68
**Depends on:** PRD #53 (run-1 complete, 3 blockers documented, actionable fix output delivered)

---

## Problem Statement

Run-1 on release-it halted at file 5/23 due to three infrastructure blockers. No files were committed with instrumentation, and no quality score was produced. The plugin files — where the majority of async I/O lives — were never reached.

**Run-1 results (baseline for run-2 comparison)**:

| Metric | Run-1 |
|--------|-------|
| Files processed | 5/23 |
| Committed | 0 |
| Failed | 2 (LINT oscillation: config.js, index.js) |
| Correct skips | 3 (args.js, cli.js, log.js) |
| Not reached | 18 (all plugin files) |
| Quality score | N/A |
| Cost | $0.68 |
| Push/PR | NO (PAT scope) |

### Three Blockers from Run-1

| # | Blocker | Root cause | Workaround |
|---|---------|------------|------------|
| RUN1-1 | Checkpoint test halt | `tag.gpgsign=true` in global git config; spiny-orb runs `npm test` without `GIT_CONFIG_GLOBAL` override | Disable `tag.gpgsign` in `~/.gitconfig` for run duration |
| RUN1-2 | LINT oscillation (arrowParens) | Agent generates `async (span) =>` but release-it Prettier config requires `async span =>` (`arrowParens: "avoid"`); fix loop has no specific diff to act on | Wait for spiny-orb LINT diff surfacing fix; or if not landed, accept config.js and index.js will fail again |
| RUN1-3 | PAT missing `pull_request:write` | Fine-grained PAT for wiggitywhitney/release-it allows push but not PR creation via GraphQL | Update PAT in vals to add `pull_request: write` scoped to wiggitywhitney/release-it |

### Primary Goal

Establish the first complete quality baseline for release-it across all 23 `lib/` files, with quality score, per-dimension rubric scores, and IS score.

### Run-1 Findings Carried Forward

| # | Title | Priority | Status entering run-2 |
|---|-------|----------|----------------------|
| RUN1-1 | Checkpoint test halt (gpgsign) | P1 | **Must resolve before run-2** |
| RUN1-2 | LINT oscillation (arrowParens) | P1 | Spiny-orb fix tracked in spiny-orb-findings.md; verify if landed |
| RUN1-3 | PAT missing pull_request:write | P2 | **Must resolve before run-2** |
| RUN1-4 | Prettier diff not surfaced in fix loop | P2 (spiny-orb) | Tracked in spiny-orb-findings.md |
| RUN1-5 | Test failure output not captured | P2 (spiny-orb) | Tracked in spiny-orb-findings.md |
| RUN1-6 | Weaver shutdown message gives no reason ("fetch failed") | P3 (spiny-orb) | Tracked in spiny-orb-findings.md |
| RUN1-7 | Live-check partial message doesn't say what to do with report | P3 (spiny-orb) | Tracked in spiny-orb-findings.md |
| RUN1-8 | Audit debuggability of all check failure messages in console output | P3 (spiny-orb) | Tracked in spiny-orb-findings.md |

---

## Solution Overview

Same twelve-milestone structure as all Type D eval runs. Pre-run verification explicitly checks the three run-1 blockers before proceeding.

### Two-Repo Workflow

| Repo | Path | Role |
|------|------|------|
| **release-it** (target) | `~/Documents/Repositories/release-it` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-1 results** (eval repo): `evaluation/release-it/run-1/` on branch `feature/prd-53-javascript-eval-setup`
- **Run-1 actionable fix output**: `evaluation/release-it/run-1/actionable-fix-output.md`
- **Run-1 findings**: `evaluation/release-it/run-1/spiny-orb-findings.md`
- **Run-1 lessons**: `evaluation/release-it/run-1/lessons-for-run2.md`
- **Evaluation rubric** (spiny-orb repo): `research/evaluation-rubric.md` (32 rules)

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-68-evaluation-run-2-release-it`) **never merges to main**. The PR exists for CodeRabbit review only. Run `/prd-done` at completion to close issue #68 without merging the eval branch. Step 13 (Copy artifacts to main) preserves the run artifacts on main before the PR is closed.

---

## Success Criteria

1. All 23 `lib/` files processed (no early halt)
2. Quality score produced across all six dimensions
3. PR created in wiggitywhitney/release-it
4. IS score produced (dry-run mode with OTel Collector)
5. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
6. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [x] **Collect skeleton documents**

  Create `evaluation/release-it/run-2/` directory in the eval repo with skeleton files:
  - `lessons-for-run3.md` (copy structure from `evaluation/release-it/run-1/lessons-for-run2.md`)
  - `spiny-orb-findings.md` (fresh skeleton with P1/P2/P3 sections)

- [ ] **Pre-run verification**

  Verify all three run-1 blockers are resolved and validate run prerequisites:

  1. **RUN1-1 (gpgsign) — MUST PASS**: Confirm `tag.gpgsign` is actually disabled in `~/.gitconfig`. Run `git config --global tag.gpgsign` — it must return empty or `false`. If it returns `true`, comment it out in `~/.gitconfig` before proceeding. Then confirm tests pass: `GIT_CONFIG_GLOBAL=/tmp/release-it-test.gitconfig npm test` from `~/Documents/Repositories/release-it/` should show 262/264 pass. Note: the instrument command itself does not use `GIT_CONFIG_GLOBAL`; spiny-orb's checkpoint test runner inherits the real `~/.gitconfig`, so the global config must be updated.
  2. **RUN1-3 (PAT) — MUST PASS**: Verify GITHUB_TOKEN has `pull_request:write` for wiggitywhitney/release-it. Run `vals exec -i -f .vals.yaml -- gh auth status` and confirm the token's scopes include `pull_request:write`, or run a test PR creation dry-run if scope output is unclear.
  3. **RUN1-2 (LINT arrowParens)**: Check if spiny-orb has merged a fix for the Prettier diff surfacing issue. If landed, config.js and index.js should commit this run. If not landed, note it — they will likely fail again.
  4. **Target repo readiness**: Verify release-it fork is on `main`, working tree is clean, `spiny-orb.yaml` and `semconv/` exist.
  5. **File inventory**: Confirm 23 `.js` files in `lib/` (match run-1 inventory in `evaluation/release-it/run-1/lessons-for-run2.md`).
  6. **Rebuild spiny-orb**: Rebuild from current branch (not necessarily main). Record SHA.
  7. **Record versions**: Node.js version, spiny-orb version/SHA, release-it version.
  8. Append observations to `evaluation/release-it/run-2/lessons-for-run3.md`.

  **Do not proceed if RUN1-1 or RUN1-3 are unresolved.** The run will halt early or produce no PR.

- [ ] **Evaluation run-2**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.**

  **Instrument command** (run from `~/Documents/Repositories/release-it/`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-2/spiny-orb-output.log
  ```

  AI role: (1) confirm readiness, (2) once Whitney provides the log output, save it and write `evaluation/release-it/run-2/run-summary.md`, (3) **push the eval branch to origin immediately** — the branch holds the only copy of run artifacts until step 13 copies them to main.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

  Success criteria: Whitney has acknowledged the findings overview.

- [ ] **Failure deep-dives**

  Root cause analysis for each failed/partial file and run-level failures.
  Produces: `evaluation/release-it/run-2/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/release-it/run-2/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Produces: `evaluation/release-it/run-2/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring**

  Produces: `evaluation/release-it/run-2/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **IS scoring run**

  Prerequisites: OTel Collector running with `evaluation/is/otelcol-config.yaml` (see `evaluation/is/README.md`). Stop Datadog Agent first: `sudo launchctl stop com.datadoghq.agent`.

  Action: Run release-it in dry-run mode with the Collector as OTLP receiver (dry-run exercises all code paths without publishing).

  From `~/Documents/Repositories/release-it/`:
  ```bash
  release-it --dry-run
  ```

  Then from `~/Documents/Repositories/spinybacked-orbweaver-eval/`:
  ```bash
  node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/release-it/run-2/is-score.md
  ```

  Restart Datadog Agent when done: `sudo launchctl start com.datadoghq.agent`

  Produces: `evaluation/release-it/run-2/is-score.md`

- [ ] **Baseline comparison**

  Compare run-2 against commit-story-v2 run-13 (most recent cross-target reference) and against release-it run-1. Highlight dimensions that differ by more than 1 point from commit-story-v2.
  Produces: `evaluation/release-it/run-2/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README**

  After baseline comparison: (1) add a row for run-2 to the run history table in `README.md` with quality score, gates, files, spans, cost, push/PR status, and IS score; (2) update the "next run" sentence (bold paragraph below the run history table) to reference run-3 and its primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2)*

  1. Run the cross-document audit agent to verify consistency across all run-2 evaluation artifacts.
  2. Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-3.
  3. Print the absolute file path of `evaluation/release-it/run-2/actionable-fix-output.md`.
  4. **Pause.** Do not proceed until Whitney confirms handoff.

  Produces: `evaluation/release-it/run-2/actionable-fix-output.md`

- [ ] **Draft Run-3 PRD**

  Create on a separate branch from main. Use Type D structure from `docs/language-extension-plan.md` and this PRD as the milestone style reference. Carry forward both user-facing checkpoints. Merge the PRD-only PR to main so `/prd-start` can pick it up.

- [ ] **Copy artifacts to main**

  From main, run:
  ```bash
  git checkout feature/prd-68-evaluation-run-2-release-it -- evaluation/release-it/run-2/
  ```
  Commit with message `eval: save release-it run-2 artifacts to main [skip ci]`. Update `evaluation/release-it/run-log.md` with a new row for this run (create the file if it doesn't exist, using the same format as `evaluation/commit-story-v2/run-log.md`). Push. This step runs before `/prd-done` so artifacts land on main while the eval branch is still reachable.

---

## Score Projections

**Conservative** (gpgsign and PAT fixed; LINT arrowParens fix not yet in spiny-orb):

- config.js and index.js fail again (LINT oscillation unchanged)
- 18 plugin files processed; most should commit
- **Quality**: 23-25/25 on committed files — agent reasoning was sound in run-1
- **Files committed**: 12-16 (of 21 reachable non-skip files)
- **Cost**: ~$3-5
- **Duration**: ~25-35 min
- **Push/PR**: YES (if PAT fixed)

**Target** (all 3 blockers resolved + LINT fix lands):

- All 23 files processed; config.js and index.js commit cleanly
- **Quality**: 25/25 possible — no known quality failure modes from run-1 agent reasoning
- **Files committed**: 15-18
- **Cost**: ~$3-5

**Stretch** (Target + strong plugin performance):

- Plugin files (Git.js, GitHub.js, GitLab.js, npm.js) all commit with correct spans
- **Quality x Files**: ≥13.0 (matching commit-story-v2's best run)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| gpgsign workaround not in place | Pre-run step 1 verifies. Do not proceed if unresolved. |
| LINT arrowParens fix not landed | Accept config.js/index.js failures; evaluate quality on plugin files |
| PAT not updated | Pre-run step 2 verifies. Do not proceed if unresolved. |
| Plugin files have unexpected failure modes | Agent reasoning quality was high in run-1; new failure modes are possible but not anticipated |
| IS scoring requires dry-run mode that doesn't exercise all paths | Document which paths were covered; note gaps in is-score.md |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-20 | Run-2 schedules after run-1 blockers resolved, not after spiny-orb issues land | Items 1 and 3 (gpgsign, PAT) are eval-team actions. Item 2 (LINT) is spiny-orb work — run-2 proceeds regardless, accepting possible LINT failures on 2 files. |
| 2026-04-20 | IS scoring uses dry-run mode | release-it's primary operation creates real releases. Dry-run mode exercises all code paths without publishing side effects. |

---

## Prior Art

- **PRD #53**: run-1 evaluation (this repo, branch `feature/prd-53-javascript-eval-setup`)
- **evaluation/release-it/run-1/**: Full run-1 documentation
- **evaluation/release-it/run-1/actionable-fix-output.md**: 8 findings, 3 run-2 prerequisites
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
