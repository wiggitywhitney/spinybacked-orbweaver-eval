# PRD #13: JS Evaluation Run-13: commit-story-v2 — NDS-003 Truthy-Check Fix Verification

**Status:** Draft
**Created:** 2026-04-09
**GitHub Issue:** #37
**Depends on:** PRD #12 (run-12 complete, 6 findings documented, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-12 scored 23/25 (92%) with 12 committed files and 1 partial — a regression from run-11's perfect 25/25. Two new canonical failures emerged:

1. **CDQ-007 FAIL** (`journal-manager.js`): The agent removed truthy guards (`if (commit.hash)`, `if (commit.author)`) to satisfy NDS-003, resulting in unconditional `setAttribute` from potentially nullable fields. The agent's own notes acknowledge "may produce undefined values."
2. **COV-004 FAIL** (`summary-manager.js`): The agent instrumented only 3 pipeline orchestrators, skipping 6 exported async I/O functions (readDayEntries, saveDailySummary, readWeekDailySummaries, saveWeeklySummary, readMonthWeeklySummaries, saveMonthlySummary). Justification ("context propagation") is not a valid COV-004 exemption.

Both failures trace to the **NDS-003 truthy-check gap**: PR #352 added `!== undefined`/`!= null` to the allowlist but did not add truthy-check patterns (`if (value)`, `if (obj.property)`). The gap forces agents to choose between dropping attributes (losing telemetry) or setting them unconditionally (CDQ-007 violation).

Additionally:
- journal-graph.js regressed to 3 attempts (was 2 in run-11)
- Cost reached $5.19 — highest since run-8 and $1.19 over the $4.00 target
- summary-detector.js was partial due to Anthropic API overload (infrastructure, not quality)

### Primary Goal

Verify that spinybacked-orbweaver#388 (NDS-003 truthy-check allowlist fix) resolved the two run-12 failure modes and **restore 25/25 quality with 13 files**.

**Target repo**: commit-story-v2 proper (same as runs 9-12).

### Secondary Goals

- Verify COV-004 improvement: `summary-manager.js` should instrument all 9 exported async functions (not 3)
- journal-graph.js returns to 2 attempts (or fewer)
- Cost ≤$4.00
- Push/PR succeeds (third consecutive)
- Advisory contradiction rate <30%

### Run-12 Scores (baseline for run-13 comparison)

