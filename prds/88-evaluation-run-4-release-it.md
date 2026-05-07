# PRD #88: JavaScript Evaluation Run-4: release-it — Pre-scan Class Method Detection

**Status:** Ready
**Created:** 2026-05-05
**GitHub Issue:** #88
**Depends on:** PRD #77 (run-3 complete, findings in `evaluation/release-it/run-3/actionable-fix-output.md`)

---

## Read This First

Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

---

## Problem Statement

Run-3 achieved 25/25 quality on 3 committed files (Q×F = 3.0) — the first non-zero Q×F for release-it. The quality ceiling is clean. The volume ceiling is not: 8 of 23 `lib/` files were falsely classified by the pre-scan as having no instrumentable functions, even though they contain exported async class methods. The advisory findings in the PR summary confirmed these false negatives:

| File | Async methods missed | Category |
|------|---------------------|----------|
| lib/plugin/github/GitHub.js | 13 | Primary Octokit integration |
| lib/plugin/npm/npm.js | 8 | npm publish pipeline |
| lib/plugin/GitBase.js | 6 | Base git operations |
| lib/plugin/GitRelease.js | 2 | Release notes pipeline |
| lib/plugin/Plugin.js | 1 | Base plugin class |
| lib/plugin/version/Version.js | 1 | Version resolution |
| lib/prompt.js | 1 | Prompt display |
| lib/shell.js | 2 | Shell exec wrappers |

Additionally, Git.js failed in run-3 due to Anthropic API termination (not a quality issue) and GitLab.js failed due to a pre-scan false negative + COV-002 on an uninstrumented fetch. Two spiny-orb infrastructure bugs were documented: the weaver prerequisite check hangs under `vals exec` without `HOME` forwarded (workaround: `HOME="$HOME"` in instrument command), and `gh pr create` targets the upstream repo in forks (workaround: create PR manually).

**Run-3 results (baseline for run-4 comparison)**:

| Metric | Run-3 |
|--------|-------|
| Files processed | 23/23 |
| Committed (net) | 3 |
| Quality | 25/25 (100%) |
| Failed | 2 (Git.js: API termination; GitLab.js: COV-002) |
| Pre-scan false negatives | 8 (async class methods) |
| True correct skips | 10 |
| Cost | $1.59 |
| Push | YES |
| PR | FAILED (gh upstream targeting) — manual PR#2 |
| Q×F | 3.0 |
| IS | 90/100 |

### P1 Blockers from Run-3

| # | Blocker | Root cause | Status entering run-4 |
|---|---------|------------|-----------------------|
| RUN3-1 | Pre-scan false negative on async class methods | Pre-scan does not traverse class bodies; exports via class syntax not detected | Check if spiny-orb P1-A fix has landed on main |
| RUN3-2 | `gh pr create` targets upstream in fork | `createPr` calls `gh pr create` without `--repo`; gh defaults to upstream | Check if spiny-orb P1-B fix has landed; PR created manually as workaround |

### P2 Issues from Run-3

| # | Issue | Status entering run-4 |
|---|-------|-----------------------|
| RUN3-3 | HOME not forwarded to weaver subprocess | Workaround confirmed: `HOME="$HOME"` in instrument command; spiny-orb P2-A fix pending |
| RUN3-4 | Git.js API termination (2 attempts) | Infrastructure; retry with no agent changes |
| RUN3-5 | GitLab.js COV-002 on uninstrumented fetch at line 188 | Retry contingent on RUN3-1 pre-scan fix; COV-003 conflict may also resurface |
| RUN3-6 | service.instance.id absent (RES-001) — IS miss | Bootstrap file does not set service.instance.id; 10-point IS miss |

### Primary Goal

Increase Q×F by correctly instrumenting the 8 false-negative plugin files. If RUN3-1 pre-scan fix has landed, estimated Q×F: ~8–12 (8 new files + 3 from run-3 ≈ 11 committed at quality). If not, Q×F stays near 3.0.

---

## Solution Overview

Same milestone structure as all Type D eval runs. Pre-run verification explicitly checks RUN3-1 and RUN3-2 status.

### Three-Repo Workflow

