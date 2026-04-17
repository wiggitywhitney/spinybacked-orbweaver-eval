# PRD #15: JS Evaluation Run-15: commit-story-v2 — Catch-Block Consistency Verification

**Status:** Ready
**Created:** 2026-04-16
**GitHub Issue:** #61
**Depends on:** PRD #55 (run-14 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-14 scored 22/25 (88%) — the lowest since run-6 — with 12 committed files and 32 spans. Quality regressed from run-13's 25/25 (100%) due to three failures:

1. **COV-003 + CDQ-003** (`journal-graph.js` `summaryNode`): summaryNode was instrumented for the first time in any run, but its catch block was missing `span.recordException()` + `span.setStatus(ERROR)`. technicalNode and dialogueNode in the same file both had correct error recording — the inconsistency was a retry-drift artifact from a 3-attempt instrumentation across a large file.

2. **COV-004** (`summary-manager.js`): 6 exported async I/O functions without spans for the 3rd consecutive run. The agent applied a "ratio backstop" heuristic. Disposition (blocking promotion vs. per-function validator) is being decided by PRD #483 Milestone M2 in the spiny-orb audit.

### Primary Goal

Verify that the catch-block consistency fix (RUN14-1) landed cleanly: all three LangGraph nodes in `journal-graph.js` (`summaryNode`, `technicalNode`, `dialogueNode`) have `span.recordException()` + `span.setStatus(ERROR)` in their catch blocks.

### Secondary Goals

- Monitor COV-004 outcome: if PRD #483 M2 promotes COV-004 to blocking or adds per-function validator, run-15 is the first run where that fix applies to summary-manager.js
- Maintain 12+ committed files (no regression from run-14)
- Cost ≤$5.00 (improvement trend from run-13's $6.41 → run-14's $5.59)
- Fifth consecutive push/PR success

### Run-14 Scores (baseline for run-15 comparison)

