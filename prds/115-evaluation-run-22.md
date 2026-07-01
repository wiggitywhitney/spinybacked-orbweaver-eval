# PRD #22: JS Evaluation Run-22: commit-story-v2 — NDS-003 Import Expansion & Blank-Line-Near-JSDoc Fix Verification

**Status:** Ready
**Created:** 2026-06-05
**GitHub Issue:** #115
**Depends on:** PRD #21 (run-21 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-21 scored 23/25 (92%) with 12 committed files and a Q×F of 11.0 — a regression from run-20's 24/25 (96%). Two new quality failures emerged: CDQ-001 (double-end in claude-collector.js: `span.end()` called inside a `startActiveSpan` callback) and COV-005 (summary-manager.js `saveDailySummary` zero attributes on the file-already-exists skip path). Both file failures are NDS-003 variants:

1. **RUN21-1 (P1)** — mcp/server.js NDS-003 blank-line-near-JSDoc: PR #905 fixed the run-20 shebang trivia-loss variant, but a new independent NDS-003 variant appeared at lines 2, 3, 31, 33, 34. The validator's forward-check misaligns when a blank line is inserted adjacent to the pre-import JSDoc block. The agent's output was structurally correct across all 3 attempts (debug dump confirmed). This is a validator algorithm issue (spiny-orb issue #917).

