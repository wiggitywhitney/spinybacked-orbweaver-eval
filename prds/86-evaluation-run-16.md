# PRD #16: JS Evaluation Run-16: commit-story-v2 — Summary Detector Catch-Block Fix

**Status:** Ready
**Created:** 2026-05-04
**GitHub Issue:** #86
**Depends on:** PRD #61 (run-15 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-15 scored 24/25 (96%) — improvement from run-14's 88% — with 14 committed files, 40 spans, and a new Q×F record of 13.4. Three run-14 failures resolved (COV-003/CDQ-003 on journal-graph.js per OTel spec Decision D1; COV-004 on summary-manager.js). One new failure:

1. **COV-003** (`summary-detector.js` `getDaysWithEntries` and `getDaysWithDailySummaries`): Both functions use `startActiveSpan` with try/finally but no outer catch. Unexpected errors propagate through those spans completely unrecorded. The three `findUnsummarized*` functions in the same file have correct outer catches with `span.recordException(error) + span.setStatus(ERROR)` — the inconsistency is within a single file. This is not a NDS-007 graceful-degradation case; there is simply no outer catch at all.

### Primary Goal

Verify that the RUN15-1 fix (prompt guidance distinguishing inner graceful-degradation catches from outer span error handlers) landed cleanly: `getDaysWithEntries` and `getDaysWithDailySummaries` in `summary-detector.js` have outer catch blocks with `span.recordException(error) + span.setStatus(ERROR)`, consistent with `findUnsummarizedDays`, `findUnsummarizedWeeks`, and `findUnsummarizedMonths` in the same file. COV-003 should pass for all 5 spans in `summary-detector.js`.

### Secondary Goals

- Monitor `journal-graph.js` attempt count: run-15 completed in 1 attempt (down from 3 in runs 12–14). Confirm whether this holds or reverts.
- Cost monitoring: run-15 $6.44, driven by `journal-manager.js` ($1.00, 59.7K tokens) and `summary-manager.js` ($1.19, 71.8K tokens). Watch for changes.
- IS SPA-001: structural calibration mismatch — not a regression (see `docs/language-extension-plan.md` step 9.5). Expected to remain above limit as more files commit.
- Fifth consecutive push/PR success expected.

### Run-15 Scores (baseline for run-16 comparison)

