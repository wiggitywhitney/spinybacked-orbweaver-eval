# PRD #77: JavaScript Evaluation Run-3: release-it — First Committed Baseline Run

**Status:** Draft
**Created:** 2026-04-21
**GitHub Issue:** #77
**Depends on:** PRD #68 (run-2 complete, blockers documented in `evaluation/release-it/run-2/actionable-fix-output.md`)

---

## Read This First

Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

---

## Problem Statement

Run-2 processed all 23 release-it `lib/` files and established a quality baseline of 24/25 (96%), but delivered 0 net commits. Two infrastructure blockers caused every checkpoint test to fail and prevented PR creation:

1. **OTel module resolution**: `@opentelemetry/api` is in peerDependencies but not installed at test time — any committed file with OTel imports crashes the test suite, causing rollback.
2. **PAT scope**: `github-token-release-it` in GCP Secret Manager lacks `pull_requests:write` — push succeeds but PR creation fails via GraphQL.

**Run-2 results (baseline for run-3 comparison)**:

| Metric | Run-2 |
|--------|-------|
| Files processed | 23/23 |
| Committed (net) | 0 (checkpoint rollbacks) |
| Quality | 24/25 (96%) |
| Failed (validation) | 8 (6 LINT, 1 NDS-003, 1 COV-003) |
| Failed (checkpoint rollback) | 12 |
| Correct skips | 3 |
| Cost | $5.69 |
| Push | YES (branch) |
| PR | FAILED (PAT scope) |
| Q × F | 0 (infrastructure failure) |

### P1 Blockers from Run-2 (must be resolved before running)

| # | Blocker | Root cause | Fix |
|---|---------|------------|-----|
| RUN2-1 | OTel module resolution at checkpoint | `@opentelemetry/api` in peerDependencies only; not installed at test time | Add `@opentelemetry/api` to devDependencies in the release-it fork: `npm install --save-dev @opentelemetry/api` and commit to fork main |
| RUN2-2 | PAT lacks `pull_requests:write` | `github-token-release-it` secret in GCP Secret Manager was created without this scope | Regenerate fine-grained PAT with `pull_requests:write` scoped to `wiggitywhitney/release-it`; update GCP Secret Manager |

### P2 Quality Issues from Run-2 (watch but do not block on)

| # | Issue | Status entering run-3 |
|---|-------|----------------------|
| RUN2-3 | arrowParens + print-width LINT cascade (6 files) | Spiny-orb Prettier post-pass fix may resolve; verify if landed |
| RUN2-4 | NDS-003 on GitHub.js (return-value capture transforms original line) | Spiny-orb validator exemption or agent fix needed; verify if landed |
| RUN2-5 | COV-003/NDS-007 conflict on GitLab.js (graceful catch blocks) | Spiny-orb COV-003 validator fix needed; verify if landed |
| RUN2-6 | GitBase.js span naming inconsistency (`release-it.*` vs `release_it.*`) | Agent convention clarification needed |

### Primary Goal

First non-zero Q×F on release-it: at least one instrumented file committed to the working tree, PR created.

---

## Solution Overview

Same twelve-milestone structure as all Type D eval runs. Pre-run verification explicitly checks the two run-2 P1 blockers before proceeding.

### Two-Repo Workflow

