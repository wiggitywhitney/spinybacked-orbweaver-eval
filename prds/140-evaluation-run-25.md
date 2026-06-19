# PRD #25: JS Evaluation Run-25: commit-story-v2 — CDQ-001 Regression Fix & SCH-003 Deterministic Type Enforcement

**Status:** Ready
**Created:** 2026-06-19
**GitHub Issue:** #140
**Depends on:** PRD #24 (run-24 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-24 scored 23/25 (92%) with 14 committed files, 0 partial, 0 failed (first clean sweep in 24 runs), and a new Q×F high-water mark of 12.88. Two new rule failures emerged:

1. **RUN24-1 (P2)** — index.js CDQ-001: `process.exit()` terminates before `finally { span.end() }` executes, dropping the `commit_story.index.main` span from the closed span set. This is a regression from the run-12 fix — the CDQ-001 pattern was introduced when index.js was first instrumented. Root cause: `process.exit()` bypasses Node.js cleanup handlers including `finally` blocks in async code.

2. **RUN24-2 (P2)** — git-collector.js SCH-003: `commit_story.git.diff_lines` declared `type: string` in `agent-extensions.yaml` but set with a bare integer (`lines.length`). This is the second consecutive run with this class of failure — in run-23 the attribute was named `diff_size`; in run-24 it was renamed to `diff_lines` (correct semantic change) but the `type: string` declaration was not corrected. *(D-7 from run-24 decision log: the schema declaration is the source of truth and stays as-is intentionally — agents must comply with the declared type. SCH-003 fix = deterministic type enforcement in spiny-orb: auto-wrap `String()` when `type: string` is declared and an integer expression is assigned. No schema change.)*

Additionally, prompt hygiene findings emerged from run-24:

3. **PH-1 (Watch)** — Hardcoded commit-story-v2 values in spiny-orb's general-purpose agent prompt. Two instances: (a) `diff_size` (a commit-story-v2-specific attribute name, now `diff_lines`) embedded in SCH-003 rule body text rather than in an `<examples>` block; (b) commit-story-v2 domain vocabulary in SCH-002 count-key disambiguation guidance. These inflate eval scores on this target and mask whether the general guidance is working. Spiny-orb team action needed: replace with neutral domain examples or move to clearly-labeled `<examples>` blocks.

### Primary Goals

Verify that RUN24-1 and RUN24-2 are resolved:
- index.js commits with `process.exit()` replaced by a graceful shutdown that allows `span.end()` to execute (or with `span.end()` called explicitly before `process.exit()`)
- git-collector.js commits with `diff_lines` set as `String(lines.length)` (or equivalent) matching the declared `type: string`

### Secondary Goals

- RUN23-4 watch (third): IS SPA-002 — `commit_story.index.main` still drops before batch flush. Root cause revised in run-24: `shutdownAndExit` fix is present in target repo's `instrumentation.js` but spiny-orb may not be routing through it. Issue #926 is closed with the original root cause description but the actual root cause has shifted — #926 needs to be reopened with the corrected description.
- RUN21-6 watch (fourth): agent notes vs committed code divergence — any new instances? spiny-orb issue #927.
- PH-1 watch: whether spiny-orb team abstracted the hardcoded commit-story-v2 values from the agent prompt.
- IS SPA-001 structural: 48 INTERNAL spans vs 10-span calibration limit. Research spike #929. Note: issue #139 tracks raising the commit-story-v2 IS scoring threshold in `score-is.js` from 10 to 55 — this is a prerequisite step for IS scoring in run-25.
- journal-graph.js: eighth consecutive success expected (runs 18–21, 23–24).

### Run-24 Scores (baseline for run-25 comparison)