| Repo | Path | Role |
|------|------|------|
| **release-it** (target) | `~/Documents/Repositories/release-it` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-88-evaluation-run-4-release-it`) **never merges to main**. The PR exists for CodeRabbit review only. Run `/prd-done` at completion to close issue #88 without merging the eval branch. Step 13 (Copy artifacts to main) preserves the run artifacts on main before the PR is closed.

---

## Success Criteria

1. Q×F ≥ 8 if RUN3-1 pre-scan fix landed; Q×F > 3.0 if RUN3-1 not yet fixed (fallback: at least one more file than run-3)
2. Pre-scan false negative status assessed — if RUN3-1 fixed, 8+ additional files attempted
3. PR created in wiggitywhitney/release-it (auto if RUN3-2 fixed; manual otherwise)
4. All 23 `lib/` files processed
5. Quality score produced across all six dimensions
6. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
7. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [x] **Read language-extension-plan.md**

  Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

- [x] **Collect skeleton documents**

  Create `evaluation/release-it/run-4/` directory in the eval repo with skeleton files:
  - `lessons-for-run5.md` (copy structure from `evaluation/release-it/run-3/lessons-for-run4.md`)
  - `spiny-orb-findings.md` (fresh skeleton with P1/P2/P3 sections)

- [x] **Pre-run verification**

  Verify run-3 P1 blockers and validate run prerequisites:

  1. **RUN3-1 (pre-scan class methods) — CHECK**: On spiny-orb main, check if async class method detection has landed. Test by examining a class-based file in release-it: if the pre-scan now identifies async class methods in `lib/plugin/github/GitHub.js` as instrumentable, the fix landed. If not, expect ~3 files committed (same as run-3).
  2. **RUN3-2 (gh pr create upstream targeting) — CHECK**: On spiny-orb main, check if `createPr` now derives `--repo` from `git remote get-url origin`. If fixed, auto PR creation should work. If not, manual PR workaround still required.
  3. **RUN3-3 (HOME forwarding) — MUST APPLY**: Confirm `HOME="$HOME"` is included in the instrument command (see command below). This is required regardless of whether the spiny-orb P2-A fix has landed.
  4. **RUN3-4 (API termination on Git.js) — NOTE**: No pre-run action needed. API termination is infrastructure — retry as-is.
  5. **RUN3-5 (GitLab.js COV-002)**: Retry if pre-scan fix landed (RUN3-1). Note that COV-003/NDS-007 conflict on graceful catch blocks may also surface — watch for it.
  6. **Target repo readiness**: Verify release-it fork is on `main`, working tree is clean, `spiny-orb.yaml` and `semconv/` exist, `@opentelemetry/api` is in devDependencies.
  7. **File inventory**: Confirm 23 `.js` files in `lib/` — run `find lib -name "*.js" | wc -l` from `~/Documents/Repositories/release-it/`.
  8. **Rebuild spiny-orb**: Rebuild from **main** (unless a specific fix branch has been communicated for this run). Record SHA.
  9. **Record versions**: Node.js version, spiny-orb version/SHA, release-it version.
  10. Append observations to `evaluation/release-it/run-4/lessons-for-run5.md`.

  **If RUN3-1 is not fixed**: proceed anyway. Document the miss. Q×F will remain near 3.0 but run-4 still produces valid evaluation data.

- [x] **Evaluation run-4**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.**

  **Instrument command** (run from `~/Documents/Repositories/release-it/`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL HOME="$HOME" GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose --thinking 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-4/spiny-orb-output.log'
  ```

  Note: `HOME="$HOME"` is required — weaver prerequisite check needs HOME for `~/.weaver/vdir_cache/`. See FINDING-PRE-1 in run-3 actionable-fix-output.md.

  AI role: (1) confirm readiness, (2) once Whitney provides the log output, save it and write `evaluation/release-it/run-4/run-summary.md`, (3) **push the eval branch to origin immediately** — the branch holds the only copy of run artifacts until step 13 copies them to main.

- [x] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

  Success criteria: Whitney has acknowledged the findings overview.

- [x] **Failure deep-dives**

  Root cause analysis for each failed/partial file and run-level failures.
  Produces: `evaluation/release-it/run-4/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [x] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/release-it/run-4/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [x] **PR artifact evaluation**

  Produces: `evaluation/release-it/run-4/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [x] **Rubric scoring**

  Produces: `evaluation/release-it/run-4/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [x] **IS scoring run** — **AI runs all commands**. See `docs/language-extension-plan.md` step 9 for the full automated sequence. Full protocol in CLAUDE.md "IS Scoring Runs" section.

  If 0 files committed on the instrument branch: write `NOT EVALUABLE — 0 files committed` to `evaluation/release-it/run-4/is-score.md` and stop.

  Target-specific values for release-it: instrument branch `spiny-orb/instrument-XXXXXXXXXX`; entrypoint `./bin/release-it.js --dry-run`; devDep install via `npm`.

  Produces: `evaluation/release-it/run-4/is-score.md`

- [x] **Baseline comparison**

  Compare run-4 against the most recent commit-story-v2 run (check `evaluation/commit-story-v2/run-log.md`) and against release-it run-3. Highlight dimensions that differ by more than 1 point from commit-story-v2.
  Produces: `evaluation/release-it/run-4/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [x] **Update root README**

  After baseline comparison: (1) add a row for run-4 to the release-it run history table in `README.md`; (2) update the "next run" sentence below the release-it run history table to reference run-5 and its primary goals.

- [x] **Actionable fix output** *(user-facing checkpoint 2)*

  1. Run the cross-document audit agent to verify consistency across all run-4 evaluation artifacts.
  2. Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-5.
  3. Print the absolute file path of `evaluation/release-it/run-4/actionable-fix-output.md`.
  4. **Pause.** Do not proceed until Whitney confirms handoff.

  Produces: `evaluation/release-it/run-4/actionable-fix-output.md`