| Repo | Path | Role |
|------|------|------|
| **release-it** (target) | `~/Documents/Repositories/release-it` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-2 results** (eval repo): `evaluation/release-it/run-2/` on branch `feature/prd-68-evaluation-run-2-release-it`
- **Run-2 actionable fix output**: `evaluation/release-it/run-2/actionable-fix-output.md`
- **Run-2 lessons**: `evaluation/release-it/run-2/lessons-for-run3.md`
- **Evaluation rubric** (spiny-orb repo): `research/evaluation-rubric.md` (32 rules)

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-77-evaluation-run-3-release-it`) **never merges to main**. The PR exists for CodeRabbit review only. Run `/prd-done` at completion to close issue #77 without merging the eval branch. Step 13 (Copy artifacts to main) preserves the run artifacts on main before the PR is closed.

---

## Success Criteria

1. At least one file committed to release-it working tree (non-zero Q×F)
2. PR created in wiggitywhitney/release-it
3. All 23 `lib/` files processed
4. Quality score produced across all six dimensions
5. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
6. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [ ] **Read language-extension-plan.md**

  Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

- [ ] **Collect skeleton documents**

  Create `evaluation/release-it/run-3/` directory in the eval repo with skeleton files:
  - `lessons-for-run4.md` (copy structure from `evaluation/release-it/run-2/lessons-for-run3.md`)
  - `spiny-orb-findings.md` (fresh skeleton with P1/P2/P3 sections)

- [ ] **Pre-run verification**

  Verify both run-2 P1 blockers are resolved and validate run prerequisites:

  1. **RUN2-1 (OTel devDependency) — MUST PASS**: Confirm `@opentelemetry/api` is in `devDependencies` in `~/Documents/Repositories/release-it/package.json`. Run from `~/Documents/Repositories/release-it/`:
     ```bash
     python3 -c "import json; p=json.load(open('package.json')); print(p.get('devDependencies',{}).get('@opentelemetry/api','MISSING'))"
     ```
     Must print a version string (not `MISSING`). If missing, run `npm install --save-dev @opentelemetry/api`, commit to fork main, and run `npm test` to confirm tests still pass before proceeding.
  2. **RUN2-2 (PAT scope) — MUST PASS**: Verify `GITHUB_TOKEN_RELEASE_IT` has `pull_requests:write` for `wiggitywhitney/release-it`. Fine-grained PATs don't show this scope in `gh auth status`. Verify directly: go to https://github.com/settings/personal-access-tokens, find the release-it eval token, confirm it shows "Pull requests: Read and write" under repository permissions for `wiggitywhitney/release-it`. Alternatively, check the token's repo-level permissions via: `vals exec -i -f .vals.yaml -- gh api repos/wiggitywhitney/release-it --jq '.permissions'` — if `admin: true` appears, the token was created with admin scope and should include PR creation. The definitive test is the run itself — if PR creation fails with the same GraphQL error as run-2, the PAT was not updated.
  3. **RUN2-3 (arrowParens LINT)**: Check if spiny-orb has merged a Prettier post-pass fix. If landed, LINT failures on files with arrowParens should resolve. If not, 6 files will likely fail LINT again.
  4. **RUN2-4 (NDS-003 GitHub.js)**: Check if spiny-orb has fixed the NDS-003 return-value capture issue or updated agent guidance to omit `release_it.github.release_id`.
  5. **RUN2-5 (COV-003/NDS-007 GitLab.js)**: Check if spiny-orb has updated the COV-003 validator to exempt graceful-degradation catch blocks.
  6. **Target repo readiness**: Verify release-it fork is on `main`, working tree is clean, `spiny-orb.yaml` and `semconv/` exist, `@opentelemetry/api` is installed.
  7. **File inventory**: Confirm 23 `.js` files in `lib/` — run `find lib -name "*.js" | wc -l` from `~/Documents/Repositories/release-it/`.
  8. **Rebuild spiny-orb**: Rebuild from current branch (not necessarily main). Record SHA.
  9. **Record versions**: Node.js version, spiny-orb version/SHA, release-it version.
  10. Append observations to `evaluation/release-it/run-3/lessons-for-run4.md`.

  **Do not proceed if RUN2-1 or RUN2-2 are unresolved.** The run will produce no commits or no PR.

- [ ] **Evaluation run-3**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.**

  **Instrument command** (run from `~/Documents/Repositories/release-it/`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-3/spiny-orb-output.log'
  ```

  AI role: (1) confirm readiness, (2) once Whitney provides the log output, save it and write `evaluation/release-it/run-3/run-summary.md`, (3) **push the eval branch to origin immediately** — the branch holds the only copy of run artifacts until step 13 copies them to main.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

  Success criteria: Whitney has acknowledged the findings overview.

