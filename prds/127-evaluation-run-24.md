# PRD #24: JS Evaluation Run-24: commit-story-v2 — SCH-003 Type Mismatch & summary-detector.js SCH-002 Fix Verification

**Status:** Ready
**Created:** 2026-06-12
**GitHub Issue:** #127
**Depends on:** PRD #23 (run-23 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-23 scored 24/25 (96%) with 13 committed files, 1 partial (summary-detector.js), and a Q×F of 12.48 — an improvement over run-21's 23/25 (92%), but short of the 25/25 target. Two new regressions emerged in the SCH dimension:

1. **RUN23-1 (P2)** — git-collector.js SCH-003: `commit_story.git.diff_size` declared as `type: string` in `agent-extensions.yaml` but set with a bare integer (`diff.length`). OTel JS SDK accepts both types at runtime silently. This is the same class as the `auto-summarize.js` attributes from prior runs. spiny-orb issue #928.

2. **RUN23-2 (P2)** — commands/summarize.js SCH-003: Three `*_summaries_generated` attributes declared `type: string` but set as bare integers. The agent that instrumented `commands/summarize.js` had no visibility into `auto-summarize.js`'s already-committed correct `String()` wrapping for the same attributes. spiny-orb issue #928.

3. **RUN23-3 (P2)** — summary-detector.js partial: `findUnsummarizedWeeks` not committed because the agent declared `commit_story.journal.base_path` (validator rejected as SCH-002 near-synonym of `commit_story.journal.file_path`). No self-correction across 2 attempts. In run-21 this function committed cleanly using `commit_story.summary.unsummarized_weeks_count`. spiny-orb issue #925.

Additionally, an IS regression appeared:

4. **RUN23-4 (Watch)** — IS SPA-002 recurrence: `commit_story.index.main` (outermost span from newly-committed `index.js`) dropped from eval-traces.json because `process.exit()` terminates Node.js before the OTel batch exporter flushes its final batch. Root cause confirmed via Datadog. Fix: `provider.forceFlush()` before `process.exit()` in `examples/instrumentation.js`. spiny-orb issue #926.

### Primary Goal

Verify that RUN23-1 and RUN23-2 (SCH-003 type mismatch) are resolved:
- git-collector.js commits with `diff_size` declared as `type: int` (or wrapped with `String()`)
- commands/summarize.js commits with `*_summaries_generated` attributes type-correct

### Secondary Goals