2. **RUN21-2 (P1)** — index.js NDS-003 + NDS-005 import expansion: With ~60 schema extensions accumulated over 29 preceding files, the agent expanded three single-line `import {` blocks into multi-line form in attempt 1 (152 NDS-003 violations). Attempt 2 could not reconstruct the exact original formatting and introduced NDS-005. Context-pollution failure at file 30/30 — prompt guidance needed to preserve existing import formatting (spiny-orb issue #916).

### Primary Goal

Verify that RUN21-1 (blank-line-near-JSDoc NDS-003) and RUN21-2 (import expansion NDS-003) are resolved:
- mcp/server.js commits cleanly with a span (no spurious NDS-003 violations)
- index.js commits cleanly with `commit_story.cli.subcommand` attribute in `main()`

### Secondary Goals

- CDQ-001 watch: whether prompt guidance from issue #915 (startActiveSpan lifecycle semantics) prevents the double-end pattern in claude-collector.js
- COV-005 watch: summary-manager.js `saveDailySummary` skip-path zero-attribute gap
- RUN21-6 watch: agent notes vs committed code divergence — whether notes timing improves (issue #918)
- mcp/server.js SCH-001 watch: if mcp/server.js commits, verify span name consistency (`commit_story.mcp.server_start` expected from 3-run pattern)
- journal-graph.js: sixth consecutive success expected (runs 17–22)
- Q×F target ≥ 14.0 if both P1 fixes land (14 files × 25/25)

### Run-21 Scores (baseline for run-22 comparison)

| Dimension | Run-21 | Run-20 | Run-19 | Run-18 | Run-17 |
|-----------|--------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | **4/5 (80%)** | 4/5 (80%) | 2/5 (40%) | 5/5 (100%) | 3/5 (60%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | 4/4 (100%) | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) | 3/4 (75%) |
| CDQ | **6/7 (86%)** | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | **21/25 (84%)** | **24/25 (96%)** | **22/25 (88%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** | **4/5** |
| **Files** | **12** | **12+1f** | **10+3p** | **11** | **10+1p** |
| **Cost** | **$8.10** | **$9.08** | **$8.83** | **$9.16** | **$10.43** |
| **Push/PR** | **AUTO (#74)** | **AUTO (#73)** | **AUTO (#71)** | **YES (#70, manual)** | **YES (#69)** |
| **IS** | **90/100** | **80/100** | **80/100** | **90/100** | **90/100** |
| **Q×F** | **11.0** | **11.5** | **8.4** | **10.6** | **8.8** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN21-1: NDS-003 blank-line-near-JSDoc (mcp/server.js) | RUN21-1 | 1 run | P1 — spiny-orb issue #917 (validator algorithm fix needed) |
| RUN21-2: index.js NDS-003 import expansion + context pollution | RUN21-2 | 1 run | P1 — spiny-orb issue #916 (prompt guidance: preserve import formatting) |
| RUN21-3: CDQ-001 claude-collector.js double-end in startActiveSpan | RUN21-3 | 1 run | P2 — spiny-orb issue #915 (startActiveSpan lifecycle semantics) |
| RUN21-4: COV-005 summary-manager.js saveDailySummary skip-path zero attrs | RUN21-4 | 1 run | P2 — input attr must be set before early-return guard |
| RUN21-5: index.js COV-005 subcommand attr unverifiable (3rd run) | RUN21-5 | 3 runs | Watch — blocked by RUN21-2; should resolve if import expansion fixed |
| RUN21-6: Agent notes vs committed code divergence | RUN21-6 | 1 run | Watch — spiny-orb issue #918 |
| RUN20-5: mcp/server.js SCH-001 recurring span name | RUN20-5 | 3+ runs | P3/Watch — unverifiable while NDS-003 blocks file; `server_start` consistent across 3 attempts |

---

## Solution Overview

Same four-phase structure as runs 5–21:

1. **Pre-run verification** — Verify RUN21-1 and RUN21-2 fixes; check CDQ-001 and notes timing issues
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #23

### Two-Repo Workflow

Same as runs 9–21.

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

1. mcp/server.js commits cleanly with a span (RUN21-1 blank-line-near-JSDoc fix confirmed)
2. index.js commits cleanly with `commit_story.cli.subcommand` attribute in `main()` (RUN21-2 resolved)
3. Quality score ≥ 24/25 (96%) regardless of P1 fix status
4. Q×F ≥ 14.0 if both P1 fixes land (14 files × 25/25)
5. Push/PR succeeds automatically (fourteenth consecutive)
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology (per-agent approach)
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) step 9.5 (SPA-001 calibration note for commit-story-v2 — 37 INTERNAL spans is structural, not a defect); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure and prefix derivation rule).
  2. `prds/113-evaluation-run-21.md` — the immediately prior commit-story-v2 run PRD. Use it as a style reference for the IS scoring milestone format and per-file evaluation structure. This document (run-22) follows the same pattern.
  3. `evaluation/javascript/commit-story-v2/run-21/actionable-fix-output.md` — prior run findings. RUN21-1 (NDS-003 blank-line-near-JSDoc in mcp/server.js) and RUN21-2 (index.js import expansion + context pollution) are the P1 goals for this run.
  **Do not mark this complete until you have read all three documents.**

- [ ] **Collect skeleton documents** — Create `evaluation/javascript/commit-story-v2/run-22/` directory with `lessons-for-prd23.md` skeleton. Must run before pre-run verification step 12.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/javascript/commit-story-v2/run-21/actionable-fix-output.md`. Check which findings were filed (RUN21-1: #917 blank-line-near-JSDoc; RUN21-2: #916 import expansion; RUN21-3: #915 startActiveSpan semantics; RUN21-6: #918 notes timing) and confirm their status.
  2. **RUN21-1 fix** (P1 — critical): Verify whether spiny-orb issue #917 (NDS-003 blank-line-near-JSDoc variant) has been resolved. Check `nds003-ast-stripper.ts` in the spinybacked-orbweaver repo for a fix that handles the case where a blank line is inserted adjacent to the pre-import JSDoc block (distinct from the run-20 shebang fix at lines 515–541). Check whether a regression fixture for the mcp/server.js blank-line pattern exists and passes. If not fixed, still proceed — run-22 will confirm the gap persists.
  3. **RUN21-2 fix** (P1 — critical): Verify whether spiny-orb issue #916 (prompt guidance: preserve existing import formatting) has been addressed. Look for any prompt changes that instruct the agent not to reformat multi-line `import {` blocks. If not fixed, still proceed.
  4. **RUN21-3 CDQ-001 fix** (P2): Verify whether spiny-orb issue #915 (startActiveSpan lifecycle semantics — `span.end()` inside callback is a double-end) has landed. Check prompt.ts or similar for guidance distinguishing `startSpan` (manual lifecycle, `finally { span.end() }` correct) from `startActiveSpan` (auto-ends, `span.end()` in callback is incorrect).
  5. **RUN21-4 COV-005 skip-path** (P2): Check for any prompt guidance update covering input attributes placed before early-return guards (e.g., `entry_date` should be set at span start, before the `if (!options.force)` check in `saveDailySummary`).
  6. **RUN21-6 notes timing** (Watch): Check whether spiny-orb issue #918 (agent notes diverge from committed code — notes appear to reflect an earlier reasoning draft, not the committed output) has been addressed.
  7. **Other spiny-orb fixes since run-21**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  8. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. Check for staged .instrumentation.md files from run-21 (expected; spiny-orb will overwrite them).
  9. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  10. **File inventory**: Count .js files in commit-story-v2's `src/` directory (expect 30).
  11. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  12. Record version and findings status.
  13. **README check**: Verify `README.md` on main has a row for run-21 in the commit-story-v2 run history table.
  14. **Datadog pre-run health check**: Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). If no results: check whether the Datadog Agent is running (`datadog-agent status`). If not running, start it (`datadog-agent start`) and retry the query. If still no results after the agent is confirmed running: check `evaluation/javascript/commit-story-v2/run-21/trace-artifact.md` for the last known `service.instance.id` and retry with the full artifact query. Do not start the eval run until spans appear — the instrument branch confirmation in step 15 depends on live span data.
  15. **Instrument branch confirmation**: Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans. Compare against `git -C ~/Documents/Repositories/commit-story-v2 rev-parse --short <instrument-branch>` (the most recent instrument branch from run-21 — find its name in `evaluation/javascript/commit-story-v2/run-21/run-summary.md` or from the run-21 PR). If the revision does not match: the target has drifted to an older branch — do not start the eval run until the correct branch is confirmed.
  16. **Capture trace artifact** (commit-story-v2 is an organic target — spans accumulate from daily developer workflow; no dedicated IS scoring invocation needed for capture): Read `evaluation/trace-capture-protocol.md` for the artifact format and full guidance. Then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). From the most recent complete journal generation run (most recent `commit_story.journal.generate_sections` span whose `commit_story.journal.sections` contains all three section types: `["summary","dialogue","technical_decisions"]`), record `service.instance.id`. If multiple complete runs appear, prefer the most recent one whose `vcs.ref.head.revision` matches the instrument branch. Write `evaluation/javascript/commit-story-v2/run-22/trace-artifact.md` using the format in `evaluation/trace-capture-protocol.md`.
  17. Append observations to `evaluation/javascript/commit-story-v2/run-22/lessons-for-prd23.md`.

- [ ] **Evaluation run-22** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/javascript/commit-story-v2/run-22/spiny-orb-output.log` and write `evaluation/javascript/commit-story-v2/run-22/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/javascript/commit-story-v2/run-22/debug-dumps/` before handing Whitney the command.

  **Use the Read tool** (not `wc` or `sed`) for all log file monitoring: `Read(file_path=..., offset=N)`. These shell commands require manual approval.

  **Attempt count inference**: spiny-orb only prints attempt count when > 1. No count in the log for a file = 1 attempt.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-22/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-22/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-22 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN21-1 fix result — specifically whether mcp/server.js committed cleanly without NDS-003 violations, (4) RUN21-2 fix result — whether index.js committed cleanly and `commit_story.cli.subcommand` is present, (5) CDQ-001 watch — did claude-collector.js avoid the double-end pattern?, (6) journal-graph.js result — sixth consecutive?, (7) quality score if visible, (8) cost, (9) push/PR status (auto or manual?), (10) overall attempt-count distribution (D-1 signal). Keep it conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [ ] **Post-run Datadog verification** — After the Findings Discussion checkpoint, confirm the new instrument branch spans appear in Datadog:
  1. Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` filtered to spans newer than the eval run's start timestamp. Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans to confirm the new instrument branch SHA appears.
  2. If no new journal entries have been generated since the eval run: note this in `run-summary.md` and defer confirmation to the next organic run — do not block forward progress.
  3. Record the `service.instance.id` from the new instrument branch in `trace-artifact.md` as the post-run trace reference.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files.
  Produces: `evaluation/javascript/commit-story-v2/run-22/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/javascript/commit-story-v2/run-22/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **(D-2) Use one agent per file**: Before spawning agents, create the output directory: `mkdir -p evaluation/javascript/commit-story-v2/run-22/per-file-sections/`. Then spawn individual background Agent() calls (not Workflow) with `run_in_background: true`; each agent reads style reference, `evaluation/javascript/commit-story-v2/run-21/per-file-evaluation.md` (for rule descriptions), original source (`git show main:src/file`), committed source (`git show <instrument-branch>:src/file`), agent notes from log, debug dump if applicable, and schema (`semconv/attributes.yaml`); each agent **writes its section directly to `evaluation/javascript/commit-story-v2/run-22/per-file-sections/<filename>.md`** — do NOT pass section text back through the agent call result (assembly stalls when sections are concatenated into a large prompt). Main context assembles from the written files once all agents complete. Correct-skip files: one batch agent for RST-001 verification.

  **Important**: Agent notes in `.instrumentation.md` files and log output are NOT ground truth about what was committed — they reflect an earlier reasoning draft. Per-file evaluation agents must read the instrumented source file directly (`git show <instrument-branch>:src/file`); do not rely on notes alone.

  **(Trace supplement)** Each per-file evaluation agent receives the `service.instance.id` from `evaluation/javascript/commit-story-v2/run-22/trace-artifact.md`. **Before writing any evaluation section**, read `evaluation/trace-capture-protocol.md`, then use the `search_datadog_spans` Datadog MCP tool with the `query` field from the artifact as the base query, appending a space and `resource_name:<prefix>.*` to filter to spans for the file under review (e.g., if the artifact query is `service:commit-story @service.instance.id:a1b2c3d4...`, pass `service:commit-story @service.instance.id:a1b2c3d4... resource_name:commit_story.journal.*` for `journal-graph.js`). The agent uses live trace data to supplement — not override — static code review for these specific checks:
  - **Attribute presence at runtime**: Does the span carry expected custom attributes with non-null values?
  - **Parent-child relationships**: Are spans nested as the code intends? Check `parentid` chains.
  - **Early exit detection**: A span with `gen_ai.operation.name` but no `gen_ai.response.id` indicates the node skipped the LLM call — note whether this matches the code's intent.
  - **CDQ-001 signal**: A `startActiveSpan` span with unexpectedly short duration or error status may indicate a double-end — use as corroborating evidence alongside static review.
  If the trace has no spans for a given file's namespace: note this in the per-file evaluation. Do not fail the file solely on trace absence.

  **(D-1) Track attempt counts**: For each file, note attempts. spiny-orb only prints attempt count when > 1; no count = 1 attempt. If a file required ≥ 3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent (grep: `grep -A 80 "Processing file.*<filename>" spiny-orb-output.log`). Check agent note framing: `"New attribute X"` = announced registration; `"X captures... No registered attribute"` = gap documented, not acted on.

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/javascript/commit-story-v2/run-22/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: *(fill in after run-22 executes)*

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/javascript/commit-story-v2/run-22/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md` (run-12 format)
  **IMPORTANT — use run-21 rubric as the primary precedent reference** (`evaluation/javascript/commit-story-v2/run-21/rubric-scores.md`), not run-12. Run-21 contains the current rule set and two critical precedents:
  1. **CDQ-006 precedent**: CDQ-006 advisory findings (e.g., external-source strings in setAttribute) are "advisory, not canonical failures per established rubric precedent" — do NOT fail CDQ-006 for advisory findings in run-22's pr-evaluation.md.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose agent output would have passed COV-001 ("WOULD PASS" in per-file evaluation) are scored as COV-001 PASS, consistent with run-20/run-21 treatment of mcp/server.js and index.js. Apply to any failed files in run-22.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-005 is now NDS-007 in per-file evaluation tables — treat as the same rule for rubric scoring.

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

  1. **Claude starts** the OTel Collector in the background:
     ```bash
     docker run --rm -d --name otelcol-is -w /etc/otelcol -p 4318:4318 --user "$(id -u):$(id -g)" -v /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is:/etc/otelcol otel/opentelemetry-collector-contrib:latest --config /etc/otelcol/otelcol-config.yaml
     ```
  2. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout <instrument-branch> -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true` — `@traceloop/instrumentation-langchain` API incompatibility crashes the process. See `evaluation/is/README.md`.
  3. **Claude stops** the Collector: `docker stop otelcol-is`
  4. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json --target commit-story-v2 > evaluation/javascript/commit-story-v2/run-22/is-score.md`
  5. **Confirm IS scoring traces in Datadog**: Note the IS scoring run start time, then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story from:<run-start-time>` (use the actual timestamp, not `now-30m`, to avoid matching unrelated organic traffic from daily use). If multiple `service.instance.id` values appear, pick the one whose spans cluster around the IS scoring invocation time. Record that `service.instance.id`. This confirms the OTel Collector's Datadog exporter forwarded spans from the IS scoring run. Note: per-target invocation commands are in each eval PRD's IS scoring milestone — `evaluation/is/README.md` has only a generic pattern.
  Produces: `evaluation/javascript/commit-story-v2/run-22/is-score.md`

- [ ] **Baseline comparison** — Compare run-22 vs runs 2–21.
  Produces: `evaluation/javascript/commit-story-v2/run-22/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-22 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence to reference run-23 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-22 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-23.
  3. Print the absolute file path of `evaluation/javascript/commit-story-v2/run-22/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #23 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #23** — Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #23's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone. Per-file evaluation milestone must specify the D-2 per-agent approach (background agents writing to per-file-sections, not Workflow harness). Run-23 primary goals and score projections are in `evaluation/javascript/commit-story-v2/run-22/actionable-fix-output.md` §5 (carry-forward tracker).

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/javascript/commit-story-v2/run-22/` to copy all artifacts. Commit to main with message `eval: save run-22 artifacts to main [skip ci]`. Add one row to `evaluation/javascript/commit-story-v2/run-log.md` for run-22 and commit with `eval: update run-log for run-22 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|

---

## Score Projections for Run-22

**If both P1 fixes land (RUN21-1 and RUN21-2):**
- mcp/server.js and index.js both commit; 14 files total
- If CDQ-001 not repeated and COV-005 skip-path not repeated: quality reaches 25/25 (100%); Q×F = 14.0 — new all-time record
- If CDQ-001 recurs in claude-collector.js: quality 24/25 (96%); Q×F ≈ 13.4
- mcp/server.js SCH-001: becomes verifiable if file commits; `commit_story.mcp.server_start` consistent across 3 run-21 attempts — likely self-resolves

**If only RUN21-1 lands (mcp/server.js fix, not index.js):**
- mcp/server.js commits, index.js still fails; 13 files
- If CDQ-001 not repeated: quality 25/25 (100%); Q×F = 13.0 — matches run-11 record
- Conservative: 24/25 (96%) × 13 = Q×F 12.5

**If neither P1 fix lands:**
- Same failure pattern as run-21; 12 files
- Conservative: 23/25 (92%), Q×F ≈ 11.0 (same as run-21)
