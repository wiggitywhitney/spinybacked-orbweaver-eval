# PRD #100: JavaScript Evaluation Run-5: release-it — LINT/NDS-003 Indentation Conflict Resolution

**Status:** Ready
**Created:** 2026-05-07
**GitHub Issue:** #100
**Depends on:** PRD #88 (run-4 complete, findings in `evaluation/release-it/run-4/actionable-fix-output.md`)

---

## Read This First

Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

---

## Problem Statement

Run-4 achieved Q×F 6.7 on 7 committed files at 24/25 quality — more than double run-3's 3.0. The pre-scan class method fix (RUN3-1) is confirmed working: Git.js committed with 10 spans from async class methods. The new ceiling is structural: 5 of 6 failed files hit the LINT/NDS-003 indentation-width conflict.

| File | Async methods blocked | Conflict mechanism |
|------|----------------------|--------------------|
| lib/plugin/github/GitHub.js | 13 | Agent split long lines → NDS-003 ×8; LINT also fires |
| lib/plugin/GitBase.js | 6 | Agent preserved originals → LINT fails |
| lib/plugin/GitRelease.js | 2 | Agent preserved originals → LINT fails |
| lib/plugin/npm/npm.js | ~8 | Agent split destructuring → NDS-003 ×26 |
| lib/prompt.js | 1 | Agent preserved originals → LINT fails |

The `startActiveSpan` wrapper adds 2 indentation levels. Files with long lines near Prettier's 120-char print width cannot satisfy both LINT (Prettier-compliant output) and NDS-003 (preserve original lines) simultaneously — no matter how many attempts the agent takes. Additionally, GitLab.js has never committed across 3 runs due to separate validator issues.

**Run-4 results (baseline for run-5 comparison)**:

| Metric | Run-4 |
|--------|-------|
| Files processed | 23/23 |
| Committed (net) | 7 |
| Quality | 24/25 (96%) |
| Failed | 6 (5 LINT/NDS-003 conflict; 1 GitLab.js COV-003+SCH-002) |
| Correct skips | 10 |
| Cost | $6.97 |
| Push | YES |
| PR | FAILED (E2BIG — compliance report in PR body) |
| Q×F | 6.7 |
| IS | 100/100 |

### P1 Blockers from Run-4

| # | Blocker | Root cause | Status entering run-5 |
|---|---------|------------|-----------------------|
| RUN4-1 | LINT/NDS-003 indentation-width conflict | `startActiveSpan` adds 2 indent levels; long lines exceed Prettier's 120-char print width; agent can't satisfy both validators | Check if spiny-orb Prettier post-pass fix has landed on main |
| RUN4-2 | PR body E2BIG | Live-check compliance report embedded inline in PR body (~12MB); `gh pr create --body` hits OS argument limit | Check if `--body-file` fix landed; also check if compliance report is now written to file rather than printed inline |

### P2 Issues from Run-4

| # | Issue | Status entering run-5 |
|---|-------|-----------------------|
| RUN4-3 | COV-003 validator gap: `Promise.reject` not detected as rethrow | shell.js quality failure; validator fix pending in spiny-orb |
| RUN4-4 | GitLab.js SCH-002 cross-domain contradiction | Validator flagged `release_it.gitlab.asset_name` as duplicate of `release_it.github.assets_count` — different domains entirely; watch in run-5 |
| RUN3-3 | HOME not forwarded to weaver subprocess | Workaround still active: `HOME="$HOME"` in instrument command |

### Primary Goal

If RUN4-1 fix has landed: instrument the 5 blocked plugin files (GitHub.js with 13 async methods, GitBase.js with 6, GitRelease.js with 2, npm.js, prompt.js). Expected Q×F: ~10–12. If not fixed: run-5 produces valid data at the same ceiling as run-4.

---

## Solution Overview

Same milestone structure as all Type D eval runs. Pre-run verification explicitly checks RUN4-1 and RUN4-2 status.

### Three-Repo Workflow