| Dimension | Run-12 | Run-11 (for context) |
|-----------|--------|---------------------|
| Non-Destructiveness (NDS) | 2/2 (100%) | 2/2 (100%) |
| Coverage (COV) | 4/5 (80%) | 5/5 (100%) |
| Restraint (RST) | 4/4 (100%) | 4/4 (100%) |
| API-Only Dependency (API) | 3/3 (100%) | 3/3 (100%) |
| Schema Fidelity (SCH) | 4/4 (100%) | 4/4 (100%) |
| Code Quality (CDQ) | 6/7 (86%) | 7/7 (100%) |
| **Overall quality** | **23/25 (92%)** | **25/25 (100%)** |
| **Gates** | **5/5 (100%)** | **5/5 (100%)** |
| **Files committed** | **12 + 1 partial** | **13** |
| **Cost** | **$5.19** | **$4.25** |
| **Quality x Files** | **11.0** | **13.0** |
| **Push/PR** | **YES (#61)** | **YES (#60)** |

### Run-12 Findings (6 findings)

| # | Title | Priority | Impact |
|---|-------|----------|--------|
| RUN12-1 | COV-004: span omission in summary-manager.js | Medium | Coverage |
| RUN12-2 | CDQ-007: unconditional nullable setAttribute in journal-manager.js | Medium | Code quality |
| RUN12-3 | NDS-003 truthy-check gap — two distinct failure modes | Medium | Rule interaction |
| RUN12-4 | journal-graph.js 3 attempts (regression) | Low | Cost |
| RUN12-5 | Cost $5.19 exceeds $4.00 target | Low | Cost |
| RUN12-6 | summary-detector.js partial due to API overload | Low | Infrastructure |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| NDS-003 truthy-check gap | RUN11-5 | 2 runs | PR #352 partial; orbweaver#388 filed for full fix |
| COV-004 span omission (orchestrators-only) | RUN12-1 | 1 run | LLM variation; guidance fix needed |
| CDQ-007 nullable setAttribute | RUN12-2 | 1 run | Consequence of NDS-003 truthy gap |
| journal-graph.js 3 attempts | RUN12-4 | 1 run | LLM variation; root cause unknown |
| Advisory contradiction rate ~44% | RUN11-1 | 2 runs | SCH-004/CDQ-006 judge issues |
| RUN7-7 span count self-report | Run-7 | 7 runs | Structurally unchanged |
| CJS require() in ESM projects | Run-2 | 12 runs | Open spec gap, not triggered |

---

## Solution Overview

Same four-phase structure as runs 5-12:

1. **Pre-run verification** — Verify spiny-orb fixes landed, validate prerequisites
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #14

### Two-Repo Workflow

Same as runs 9-12.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **commit-story-v2-eval** (evaluation) | `~/Documents/Repositories/commit-story-v2-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-12 results** (eval repo): `evaluation/commit-story-v2/run-12/` on branch `feature/prd-33-evaluation-run-12`
- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Run-12 actionable fix output** (eval repo): `evaluation/commit-story-v2/run-12/actionable-fix-output.md`
- **Run-12 findings** (eval repo): `evaluation/commit-story-v2/run-12/spiny-orb-findings.md` (6 findings)
- **Run-12 lessons** (eval repo): `evaluation/commit-story-v2/run-12/lessons-for-prd13.md`

> **Note**: The actual Run-12 eval artifacts (findings, actionable fixes, lessons) live on branch `feature/prd-33-evaluation-run-12`. The `docs/templates/eval-run-style-reference/` directory on main contains formatting/style reference copies only — use these for style guidance, not as artifact sources.

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-37-evaluation-run-13`) **never merges to main**. The PR exists for CodeRabbit review only. When `/prd-done` runs at completion, close issue #37 without merging the eval branch.

---

## Success Criteria

1. Quality score of 25/25 restored
2. At least 13 files committed (recover from run-12 regression)
3. Push/PR succeeds (third consecutive)
4. `journal-manager.js`: CDQ-007 passes — guard-and-set pattern used for commit.hash and commit.author
5. `summary-manager.js`: COV-004 passes — all 9 exported async functions instrumented (not 3)
6. `index.js`: `commit_story.context.messages_count` attribute present (not dropped)
7. Per-file span counts verified by post-hoc counting
8. All evaluation artifacts generated from canonical methodology
9. Cross-document audit agent run at end of actionable-fix-output milestone
10. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-13/` directory with `lessons-for-prd14.md` skeleton. Must run before pre-run verification step 9.

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-12/actionable-fix-output.md`. Check which findings were filed as issues.
  2. **NDS-003 truthy-check fix** (P1 — critical): Verify orbweaver#388 is merged. Check that `if (value)` and `if (obj.property)` guard patterns are now in the NDS-003 allowlist when the guarded body contains only `span.*` calls.
  3. **COV-004 guidance** (P2): Check if any validator or guidance was added to prevent the "context propagation" span omission pattern for exported async I/O functions.
  4. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist.
  5. **Push auth stability check**: Verify token still works (dry-run push).
  6. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  7. Rebuild spiny-orb from **current branch** (not necessarily main — rebuild from whatever branch it's on).
  8. Record version and findings status.
  9. Append observations to `evaluation/commit-story-v2/run-13/lessons-for-prd14.md`.

- [x] **Evaluation run-13** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role in this milestone: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-13/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-13/run-summary.md`.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-13/spiny-orb-output.log
  ```

- [x] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) quality score if visible in log, (3) cost, (4) push/PR status, (5) top 1-2 surprises or regressions. Keep it conversational, under 10 lines. Wait for her acknowledgment before proceeding.