- [ ] **Draft Run-5 PRD**

  Create on a separate branch from main. Use Type D structure from `docs/language-extension-plan.md` and this PRD as the milestone style reference. Carry forward both user-facing checkpoints. Merge the PRD-only PR to main so `/prd-start` can pick it up.

- [ ] **Copy artifacts to main**

  From main, run:
  ```bash
  git checkout feature/prd-88-evaluation-run-4-release-it -- evaluation/release-it/run-4/
  ```
  Commit with message `eval: save release-it run-4 artifacts to main [skip ci]`. Update `evaluation/release-it/run-log.md` with a new row for this run (create if it doesn't exist, using `evaluation/commit-story-v2/run-log.md` as the format reference). Push. This step runs before `/prd-done` so artifacts land on main while the eval branch is still reachable.

---

## Score Projections

**Conservative** (RUN3-1 pre-scan fix not landed; P2 items unchanged):

- 8 false-negative files still skipped by pre-scan
- Git.js retry may succeed (API termination was infrastructure)
- **Files committed**: 3–4 (same set as run-3 + Git.js if retry succeeds)
- **Quality**: 25/25
- **Q×F**: ~3–4
- **Cost**: ~$2–3

**Target** (RUN3-1 pre-scan fix landed):

- 8 previously-skipped files now attempted; most commit cleanly
- GitLab.js may still oscillate on COV-002/COV-003 conflict
- **Files committed**: 8–12
- **Quality**: 24–25/25
- **Q×F**: ~8–12
- **Cost**: ~$5–10 (more LLM calls for class-method-heavy files)

**Stretch** (all P1+P2 fixes landed):

- Auto PR creation works
- GitLab.js COV-003 validator fix lands
- **Files committed**: 12–15
- **Quality**: 25/25
- **Q×F**: ~12–15

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| RUN3-1 not fixed (pre-scan still misses class methods) | Accept result; run-4 still validates quality on whatever commits; document gap for run-5 |
| Git.js API termination recurs | Document; flag for spiny-orb team; if 3+ consecutive runs, escalate |
| GitLab.js COV-003 resurfaces | Document new failure mode; add to spiny-orb-findings.md |
| IS scoring unavailable if 0 committed files | Mark NOT EVALUABLE; do not block milestone |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-05 | Run-4 proceeds regardless of whether RUN3-1 pre-scan fix has landed | Even without the fix, run-4 validates quality on the 3 files that did commit in run-3, retries Git.js, and produces a valid eval data point for tracking progress |
| 2026-05-05 | HOME="$HOME" stays in instrument command until spiny-orb P2-A fix confirmed on main | Workaround is safe and low-cost; removing it without confirming the fix would repeat run-3's blocked start |
| 2026-05-06 | GITHUB_TOKEN_RELEASE_IT lives only in the release-it fork's .vals.yaml, not the eval repo's | Token was added to the fork's vals.yaml during run-2 setup but never mirrored to the eval repo's vals.yaml. Always use `-f ~/Documents/Repositories/release-it/.vals.yaml` for dry-run verification, not the eval repo's file. Using the eval repo's file produces "invalid token" — a false alarm. |
| 2026-05-06 | Spiny-orb findings go in handoff document, not filed directly as GitHub issues | The eval team's role is to collect findings and deliver actionable-fix-output.md to the spiny-orb team. The spiny-orb team decides what to file. Direct issue creation from eval sessions bypasses the triage handoff. |
| 2026-05-06 | LINT/NDS-003 indentation conflict is a structural spiny-orb issue, not an agent prompt issue | Adding the startActiveSpan wrapper adds 2 indentation levels, pushing long lines over Prettier's 120-char print width. The LINT validator catches if the agent preserves originals; NDS-003 catches if the agent reformats. No prompt change fixes this — the fix requires a Prettier post-pass before NDS-003 comparison, or computing NDS-003's baseline against the Prettier-formatted original. |
| 2026-05-06 | IS scoring is fully automated — AI runs all commands, never surfaces steps for user | IS scoring is not a user-facing action. The AI handles Colima check, stale container removal, devDep install, Datadog Agent stop/start, Docker collector, target app dry-run, score-is.js, and cleanup. Canonical instructions: CLAUDE.md "IS Scoring Runs" section and `docs/language-extension-plan.md` step 9. Applies to all Type C and Type D eval PRDs. |

---

## Prior Art

- **PRD #53**: run-1 evaluation (this repo, branch `feature/prd-53-javascript-eval-setup`)
- **PRD #68**: run-2 evaluation (this repo, branch `feature/prd-68-evaluation-run-2-release-it`)
- **PRD #77**: run-3 evaluation (this repo, branch `feature/prd-77-evaluation-run-3-release-it`)
- **evaluation/release-it/run-3/actionable-fix-output.md**: P1/P2/P3 findings, 2 P1 blockers for run-4
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