| Repo | Path | Role |
|------|------|------|
| **release-it** (target) | `~/Documents/Repositories/release-it` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-100-evaluation-run-5-release-it`) **never merges to main**. The PR exists for CodeRabbit review only. Run `/prd-done` at completion to close issue #100 without merging the eval branch. Step 13 (Copy artifacts to main) preserves the run artifacts on main before the PR is closed.

---

## Success Criteria

1. Q×F ≥ 10 if RUN4-1 indentation-width fix landed; Q×F > 6.7 if not yet fixed (fallback: at least one more file than run-4)
2. LINT/NDS-003 conflict status assessed — document whether fix landed and which files it unblocked
3. PR created in wiggitywhitney/release-it (auto if RUN4-2 fixed; manual otherwise)
4. All 23 `lib/` files processed
5. Quality score produced across all six dimensions
6. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
7. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [ ] **Read language-extension-plan.md**

  Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

- [ ] **Collect skeleton documents**

  Create `evaluation/release-it/run-5/` directory in the eval repo with skeleton files:
  - `lessons-for-run6.md` (copy structure from `evaluation/release-it/run-4/lessons-for-run5.md`)
  - `spiny-orb-findings.md` (fresh skeleton with P1/P2/P3 sections)

- [ ] **Pre-run verification**

  Verify run-4 P1 blockers and validate run prerequisites:

  1. **RUN4-1 (LINT/NDS-003 indentation-width conflict) — CHECK**: On spiny-orb main, check if the Prettier post-pass fix has landed (look for a PR addressing LINT/NDS-003 conflict or Prettier formatting before NDS-003 validation). Test on `lib/plugin/github/GitHub.js`: if the pre-scan identifies it as instrumentable AND the agent can produce a LINT-passing result, the fix is live. If not, expect ~7 files committed (same set as run-4).
  2. **RUN4-2 (PR body E2BIG) — CHECK**: On spiny-orb main, check if `createPr` now uses `--body-file` or if the compliance report is written to a separate file rather than embedded inline. If fixed, auto PR creation should work. If not, manual PR workaround still required.
  3. **RUN4-3 (COV-003 Promise.reject gap) — CHECK**: Check if the COV-003 validator now recognizes `return Promise.reject(err)` as a rethrow pattern. If fixed, shell.js should pass COV-003.
  4. **RUN4-4 (GitLab.js SCH-002) — CHECK**: Check if the SCH-002 duplicate detection now constrains matching to same-namespace attributes. If fixed, `release_it.gitlab.asset_name` should not be flagged as a duplicate of `release_it.github.assets_count`.
  5. **RUN3-3 (HOME forwarding) — MUST APPLY**: Confirm `HOME="$HOME"` is included in the instrument command regardless of whether spiny-orb fix has landed.
  6. **Target repo readiness**: Verify release-it fork is on `main`, working tree is clean. Run `git status` in `~/Documents/Repositories/release-it` — if OTel devDeps from a prior IS scoring run are present in package.json/package-lock.json, restore with `git restore package.json package-lock.json` before proceeding.
  7. **File inventory**: Confirm 23 `.js` files in `lib/` — run `find lib -name "*.js" | wc -l` from `~/Documents/Repositories/release-it/`.
  8. **Rebuild spiny-orb**: Rebuild from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && git checkout main && git pull && npm install && npm run build`. Record SHA.
  9. **Record versions**: Node.js version, spiny-orb version/SHA, release-it version.
  10. Append observations to `evaluation/release-it/run-5/lessons-for-run6.md`.

  **If RUN4-1 is not fixed**: proceed anyway. Document the miss. Q×F will remain near 6.7 but run-5 still produces valid evaluation data.

- [ ] **Evaluation run-5**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.**

  AI must create `evaluation/release-it/run-5/debug-dumps/` before handing Whitney the command.

  **Instrument command** (run from `~/Documents/Repositories/release-it/`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL HOME="$HOME" GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f ~/Documents/Repositories/release-it/.vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-5/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-5/spiny-orb-output.log'
  ```

  Note: `HOME="$HOME"` is required — weaver prerequisite check needs HOME for `~/.weaver/vdir_cache/`. `vals exec` reads from release-it fork's `.vals.yaml` (NOT the eval repo's). Source directory is `lib/`.

  AI role: (1) confirm readiness, (2) once Whitney provides the log output, save it and write `evaluation/release-it/run-5/run-summary.md`, (3) **push the eval branch to origin immediately** — the branch holds the only copy of run artifacts until step 13 copies them to main, (4) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/release-it/spiny-orb-pr-summary.md --repo wiggitywhitney/release-it --head <instrument-branch> --title "..."`

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

  Success criteria: Whitney has acknowledged the findings overview.

- [ ] **Failure deep-dives**

  Root cause analysis for each failed/partial file and run-level failures.
  Produces: `evaluation/release-it/run-5/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/release-it/run-5/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation**

  Produces: `evaluation/release-it/run-5/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring**

  Produces: `evaluation/release-it/run-5/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **IS scoring run** — **AI runs all commands**. See CLAUDE.md "IS Scoring Runs" section and `docs/language-extension-plan.md` step 9 for the full automated sequence.

  If 0 files committed on the instrument branch: write `NOT EVALUABLE — 0 files committed` to `evaluation/release-it/run-5/is-score.md` and stop.

  Target-specific values for release-it: entrypoint `./bin/release-it.js --dry-run`; devDep install via `npm`.

  Produces: `evaluation/release-it/run-5/is-score.md`

- [ ] **Baseline comparison**

  Compare run-5 against run-4 and run-3, and against the most recent commit-story-v2 run (check `evaluation/commit-story-v2/run-log.md`). Highlight dimensions that differ by more than 1 point from commit-story-v2.
  Produces: `evaluation/release-it/run-5/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README**

  After baseline comparison: (1) add a row for run-5 to the release-it run history table in `README.md`; (2) update the "next run" sentence below the release-it run history table to reference run-6 and its primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2)*

  1. Run the cross-document audit agent to verify consistency across all run-5 evaluation artifacts.
  2. Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-6.
  3. Print the absolute file path of `evaluation/release-it/run-5/actionable-fix-output.md`.
  4. **Pause.** Do not proceed until Whitney confirms handoff.

  Produces: `evaluation/release-it/run-5/actionable-fix-output.md`