| Dimension | Run-14 | Run-13 | Run-12 |
|-----------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 | 2/2 |
| COV | 3/5 (60%) | 5/5 | 4/5 |
| RST | 4/4 (100%) | 4/4 | 4/4 |
| API | 3/3 (100%) | 3/3 | 3/3 |
| SCH | 4/4 (100%) | 4/4 | 4/4 |
| CDQ | 6/7 (86%) | 7/7 | 6/7 |
| **Total** | **22/25 (88%)** | **25/25** | **23/25** |
| **Gates** | **5/5** | **5/5** | **5/5** |
| **Files** | **12** | **7** | **12+1p** |
| **Cost** | **$5.59** | **~$6.41** | **$5.19** |
| **Push/PR** | **YES (#65)** | **YES (#62)** | **YES (#61)** |
| **IS** | **80/100** | **N/A** | **N/A** |
| **Q×F** | **10.6** | **7.0** | **11.0** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| COV-003 + CDQ-003: summaryNode catch | RUN14-1 | 1 run | P1 fix pending in spiny-orb |
| COV-004: summary-manager.js | RUN12-1 | 3 runs | Disposition pending PRD #483 M2 |
| journal-graph.js 3 attempts | RUN12-4 | 3 runs | Root cause uninvestigated; cost driver |
| Cost above $4.00 | RUN11-4 | 4 runs | $5.59 in run-14 |
| IS SPA-001: journal trace 12 INTERNAL spans | RUN14-4 | 1 run | Monitor |
| IS RES-001: no service.instance.id | RUN14-5 | 1 run | SDK config gap, not spiny-orb scope |

---

## Solution Overview

Same four-phase structure as runs 5–14:

1. **Pre-run verification** — Verify RUN14-1 fix (catch-block consistency) and PRD #483 M2 COV-004 outcome
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #16

### Two-Repo Workflow

Same as runs 9–14.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-14 results** (eval repo): `evaluation/commit-story-v2/run-14/` on branch `feature/prd-55-evaluation-run-14`
- **Run-14 actionable fix output**: `evaluation/commit-story-v2/run-14/actionable-fix-output.md`
- **Evaluation rubric** (spiny-orb repo): `spinybacked-orbweaver/research/evaluation-rubric.md` (32 rules)
- **Style references**: `docs/templates/eval-run-style-reference/`

### Eval Branch Convention

This PRD document (`prds/61-evaluation-run-15.md`) merges to `main` so `/prd-start` can pick it up.

The **evaluation execution branch** created by `/prd-start` from main **never merges to main**. That branch holds eval artifacts and exists for CodeRabbit review only. When `/prd-done` runs at completion, close issue #61 without merging the eval execution branch.

---

## Success Criteria

1. Quality score of 25/25 restored
2. `journal-graph.js` summaryNode catch block has `span.recordException()` + `span.setStatus(ERROR)` — consistent with technicalNode and dialogueNode
3. COV-003 and CDQ-003 pass for all three LangGraph nodes
4. At least 12 committed files (no regression from run-14)
5. Push/PR succeeds (fifth consecutive)
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology
8. Cross-document audit agent run at end of actionable-fix-output milestone
9. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [ ] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-15/` directory with `lessons-for-prd16.md` skeleton. Must run before pre-run verification step 9.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-14/actionable-fix-output.md`. Check which findings were filed as issues.
  2. **Catch-block consistency fix** (P1 — critical, RUN14-1): Verify the fix for summaryNode's missing error recording landed. The fix involves prompt guidance for consistent `span.recordException() + span.setStatus(ERROR)` across all LangGraph node catch blocks in `journal-graph.js`. Confirm the relevant issue/PR is closed and merged to spiny-orb main.
  3. **COV-004 outcome from PRD #483 M2**: Check whether PRD #483 Milestone M2 completed and what decision was made for COV-004. Three outcomes are possible:
     - COV-004 promoted to blocking → summary-manager.js will commit with all 9 functions if the fix was also made
     - COV-004 gets per-function validator output → agent receives specific function names; same commit behavior expected
     - COV-004 kept advisory as-is → same failure pattern as runs 12–14 expected; not a regression
     Record which outcome applies. Do NOT block the run if PRD #483 M2 is still in progress — proceed with the run and note the open status.
  4. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. **Before switching to main, check for uncommitted artifacts on the current instrument branch** (run `git status` in commit-story-v2) and commit any to that branch before switching.
  5. **Push auth stability check**: Verify token still works (dry-run push).
  6. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  7. Rebuild spiny-orb from **main**.
  8. Record version and findings status.
  9. Append observations to `evaluation/commit-story-v2/run-15/lessons-for-prd16.md`.

- [ ] **Evaluation run-15** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-15/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-15/run-summary.md`.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-15/spiny-orb-output.log
  ```

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) whether summaryNode catch block looks consistent with the other nodes (signal for RUN14-1 fix), (4) quality score if visible, (5) cost, (6) push/PR status. Keep it conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files.
  Produces: `evaluation/commit-story-v2/run-15/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all 32 rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-15/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-15/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-15/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

  1. **Claude runs**: `datadog-agent stop`
  2. **Claude starts** the OTel Collector in the background:
     ```bash
     docker run --rm -d --name otelcol-is -w /etc/otelcol -p 4318:4318 -v /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is:/etc/otelcol otel/opentelemetry-collector-contrib:latest --config /etc/otelcol/otelcol-config.yaml
     ```
  3. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout spiny-orb/instrument-XXXXXXXXXX -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true` — `@traceloop/instrumentation-langchain` API incompatibility crashes the process. See `evaluation/is/README.md`.
  4. **Claude stops** the Collector: `docker stop otelcol-is`
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-15/is-score.md`
  6. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-15/is-score.md`

- [ ] **Baseline comparison** — Compare run-15 vs runs 2-14.
  Produces: `evaluation/commit-story-v2/run-15/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-15 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence at the bottom to reference run-16 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-15 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-16.
  3. **Advisory findings document for PRD #483** (if PRD #483 is still active): Create `evaluation/commit-story-v2/run-15/advisory-findings-for-audit.md` using the same format as run-14's version. Hard data only — rule ID, finding text, TP/FP classification.
  4. Print the absolute file path of `evaluation/commit-story-v2/run-15/actionable-fix-output.md`.
  5. **Pause.** Do not proceed to Draft PRD #16 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #16** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #16's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|

---

## Score Projections for Run-15

### Conservative (RUN14-1 fix lands, COV-004 unchanged)

- **Quality**: 25/25 (100%) — COV-003 + CDQ-003 resolved; COV-004 still advisory
- **Files**: 12 — same set as run-14
- **Cost**: ~$5.00–5.50 — 3-attempt files persist

### Target (RUN14-1 fix + COV-004 promoted or per-function validator)

- **Quality**: 25/25 (100%)
- **Files**: 12–13 — if summary-manager.js commits all 9 exported async functions, file count stays at 12 but span count increases; 13 if one additional file commits
- **Cost**: ~$4.50–5.00

### Stretch (all fixes + journal-graph.js reaches 2 attempts)

- **Quality**: 25/25, full attribute coverage
- **Files**: 13
- **Cost**: ≤$4.00