- RUN23-3 watch: whether prompt guidance from issue #925 enables summary-detector.js to commit all 5 functions with correct output-count attributes (reusing `commit_story.summary.unsummarized_weeks_count` as in run-21, not a new input-parameter attribute)
- RUN23-4 watch: whether the `provider.forceFlush()` fix (issue #926) resolves IS SPA-002 and restores IS to 90/100
- RUN21-6 watch: agent notes vs committed code divergence — second watch run; any new instances?
- IS SPA-001 structural: 25 INTERNAL spans vs 10-span calibration limit — watch whether span count growth worsens the gap
- journal-graph.js: seventh consecutive success expected (runs 18–21, 23)

### Run-23 Scores (baseline for run-24 comparison)

| Dimension | Run-23 | Run-21 | Run-20 | Run-19 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | 5/5 (100%) | 4/5 (80%) | 4/5 (80%) | 2/5 (40%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | **3/4 (75%)** | 4/4 (100%) | 4/4 (100%) | 3/4 (75%) |
| CDQ | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | 7/7 (100%) |
| **Total** | **24/25 (96%)** | **23/25 (92%)** | **24/25 (96%)** | **21/25 (84%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** |
| **Files** | **13+1p** | **12+2f** | **12+1f** | **10+3p** |
| **Cost** | **$7.84** | **~$8.10** | **$9.08** | **$8.83** |
| **Push/PR** | **AUTO (#75)** | **AUTO (#74)** | **AUTO (#73)** | **AUTO (#71)** |
| **IS** | **80/100** | **90/100** | **80/100** | **80/100** |
| **Q×F** | **12.48** | **11.0** | **11.5** | **8.4** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN23-1: git-collector.js `diff_size` integer-as-string | RUN23-1 | 1 run | P2 — spiny-orb issue #928 |
| RUN23-2: commands/summarize.js `*_summaries_generated` integer-as-string | RUN23-2 | 1 run | P2 — spiny-orb issue #928 |
| RUN23-3: summary-detector.js SCH-002 near-synonym partial | RUN23-3 | 1 run | P2 — spiny-orb issue #925; prefer output-count over input-param |
| RUN23-4: IS SPA-002 recurrence — process.exit() drops outermost span | RUN23-4 | 1 run | Watch — fix: `provider.forceFlush()` in bootstrap; spiny-orb issue #926 |
| IS SPA-001: INTERNAL span count structural | Structural | 10 runs | Structural — 25 INTERNAL spans vs 10-span calibration; research spike #929 |
| RUN21-6: Agent notes vs committed code divergence | RUN21-6 | 3 runs | Watch — spiny-orb issue #927; second watch run in run-24 |

---

## Solution Overview

Same four-phase structure as runs 5–23:

1. **Pre-run verification** — Verify RUN23-1, RUN23-2, RUN23-3 fix status; check for any new spiny-orb changes since run-23
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #25

### Two-Repo Workflow

Same as runs 9–23.

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

1. git-collector.js commits cleanly with `diff_size` type-correct (RUN23-1 fix confirmed)
2. commands/summarize.js commits cleanly with `*_summaries_generated` type-correct (RUN23-2 fix confirmed)
3. Quality score ≥ 24/25 (96%) regardless of fix status
4. Q×F ≥ 14.0 if all three SCH-003 and SCH-002 fixes land (14 files × 25/25)
5. Push/PR succeeds automatically (sixteenth consecutive)
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology (per-agent approach)
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to: (a) step 9.5 (SPA-001 calibration note for commit-story-v2 — INTERNAL span count is structural, not a defect); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure and prefix derivation rule). Also read `prds/126-evaluation-run-23.md` — the most recently completed commit-story-v2 run PRD. Use it as a style reference for the IS scoring milestone format and per-file evaluation structure. This document (run-24) follows the same pattern. **Do not mark this complete until you have read both documents.**

- [x] **Cross-run process review** *(Step 0.5 — before any other milestones except Step 0)* — Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Brief: check whether any other eval target (taze, release-it) has a completed run more recent than commit-story-v2's most recent completed run (run-23, `evaluation/commit-story-v2/run-23/actionable-fix-output.md`). A run is complete when its directory contains `actionable-fix-output.md`. If a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; present a structured checkpoint report (steps already in template vs. missing vs. target-specific only); wait for user approval before making any template changes. Full procedure with timestamp comparison method is in `docs/language-extension-plan.md` Step 0.5.

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-24/` directory with `lessons-for-prd25.md` skeleton. Must run before pre-run verification begins.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-23/actionable-fix-output.md`. Check which findings were filed and their current status.
  2. **RUN23-1 fix** (P2): Verify whether spiny-orb issue #928 (SCH-003 type mismatch — integer-as-string for `diff_size` and `*_summaries_generated`) has been resolved. Look for prompt guidance updates instructing agents to check the declared schema type before setting an attribute from a numeric source and apply `String()` conversion if `type: string`, or schema changes declaring the attributes as `type: int`. If not fixed, still proceed — run-24 will confirm the gap persists.
  3. **RUN23-2 fix** (P2): Covered by the same issue #928 as RUN23-1 — check together.
  4. **RUN23-3 fix** (P2): Verify whether spiny-orb issue #925 (SCH-002 near-synonym oscillation in summary-detector.js) has produced guidance preferring output-count attributes over input-parameter attributes when instrumenting functions. Also check for guidance that the self-correction path when a validator rejects a near-synonym should be "look for an existing registered attribute or instrument a different output metric" — not resubmit with the same attribute. If no fix, still proceed — run-24 will confirm.
  5. **RUN23-4 watch** (Watch): Check whether spiny-orb issue #926 (`process.exit()` drops outermost span before OTel batch flush) has been addressed. Look for a `provider.forceFlush()` call in `examples/instrumentation.js` before `process.exit()`, or an equivalent graceful shutdown change in `index.js`. If fixed, expect IS to recover to 90/100.
  6. **RUN21-6 watch** (Watch): Check whether any further changes landed for issue #927 (agent notes vs committed code divergence). Second watch run — note any new instances in run-24.
  7. **Other spiny-orb fixes since run-23**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  8. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. Check for staged `.instrumentation.md` files from run-23 (expected; spiny-orb will overwrite them).
  9. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  10. **File inventory**: Count .js files in commit-story-v2's `src/` directory (expect 30 after run-23 added `commands/summarize.js`; verify count).
  11. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  12. Record version and findings status.
  13. **README check**: Verify `README.md` on main has rows for runs 15–23 in the commit-story-v2 run history table. Run-22 was never executed and has no row.
  14. **Datadog pre-run health check**: Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). If no results: check whether the Datadog Agent is running (`datadog-agent status`). If not running, start it (`datadog-agent start`) and retry the query. If still no results after the agent is confirmed running: check `evaluation/commit-story-v2/run-23/trace-artifact.md` for the last known `service.instance.id` and retry with the full artifact query. Do not start the eval run until spans appear — the instrument branch confirmation in step 15 depends on live span data.
  15. **Instrument branch confirmation**: Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans. Compare against `git -C ~/Documents/Repositories/commit-story-v2 rev-parse --short <instrument-branch>` (the most recent instrument branch from run-23 — find its name in `evaluation/commit-story-v2/run-23/run-summary.md` or from the run-23 PR). If the revision does not match: the target has drifted to an older branch — do not start the eval run until the correct branch is confirmed.
  16. **Capture trace artifact** (commit-story-v2 is an organic target): Read `evaluation/trace-capture-protocol.md` for the artifact format and full guidance. Then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). From the most recent complete journal generation run (most recent `commit_story.journal.generate_sections` span whose `commit_story.journal.sections` contains all three section types: `["summary","dialogue","technical_decisions"]`), record `service.instance.id`. If multiple complete runs appear, prefer the most recent one whose `vcs.ref.head.revision` matches the instrument branch. Write `evaluation/commit-story-v2/run-24/trace-artifact.md` using the format in `evaluation/trace-capture-protocol.md`.
  17. Append observations to `evaluation/commit-story-v2/run-24/lessons-for-prd25.md`.

- [ ] **Evaluation run-24** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-24/spiny-orb-output.log` using `git add -f` (the root `.gitignore` has a `*.log` pattern that silently skips plain `git add`) and write `evaluation/commit-story-v2/run-24/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/commit-story-v2/run-24/debug-dumps/` before handing Whitney the command. When writing `run-summary.md`, extract the instrument branch name directly from the log (`grep -m1 'Branch:' spiny-orb-output.log`) — do not write it from context (D-4).

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-24/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-24/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-24 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN23-1 fix result — git-collector.js `diff_size` type-correct?, (4) RUN23-2 fix result — commands/summarize.js `*_summaries_generated` type-correct?, (5) RUN23-3 result — did summary-detector.js commit all 5 functions?, (6) 3-attempt rate — any change from run-23's pattern?, (7) journal-graph.js result — seventh consecutive?, (8) quality score if visible, (9) cost, (10) push/PR status (auto or manual?), (11) overall attempt-count distribution (D-1 signal). Keep it conversational, under 12 lines. Wait for acknowledgment before proceeding.

- [ ] **Post-run Datadog verification** — After the Findings Discussion checkpoint, confirm the new instrument branch spans appear in Datadog:
  1. Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` filtered to spans newer than the eval run's start timestamp. Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans to confirm the new instrument branch SHA appears.
  2. If no spans from the instrument branch appear yet: note this in `run-summary.md` and defer — do not block forward progress. **The trace run does not need to happen during the eval itself** — any invocation of the instrumented code on the correct branch after the eval completes is sufficient.
  3. When confirmed, record the corresponding `service.instance.id` in `trace-artifact.md` as the post-run trace reference (update from the pre-run capture if the instance differs).

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files. Also include committed files with ≥ 3 attempts AND quality failures — see scope note in `docs/language-extension-plan.md` step 5.
  Produces: `evaluation/commit-story-v2/run-24/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-24/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **Rule rename note**: NDS-005 (Control Flow Preserved) is called **NDS-007** in spiny-orb's validator output and in agent notes. Use NDS-007 in all per-file evaluation tables.

  **(D-2) Use one agent per file**: Before spawning agents, create the output directory: `mkdir -p evaluation/commit-story-v2/run-24/per-file-sections/`. Then spawn individual background Agent() calls (not Workflow) with `run_in_background: true`; each agent reads style reference, `evaluation/commit-story-v2/run-23/per-file-evaluation.md` (for rule descriptions), original source (`git show main:src/file`), committed source (`git show <instrument-branch>:src/file`), agent notes from log, debug dump if applicable, and schema (`semconv/attributes.yaml`); each agent **writes its section directly to `evaluation/commit-story-v2/run-24/per-file-sections/<filename>.md`** — do NOT pass section text back through the agent call result (assembly stalls when sections are concatenated into a large prompt). Main context assembles from the written files once all agents complete. Correct-skip files: one batch agent for RST-001 verification.

  **Important**: Agent notes in `.instrumentation.md` files and log output are NOT ground truth about what was committed — they reflect an earlier reasoning draft. Per-file evaluation agents must read the instrumented source file directly (`git show <instrument-branch>:src/file`); do not rely on notes alone.

  **(Trace supplement)** Each per-file evaluation agent receives the `service.instance.id` from `evaluation/commit-story-v2/run-24/trace-artifact.md`. **Before writing any evaluation section**, read `evaluation/trace-capture-protocol.md`, then use the `search_datadog_spans` Datadog MCP tool with the `query` field from the artifact as the base query, appending a space and `resource_name:<prefix>.*` to filter to spans for the file under review. The agent uses live trace data to supplement — not override — static code review for these specific checks:
  - **Attribute presence at runtime**: Does the span carry expected custom attributes with non-null values?
  - **Parent-child relationships**: Are spans nested as the code intends? Check `parentid` chains.
  - **Early exit detection**: A span with `gen_ai.operation.name` but no `gen_ai.response.id` indicates the node skipped the LLM call — note whether this matches the code's intent.
  - **CDQ-001 signal**: A `startActiveSpan` span with unexpectedly short duration or error status may indicate a double-end — use as corroborating evidence alongside static review.
  If the trace has no spans for a given file's namespace: note this in the per-file evaluation. Do not fail the file solely on trace absence.

  **(D-1) Track attempt counts**: For each file, note attempts. spiny-orb only prints attempt count when > 1; no count = 1 attempt. If a file required ≥ 3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent (grep: `grep -A 80 "Processing file.*<filename>" spiny-orb-output.log`). Check agent note framing: `"New attribute X"` = announced registration; `"X captures... No registered attribute"` = gap documented, not acted on.

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-24/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: *(fill in after run-24 executes)*

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-24/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md` (run-12 format)
  **IMPORTANT — use run-23 rubric as the primary precedent reference** (`evaluation/commit-story-v2/run-23/rubric-scores.md`), not run-12. Run-23 contains the current rule set and two critical precedents:
  1. **CDQ-006 precedent**: CDQ-006 advisory findings (e.g., external-source strings in setAttribute) are "advisory, not canonical failures per established rubric precedent" — do NOT fail CDQ-006 for advisory findings in run-24's pr-evaluation.md.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose agent output would have passed COV-001 ("WOULD PASS" in per-file evaluation) are scored as COV-001 PASS, consistent with run-20/run-21/run-23 treatment. Apply to any failed files in run-24.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-007 (was NDS-005) is Control Flow Preserved — treat as the same rule for rubric scoring.

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

  1. **Claude runs**: `datadog-agent stop`
  2. **Claude starts** the OTel Collector in the background using the installed binary:
     ```bash
     vals exec -f ~/Documents/Repositories/spinybacked-orbweaver-eval/.vals.yaml -- bash -c 'export PATH="$HOME/.local/bin:/opt/homebrew/bin:$PATH" && otelcol-contrib --config ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is/otelcol-config.yaml > /tmp/otelcol.log 2>&1' &
     COLLECTOR_PID=$!
     until lsof -i :4318 >/dev/null 2>&1; do sleep 0.5; done
     ```
  3. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout <instrument-branch> -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true` — `@traceloop/instrumentation-langchain` API incompatibility crashes the process. See `evaluation/is/README.md`.
  4. **Claude stops** the Collector: `kill "$COLLECTOR_PID"`
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-24/is-score.md`
  6. **Confirm IS scoring traces in Datadog**: Note the IS scoring run start time, then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story from:<run-start-time>` (use the actual timestamp, not `now-30m`, to avoid matching unrelated organic traffic from daily use). If multiple `service.instance.id` values appear, pick the one whose spans cluster around the IS scoring invocation time. Record that `service.instance.id`. This confirms the OTel Collector's Datadog exporter forwarded spans from the IS scoring run.
  7. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-24/is-score.md`

- [ ] **Baseline comparison** — Compare run-24 vs runs 2–23 (run-22 was never executed).
  Produces: `evaluation/commit-story-v2/run-24/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-24 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence to reference run-25 and its primary goals. Note: run-22 was never executed and has no row.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-24 evaluation artifacts.
  2. *(User-facing checkpoint 2)* Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-25.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-24/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #25 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #25** — Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint (steps 12.1–12.3) first — review `evaluation/commit-story-v2/run-24/actionable-fix-output.md` and any `lessons-for-prd25.md` files for process observations; present proposed template updates; get user approval; commit approved changes as a separate commit before drafting the PRD. Then draft PRD #25 using this PRD as the style reference. Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #25's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone. Per-file evaluation milestone must specify the D-2 per-agent approach.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/commit-story-v2/run-24/` to copy all artifacts. Commit to main with message `eval: save run-24 artifacts to main [skip ci]`. Add one row to `evaluation/commit-story-v2/run-log.md` for run-24 and commit with `eval: update run-log for run-24 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-3 | Trace run does not need to happen during the eval — any post-eval invocation on the correct branch is sufficient | The post-commit hook runs automatically on any commit to the instrument branch. Confirmed via run-23. Added as step 4a in language-extension-plan.md. | 2026-06-10 |
| D-4 | Branch name in run-summary.md must be extracted from the log, never written from context | Discovered when run-23 summary recorded the wrong branch name from context. Fix: `grep -m1 'Branch:' spiny-orb-output.log` — added to language-extension-plan.md step 3. | 2026-06-10 |
| D-5 | `spiny-orb-output.log` requires `git add -f` to stage — plain `git add` silently skips it | The root `.gitignore` has a `*.log` pattern. Discovered in run-23. Added note to language-extension-plan.md step 3 and propagated to all open eval PRDs. | 2026-06-12 |

---

## Score Projections for Run-24

**If both SCH-003 fixes land (RUN23-1 and RUN23-2) and summary-detector.js commits all 5 functions (RUN23-3):**
- 14 committed files, quality 25/25 (100%); Q×F = 14.0 — new all-time record (ties run-11's Q×F record with a higher file count)
- IS recovery to 90/100 if `provider.forceFlush()` fix lands

**If SCH-003 fixed but summary-detector.js still partial:**
- 13+1p committed files, quality 25/25 (100%); Q×F ≈ 13.5 (14 × 25/25 with partial file discount)
- Conservative: 24/25 (96%), Q×F 12.48 (same as run-23)

**If SCH-003 recurs (neither fix lands):**
- Quality 24/25 (96%), 13 committed files; Q×F ≈ 12.48 (same as run-23)
- IS remains 80/100 if forceFlush fix also absent

**Key insight**: The two SCH-003 failures share the same root cause and issue #928. A single prompt guidance line — "when setting an attribute declared as `type: string` from a numeric source, always wrap with `String()`" — or schema changes declaring the attributes as `type: int` would resolve both. Either fix path should land cleanly.
