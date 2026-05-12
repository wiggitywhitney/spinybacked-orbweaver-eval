# PRD #17: JS Evaluation Run-17: commit-story-v2 — Adaptive Thinking Budget Fix Verification

**Status:** Ready
**Created:** 2026-05-11
**GitHub Issue:** #102
**Depends on:** PRD #86 (run-16 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-16 scored 22/25 (88%) with 10 committed files and a Q×F of 8.8 — a significant regression from run-15's 13.4 record. One run-15 failure resolved (COV-003 summary-detector.js outer catch — primary goal achieved). Three new failures introduced:

1. **RUN16-1 (P1)** — Null parsed_output (token budget exhaustion): four function-level fallback LLM calls exhausted their entire token budget on adaptive thinking and produced no structured output. Root cause: `thinking: { type: 'adaptive' }` with no cap, combined with the COV-003 outer-catch guidance expansion that increased reasoning depth for files with complex catch patterns. Affected: context-capture-tool.js (full failure), reflection-tool.js (full failure), summary-manager.js `generateAndSaveWeeklySummary` + `generateAndSaveMonthlySummary` (skipped within partial). index.js failed separately (API termination).

2. **RUN16-3 (P1)** — NDS-005 function-level fallback bug: the fallback stripped a try/catch block from commit-analyzer.js (a 0-span file requiring no instrumentation). Committed code has a structural defect.

3. **RUN16-4 (P2)** — journal-graph.js technicalNode NDS-003 oscillation: third consecutive run without a span. Separate from the P1 bugs; tracked as a regression fixture in spiny-orb PRD #845.

### Primary Goal

Verify that spiny-orb Issue 1 (RUN16-1: switch `type: 'adaptive'` → `type: 'enabled', budget_tokens: Math.floor(max_tokens * 0.65)` for file-level calls; `max_tokens - 4096` for function-level; raise `MIN_OUTPUT_BUDGET`) and Issue 2 (RUN16-3: 0-span files return original unchanged) landed and resolved the failures:
- context-capture-tool.js commits `saveContext` with a span
- reflection-tool.js commits `saveReflection` with a span
- summary-manager.js `generateAndSaveWeeklySummary` and `generateAndSaveMonthlySummary` both commit with spans
- commit-analyzer.js committed code is bit-for-bit identical to original (no try/catch stripped)

### Secondary Goals