| Dimension | Run-15 | Run-14 | Run-13 |
|-----------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 | 2/2 |
| COV | 4/5 (80%) | 3/5 | 5/5 |
| RST | 4/4 (100%) | 4/4 | 4/4 |
| API | 3/3 (100%) | 3/3 | 3/3 |
| SCH | 4/4 (100%) | 4/4 | 4/4 |
| CDQ | 7/7 (100%) | 6/7 | 7/7 |
| **Total** | **24/25 (96%)** | **22/25 (88%)** | **25/25 (100%)** |
| **Gates** | **5/5** | **5/5** | **5/5** |
| **Files** | **14** | **12** | **7** |
| **Cost** | **$6.44** | **$5.59** | **~$6.41** |
| **Push/PR** | **YES (#66)** | **YES (#65)** | **YES (#62)** |
| **IS** | **70/100** | **80/100** | **N/A** |
| **Q×F** | **13.4** | **10.6** | **7.0** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| COV-003: summary-detector.js outer catch missing | RUN15-1 | 1 run | P1 fix pending in spiny-orb |
| Cost above $4.00 | RUN11-4 | 5 runs | $6.44 in run-15 |
| IS SPA-001: INTERNAL span count structural | RUN14-4 | 2 runs | 37 spans in run-15; structural calibration mismatch (see language-extension-plan.md step 9.5) |
| IS SPA-002: orphan span | RUN15-2 | 1 run | Monitor — likely auto-instrumentation |
| IS RES-001: no service.instance.id | RUN14-5 | 2 runs | SDK setup gap, not spiny-orb scope |
| RUN15-3: push detection bug | RUN15-3 | 1 run | Low — spiny-orb misdetects push success when hook output mixes with git stdout |
| Advisory contradiction rate ~94% | RUN11-1 | 6 runs | SCH-001 semantic dedup + CDQ-007 null guards producing false positives |

---

## Solution Overview

Same four-phase structure as runs 5–15:

1. **Pre-run verification** — Verify RUN15-1 fix (outer catch guidance)
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #17

### Two-Repo Workflow

Same as runs 9–15.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Key Inputs

- **Run-15 results**: `evaluation/commit-story-v2/run-15/` (on `main` after PRD #61 "Copy artifacts to main" milestone; on branch `feature/prd-61-evaluation-run-15` if that step hasn't run yet)
- **Run-15 actionable fix output**: `evaluation/commit-story-v2/run-15/actionable-fix-output.md`
- **Evaluation rubric** (spiny-orb repo): `docs/rules-reference.md`
- **Style references**: `docs/templates/eval-run-style-reference/`

### Eval Branch Convention

This PRD document (`prds/86-evaluation-run-16.md`) merges to `main` so `/prd-start` can pick it up.

The **evaluation execution branch** created by `/prd-start` from main **never merges to main**. That branch holds eval artifacts and exists for CodeRabbit review only. Before closing with `/prd-done`, run the "Copy artifacts to main" milestone. When `/prd-done` runs at completion, close issue #86 without merging the eval execution branch.

---

## Success Criteria

1. Quality score of 25/25 restored
2. `summary-detector.js` COV-003 passes for all 5 spans — `getDaysWithEntries` and `getDaysWithDailySummaries` have outer catch blocks consistent with `findUnsummarizedDays/Weeks/Months`
3. At least 14 committed files (no regression from run-15)
4. Push/PR succeeds (sixth consecutive)
5. Per-file span counts verified by post-hoc counting
6. All evaluation artifacts generated from canonical methodology
7. Cross-document audit agent run at end of actionable-fix-output milestone
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to step 9.5 (SPA-001 calibration note for commit-story-v2) and step 9 (IS scoring protocol). **Do not mark this complete until you have read both sections.**

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-16/` directory with `lessons-for-prd17.md` skeleton. Must run before pre-run verification step 9.

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-15/actionable-fix-output.md`. Check which findings were filed as issues.
  2. **Outer catch guidance fix** (P1 — critical, RUN15-1): Verify the fix for the outer catch gap in `summary-detector.js` landed. The fix involves prompt guidance distinguishing inner graceful-degradation catches (NDS-007 applies — no error recording) from the outer span-level catch (still needed for unexpected exceptions). Confirm the relevant issue/PR is closed and merged to spiny-orb main.
  3. **Other spiny-orb fixes since run-15**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation (push detection bug RUN15-3, advisory quality improvements #728 #729).
  4. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. **Before switching to main, check for uncommitted artifacts on the current instrument branch** (run `git status` in commit-story-v2) and commit any to that branch before switching.
  5. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  6. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  7. Rebuild spiny-orb from **main**.
  8. Record version and findings status.
  9. Append observations to `evaluation/commit-story-v2/run-16/lessons-for-prd17.md`.

- [x] **Evaluation run-16** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-16/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-16/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/commit-story-v2/run-16/debug-dumps/` before handing Whitney the command.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-16/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-16/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-16 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [x] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) COV-003 result for `summary-detector.js` — specifically whether `getDaysWithEntries` and `getDaysWithDailySummaries` now have outer catches consistent with `findUnsummarized*`, (4) `journal-graph.js` attempt count (did the 1-attempt result hold?), (5) quality score if visible, (6) cost, (7) push/PR status. Keep it conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [x] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files.
  Produces: `evaluation/commit-story-v2/run-16/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [x] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-16/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

- [x] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-16/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-16/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`
  *(Updated per D1: NDS-003 for summary-manager.js is PASS — the "line 155 missing" flag is a false positive from line number drift; the early-return guard is present in the committed code.)*

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
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-16/is-score.md`
  6. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-16/is-score.md`

- [ ] **Baseline comparison** — Compare run-16 vs runs 2-15.
  Produces: `evaluation/commit-story-v2/run-16/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-16 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence at the bottom to reference run-17 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-16 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-17.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-16/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #17 until Whitney confirms she has handed the document off to the spiny-orb team.
  *(Updated per D2: null parsed_output fix recommendation = increase minimum token budget for function-level fallback calls on short files, or detect when adaptive thinking reaches ~80% of budget and force output generation. Root cause is token budget exhaustion — NOT output format changes from PRD #509.)*

- [ ] **Draft PRD #17** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #17's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone.
  *(Updated per D2: primary goal for run-17 = verify spiny-orb fix for function-level fallback token budget exhaustion. Affected files: context-capture-tool.js, reflection-tool.js, index.js, and the 2 summary-manager.js functions. The fix is spiny-orb-side — increase minimum budget or detect thinking-dominated responses early. PRD #17 pre-run verification must confirm a fix landed before running.)*

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/commit-story-v2/run-16/` to copy all artifacts. Commit to main with message `eval: save run-16 artifacts to main [skip ci]`. Add one row to `evaluation/commit-story-v2/run-log.md` for run-16 and commit with `eval: update run-log for run-16 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D1 | NDS-003 validator flag on summary-manager.js "line 155 missing" is a false positive from line number drift, not a real structural defect. The return statement IS present in the instrumented file (at line 187/221 due to span wrapper additions shifting line numbers). Rubric should score NDS-003 as PASS for summary-manager.js. | The validator compared against instrument-time base; line numbers shifted between that base and current main. The early-return guard exists in the committed code. | 2026-05-11 |
| D2 | Null parsed_output failures are caused by adaptive thinking exhausting the token budget before producing structured JSON output — not by output format changes introduced in PRD #509. The function-level fallback triggers separate per-function LLM calls with small budgets (min 16,384 for short functions); the model exhausts the budget on reasoning and produces no structured output. | Log shows `stop_reason: max_tokens` + `raw_preview: <no text content>` on all 4 affected calls. Fix recommendation for PRD #17: increase minimum budget for function-level fallback calls, or detect when thinking reaches 80% of budget and force output generation. | 2026-05-11 |

---

## Score Projections for Run-16

### Conservative (RUN15-1 fix lands, no other changes)

- **Quality**: 25/25 (100%) — COV-003 resolved; no other known open quality issues
- **Files**: 14 — same set expected
- **Cost**: ~$6.00–6.50 — similar cost drivers persist

### Target (RUN15-1 fix + journal-manager.js cost improvement)

- **Quality**: 25/25 (100%)
- **Files**: 14–15
- **Cost**: ~$5.00–5.50 — if journal-manager.js reaches lower token regime

### Stretch (all fixes + cost breakthrough)

- **Quality**: 25/25, full coverage
- **Files**: 14–15
- **Cost**: ≤$5.00
