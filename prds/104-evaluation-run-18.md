# PRD #18: JS Evaluation Run-18: commit-story-v2 — NDS-003 Reconciler Gap Fix Verification

**Status:** Ready
**Created:** 2026-05-12
**GitHub Issue:** #104
**Depends on:** PRD #17 (run-17 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-17 scored 22/25 (88%) with 10 committed files and a Q×F of 8.8 — flat from run-16 despite the thinking budget fix. The NDS-003 gate failed for the first time in the series (4/5 gates). Four findings are new or elevated:

1. **RUN17-1 (P1)** — NDS-003 reconciler gap: the validator's line-offset calculation breaks when `startActiveSpan` wrapping adds lines inside a nested callback. The reconciler counts re-indented lines as both "removed" and "added," inflating the cumulative offset. Blocked: context-capture-tool.js (saveContext), reflection-tool.js (saveReflection), index.js (main), summary-manager.js generateAndSaveDailySummary + generateAndSaveWeeklySummary + generateAndSaveMonthlySummary. Agent code is correct in all cases.

2. **RUN17-2 (P1)** — NDS-003 content corruption in journal-graph.js: the agent dropped `}` from a JSON template literal in `formatChatMessages`. Hypothesis: 65% thinking budget cap insufficient for character-level verification in complex 629-line files. Also: ~48 of the 49 NDS-003 violations are the same reconciler gap as RUN17-1.

3. **RUN17-3 (P2)** — git-collector COV-001: `getCommitData` (exported async, primary orchestrator) has no span. Only `getPreviousCommitTime` was instrumented. Exists across 8+ prior runs; first detected in run-17 via per-agent evaluation.

4. **RUN17-4 (P2)** — summary-graph SCH-002: `messages_count` and `quotes_count` used for journal entry counts (wrong domain). Present since run-12; first detected in run-17 via per-agent evaluation.

### Primary Goal

Verify that RUN17-1 (NDS-003 reconciler gap for `startActiveSpan` in nested callbacks) and RUN17-2 (journal-graph content corruption) are resolved:
- context-capture-tool.js commits `saveContext` with a span
- reflection-tool.js commits `saveReflection` with a span
- index.js commits `main()` with a span
- summary-manager.js commits generateAndSaveDailySummary, generateAndSaveWeeklySummary, generateAndSaveMonthlySummary with spans
- journal-graph.js commits with all original line content intact (template literal closing brace preserved)
- NDS-003 gate passes (5/5 gates)

### Secondary Goals

- RUN17-3 verified: git-collector.js `getCommitData` commits with a span
- RUN17-4 verified: summary-graph.js uses domain-correct attributes (no `messages_count` or `quotes_count` for journal entries)
- Cost improvement toward ~$8-9 (failed-file waste eliminated)
- IS SPA-001: structural calibration mismatch — not a regression. See `docs/language-extension-plan.md` step 9.5.
- Eighth consecutive push/PR success expected

### Run-17 Scores (baseline for run-18 comparison)

