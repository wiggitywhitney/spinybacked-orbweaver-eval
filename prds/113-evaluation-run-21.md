# PRD #21: JS Evaluation Run-21: commit-story-v2 — NDS-003 Trivia-Loss Bug Fix Verification

**Status:** Ready
**Created:** 2026-06-02
**GitHub Issue:** #113
**Depends on:** PRD #20 (run-20 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-20 scored 24/25 (96%) with 12 committed files and a Q×F of 11.5 — a strong recovery from run-19's 84% regression (PRD #885 multiLine fix confirmed). However, a new spiny-orb regression introduced by PRD #885 blocked mcp/server.js for the first time across all three attempts. Two findings need verification in run-21:

1. **RUN20-1 (P1)** — NDS-003 trivia-loss false positive on mcp/server.js: when `removeOtelImports` in `nds003-ast-stripper.ts` removes an OTel import placed as the first statement in the file, ts-morph takes the node's leading file-level trivia (shebang, JSDoc block) with it. The resulting `normalizedStripped` is missing 21 lines vs `normalizedOriginal`, producing spurious forward-check failures at fixed line numbers (1, 3–20, 37, 39) across all 3 attempts. The agent's instrumented code was correct. Fix: detect and transfer leading file-level trivia to the next statement before removing a first-position OTel import.

2. **RUN20-3 (P2)** — index.js COV-005 regression: `main()` committed without `commit_story.cli.subcommand` (was present in run-19). Root cause: NDS-003 pressure from the same trivia-loss bug caused attempt-3 simplification. Expected to recover if RUN20-1 fix lands.

### Primary Goal

Verify that RUN20-1 (NDS-003 trivia-loss fix) is resolved:
- mcp/server.js commits cleanly with a span (no spurious NDS-003 violations)
- index.js `commit_story.cli.subcommand` attribute present in `main()` output

### Secondary Goals

- RUN20-2 watch: 3-attempt rate should drop from run-20's 46% (6/13 files) if NDS-003 contamination was the primary driver; if rate stays elevated, PRD #897 prompt generality cleanup is an independent factor
- RUN19-2 persistent (P2): git-collector.js `getCommitData` COV-005 — agent expressed intent but registered no schema extensions; verify schema update reliability investigation progress
- RUN20-4 watch: summary-manager.js `readWeekDailySummaries` and `readMonthWeeklySummaries` — prompt guidance for result-count attributes on read-path functions
- RUN20-5 watch: mcp/server.js SCH-001 — will become a scored failure once NDS-003 fix allows the file to commit; watch whether the agent anchors on a consistent registered span name or continues inventing variants
- IS SPA-002: orphan span — different span ID each run (run-19: `b48fbc5f`; run-20: `ce5f0429`); verify whether the context propagation gap correlates with a specific LangGraph execution path
- journal-graph.js: fifth consecutive success expected (runs 17–20 confirmed)
- Q×F target ≥ 12.5 if mcp/server.js commits (13 files × 24/25)

### Run-20 Scores (baseline for run-21 comparison)

