# PRD #14: JS Evaluation Run-14: commit-story-v2 — Smart Rollback + Type-Safety Verification

**Status:** Draft
**Created:** 2026-04-12
**GitHub Issue:** #55
**Depends on:** PRD #13 (run-13 complete, 3 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-13 scored 25/25 (100%) on 7 committed files — quality restored — but with the lowest committed file count ever (Q×F = 7.0). Two checkpoint test failures caused 10 files to be rolled back, including meaningful instrumentation in summary-manager.js (8 spans), journal-manager.js, index.js, and mcp/server.js.

The two checkpoint failures reveal a new class of type-safety gap in agent attribute guards:

1. **Checkpoint failure 1** (`summary-graph.js`): Agent guarded `weeklySummaries.length` with `!== undefined`; tests pass `null`. `null !== undefined` is true, so the guard does not protect against `null.length`.
2. **Checkpoint failure 2** (`journal-manager.js`): Agent called `commit.timestamp.split('T')[0]` assuming a string; tests pass a `Date` object.

Additionally, `summaryNode` in `journal-graph.js` has been skipped due to NDS-003 (Code Preserved) for 3 consecutive runs (runs 11–13).

Run-13 actionable fix output: `evaluation/commit-story-v2/run-13/actionable-fix-output.md`

### Primary Goal

Verify that three spiny-orb fixes land cleanly in run-14:
- **RUN13-1** (smart checkpoint rollback): only the file containing the failing code is rolled back, not the full window
- **RUN13-2** (type-safety guards): `!= null` preferred over `!== undefined`; `new Date(value).toISOString()` used for timestamp conversion
- **RUN13-3** (summaryNode NDS-003): summaryNode in journal-graph.js instrumented for the first time

### Secondary Goals

- Restore committed file count to 13 (run-11 high) with smart rollback saving the cascade victims
- Verify summary-manager.js (8 spans, previously rolled back) commits cleanly under COV-004 guidance fix
- Cost ≤$4.00
- Fourth consecutive push/PR success

### Run-13 Scores (baseline for run-14 comparison)