- [ ] **Failure deep-dives**

  Root cause analysis for each failed/partial file and run-level failures.
  Produces: `evaluation/release-it/run-3/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/release-it/run-3/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Produces: `evaluation/release-it/run-3/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring**

  Produces: `evaluation/release-it/run-3/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **IS scoring run**

  Prerequisites: OTel Collector running with `evaluation/is/otelcol-config.yaml` (see `evaluation/is/README.md`). Stop Datadog Agent first: `sudo launchctl stop com.datadoghq.agent`. IS scoring requires committed instrumented files in the working tree — if 0 files committed, mark as NOT EVALUABLE.

  Action: Run release-it in dry-run mode with the Collector as OTLP receiver (dry-run exercises all code paths without publishing).

  From `~/Documents/Repositories/release-it/`:
  ```bash
  release-it --dry-run
  ```

  Then from `~/Documents/Repositories/spinybacked-orbweaver-eval/`:
  ```bash
  node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/release-it/run-3/is-score.md
  ```

  Restart Datadog Agent when done: `sudo launchctl start com.datadoghq.agent`

  Produces: `evaluation/release-it/run-3/is-score.md`

- [ ] **Baseline comparison**

  Compare run-3 against commit-story-v2 run-13 (most recent cross-target reference) and against release-it run-2. Highlight dimensions that differ by more than 1 point from commit-story-v2.
  Produces: `evaluation/release-it/run-3/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README**

  After baseline comparison: (1) add a row for run-3 to the run history table in `README.md` with quality score, gates, files, spans, cost, push/PR status, and IS score; (2) update the "next run" sentence (bold paragraph below the release-it run history table) to reference run-4 and its primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2)*

  1. Run the cross-document audit agent to verify consistency across all run-3 evaluation artifacts.
  2. Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-4.
  3. Print the absolute file path of `evaluation/release-it/run-3/actionable-fix-output.md`.
  4. **Pause.** Do not proceed until Whitney confirms handoff.

  Produces: `evaluation/release-it/run-3/actionable-fix-output.md`

- [ ] **Draft Run-4 PRD**

  Create on a separate branch from main. Use Type D structure from `docs/language-extension-plan.md` and this PRD as the milestone style reference. Carry forward both user-facing checkpoints. Merge the PRD-only PR to main so `/prd-start` can pick it up.

- [ ] **Copy artifacts to main**

  From main, run:
  ```bash
  git checkout feature/prd-77-evaluation-run-3-release-it -- evaluation/release-it/run-3/
  ```
  Commit with message `eval: save release-it run-3 artifacts to main [skip ci]`. Update `evaluation/release-it/run-log.md` with a new row for this run (create the file if it doesn't exist, using the same format as `evaluation/commit-story-v2/run-log.md`). Push. This step runs before `/prd-done` so artifacts land on main while the eval branch is still reachable.

---

## Score Projections

**Conservative** (P1 blockers fixed; P2 items unchanged):

- OTel checkpoint tests pass — instrumented files survive to working tree
- LINT failures persist for 6 files (arrowParens + print-width)
- GitHub.js NDS-003 and GitLab.js COV-003 persist
- **Files committed**: 6-9 (config, factory, Version, shell, util + correct-skip report files)
- **Quality**: ~24/25 (96%) — same failure modes as run-2 on committed set
- **Q×F**: ~5-9
- **Cost**: $5-7
- **Push/PR**: YES

**Target** (P1 fixed + arrowParens Prettier post-pass lands):

- 6 LINT failures convert to commits
- GitHub.js and GitLab.js still fail their non-LINT issues
- **Files committed**: 12-14
- **Quality**: 23-24/25
- **Q×F**: ~11-13

**Stretch** (all P1 + all P2 fixes land):

- All 13 instrumented files commit cleanly
- Quality reaches 25/25 if NDS-003 and COV-003 also fixed
- **Q×F**: ~13 (matching commit-story-v2's best runs)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| RUN2-1 (OTel devDep) not fixed before run | Pre-run step 1 verifies. Do not proceed if unresolved. |
| RUN2-2 (PAT scope) not fixed before run | Pre-run step 2 verifies. Do not proceed if unresolved. |
| arrowParens Prettier post-pass not yet in spiny-orb | Accept LINT failures; evaluate quality on files that do commit |
| IS scoring unavailable if 0 committed files | Document as NOT EVALUABLE in is-score.md; do not block milestone |
| New failure modes in plugin files (Git.js, GitHub.js, npm.js) | Agent reasoning quality was high in run-2; new failures possible but not anticipated |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-21 | Run-3 proceeds only after P1 blockers resolved | OTel devDep and PAT scope are eval-team actions. P2 items (arrowParens, NDS-003, COV-003) are spiny-orb work — run-3 proceeds regardless, accepting possible quality failures on those files. |
| 2026-04-21 | IS scoring marked NOT EVALUABLE if 0 committed files | IS scoring requires runtime OTLP data from instrumented code; if no instrumented files survive, scoring produces no useful data. |

---

## Prior Art

- **PRD #53**: run-1 evaluation (this repo, branch `feature/prd-53-javascript-eval-setup`)
- **PRD #68**: run-2 evaluation (this repo, branch `feature/prd-68-evaluation-run-2-release-it`)
- **evaluation/release-it/run-2/**: Full run-2 documentation
- **evaluation/release-it/run-2/actionable-fix-output.md**: 7 findings, 2 run-3 P1 prerequisites
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