| Dimension | Run-17 | Run-16 | Run-15 |
|-----------|--------|--------|--------|
| NDS | 2/2 (100%) | 1/2 (50%) | 2/2 |
| COV | 3/5 (60%) | 3/5 (60%) | 4/5 |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 |
| SCH | 3/4 (75%) | 4/4 (100%) | 4/4 |
| CDQ | 7/7 (100%) | 7/7 (100%) | 7/7 |
| **Total** | **22/25 (88%)** | **22/25 (88%)** | **24/25 (96%)** |
| **Gates** | **4/5** | **5/5** | **5/5** |
| **Files** | **10+1p** | **10+3p** | **14** |
| **Cost** | **$10.43** | **$12.29** | **$6.44** |
| **Push/PR** | **YES (#69)** | **YES (#68)** | **YES (#66)** |
| **IS** | **90/100** | **80/100** | **70/100** |
| **Q×F** | **8.8** | **8.8** | **13.4** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN17-1: NDS-003 reconciler gap (startActiveSpan in nested callbacks) | RUN17-1 | 1 run | P1 — spiny-orb reconciler fix needed |
| RUN17-2: NDS-003 content corruption (journal-graph.js, thinking budget) | RUN17-2 | 1 run | P1 — thinking budget cap evaluation needed |
| RUN17-3: git-collector COV-001 (getCommitData missing span) | RUN17-3 | 1 run | P2 — pre-scan AST fix needed |
| RUN17-4: summary-graph SCH-002 (wrong attribute domain) | RUN17-4 | 1 run | P2 — new attribute + agent directive needed |
| journal-graph.js NDS-003 (full failure, 4 runs) | RUN16-4 | 4 runs | P1 component of RUN17-1+RUN17-2 |
| IS SPA-001: INTERNAL span count structural | RUN15-4 | 3 runs | Structural calibration mismatch |
| Advisory contradiction rate ~39% | RUN11-1 | 8 runs | SCH-001 false positives on extension spans |
| RUN17-5: Advisory pass rollback path unaudited | **RUN17-5** | 1 run | Low — bundled with RUN17-6; rollback-to-prior-passing-file path has no confirmed test coverage |
| RUN17-6: PR title "(N files)" count wrong | **RUN17-6** | 1 run | Low — bundled with RUN17-5; title shows unexplained count vs actual processed/committed |

---

## Solution Overview

Same four-phase structure as runs 5–17:

1. **Pre-run verification** — Verify RUN17-1, RUN17-2, RUN17-3, RUN17-4 fixes landed
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #19

### Two-Repo Workflow

Same as runs 9–17.

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

1. Quality score of 22/25 or better (conservative: COV-001 and SCH-002 still open) or 24/25 (target: all P1 fixes land)
2. context-capture-tool.js, reflection-tool.js, index.js, and summary-manager.js 3 generate functions all commit with spans (RUN17-1 reconciler fix verified)
3. journal-graph.js commits with correct template literal content — no dropped characters (RUN17-2 content corruption resolved)
4. NDS-003 gate passes (5/5 gates)
5. At least 13 committed files (recovering from run-17's 10)
6. Push/PR succeeds (eighth consecutive)
7. Per-file span counts verified by post-hoc counting
8. All evaluation artifacts generated from canonical methodology (per-agent approach)
9. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to step 9.5 (SPA-001 calibration note for commit-story-v2) and step 9 (IS scoring protocol). **Do not mark this complete until you have read both sections.**

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-18/` directory with `lessons-for-prd19.md` skeleton. Must run before pre-run verification step 9.

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-17/actionable-fix-output.md`. Check which issues were filed (RUN17-1: NDS-003 reconciler gap + PRD #845 update; RUN17-2: thinking budget cap issue; RUN17-3+RUN17-4: coverage/schema bundle; RUN17-5+RUN17-6: reliability/UX bundle) and confirm their status.
  2. **RUN17-1 fix** (P1 — critical): In the NDS-003 reconciler, verify the offset calculation now handles `startActiveSpan` wrapping inside nested callbacks. Check that context-capture-tool.js `saveContext` (original 121 lines) and reflection-tool.js `saveReflection` (original 113 lines) — both MCP `server.tool()` callback structures — would produce output the validator accepts. The key check: does the reconciler correctly skip re-indented lines inside span wrappers rather than counting them as removals? If PRD #845 M2 has a regression fixture for this pattern, confirm it passes.
  3. **RUN17-2 fix** (P1 — critical): Verify the thinking budget for file-level calls is sufficient for complex files (journal-graph.js is 629 lines with nested template literals and regex arrays). The issue was tracking whether 65% of max_tokens is the right cap. Check if the cap was raised or made dynamic.
  4. **RUN17-3 fix** (P2): Verify that the pre-scan AST or agent directive now identifies `getCommitData` in git-collector.js as a COV-001 target. Confirm the fix is on spiny-orb main.
  5. **RUN17-4 fix** (P2): Verify that `commit_story.journal.entries_count` (or equivalent) has been added to the schema, and that the agent directive prevents reuse of `messages_count` or `quotes_count` for journal entry counts. Confirm on spiny-orb main.
  6. **Other spiny-orb fixes since run-17**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  7. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. **Before switching to main, check for uncommitted artifacts on the current instrument branch** (run `git status` in commit-story-v2) and commit any to that branch before switching.
  8. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  9. **File inventory**: Count .js files in commit-story-v2's `src/` directory.
  10. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  11. Record version and findings status.
  12. Append observations to `evaluation/commit-story-v2/run-18/lessons-for-prd19.md`.

- [ ] **Evaluation run-18** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-18/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-18/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/commit-story-v2/run-18/debug-dumps/` before handing Whitney the command.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-18/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-18/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-18 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN17-1 fix result — specifically whether context-capture-tool.js, reflection-tool.js, index.js, and summary-manager.js all 3 generate functions committed with spans, (4) RUN17-2 fix result — whether journal-graph.js committed and if so whether the template literal `}` corruption is gone; if still failed, note whether the failure is the same content corruption or a different NDS-003 pattern, (5) RUN17-3 result — whether git-collector.js getCommitData has a span, (6) quality score if visible, (7) cost, (8) push/PR status, (9) overall attempt-count distribution (D-1 signal). Keep it conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files.
  Produces: `evaluation/commit-story-v2/run-18/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-18/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **(D-2) Use one agent per file**: Spawn one agent per file in parallel; each agent reads style reference, `evaluation/commit-story-v2/run-17/per-file-evaluation.md` (for rule descriptions), original source (`git show main:src/file`), committed source (`git show <instrument-branch>:src/file`), agent notes from log, debug dump if applicable, and schema (`semconv/attributes.yaml`); each writes its section to `evaluation/commit-story-v2/run-18/per-file-sections/<filename>.md`; main context assembles into per-file-evaluation.md. Correct-skip files: one batch agent for RST-001 verification. This approach surfaced two previously undetected quality gaps in run-17 (git-collector COV-001, summary-graph SCH-002); use it for run-18.

  **(D-1) Track attempt counts**: For each file, note attempts. Assess whether ≥2-attempt files show better quality (real NDS-003 fixes) vs noise (formatting churn).

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-18/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-18/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

  1. **Claude runs**: `datadog-agent stop`
  2. **Claude starts** the OTel Collector in the background:
     ```bash
     docker run --rm -d --name otelcol-is -w /etc/otelcol -p 4318:4318 --user "$(id -u):$(id -g)" -v /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is:/etc/otelcol otel/opentelemetry-collector-contrib:latest --config /etc/otelcol/otelcol-config.yaml
     ```
  3. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout spiny-orb/instrument-XXXXXXXXXX -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true` — `@traceloop/instrumentation-langchain` API incompatibility crashes the process. See `evaluation/is/README.md`.
  4. **Claude stops** the Collector: `docker stop otelcol-is`
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-18/is-score.md`
  6. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-18/is-score.md`

- [ ] **Baseline comparison** — Compare run-18 vs runs 2-17.
  Produces: `evaluation/commit-story-v2/run-18/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-18 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence at the bottom to reference run-19 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-18 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-19.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-18/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #19 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #19** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #19's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone. Per-file evaluation milestone must specify the D-2 per-agent approach.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/commit-story-v2/run-18/` to copy all artifacts. Commit to main with message `eval: save run-18 artifacts to main [skip ci]`. Add one row to `evaluation/commit-story-v2/run-log.md` for run-18 and commit with `eval: update run-log for run-18 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|

---

## Score Projections for Run-18

### Conservative (RUN17-1 reconciler fix lands, RUN17-2 thinking budget unchanged)

- **Quality**: 22/25 (88%) — COV-001 (git-collector) and SCH-002 (summary-graph) still open; but NDS-003 gate recovers to 5/5; context-capture-tool, reflection-tool, index.js commit; summary-manager 3 generate functions commit
- **Files**: 13-14 — 4 previously failed files now commit; journal-graph still blocked by RUN17-2 content corruption
- **Cost**: ~$8-9 — failed-file waste reduced; journal-graph still consuming tokens on failed attempts
- **Q×F**: (22/25) × 13 = 11.4

### Target (RUN17-1 + RUN17-2 fixes land)

- **Quality**: 22/25 (88%) — COV-001 and SCH-002 still open
- **Files**: 14-15 — all 4 failed files commit; summary-manager 3 generate functions commit
- **Cost**: ~$6-8
- **Q×F**: (22/25) × 14 = 12.3

### Stretch (all P1+P2 fixes land)

- **Quality**: 24/25 (96%) — COV-001 (git-collector) and SCH-002 (summary-graph) resolved; technicalNode still oscillating (PRD #845 in progress)
- **Files**: 14-15
- **Cost**: ~$6-8
- **Q×F**: (24/25) × 14 = 13.4 — matching run-15 record