- [ ] **Draft Run-6 PRD**

  Create on a separate branch from main. Use Type D structure from `docs/language-extension-plan.md` and this PRD as the milestone style reference. Carry forward both user-facing checkpoints. Merge the PRD-only PR to main so `/prd-start` can pick it up.

- [ ] **Copy artifacts to main**

  From main, run:
  ```bash
  git checkout feature/prd-100-evaluation-run-5-release-it -- evaluation/release-it/run-5/
  ```
  Commit with message `eval: save release-it run-5 artifacts to main [skip ci]`. Update `evaluation/release-it/run-log.md` with a new row for this run. Push. This step runs before `/prd-done` so artifacts land on main while the eval branch is still reachable.

---

## Score Projections

**Conservative** (RUN4-1 indentation fix not landed):

- 5 LINT/NDS-003 conflict files still fail
- GitLab.js may still fail (SCH-002 contradiction not fixed)
- **Files committed**: ~7 (same set as run-4)
- **Quality**: 24/25 (COV-003 shell.js may persist until validator fix)
- **Q×F**: ~6.7
- **Cost**: ~$5–7

**Target** (RUN4-1 fix landed):

- GitHub.js (13 methods), GitBase.js (6), GitRelease.js (2), npm.js, and prompt.js now commit cleanly
- GitLab.js uncertain (depends on SCH-002 fix)
- **Files committed**: 11–13
- **Quality**: 24–25/25
- **Q×F**: ~10–12
- **Cost**: ~$8–12 (more LLM calls for class-heavy plugin files)

**Stretch** (RUN4-1 + RUN4-2 both fixed):

- Auto PR creation works
- Full plugin layer instrumented
- **Files committed**: 12–15
- **Quality**: 25/25 if COV-003 validator gap also fixed
- **Q×F**: ~12–15

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| RUN4-1 not fixed (LINT/NDS-003 conflict persists) | Accept result; run-5 still validates run-4's committed files at quality; document gap for run-6 |
| GitLab.js COV-003/SCH-002 persists | Document new failure mode count; add to spiny-orb-findings.md |
| New failure modes surface in previously-blocked plugin files | Document fully in failure-deep-dives; don't count against RUN4-1 fix assessment |
| IS scoring unavailable if 0 committed files | Mark NOT EVALUABLE; do not block milestone |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-07 | Run-5 proceeds regardless of whether RUN4-1 indentation-width fix has landed | Even without the fix, run-5 validates quality on run-4's committed files and produces a valid data point for the trend |
| 2026-05-07 | HOME="$HOME" stays in instrument command | Safe workaround with no downside; removing without confirming spiny-orb fix would risk repeating the weaver timeout failure |
| 2026-05-07 | IS scoring is fully automated — AI runs all commands | Canonical instructions in CLAUDE.md "IS Scoring Runs" section and `docs/language-extension-plan.md` step 9 |

---

## Prior Art

- **PRD #53**: run-1 evaluation (this repo, branch `feature/prd-53-javascript-eval-setup`)
- **PRD #68**: run-2 evaluation (this repo, branch `feature/prd-68-evaluation-run-2-release-it`)
- **PRD #77**: run-3 evaluation (this repo, branch `feature/prd-77-evaluation-run-3-release-it`)
- **PRD #88**: run-4 evaluation (this repo, branch `feature/prd-88-evaluation-run-4-release-it`)
- **evaluation/release-it/run-4/actionable-fix-output.md**: P1/P2 findings, blockers for run-5
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
