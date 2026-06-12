# PRD #23: JS Evaluation Run-23: commit-story-v2 — NDS-003 Blank-Line-Near-JSDoc & Import Expansion Fix Verification

**Status:** Ready
**Created:** 2026-06-08
**GitHub Issue:** #126
**Depends on:** PRD #113 (run-21 complete, actionable fix output delivered to spiny-orb team; note: run-22 was planned in PRD #115 but never executed)

---

## Problem Statement

Run-21 scored 23/25 (92%) with 12 committed files and a Q×F of 11.0 — a regression from run-20's 24/25 (96%). Two new quality failures emerged: CDQ-001 (double-end in claude-collector.js: `span.end()` called inside a `startActiveSpan` callback) and COV-005 (summary-manager.js `saveDailySummary` zero attributes on the file-already-exists skip path). Both file failures are NDS-003 variants:

1. **RUN21-1 (P1)** — mcp/server.js NDS-003 blank-line-near-JSDoc: PR #905 fixed the run-20 shebang trivia-loss variant, but a new independent NDS-003 variant appeared at lines 2, 3, 31, 33, 34. The validator's forward-check misaligns when a blank line is inserted adjacent to the pre-import JSDoc block. The agent's output was structurally correct across all 3 attempts (debug dump confirmed). This is a validator algorithm issue (spiny-orb issue #917).