| Dimension | Run-24 | Run-23 | Run-21 | Run-20 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | 5/5 (100%) | 5/5 (100%) | 4/5 (80%) | 4/5 (80%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | **3/4 (75%)** | 3/4 (75%) | 4/4 (100%) | 4/4 (100%) |
| CDQ | **6/7 (86%)** | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | **23/25 (92%)** | **24/25 (96%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** |
| **Files** | **14 (0p, 0f)** | **13+1p** | **12+2f** | **12+1f** |
| **Cost** | **~$3.70** | **~$5.60** | **~$8.10** | **$9.08** |
| **Push/PR** | **AUTO (#81)** | **AUTO (#75)** | **AUTO (#74)** | **AUTO (#73)** |
| **IS** | **80/100** | **80/100** | **90/100** | **80/100** |
| **Q×F** | **12.88** | **12.48** | **11.0** | **11.5** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN24-1: index.js CDQ-001 — `process.exit()` bypasses `span.end()` (regression) | RUN24-1 | 1 run | P2 — spiny-orb fix needed |
| RUN24-2: git-collector.js SCH-003 — `diff_lines` declared `type: string`, set as integer | RUN24-2 | 2 runs (consecutive) | P2 — deterministic type enforcement in spiny-orb; schema stays as-is |
| RUN23-4: IS SPA-002 — `commit_story.index.main` drops before batch flush | RUN23-4 | 3 runs | Watch — revised root cause: spiny-orb not routing through existing `shutdownAndExit` pattern; #926 closed with wrong root cause, needs reopen |
| IS SPA-001: INTERNAL span count structural | Structural | 11 runs | Structural — 48 INTERNAL spans vs 10-span calibration; research spike #929; issue #139 tracks threshold update |
| RUN21-6: Agent notes vs committed code divergence | RUN21-6 | 4 runs | Watch — spiny-orb issue #927; fourth watch run in run-25 |
| PH-1: Hardcoded commit-story-v2 values in agent prompt | RUN24 §9 | 1 run | Watch — two instances: SCH-003 rule body + SCH-002 disambiguation; spiny-orb team action needed |

---

## Solution Overview

Same four-phase structure as runs 5–24:

1. **Pre-run verification** — Verify RUN24-1, RUN24-2 fix status; check for any new spiny-orb changes since run-24
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #26

### Two-Repo Workflow

Same as runs 9–24.

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

1. index.js commits cleanly with CDQ-001 resolved (RUN24-1 fix confirmed)
2. git-collector.js commits cleanly with `diff_lines` type-correct — `String()` wrapping or equivalent (RUN24-2 fix confirmed)
3. Quality score ≥ 24/25 (96%) regardless of fix status
4. Q×F ≥ 14.0 if both CDQ-001 and SCH-003 fixes land (14 files × 25/25)
5. Push/PR succeeds automatically (seventeenth consecutive)
6. Per-file span counts verified by post-hoc counting
7. All evaluation artifacts generated from canonical methodology (per-agent approach, batches of 5)
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause with spoken summary)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to: (a) step 9.5 (SPA-001 calibration note for commit-story-v2 — INTERNAL span count is structural, not a defect); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure and prefix derivation rule, D-2 batch-of-5 approach). Also read these two documents in order: (b) `prds/127-evaluation-run-24.md` — the most recently completed commit-story-v2 run PRD; use it as a style reference for the IS scoring milestone format and per-file evaluation structure; (c) `evaluation/commit-story-v2/run-24/actionable-fix-output.md` — drives the current run's goals; provides the full detail behind RUN24-1, RUN24-2, and PH-1 listed in this PRD's Problem Statement. **Do not mark this complete until you have read all three documents.**

- [x] **Cross-run process review** *(Step 0.5 — before any other milestones except Step 0)* — Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Brief: check whether any other eval target (taze, release-it) has a completed run more recent than commit-story-v2's most recent completed run (run-24, `evaluation/commit-story-v2/run-24/actionable-fix-output.md`). A run is complete when its directory contains `actionable-fix-output.md`. If a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; present a structured checkpoint report (steps already in template vs. missing vs. target-specific only); wait for user approval before making any template changes. Full procedure with timestamp comparison method is in `docs/language-extension-plan.md` Step 0.5.

- [x] **Collect skeleton documents** — Create `evaluation/commit-story-v2/run-25/` directory with `lessons-for-prd26.md` skeleton. Must run before pre-run verification begins.

- [x] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/commit-story-v2/run-24/actionable-fix-output.md`. Check which findings were filed and their current status.
  2. **RUN24-1 fix** (P2): Verify whether the CDQ-001 regression in index.js has been addressed. Look for either: (a) `process.exit()` replaced with graceful shutdown so `finally { span.end() }` executes; or (b) explicit `span.end()` call before `process.exit()` in index.js. If not fixed, still proceed — run-25 will confirm the gap persists.
  3. **RUN24-2 fix** (P2): Verify whether deterministic type enforcement has been added to spiny-orb for the string-declared integer-value case. Look for a pre-commit check that wraps integer expressions with `String()` when the declared schema type is `string`. If not fixed, still proceed — run-25 will confirm.
  4. **RUN23-4 watch** (Watch, third run): Check whether issue #926 has been reopened with the revised root cause (spiny-orb not routing through the existing `shutdownAndExit` shutdown pattern, rather than the original "add forceFlush to bootstrap" root cause). Note the current status.
  5. **PH-1 watch**: Check whether spiny-orb team has abstracted the hardcoded commit-story-v2 attribute names from the agent prompt: (a) SCH-003 rule body — `diff_size`/`diff_lines` replaced with neutral domain example; (b) SCH-002 disambiguation — commit-story-v2 domain vocabulary moved to labeled `<examples>` block.
  6. **RUN21-6 watch** (Watch, fourth run): Check whether any further changes landed for issue #927 (agent notes vs committed code divergence). Fourth watch run — note any new instances in run-25.
  7. **Other spiny-orb fixes since run-24**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  8. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, spiny-orb.yaml and semconv/ exist. Check for staged `.instrumentation.md` files from run-24 (expected; spiny-orb will overwrite them).
  9. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  10. **File inventory**: Count .js files in commit-story-v2's `src/` directory (expect 31 after run-24 processed `src/logger.js` for the first time; verify count and check for any new files added since run-24).
  11. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  12. Record version and findings status.
  13. **README check**: Verify `README.md` on main has rows for runs 15–24 in the commit-story-v2 run history table. Run-22 was never executed and has no row.
  14. **Datadog pre-run health check**: Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). If no results: check whether the Datadog Agent is running (`datadog-agent status`). If not running, start it (`datadog-agent start`) and retry the query. If still no results after the agent is confirmed running: check `evaluation/commit-story-v2/run-24/trace-artifact.md` for the last known `service.instance.id` and retry with the full artifact query. Do not start the eval run until spans appear — the instrument branch confirmation in step 15 depends on live span data.
  15. **Instrument branch confirmation**: Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans. Compare against `git -C ~/Documents/Repositories/commit-story-v2 rev-parse --short <instrument-branch>` (the most recent instrument branch from run-24 — find its name in `evaluation/commit-story-v2/run-24/run-summary.md`). If the revision does not match: the target has drifted to an older branch — do not start the eval run until the correct branch is confirmed.
  16. **Capture trace artifact** (commit-story-v2 is an organic target): Read `evaluation/trace-capture-protocol.md` for the artifact format and full guidance. Then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` (last 7 days). From the most recent complete journal generation run (most recent `commit_story.journal.generate_sections` span whose `commit_story.journal.sections` contains all three section types: `["summary","dialogue","technical_decisions"]`), record `service.instance.id`. If multiple complete runs appear, prefer the most recent one whose `vcs.ref.head.revision` matches the instrument branch. Write `evaluation/commit-story-v2/run-25/trace-artifact.md` using the format in `evaluation/trace-capture-protocol.md`.
  17. Append observations to `evaluation/commit-story-v2/run-25/lessons-for-prd26.md`.

- [ ] **Evaluation run-25** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/commit-story-v2/run-25/spiny-orb-output.log` using `git add -f` (the root `.gitignore` has a `*.log` pattern that silently skips plain `git add`) and write `evaluation/commit-story-v2/run-25/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/commit-story-v2/run-25/debug-dumps/` before handing Whitney the command. When writing `run-summary.md`, extract the instrument branch name directly from the log (`grep -m1 'Branch:' spiny-orb-output.log`) — do not write it from context (D-4).

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-25/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/commit-story-v2/run-25/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-25 artifacts until the "Copy artifacts to main" milestone runs — do not leave it local-only.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN24-1 fix result — did index.js commit cleanly with CDQ-001 resolved?, (4) RUN24-2 fix result — did git-collector.js commit with `diff_lines` type-correct?, (5) journal-graph.js result — eighth consecutive?, (6) 3-attempt rate — any change from run-24's pattern (3 multi-attempt files)?, (7) quality score if visible, (8) cost, (9) push/PR status (auto or manual?), (10) overall attempt-count distribution. Keep it conversational, under 12 lines. Wait for acknowledgment before proceeding.

- [ ] **Post-run Datadog verification** — After the Findings Discussion checkpoint, confirm the new instrument branch spans appear in Datadog:
  1. Use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story` filtered to spans newer than the eval run's start timestamp. Check `vcs.ref.head.revision` on `commit_story.journal.save_journal_entry` spans to confirm the new instrument branch SHA appears.
  2. If no spans from the instrument branch appear yet: note this in `run-summary.md` and defer — do not block forward progress. **The trace run does not need to happen during the eval itself** — any invocation of the instrumented code on the correct branch after the eval completes is sufficient.
  3. When confirmed, record the corresponding `service.instance.id` in `trace-artifact.md` as the post-run trace reference (update from the pre-run capture if the instance differs).

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files. Also include committed files with ≥ 3 attempts AND quality failures — see scope note in `docs/language-extension-plan.md` step 5.
  Produces: `evaluation/commit-story-v2/run-25/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/commit-story-v2/run-25/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **Rule rename note**: NDS-005 (Control Flow Preserved) is called **NDS-007** in spiny-orb's validator output and in agent notes. Use NDS-007 in all per-file evaluation tables.

  **(D-2) Spawn per-file evaluation agents in batches of 5**: Before spawning agents, create the output directory: `mkdir -p evaluation/commit-story-v2/run-25/per-file-sections/`. Spawn individual background Agent() calls with `run_in_background: true` in batches of 5. After each batch returns, write section files to disk immediately — do NOT wait for all batches to finish before writing. After writing, the user clears context before spawning the next batch. At the start of each new batch, run `ls per-file-sections/` to see what's done and pick the next 5. Recommended groupings (adapt to run-25 file set): collectors + integrators, generators, managers, commands + utilities, correct-skips batch. Each agent reads: style reference, prior run's per-file-evaluation.md (for rule descriptions), original source (`git show main:src/file`), committed source (`git show <instrument-branch>:src/file`), agent notes from log, debug dump if applicable, and schema (`semconv/attributes.yaml`); each agent **writes its section directly to `evaluation/commit-story-v2/run-25/per-file-sections/<filename>.md`** — do NOT pass section text back through the agent call result. Main context assembles from the written files once all agents complete. Correct-skip files: one batch agent for RST-001 verification, handled separately. Full protocol: `docs/language-extension-plan.md` step 6 (D-2).

  **COV-005 methodology (attribute presence, not attribute identity)**: COV-005 passes if a span carries ≥1 meaningful domain attribute. Do NOT fail COV-005 based on comparison to run-24's specific attribute choices — attribute variation between runs is normal and expected. When a committed file's attribute set changes substantially from run-24 (any span drops ≥50% of its attributes, or a span that carried ≥3 attributes now carries 1), note it as a **coverage delta observation** in the per-file narrative — examine which specific attributes changed and whether the remaining attributes still capture the span's meaningful domain context. A coverage delta observation is narrative only; it does not affect any rule verdict. Only fail COV-005 when a span carries zero domain attributes.

  **Important**: Agent notes in `.instrumentation.md` files and log output are NOT ground truth about what was committed — they reflect an earlier reasoning draft. Per-file evaluation agents must read the instrumented source file directly (`git show <instrument-branch>:src/file`); do not rely on notes alone.

  **(Trace supplement)** Each per-file evaluation agent receives the `service.instance.id` from `evaluation/commit-story-v2/run-25/trace-artifact.md`. **Before writing any evaluation section**, read `evaluation/trace-capture-protocol.md`, then use the `search_datadog_spans` Datadog MCP tool with the `query` field from the artifact as the base query, appending a space and `resource_name:<prefix>.*` to filter to spans for the file under review. The agent uses live trace data to supplement — not override — static code review for: attribute presence at runtime, parent-child relationships, early exit detection, and CDQ-001 signal.

  **(D-1) Track attempt counts**: For each file, note attempts. spiny-orb only prints attempt count when > 1; no count = 1 attempt. If a file required ≥ 3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent (`grep -A 80 "Processing file.*<filename>" spiny-orb-output.log`).

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/commit-story-v2/run-25/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: Find the URL in `evaluation/commit-story-v2/run-25/run-summary.md` (written after the eval run completes).

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/commit-story-v2/run-25/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md` (run-12 format)
  **IMPORTANT — use run-24 rubric as the primary precedent reference** (`evaluation/commit-story-v2/run-24/rubric-scores.md`), not run-12. Run-24 contains the current rule set and critical precedents:
  1. **CDQ-006 precedent**: CDQ-006 advisory findings (e.g., external-source strings in setAttribute) are "advisory, not canonical failures per established rubric precedent" — do NOT fail CDQ-006 for advisory findings.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose agent output would have passed COV-001 ("WOULD PASS" in per-file evaluation) are scored as COV-001 PASS, consistent with run-20/run-21/run-23/run-24 treatment. Apply to any failed files in run-25.
  3. **COV-005 delta observation precedent**: Coverage delta observations are narrative only and do not affect COV-005 verdicts.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-007 (was NDS-005) is Control Flow Preserved.

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md` (commit-story-v2 section).

  **Prerequisite before running**: Update `evaluation/is/score-is.js` to use threshold 55 for commit-story-v2 (issue #139). The current threshold is 10, which causes SPA-001 to pass incorrectly given commit-story-v2's 48 INTERNAL spans. Update the threshold before running — do not run IS scoring with the old threshold of 10.

  1. **Claude runs**: `datadog-agent stop`
  2. **Claude starts** the OTel Collector in the background using the installed binary:
     ```bash
     vals exec -f ~/Documents/Repositories/spinybacked-orbweaver-eval/.vals.yaml -- ~/.local/bin/otelcol-contrib --config ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is/otelcol-config.yaml > /tmp/otelcol.log 2>&1 &
     COLLECTOR_PID=$!
     timeout 30 bash -c 'until lsof -i :4318 >/dev/null 2>&1; do sleep 0.5; done' || { kill "$COLLECTOR_PID" 2>/dev/null; exit 1; }
     ```
  3. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`. The instrument branch name is available in `evaluation/commit-story-v2/run-25/run-summary.md` once the eval run completes:
     ```bash
     git checkout <instrument-branch> -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true` — `@traceloop/instrumentation-langchain` API incompatibility crashes the process. See `evaluation/is/README.md`.
  4. **Claude stops** the Collector: `kill "$COLLECTOR_PID"`
  5. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/commit-story-v2/run-25/is-score.md`
  6. **Confirm IS scoring traces in Datadog**: Note the IS scoring run start time, then use the `search_datadog_spans` Datadog MCP tool with query `service:commit-story from:<run-start-time>` (use the actual timestamp to avoid matching organic traffic). Record the `service.instance.id`. This confirms the OTel Collector's Datadog exporter forwarded spans from the IS scoring run.
  7. **Claude runs**: `datadog-agent start`
  Produces: `evaluation/commit-story-v2/run-25/is-score.md`

- [ ] **Baseline comparison** — Compare run-25 vs runs 2–24 (run-22 was never executed).
  Produces: `evaluation/commit-story-v2/run-25/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — After baseline comparison, update `README.md`: (1) add a row for run-25 to the run history table (quality, gates, files, spans, cost, push/PR, IS score); (2) update the "next run" sentence to reference run-26 and its primary goals. Note: run-22 was never executed and has no row.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-25 evaluation artifacts.
  2. **Spoken summary (root cause + generalization)** *(user-facing checkpoint 2)*: Before printing the file path, provide a spoken summary with three elements: (a) **Main points** — the key failures, their category, and priority in plain language; (b) **Root cause vs. symptom** — for each recommended fix, state whether it addresses the root cause or a symptom; if symptom, explain why the root cause is not directly reachable; (c) **Every-user generalization check** — explain how each fix helps any spiny-orb user instrumenting any target repo, not just commit-story-v2.
  3. Print the absolute file path of `evaluation/commit-story-v2/run-25/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #26 until Whitney confirms she has handed the document off to the spiny-orb team.

- [ ] **Draft PRD #26** — Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint (steps 12.1–12.3) first — review `evaluation/commit-story-v2/run-25/actionable-fix-output.md` and any `lessons-for-prd26.md` files for process observations; present proposed template updates; get user approval; commit approved changes as a separate commit before drafting the PRD. Then draft PRD #26 using this PRD as the style reference. Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints into PRD #26's milestone structure. IS scoring milestone must use the same format as this PRD's IS scoring milestone. Per-file evaluation milestone must specify the D-2 batch-of-5 approach.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/commit-story-v2/run-25/` to copy all artifacts. Commit to main with message `eval: save run-25 artifacts to main [skip ci]`. Add one row to `evaluation/commit-story-v2/run-log.md` for run-25 and commit with `eval: update run-log for run-25 [skip ci]`. Push main. This step runs before `/prd-done` so the artifacts land on main while the eval branch is still reachable.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | SCH-003 fix = deterministic type enforcement (auto-wrap `String()` when `type: string` declared + integer assigned). Schema stays as-is. | Inherited from run-24 D-7. Schema is the source of truth; intentional type declarations stay; agents must comply. Reverse case (`type: int` + string) is not safely auto-fixable and should be passed back to the agent. | 2026-06-18 |

---