- Monitor journal-graph.js attempt count: 3 in run-16 (run-15's 1-attempt was anomalous). Confirm whether technicalNode oscillation resolves after PRD #845 work lands, or remains a ceiling.
- Cost improvement: $12.29 in run-16 (all-time high). With RUN16-1 fix reducing failed-file token waste and adaptive→enabled preventing budget-exhaustion calls, cost should improve toward ~$8-9.
- IS SPA-001: structural calibration mismatch — not a regression. See `docs/language-extension-plan.md` step 9.5.
- IS RES-001: service.instance.id absent — SDK setup gap, not spiny-orb scope.
- Seventh consecutive push/PR success expected.

### Run-16 Scores (baseline for run-17 comparison)

| Dimension | Run-16 | Run-15 | Run-14 |
|-----------|--------|--------|--------|
| NDS | 1/2 (50%) | 2/2 | 2/2 |
| COV | 3/5 (60%) | 4/5 | 3/5 |
| RST | 4/4 (100%) | 4/4 | 4/4 |
| API | 3/3 (100%) | 3/3 | 3/3 |
| SCH | 4/4 (100%) | 4/4 | 4/4 |
| CDQ | 7/7 (100%) | 7/7 | 6/7 |
| **Total** | **22/25 (88%)** | **24/25 (96%)** | **22/25 (88%)** |
| **Gates** | **5/5** | **5/5** | **5/5** |
| **Files** | **10+3p** | **14** | **12** |
| **Cost** | **$12.29** | **$6.44** | **$5.59** |
| **Push/PR** | **YES (#68)** | **YES (#66)** | **YES (#65)** |
| **IS** | **80/100** | **70/100** | **80/100** |
| **Q×F** | **8.8** | **13.4** | **10.6** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN16-1: Null parsed_output (adaptive thinking budget exhaustion) | RUN16-1 | 1 run | P1 — spiny-orb Issue 1 (switch to type:'enabled' + budget_tokens) |
| RUN16-3: NDS-005 0-span fallback bug (try/catch stripped) | RUN16-3 | 1 run | P1 — spiny-orb Issue 2 (0-span passthrough) |
| RUN16-2: Live-check JSON to terminal stdout | RUN16-2 | 1 run | P2 — bundled with Issue 2 |
| journal-graph.js technicalNode NDS-003 oscillation | RUN16-4 | 3 runs | P2 — tracked in spiny-orb PRD #845 |
| IS SPA-001: INTERNAL span count structural | RUN14-4 | 3 runs | Structural calibration mismatch |
| IS RES-001: no service.instance.id | RUN14-5 | 3 runs | SDK setup gap, not spiny-orb scope |
| Advisory contradiction rate ~90%+ | RUN11-1 | 7 runs | CDQ-007 null guards + SCH-001 semantic dedup |

---

## Solution Overview

Same four-phase structure as runs 5–16:

1. **Pre-run verification** — Verify RUN16-1 and RUN16-3 fixes landed
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #18

### Two-Repo Workflow

Same as runs 9–16.

| Repo | Path | Role |
|------|------|------|
| **commit-story-v2** (target) | `~/Documents/Repositories/commit-story-v2` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver` | The spiny-orb agent |

### Eval Branch Convention

This PRD document merges to `main` so `/prd-start` can pick it up.

The **evaluation execution branch** created by `/prd-start` from main **never merges to main**. Before closing with `/prd-done`, run the "Copy artifacts to main" milestone. When `/prd-done` runs at completion, close the issue without merging or deleting the eval branch.

---

## Success Criteria

1. Quality score of 24/25 or better (conservative: technicalNode oscillation persists) or 25/25 (target: #845 fix lands too)
2. context-capture-tool.js, reflection-tool.js, summary-manager.js generateAndSaveWeeklySummary + generateAndSaveMonthlySummary all commit with spans (RUN16-1 fix verified)
3. commit-analyzer.js committed code is bit-for-bit identical to original (RUN16-3 fix verified)
4. At least 13 committed files (recovering from run-16's 10)
5. Push/PR succeeds (seventh consecutive)
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to step 9.5 (SPA-001 calibration note for commit-story-v2) and step 9 (IS scoring protocol). **Do not mark this complete until you have read both sections.**

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-17/` directory with `lessons-for-prd18.md` skeleton. Must run before pre-run verification step 9.

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-16/actionable-fix-output.md`. Check which issues were filed (Issue 1: RUN16-1 adaptive thinking; Issue 2: RUN16-2+RUN16-3 bundled) and confirm their status.
  2. **RUN16-1 fix** (P1 — critical): In `src/agent/instrument-file.ts`, search for the `thinking:` configuration (was `{ type: 'adaptive' }` at run-16 time). Verify it now uses `type: 'enabled'` with a `budget_tokens` value that is less than `max_tokens` — the exact ratio may vary (0.65 was the recommendation; the team may have shipped a slightly different calibration). The key check is that `type: 'adaptive'` is GONE — replaced by a cap. Also verify the function-level fallback in `instrument-with-retry.ts` propagates the thinking cap correctly (it passes `maxOutputTokens` in — confirm the thinking configuration applies there too). Confirm Issue 1 is closed and on spiny-orb main.
  3. **RUN16-3 fix** (P1 — critical): Verify the function-level fallback returns the original file unchanged when 0 spans are added (no reassembly pass for 0-span files). Confirm Issue 2 is closed and on spiny-orb main.
  4. **RUN16-2 fix** (P2): Verify live-check compliance report JSON is no longer printed to terminal stdout (disk-only output). Bundled with Issue 2.
  5. **Other spiny-orb fixes since run-16**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  6. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. **Before switching to main, check for uncommitted artifacts on the current instrument branch** (run `git status` in commit-story-v2) and commit any to that branch before switching.
  7. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  8. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  9. Rebuild spiny-orb from **main**.
  10. Record version and findings status.
  11. Append observations to `evaluation/commit-story-v2/run-17/lessons-for-prd18.md`.

- [x] **Evaluation run-17** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-17/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-17/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/commit-story-v2/run-17/debug-dumps/` before handing Whitney the command.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-17/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-17/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-17 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [x] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN16-1 fix result — specifically whether context-capture-tool.js, reflection-tool.js, and summary-manager.js generateAndSaveWeeklySummary + generateAndSaveMonthlySummary all committed with spans, (4) RUN16-3 fix result — whether commit-analyzer.js is clean, (5) journal-graph.js attempt count and technicalNode status, (6) quality score if visible, (7) cost, (8) push/PR status, **(9) overall attempt-count distribution — how many files needed 1 / 2 / 3 attempts (D-1 signal)**. Keep it conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [x] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files.
  Produces: `evaluation/commit-story-v2/run-17/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [x] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-17/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`
  **(D-1) Also investigate rising attempt counts**: For each file, note attempt count. For any file with ≥2 attempts, assess whether additional attempts corrected real quality issues (e.g., NDS-003 violation caught and fixed) vs noise (e.g., minor formatting reformat that doesn't affect correctness). Summarize at the end: is the attempt-count trend producing better final instrumentation, or is it validation overhead that warrants a spiny-orb issue?

- [x] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-17/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [x] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-17/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [x] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

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
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-17/is-score.md`
  6. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-17/is-score.md`

- [ ] **Baseline comparison** — Compare run-17 vs runs 2-16.
  Produces: `evaluation/commit-story-v2/run-17/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-17 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence at the bottom to reference run-18 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-17 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-18.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-17/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #18 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #18** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #18's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/commit-story-v2/run-17/` to copy all artifacts. Commit to main with message `eval: save run-17 artifacts to main [skip ci]`. Add one row to `evaluation/commit-story-v2/run-log.md` for run-17 and commit with `eval: update run-log for run-17 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | Investigate rising attempt counts during per-file evaluation | Run-15 most instrumented files succeeded in 1 attempt; run-16 simple files took 2 attempts; run-17 git-collector.js took 3 attempts at file 2 of 30. Trend is real and building across runs. Likely cause: cumulative validation improvements (Prettier-normalized NDS-003, stricter reconcilers, new rules) catching more first-pass failures. Open question: is increased attempt count producing better final instrumentation quality, or just more validation overhead? | 2026-05-12 |

---

## Score Projections for Run-17

### Conservative (RUN16-1 + RUN16-3 fixes land, technicalNode still oscillates)

- **Quality**: 24/25 (96%) — NDS-005 resolved; COV-001/COV-004 resolved for the 4 affected functions; technicalNode still partial
- **Files**: 13–14 — context-capture-tool.js, reflection-tool.js, index.js commit; summary-manager.js 2 functions commit
- **Cost**: ~$8.00–9.00 — reduced failed-file waste; enabled+budget_tokens prevents thinking-exhaustion calls; journal-graph.js 3 attempts baseline persists

### Target (RUN16-1 + RUN16-3 + RUN16-4 PRD #845 fix)

- **Quality**: 25/25 (100%) — all known failures resolved
- **Files**: 14–15
- **Cost**: ~$6.00–7.00 — further reduced; journal-graph.js 3 attempts may improve with NDS-003 fix

### Stretch (all fixes + cost improvement)

- **Quality**: 25/25
- **Files**: 14–15
- **Cost**: ≤$6.00