2. **RUN21-2 (P1)** — index.js NDS-003 + NDS-005 import expansion: With ~60 schema extensions accumulated over 29 preceding files, the agent expanded three single-line `import {` blocks into multi-line form in attempt 1 (152 NDS-003 violations). Attempt 2 could not reconstruct the exact original formatting and introduced NDS-005. Context-pollution failure at file 30/30 — prompt guidance needed to preserve existing import formatting (spiny-orb issue #916).

Run-22 (PRD #115) was planned but never executed — GitHub issue closed 2026-06-05. Run-23 targets the same P1 fixes.

### Primary Goal

Verify that RUN21-1 (blank-line-near-JSDoc NDS-003) and RUN21-2 (import expansion NDS-003) are resolved:
- mcp/server.js commits cleanly with a span (no spurious NDS-003 violations)
- index.js commits cleanly with `commit_story.cli.subcommand` attribute in `main()`

### Secondary Goals

- CDQ-001 watch: whether prompt guidance from issue #915 (startActiveSpan lifecycle semantics) prevents the double-end pattern in claude-collector.js
- COV-005 watch: summary-manager.js `saveDailySummary` skip-path zero-attribute gap
- RUN21-6 watch: agent notes vs committed code divergence — whether notes timing improves (issue #918)
- mcp/server.js SCH-001 watch: if mcp/server.js commits, verify span name consistency (`commit_story.mcp.server_start` expected from 3-run pattern)
- journal-graph.js: sixth consecutive success expected (runs 17–21)

### Run-21 Scores (baseline for run-23 comparison)

| Dimension | Run-21 | Run-20 | Run-19 | Run-18 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | **4/5 (80%)** | 4/5 (80%) | 2/5 (40%) | 5/5 (100%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | 4/4 (100%) | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) |
| CDQ | **6/7 (86%)** | 7/7 (100%) | 7/7 (100%) | 7/7 (100%) |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | **21/25 (84%)** | **24/25 (96%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** |
| **Files** | **12+2f** | **12+1f** | **10+3p** | **11** |
| **Cost** | **~$8.10** | **$9.08** | **$8.83** | **$9.16** |
| **Push/PR** | **AUTO (#74)** | **AUTO (#73)** | **AUTO (#71)** | **YES (#70, manual)** |
| **IS** | **90/100** | **80/100** | **80/100** | **90/100** |
| **Q×F** | **11.0** | **11.5** | **8.4** | **10.6** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN21-1: mcp/server.js NDS-003 blank-line-near-JSDoc | RUN21-1 | 2 runs (21+skipped 22) | P1 — spiny-orb issue #917 |
| RUN21-2: index.js NDS-003 + NDS-005 import expansion | RUN21-2 | 2 runs (21+skipped 22) | P1 — spiny-orb issue #916 |
| RUN21-3: CDQ-001 claude-collector.js double-end in startActiveSpan | RUN21-3 | 2 runs (21+skipped 22) | P2 — spiny-orb issue #915 prompt guidance |
| RUN21-4: COV-005 summary-manager.js saveDailySummary skip-path | RUN21-4 | 2 runs (21+skipped 22) | P2 — input attr before guard |
| RUN21-5: index.js COV-005 subcommand attr unverifiable (4th run entering 23) | RUN21-5 | 4 runs | Watch — blocked by RUN21-2 |
| RUN21-6: Agent notes vs committed code divergence | RUN21-6 | 2 runs (21+skipped 22) | Watch — spiny-orb issue #918 |
| RUN20-5: mcp/server.js SCH-001 recurring | RUN20-5 | 4+ runs | Watch — unverifiable while NDS-003 blocks |

---

## Solution Overview

Same four-phase structure as runs 5–21:

1. **Pre-run verification** — Verify RUN21-1, RUN21-2, RUN21-3, RUN21-4 fix status; check for any new spiny-orb changes since run-21
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #24

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

1. mcp/server.js commits cleanly with a span (RUN21-1 blank-line-near-JSDoc NDS-003 fix confirmed)
2. index.js `commit_story.cli.subcommand` attribute present in `main()` (RUN21-2 recovery)
3. Quality score ≥ 24/25 (96%) regardless of P1 fix status
4. Q×F ≥ 12.5 if both P1s land (14 files × 24/25 minimum, or 13 × 25/25)
5. Push/PR succeeds automatically (fifteenth consecutive)
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology (per-agent approach)
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to: (a) step 9.5 (SPA-001 calibration note for commit-story-v2 — 37 INTERNAL spans is structural, not a defect); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure and prefix derivation rule). Also read `prds/113-evaluation-run-21.md` — the most recently completed commit-story-v2 run PRD. Use it as a style reference for the IS scoring milestone format and per-file evaluation structure. This document (run-23) follows the same pattern. **Do not mark this complete until you have read both documents.**

- [x] **Cross-run process review** *(Step 0.5 — before any other milestones except Step 0)* — Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Brief: check whether any other eval target (taze, release-it) has a completed run more recent than commit-story-v2's most recent completed run (run-21, `evaluation/commit-story-v2/run-21/actionable-fix-output.md`). A run is complete when its directory contains `actionable-fix-output.md`. If a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; present a structured checkpoint report (steps already in template vs. missing vs. target-specific only); wait for user approval before making any template changes. Full procedure with timestamp comparison method is in `docs/language-extension-plan.md` Step 0.5.

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-23/` directory with `lessons-for-prd24.md` skeleton. Must run before pre-run verification begins.

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-21/actionable-fix-output.md`. Note: run-22 was never executed — the open items below are from run-21. Check which findings were filed and their current status.
  2. **RUN21-1 fix** (P1 — critical): Verify whether spiny-orb issue #917 (NDS-003 blank-line-near-JSDoc variant) has been resolved. Check `nds003-ast-stripper.ts` in the spinybacked-orbweaver repo for a fix that handles the case where a blank line is inserted adjacent to the pre-import JSDoc block (distinct from the run-20 shebang fix at lines 515–541). Check whether a regression fixture for the mcp/server.js blank-line pattern exists and passes. If not fixed, still proceed — run-23 will confirm the gap persists.
  3. **RUN21-2 fix** (P1 — critical): Verify whether spiny-orb issue #916 (import expansion / context pollution at large schema extension volume) has been addressed. Look for prompt guidance updates that explicitly prohibit reformatting single-line `import {` blocks into multi-line form. If no fix, still proceed — run-23 will confirm the gap persists.
  4. **RUN21-3 fix** (P2): Verify whether issue #915 (CDQ-001 startActiveSpan lifecycle clarification) has produced any prompt guidance update distinguishing `startSpan` (explicit `span.end()` required) from `startActiveSpan` (auto-ends on callback; do NOT add `span.end()` inside callback). If guidance landed, watch claude-collector.js in run-23.
  5. **RUN21-4 watch** (P2): Check for any prompt guidance covering "set input parameter attributes before early-return guards." Not expected to have a dedicated fix — evaluate impact in run-23.
  6. **RUN21-6 watch** (Watch): Check whether issue #918 (notes vs committed code divergence) has produced any change to notes generation timing or flagging.
  7. **Other spiny-orb fixes since run-21**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  8. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. Check for staged .instrumentation.md files from run-21 (expected; spiny-orb will overwrite them).
  9. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  10. **File inventory**: Count .js files in commit-story-v2's `src/` directory (expect 30).
  11. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  12. Record version and findings status.
  13. **README check**: Verify `README.md` on main has rows for runs 15–21 in the commit-story-v2 run history table. Run-22 was never executed and has no row.
  14. **Datadog pre-run health check**: Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). If no results: check whether the Datadog Agent is running (`datadog-agent status`). If not running, start it (`datadog-agent start`) and retry the query. If still no results after the agent is confirmed running: check `evaluation/commit-story-v2/run-21/trace-artifact.md` for the last known `service.instance.id` and retry with the full artifact query. Do not start the eval run until spans appear — the instrument branch confirmation in step 15 depends on live span data.
  15. **Instrument branch confirmation**: Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans. Compare against `git -C ~/Documents/Repositories/commit-story-v2 rev-parse --short <instrument-branch>` (the most recent instrument branch from run-21 — find its name in `evaluation/commit-story-v2/run-21/run-summary.md` or from the run-21 PR). If the revision does not match: the target has drifted to an older branch — do not start the eval run until the correct branch is confirmed.
  16. **Capture trace artifact** (commit-story-v2 is an organic target — spans accumulate from daily developer workflow; no dedicated IS scoring invocation needed for capture): Read `evaluation/trace-capture-protocol.md` for the artifact format and full guidance. Then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). From the most recent complete journal generation run (most recent `commit_story.journal.generate_sections` span whose `commit_story.journal.sections` contains all three section types: `["summary","dialogue","technical_decisions"]`), record `service.instance.id`. If multiple complete runs appear, prefer the most recent one whose `vcs.ref.head.revision` matches the instrument branch. Write `evaluation/commit-story-v2/run-23/trace-artifact.md` using the format in `evaluation/trace-capture-protocol.md`.
  17. Append observations to `evaluation/commit-story-v2/run-23/lessons-for-prd24.md`.

- [x] **Evaluation run-23** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-23/spiny-orb-output.log` and write `evaluation/commit-story-v2/run-23/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/commit-story-v2/run-23/debug-dumps/` before handing Whitney the command.

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-23/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-23/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-23 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [x] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN21-1 fix result — specifically whether mcp/server.js committed cleanly without NDS-003 violations, (4) RUN21-2 fix result — whether index.js `commit_story.cli.subcommand` is present, (5) 3-attempt rate — any change from run-21's 8%?, (6) CDQ-001 — did claude-collector.js avoid the double-end pattern?, (7) journal-graph.js result — sixth consecutive?, (8) quality score if visible, (9) cost, (10) push/PR status (auto or manual?), (11) overall attempt-count distribution (D-1 signal). Keep it conversational, under 12 lines. Wait for acknowledgment before proceeding.

- [x] **Post-run Datadog verification** — After the Findings Discussion checkpoint, confirm the new instrument branch spans appear in Datadog:
  1. Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` filtered to spans newer than the eval run's start timestamp. Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans to confirm the new instrument branch SHA appears.
  2. If no spans from the instrument branch appear yet: note this in `run-summary.md` and defer — do not block forward progress. **The trace run does not need to happen during the eval itself** — any invocation of the instrumented code on the correct branch after the eval completes is sufficient (e.g., a commit to the instrument branch triggers the post-commit hook and produces spans).
  3. When confirmed, record the corresponding `service.instance.id` in `trace-artifact.md` as the post-run trace reference (update from the pre-run capture if the instance differs).

  **Run-23 result**: Post-run instance `050d24b0-abe6-4350-9bcd-b842bc2bc57b` confirmed on `spiny-orb/instrument-1781089793056` (vcs.ref.head.revision=5bfc917) via spans captured at ~12:31Z after Whitney's "docs: add PR summary" commit to the instrument branch triggered the post-commit hook. Corrected branch name in `run-summary.md` and `trace-artifact.md` (prior entries incorrectly referenced `instrument-1780596389399`, a June 4 branch).

- [x] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files. Also include committed files with ≥ 3 attempts AND quality failures — see scope note in `docs/language-extension-plan.md` step 5.
  Produces: `evaluation/commit-story-v2/run-23/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [x] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-23/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **(D-2) Use one agent per file**: Before spawning agents, create the output directory: `mkdir -p evaluation/commit-story-v2/run-23/per-file-sections/`. Then spawn individual background Agent() calls (not Workflow) with `run_in_background: true`; each agent reads style reference, `evaluation/commit-story-v2/run-21/per-file-evaluation.md` (for rule descriptions), original source (`git show main:src/file`), committed source (`git show <instrument-branch>:src/file`), agent notes from log, debug dump if applicable, and schema (`semconv/attributes.yaml`); each agent **writes its section directly to `evaluation/commit-story-v2/run-23/per-file-sections/<filename>.md`** — do NOT pass section text back through the agent call result (assembly stalls when sections are concatenated into a large prompt). Main context assembles from the written files once all agents complete. Correct-skip files: one batch agent for RST-001 verification.

  **Important**: Agent notes in `.instrumentation.md` files and log output are NOT ground truth about what was committed — they reflect an earlier reasoning draft. Per-file evaluation agents must read the instrumented source file directly (`git show <instrument-branch>:src/file`); do not rely on notes alone.

  **Rule rename**: The rule previously called NDS-005 (Control Flow Preserved) is now called **NDS-007** in spiny-orb's validator output and in run-23 agent notes. Use NDS-007 in all per-file evaluation tables — do not carry forward the NDS-005 label from the run-21 style reference.

  **(Trace supplement)** Each per-file evaluation agent receives the `service.instance.id` from `evaluation/commit-story-v2/run-23/trace-artifact.md`. **Before writing any evaluation section**, read `evaluation/trace-capture-protocol.md`, then use the `search_datadog_spans` Datadog MCP tool with the `query` field from the artifact as the base query, appending a space and `resource_name:<prefix>.*` to filter to spans for the file under review (e.g., if the artifact query is `service:commit-story @service.instance.id:a1b2c3d4...`, pass `service:commit-story @service.instance.id:a1b2c3d4... resource_name:commit_story.journal.*` for `journal-graph.js`). The agent uses live trace data to supplement — not override — static code review for these specific checks:
  - **Attribute presence at runtime**: Does the span carry expected custom attributes with non-null values?
  - **Parent-child relationships**: Are spans nested as the code intends? Check `parentid` chains.
  - **Early exit detection**: A span with `gen_ai.operation.name` but no `gen_ai.response.id` indicates the node skipped the LLM call — note whether this matches the code's intent.
  - **CDQ-001 signal**: A `startActiveSpan` span with unexpectedly short duration or error status may indicate a double-end — use as corroborating evidence alongside static review.
  If the trace has no spans for a given file's namespace: note this in the per-file evaluation. Do not fail the file solely on trace absence.

  **(D-1) Track attempt counts**: For each file, note attempts. spiny-orb only prints attempt count when > 1; no count = 1 attempt. If a file required ≥ 3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent (grep: `grep -A 80 "Processing file.*<filename>" spiny-orb-output.log`). Check agent note framing: `"New attribute X"` = announced registration; `"X captures... No registered attribute"` = gap documented, not acted on.

- [x] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-23/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: *(fill in after run-23 executes)*

- [x] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-23/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md` (run-12 format)
  **IMPORTANT — use run-21 rubric as the primary precedent reference** (`evaluation/commit-story-v2/run-21/rubric-scores.md`), not run-12. Run-21 contains the current rule set and two critical precedents:
  1. **CDQ-006 precedent**: CDQ-006 advisory findings (e.g., external-source strings in setAttribute) are "advisory, not canonical failures per established rubric precedent" — do NOT fail CDQ-006 for advisory findings in run-23's pr-evaluation.md.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose agent output would have passed COV-001 ("WOULD PASS" in per-file evaluation) are scored as COV-001 PASS, consistent with run-20/run-21 treatment of mcp/server.js and index.js. Apply to any failed files in run-23.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-005 is now NDS-007 in per-file evaluation tables — treat as the same rule for rubric scoring.

- [x] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

  1. **Claude runs**: `datadog-agent stop`
  2. **Claude starts** the OTel Collector in the background:
     ```bash
     docker run --rm -d --name otelcol-is -w /etc/otelcol -p 4318:4318 --user "$(id -u):$(id -g)" -v /Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is:/etc/otelcol otel/opentelemetry-collector-contrib:latest --config /etc/otelcol/otelcol-config.yaml
     ```
  3. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout <instrument-branch> -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true` — `@traceloop/instrumentation-langchain` API incompatibility crashes the process. See `evaluation/is/README.md`.
  4. **Claude stops** the Collector: `docker stop otelcol-is`
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-23/is-score.md`
  6. **Confirm IS scoring traces in Datadog**: Note the IS scoring run start time, then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story from:<run-start-time>` (use the actual timestamp, not `now-30m`, to avoid matching unrelated organic traffic from daily use). If multiple `service.instance.id` values appear, pick the one whose spans cluster around the IS scoring invocation time. Record that `service.instance.id`. This confirms the OTel Collector's Datadog exporter forwarded spans from the IS scoring run.
  7. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-23/is-score.md`

- [x] **Baseline comparison** — Compare run-23 vs runs 2–21 (run-22 was never executed).
  Produces: `evaluation/commit-story-v2/run-23/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [x] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-23 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence to reference run-24 and its primary goals. Note: run-22 was never executed and has no row.

- [x] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-23 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-24.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-23/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #24 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #24** — Follow `docs/language-extension-plan.md` step 12. **Template-update checkpoint (steps 12.1–12.3) is already complete** (D-5 committed 2026-06-12 — `git add -f` note propagated to all open eval PRDs and template). Proceed directly to step 12.4: draft the PRD. Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #24's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone. Per-file evaluation milestone must specify the D-2 per-agent approach (background agents writing to per-file-sections, not Workflow harness). Run-24 primary goals and score projections are in `evaluation/commit-story-v2/run-23/actionable-fix-output.md` §5 (carry-forward tracker).

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/commit-story-v2/run-23/` to copy all artifacts. Commit to main with message `eval: save run-23 artifacts to main [skip ci]`. Add one row to `evaluation/commit-story-v2/run-log.md` for run-23 and commit with `eval: update run-log for run-23 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-3 | Trace run does not need to happen during the eval — any post-eval invocation on the correct branch is sufficient | The post-commit hook runs automatically on any commit to the instrument branch. Confirmed via run-23: Whitney's "docs: add PR summary" commit to the instrument branch after the eval produced spans with the correct vcs.ref.head.revision. Added as step 4a in language-extension-plan.md and propagated to run-22 PRD. | 2026-06-10 |
| D-4 | Branch name in run-summary.md must be extracted from the log, never written from context | Discovered when run-23 summary recorded instrument-1780596389399 (a June 4 branch) instead of the actual run-23 branch instrument-1781089793056. Root cause: agent wrote from context. Fix: `grep -m1 'Branch:' spiny-orb-output.log` — added to language-extension-plan.md step 3. | 2026-06-10 |
| D-5 | `spiny-orb-output.log` requires `git add -f` to stage — plain `git add` silently skips it | The root `.gitignore` has a `*.log` pattern that matches `spiny-orb-output.log`. Discovered in run-23. Added note to language-extension-plan.md step 3 and propagated to all open eval PRDs (#82 taze run-14, #100 release-it run-5). Applies to all future eval runs on all targets. | 2026-06-12 |

---

## Score Projections for Run-23

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