| Dimension | Run-20 | Run-19 | Run-18 | Run-17 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | **4/5 (80%)** | 2/5 (40%) | 5/5 (100%) | 3/5 (60%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) | 3/4 (75%) |
| CDQ | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) |
| **Total** | **24/25 (96%)** | **21/25 (84%)** | **24/25 (96%)** | **22/25 (88%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **4/5** |
| **Files** | **12+1f** | **10+3p** | **11** | **10+1p** |
| **Cost** | **$9.08** | **$8.83** | **$9.16** | **$10.43** |
| **Push/PR** | **AUTO (#73)** | **AUTO (#71)** | **YES (#70, manual)** | **YES (#69)** |
| **IS** | **80/100** | **80/100** | **90/100** | **90/100** |
| **Q×F** | **11.5** | **8.4** | **10.6** | **8.8** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN20-1: NDS-003 trivia-loss (mcp/server.js) | RUN20-1 | 1 run | P1 — `removeOtelImports` in `nds003-ast-stripper.ts` fix needed |
| RUN20-3: index.js COV-005 (subcommand attribute dropped) | RUN20-3 | 1 run | P2 — expected to resolve if RUN20-1 fix resolves NDS-003 pressure |
| RUN20-2: High 3-attempt rate (46%) | RUN20-2 | 1 run | P2 — may resolve if NDS-003 contamination was causal; watch |
| RUN19-2: git-collector.js COV-005 (getCommitData output attrs) | RUN19-2 | 2 runs | P2 — schema update reliability investigation needed |
| RUN20-4: summary-manager.js read-path COV-005 | RUN20-4 | 1 run | P3/Watch — first-time commit revealed input-only instrumentation |
| RUN20-5: mcp/server.js SCH-001 recurring | RUN20-5 | 1 run | P3/Watch — becomes scored failure if NDS-003 fix lands |
| IS SPA-002: orphan span (context propagation gap) | RUN19-3 | 2 runs | P2 — different span ID each run; correlates with LangChain auto-instrumentation |
| IS SPA-001: INTERNAL span count structural | RUN15-4 | 6 runs | Structural calibration mismatch; not a regression target |

---

## Solution Overview

Same four-phase structure as runs 5–20:

1. **Pre-run verification** — Verify RUN20-1 fix landed; check RUN19-2 investigation progress
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #22

### Two-Repo Workflow

Same as runs 9–20.

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

1. mcp/server.js commits cleanly with a span (RUN20-1 trivia-loss fix confirmed)
2. index.js `commit_story.cli.subcommand` attribute present in `main()` (COV-005 recovery)
3. Quality score ≥ 24/25 (96%) regardless of RUN20-1 fix status
4. Q×F ≥ 12.5 if mcp/server.js commits (13 files × 24/25)
5. Push/PR succeeds automatically (twelfth consecutive)
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology (per-agent approach)
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to step 9.5 (SPA-001 calibration note for commit-story-v2) and step 9 (IS scoring protocol). **Do not mark this complete until you have read both sections.**

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-21/` directory with `lessons-for-prd22.md` skeleton. Must run before pre-run verification step 12.

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-20/actionable-fix-output.md`. Check which findings were filed (RUN20-1: `removeOtelImports` trivia-loss; RUN20-2: 3-attempt cluster; RUN19-2: schema update reliability) and confirm their status.
  2. **RUN20-1 fix** (P1 — critical): Verify that `removeOtelImports` in `nds003-ast-stripper.ts` has been updated to transfer leading file-level trivia (shebang, file-level JSDoc) to the next statement before removing a first-position OTel import. Check whether a regression fixture for the mcp/server.js pattern (shebang + 18-line file-level JSDoc before imports) exists and passes. If the fix has NOT landed, still proceed — run-21 will confirm the gap persists.
  3. **RUN20-3 dependency** (P2): No independent fix is expected for index.js COV-005 — it should resolve automatically if RUN20-1 lands. Verify this understanding is correct.
  4. **RUN19-2 investigation** (P2 — 2nd run): Check whether spiny-orb has investigated `agent-extensions.yaml` reset behavior between retry attempts. Verbose log framing diagnostic: files that register new attributes say `"New attribute X: no registered key captures..."` (active registration); files that document but skip say `"X captures [concept]. No registered attribute covers..."` (passive documentation). Check if any prompt or architecture change addresses this asymmetry. If not fixed, still proceed — run-21 will add a third data point.
  5. **RUN20-4 watch** (P3): Check for any prompt guidance update covering result-count attributes on read-path functions (e.g., `readWeek*`, `readMonth*` in summary-manager.js).
  6. **Other spiny-orb fixes since run-20**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  7. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. Check for staged .instrumentation.md files from run-20 (expected; spiny-orb will overwrite them).
  8. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  9. **File inventory**: Count .js files in commit-story-v2's `src/` directory (expect 30).
  10. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  11. Record version and findings status.
  12. **README check**: Verify `README.md` on main has rows for runs 15–20 in the commit-story-v2 run history table.
  13. Append observations to `evaluation/commit-story-v2/run-21/lessons-for-prd22.md`.

- [x] **Evaluation run-21** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-21/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-21/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/commit-story-v2/run-21/debug-dumps/` before handing Whitney the command.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-21/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-21/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-21 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [x] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN20-1 fix result — specifically whether mcp/server.js committed cleanly without NDS-003 violations, (4) RUN20-3 result — whether index.js `commit_story.cli.subcommand` is present, (5) 3-attempt rate — did it drop from run-20's 46%?, (6) journal-graph.js result — fifth consecutive?, (7) quality score if visible, (8) cost, (9) push/PR status (auto or manual?), (10) overall attempt-count distribution (D-1 signal). Keep it conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [x] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files.
  Produces: `evaluation/commit-story-v2/run-21/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [x] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-21/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **(D-2) Use one agent per file**: Spawn one agent per file in parallel; each agent reads style reference, `evaluation/commit-story-v2/run-20/per-file-evaluation.md` (for rule descriptions), original source (`git show main:src/file`), committed source (`git show <instrument-branch>:src/file`), agent notes from log, debug dump if applicable, and schema (`semconv/attributes.yaml`); each writes its section to `evaluation/commit-story-v2/run-21/per-file-sections/<filename>.md`; main context assembles into per-file-evaluation.md. Correct-skip files: one batch agent for RST-001 verification.

  **(D-1) Track attempt counts**: For each file, note attempts. If a file required ≥ 3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent (grep: `grep -A 80 "Processing file.*<filename>" spiny-orb-output.log`). Check agent note framing: `"New attribute X"` = announced registration; `"X captures... No registered attribute"` = gap documented, not acted on.

- [x] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-21/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: https://github.com/wiggitywhitney/commit-story-v2/pull/74 (instrument branch: spiny-orb/instrument-1780596389399)

- [x] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-21/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md` (run-12 format)
  **IMPORTANT — use run-20 rubric as the primary precedent reference** (`evaluation/commit-story-v2/run-20/rubric-scores.md`), not run-12. Run-20 contains the current rule set and two critical precedents:
  1. **CDQ-006 precedent**: CDQ-006 advisory findings (e.g., external-source strings in setAttribute) are "advisory, not canonical failures per established rubric precedent" — do NOT fail CDQ-006 for the advisory findings in run-21's pr-evaluation.md for context-capture-tool and journal-manager.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose agent output would have passed COV-001 ("WOULD PASS" in per-file evaluation) are scored as COV-001 PASS, consistent with run-20's treatment of mcp/server.js. Apply this to both mcp/server.js and index.js in run-21.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-005 is now NDS-007 in per-file evaluation tables — treat as the same rule for rubric scoring.

- [x] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

  1. **Claude runs**: `datadog-agent stop`
  2. **Claude starts** the OTel Collector in the background:
     ```bash
     docker run --rm -d --name otelcol-is -w /etc/otelcol -p 4318:4318 --user "$(id -u):$(id -g)" -v /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is:/etc/otelcol otel/opentelemetry-collector-contrib:latest --config /etc/otelcol/otelcol-config.yaml
     ```
  3. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout spiny-orb/instrument-1780596389399 -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true` — `@traceloop/instrumentation-langchain` API incompatibility crashes the process. See `evaluation/is/README.md`.
  4. **Claude stops** the Collector: `docker stop otelcol-is`
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-21/is-score.md`
  6. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-21/is-score.md`

- [x] **Baseline comparison** — Compare run-21 vs runs 2–20.
  Produces: `evaluation/commit-story-v2/run-21/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [x] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-21 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence to reference run-22 and its primary goals.

- [x] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-21 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-22.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-21/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #22 until Whitney confirms she has handed the document off to the spiny-orb team.

- [x] **Draft PRD #22** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #22's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone. Per-file evaluation milestone must specify the D-2 per-agent approach. Run-22 primary goals and score projections are in `evaluation/commit-story-v2/run-21/actionable-fix-output.md` §5 (carry-forward tracker); spiny-orb issues to reference: #917 (NDS-003 blank-line-near-JSDoc), #916 (import reformatting), #915 (CDQ-001/COV-005 prompt guidance), #918 (notes timing). Created as `prds/115-evaluation-run-22.md`, GitHub issue #115, merged via PR #116.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/commit-story-v2/run-21/` to copy all artifacts. Commit to main with message `eval: save run-21 artifacts to main [skip ci]`. Add one row to `evaluation/commit-story-v2/run-log.md` for run-21 and commit with `eval: update run-log for run-21 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|

---

## Score Projections for Run-21

**If RUN20-1 fix lands and mcp/server.js commits:**
- mcp/server.js contributes a committed span; 13 files committed total
- If index.js COV-005 also recovers (expected): COV holds at 4/5 or improves; Q×F reaches ~12.5 (24/25 × 13 files)
- If git-collector.js COV-005 also resolves: COV reaches 5/5; quality reaches 25/25 (100%); Q×F = 13.0 — matches run-11/run-13 record
- mcp/server.js SCH-001: becomes a scored failure at run-21 if the span name is not registered; watch for consistent vs. invented name

**If RUN20-1 fix has NOT landed (same trivia-loss patterns persist):**
- mcp/server.js fails again; index.js COV-005 persists; 3-attempt cluster may persist
- Conservative: 24/25 (96%), 12 files, Q×F ≈ 11.5 (same as run-20)