- [x] **Failure deep-dives** — For each failed file AND run-level failure. Includes the partial file if any.
  Produces: `evaluation/commit-story-v2/run-13/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [x] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all 32 rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-13/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [x] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-13/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [x] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-13/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [x] **Baseline comparison** — Compare run-13 vs runs 2-12.
  Produces: `evaluation/commit-story-v2/run-13/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [x] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-13 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-14.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-13/actionable-fix-output.md` (derive from current working directory).
  4. **Pause.** Do not proceed to Draft PRD #14 until Whitney confirms she has handed the document off to the spiny-orb team.

- [x] **Draft PRD #14** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints (Findings Discussion + handoff pause) into PRD #14's milestone structure.

---

## Score Projections (from Run-12 Actionable Fix Output §7)

**50% discount**: Projections account for LLM variation by discounting 50% toward the worst case. "After 50% discount" = midpoint between ideal and minimum expected outcome.

### Minimum (no fixes — P1/P2 not landed)

- **Quality**: 23/25 (92%) — same failures likely to recur
- **Files**: 12-13
- **Push/PR**: YES
- **After 50% discount**: 22-23/25, 11-13 files

### Target (P1 fix: NDS-003 truthy-check allowlist)

- **Quality**: 25/25 (100%) — CDQ-007 resolved, attribute completeness improves
- **Files**: 13
- **Cost**: Unclear — depends on journal-graph.js attempt count
- **After 50% discount**: 24-25/25, 12-13 files

### Target + P2 (NDS-003 truthy fix + COV-004 guidance)

- **Quality**: 25/25 (100%) — both run-12 failures addressed
- **Files**: 13
- **After 50% discount**: 25/25, 13 files, PR likely

### Stretch (all fixes + cost reduction)

- **Quality**: 25/25, full attribute coverage
- **Files**: 13
- **Cost**: ≤$4.00 if journal-graph.js returns to 2 attempts
- **After 50% discount**: 25/25, 13 files

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| NDS-003 truthy-check fix not landed | Pre-run step 2 verifies. If not fixed, CDQ-007 and attribute dropping continue. Score likely 23/25 again. |
| LLM variation introduces new failure type | 50% discount accounts for this. Oscillation pattern documented — expect ~23/25 minimum if no fixes. |
| journal-graph.js stays at 3 attempts | Cost guard limits impact. Root cause still unknown. |
| API overload recurs on summary-detector.js | Infrastructure issue. Treat partial as clean for rubric purposes. |
| COV-004 guidance fix not landed | summary-manager.js may again omit exported async helpers. Pre-run step 3 checks. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-09 | NDS-003 truthy-check as P1 | Two distinct failure modes in run-12 (CDQ-007 + attribute dropping). Must be fully resolved. orbweaver#388 filed. |
| 2026-04-09 | COV-004 guidance as P2 | Exported async I/O omission is LLM variation but guided by missing rubric clarity. Secondary to P1. |
| 2026-04-09 | Rebuild from current spiny-orb branch (not necessarily main) | Run-12 lesson: spiny-orb was on a feature branch ahead of main. Rebuild from whatever branch it's on, not `main` specifically. |
| 2026-04-09 | Two user-facing checkpoints in all future eval PRDs | Moment 1 (post-run, raw signal) and Moment 2 (post-analysis, interpreted + handoff) are named milestones in this PRD and all successors. |

---

## Prior Art

- **PRD #12**: Run-12 evaluation (this repo, branch `feature/prd-33-evaluation-run-12`)
- **evaluation/commit-story-v2/run-12/**: Full run-12 documentation
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
- **spinybacked-orbweaver#388**: NDS-003 truthy-check allowlist fix (P1)