| Dimension | Run-13 | Run-12 | Run-11 |
|-----------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 | 2/2 |
| COV | 5/5 (100%) | 4/5 | 5/5 |
| RST | 4/4 (100%) | 4/4 | 4/4 |
| API | 3/3 (100%) | 3/3 | 3/3 |
| SCH | 4/4 (100%) | 4/4 | 4/4 |
| CDQ | 7/7 (100%) | 6/7 | 7/7 |
| **Total** | **25/25 (100%)** | **23/25** | **25/25** |
| **Gates** | **5/5** | **5/5** | **5/5** |
| **Files** | **7** | **12+1p** | **13** |
| **Cost** | **~$6.41** | **$5.19** | **$4.25** |
| **Push/PR** | **YES (#62)** | **YES (#61)** | **YES (#60)** |
| **Q×F** | **7.0** | **11.0** | **13.0** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| journal-graph.js summaryNode NDS-003 | RUN11-5 | 3 runs | P1 fix in RUN13-3 |
| journal-graph.js 3 attempts | RUN12-4 | 2 runs | LLM variation, unknown root cause |
| Cost above $4.00 | RUN11-4 | 3 runs | Regressed to ~$6.41 in run-13 |
| Advisory contradiction rate | RUN11-1 | 3 runs | 67% in run-13 (worse) |
| COV-004 on summary-manager.js | RUN12-1 | Unverified | Fix landed (PR #398) but file rolled back in run-13 |
| RUN7-7 span count self-report | Run-7 | 8 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 | 13 runs | Open spec gap, not triggered |

---

## Solution Overview

Same four-phase structure as runs 5-13:

1. **Pre-run verification** — Verify smart rollback fix (RUN13-1), type-safety guidance (RUN13-2), and summaryNode fix (RUN13-3) are merged; validate prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #15

### Two-Repo Workflow

Same as runs 9-13.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-13 results** (eval repo): `evaluation/commit-story-v2/run-13/` on branch `feature/prd-37-evaluation-run-13`
- **Run-13 actionable fix output**: `evaluation/commit-story-v2/run-13/actionable-fix-output.md`
- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Style references**: `docs/templates/eval-run-style-reference/`

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-55-eval-run-14`) **never merges to main**. The PR exists for CodeRabbit review only. When `/prd-done` runs at completion, close issue #55 without merging the eval branch.

---

## Success Criteria

1. Quality score of 25/25 maintained
2. At least 13 files committed (recover from run-13's 7-file regression)
3. No checkpoint test failures (or, if failures occur, only the failing file is rolled back — not the full 5-file window)
4. `journal-graph.js` summaryNode receives a span (first time in any run)
5. `summary-manager.js` all 9 exported async functions instrumented (COV-004 verification)
6. Push/PR succeeds (fourth consecutive)
7. Per-file span counts verified by post-hoc counting
8. All evaluation artifacts generated from canonical methodology
9. Cross-document audit agent run at end of actionable-fix-output milestone
10. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [ ] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-14/` directory with `lessons-for-prd15.md` skeleton. Must run before pre-run verification step 9.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-13/actionable-fix-output.md`. Check which findings were filed as issues.
  2. **Smart checkpoint rollback fix** (P1 — critical): Verify RUN13-1 is merged. Check that checkpoint failures now parse the test stack trace and roll back only the file(s) named in the failing test output, not the full window.
  3. **Type-safety setAttribute guidance** (P1 — critical): Verify RUN13-2 is merged. Check that the agent instrumentation prompt includes guidance to use `!= null` over `!== undefined`, and `new Date(value).toISOString()` for timestamp fields.
  4. **summaryNode NDS-003 fix** (P1): Verify RUN13-3 is merged. Check that either the NDS-003 allowlist or the agent prompt addresses template literal modification in summaryNode.
  5. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. **Before switching to main, check for uncommitted artifacts on the current instrument branch** (run `git status` in commit-story-v2) and commit any to that branch before switching.
  6. **Push auth stability check**: Verify token still works (dry-run push).
  7. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  8. Rebuild spiny-orb from **current branch** (not necessarily main — rebuild from whatever branch it's on).
  9. Record version and findings status.
  10. Append observations to `evaluation/commit-story-v2/run-14/lessons-for-prd15.md`.

- [ ] **Evaluation run-14** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role in this milestone: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-14/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-14/run-summary.md`.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-14/spiny-orb-output.log
  ```

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether checkpoint failures occurred and how many files were rolled back (signal for whether smart rollback fix worked), (3) quality score if visible in log, (4) cost, (5) push/PR status. Keep it conversational, under 10 lines. Wait for her acknowledgment before proceeding.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files.
  Produces: `evaluation/commit-story-v2/run-14/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all 32 rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-14/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-14/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-14/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **Baseline comparison** — Compare run-14 vs runs 2-13.
  Produces: `evaluation/commit-story-v2/run-14/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-14 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-15.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-14/actionable-fix-output.md` (derive from current working directory).
  4. **Pause.** Do not proceed to Draft PRD #15 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #15** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints (Findings Discussion + handoff pause) into PRD #15's milestone structure.

---

## Score Projections for Run-14

**Note on "50% discount"**: Projections discount 50% toward worst case to account for LLM variation.

### Minimum (no fixes land)

- **Quality**: 25/25 (100%) — checkpoint catches errors before they commit
- **Files**: 7-10 — checkpoint cascade continues without smart rollback
- **After 50% discount**: 25/25, 7-9 files

### Target (all 3 P1 fixes land)

- **Quality**: 25/25 (100%)
- **Files**: 13 — smart rollback saves cascade victims; summaryNode commits
- **Cost**: ~$3-4 — sunk cost eliminated with smart rollback
- **After 50% discount**: 25/25, 10-13 files, cost ~$4-5

### Stretch (all fixes + cost reduction)

- **Quality**: 25/25, full attribute coverage
- **Files**: 13+
- **Cost**: ≤$4.00 if journal-graph.js returns to 2 attempts
- **After 50% discount**: 25/25, 12-13 files
