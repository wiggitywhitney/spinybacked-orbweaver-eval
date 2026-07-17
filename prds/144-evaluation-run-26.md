// ABOUTME: PRD for JS Evaluation Run-26 — COV-004 ENOENT validator fix verification and attribute selection guidance watch.
# PRD #26: JS Evaluation Run-26: commit-story-v2 — COV-004 ENOENT Fix Verification

**Status:** Ready
**Created:** 2026-06-20
**GitHub Issue:** #144
**Depends on:** PRD #25 (run-25 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-25 scored 24/25 (96%) with 13 committed files, 1 partial (summary-manager.js), 0 failed. Gates 5/5. IS 100/100 (all-time record). Q×F 12.48.

One new rule failure emerged:

1. **RUN25-1 (P2)** — summary-manager.js COV-004: `isExpectedConditionCatch` in `cov003.ts` does not recognize the negated ENOENT rethrow pattern (`if (err.code !== 'ENOENT') throw err`). The run-24 agent avoided this by using empty catches (`catch {}`), which pass the validator but silently swallow non-ENOENT errors — technically an NDS-007 violation. The run-25 agent preserved semantically correct conditional rethrow and was blocked. Two exported async functions (`readWeekDailySummaries`, `readMonthWeeklySummaries`) committed as partial. Root cause in spiny-orb: `isExpectedConditionCatch` treats both the positive form (`if (err.code === 'ENOENT') return; throw err`) and the negated form (`if (err.code !== 'ENOENT') throw err`) identically, rejecting both. Only the positive form is a genuine error path — the negated form is graceful degradation.

Additionally, process/tool observations from run-25:

2. **Attribute selection guidance gap (P2)** — Three-run declining richness on `context-capture-tool.js` (3→2→1 attrs); `summary-detector.js` collapsed from 3 extension attrs to 0 on identical source; `summarize.js` jumped from 2 to 6. Agent lacks a principled framework for attribute selection. Three asks delivered to spiny-orb team in actionable-fix-output.md §5: (a) minimum-attribute threshold guidance, (b) registered-vs-extension decision guidance, (c) industry practice research spike. Watch run-26 for improvement.

3. **Debug dump coverage gap (P2)** — ~~`--debug-dump-dir` only writes files for `buildFailedResult` path (failed files). Partial files (e.g., summary-manager.js run-25) produce no dump.~~ **RESOLVED** — spiny-orb now writes `--debug-dump-dir` output for partial and success-with-0-spans files in addition to failed files.

4. **Thinking block persistence Watch** — ~~Attribute variance in run-25 cannot be diagnosed from agent notes alone. PRD #752 (thinking block persistence to companion files) would address this.~~ **RESOLVED** — thinking blocks are now always written to `.instrumentation.md` companion files on the instrument branch regardless of which display flags are passed.

### Primary Goals

Verify that RUN25-1 is resolved:
- summary-manager.js commits all 9 exported async functions cleanly with COV-004 passing (validator recognizes negated ENOENT rethrow pattern as graceful degradation)

### Secondary Goals

- **Attribute selection guidance**: Did prompt changes from §5 asks land? Watch for improvement across files with prior variance.
- **context-capture-tool.js declining richness** (watch, 4th run): Does `commit_story.context.capture` gain back `entry_date` and `source`, or continue declining?
- **RUN21-6 watch** (fifth run): Any new agent notes vs committed code divergence. spiny-orb issue #927.
- **PH-1 first signal**: Run-25 was the first post-fix run (PR #982 removed hardcoded commit-story-v2 values from agent prompt). Does abstracted guidance generalize correctly in run-26?
- **journal-graph.js**: Ninth consecutive success expected (runs 18–21, 23–25).

### Run-25 Scores (baseline for run-26 comparison)

| Dimension | Run-25 | Run-24 | Run-23 | Run-21 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | **4/5 (80%)** | 5/5 (100%) | 5/5 (100%) | 4/5 (80%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) | 4/4 (100%) |
| CDQ | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) | 6/7 (86%) |
| **Total** | **24/25 (96%)** | **23/25 (92%)** | **24/25 (96%)** | **23/25 (92%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** |
| **Files** | **13+1p** | **14 (0p, 0f)** | **13+1p** | **12+2f** |
| **Cost** | **$7.38** | **~$3.70** | **~$5.60** | **~$8.10** |
| **Push/PR** | **AUTO (#86)** | **AUTO (#81)** | **AUTO (#75)** | **AUTO (#74)** |
| **IS** | **100/100** | **80/100** | **80/100** | **90/100** |
| **Q×F** | **12.48** | **12.88** | **12.48** | **11.0** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN25-1: summary-manager.js COV-004 — `isExpectedConditionCatch` false positive on negated ENOENT rethrow | RUN25-1 | 1 run | P2 — validator fix (Option A) or prompt guidance workaround (Option B); schema stays as-is |
| RUN21-6: Agent notes vs committed code divergence | RUN21-6 | 5 runs | Watch — spiny-orb issue #927; fifth watch run in run-26 |
| context-capture-tool.js: Declining attribute richness (3→2→1 over runs 23–25) | RUN23 | 3 runs | Watch — COV-005 still passes but trend reaches 0 by run-27 without guidance fix; root cause: insufficient minimum-attribute threshold guidance |
| IS SPA-001: INTERNAL span count structural | Structural | 11 runs | Structural — threshold raised to 55 by PR #142; research spike #929 still open |

---

## Solution Overview

Same four-phase structure as runs 5–25:

1. **Pre-run verification** — Verify RUN25-1 fix status; check for attribute selection guidance changes since run-25
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #27

### Two-Repo Workflow

Same as runs 9–25.

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

1. summary-manager.js commits all 9 functions cleanly with COV-004 passing (RUN25-1 fix confirmed)
2. Quality score ≥ 24/25 (96%); 25/25 if RUN25-1 fix lands
3. Q×F ≥ 14.0 if COV-004 fix lands (25/25 × 14 files — all-time record target)
4. Push/PR succeeds automatically (eighteenth consecutive)
5. Per-file span counts verified by post-hoc counting
6. All evaluation artifacts generated from canonical methodology (per-agent approach, batches of 5)
7. Both user-facing checkpoints completed (Findings Discussion + handoff pause with spoken summary)
8. IS ≥ 80/100 (run-25 established 100/100 baseline; SPA-002 structurally resolved for this target)

---

## Milestones

- [x] **Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.** Pay particular attention to: (a) step 9.5 (SPA-001 calibration note — commit-story-v2 threshold is 55, updated by PR #142); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure and D-2 batch-of-5 approach). Also read these two documents in order: (b) `prds/140-evaluation-run-25.md` — the most recently completed commit-story-v2 run PRD; use it as a style reference for the IS scoring milestone format and per-file evaluation structure; (c) `evaluation/javascript/commit-story-v2/run-25/actionable-fix-output.md` — drives the current run's goals. **Do not mark this complete until you have read all three documents.**

- [ ] **Cross-run process review** *(Step 0.5 — before any other milestones except Step 0)* — Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Check whether any other eval target (taze, release-it) has a completed run more recent than run-25 (`evaluation/javascript/commit-story-v2/run-25/actionable-fix-output.md`). If so, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; present a structured checkpoint report; wait for user approval before making any template changes.

- [ ] **Collect skeleton documents** — Create `evaluation/javascript/commit-story-v2/run-26/` directory with `lessons-for-prd27.md` skeleton. Must run before pre-run verification begins.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Datadog MCP health check** *(first, before any other pre-run step)*: Run `search_datadog_spans` with `service:commit-story` for the last 1 hour. If it fails or returns an unexpected error (not just "no results"), re-run `/ddsetup`, then `/reload-plugins`. Do not proceed until Datadog MCP queries succeed.
  2. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/javascript/commit-story-v2/run-25/actionable-fix-output.md`. Check which findings were filed and their current status.
  3. **RUN25-1 fix** (P2): Verify whether the COV-004 validator fix has landed. Look for a change in `isExpectedConditionCatch` (in `cov003.ts`) that recognizes the negated ENOENT pattern (`if (err.code !== 'ENOENT') throw err`) as graceful degradation (returns `true`) rather than flagging it. If not fixed, still proceed — run-26 will confirm the gap persists. Note whether Option A (validator fix) or Option B (prompt guidance workaround) was implemented.
  4. **Attribute selection guidance** (P2): Check whether any of the three asks from actionable-fix-output.md §5 were implemented: (a) minimum-attribute threshold guidance in agent prompt; (b) registered-vs-extension decision guidance; (c) research spike PR. Note status of each.
  5. **Debug dump coverage** (P2): Check whether `lastInstrumentedCode` is now populated for partial results (`validation.passed` partial path). If not, run-26 will have the same gap as run-25.
  6. **RUN21-6 watch** (Watch, fifth run): Check whether any further changes landed for issue #927. Fifth watch run — note any new instances in run-26.
  7. **context-capture-tool.js watch**: No specific fix expected; note whether attribute selection guidance changes (if any) affected this file.
  8. **Other spiny-orb fixes since run-25**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  9. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, `spiny-orb.yaml` and `semconv/` exist. Check that target is NOT on run-25 instrument branch at session start.
  10. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  11. **File inventory**: Count `.js` files in commit-story-v2's `src/` directory (expect 31; verify count and check for any new files added since run-25).
  12. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  13. Record version and findings status.
  14. **README check**: Verify `README.md` on main has a row for run-25.
  15. **Datadog pre-run health check**: Use `search_datadog_spans` with `service:commit-story` (last 7 days). If no results, check Datadog Agent status. Do not start the eval run until spans appear.
  16. **Instrument branch confirmation**: Check `git.commit.sha` on recent `commit_story.journal.save_journal_entry` spans (note: NOT `vcs.ref.head.revision` — that attribute is the CLI argument, not the instrument branch HEAD; see D-6). The `git.commit.sha` value is the HEAD SHA of whichever instrument branch is running. The run-25 instrument branch was `spiny-orb/instrument-1781909345452` — to get its HEAD SHA: `git -C ~/Documents/Repositories/commit-story-v2 rev-parse spiny-orb/instrument-1781909345452`. Spans showing this SHA are from the run-25 instrument branch. If target is still on the run-25 branch organically, that is expected and fine — confirm the target repo itself is on `main`.
  17. **Capture trace artifact** (organic target): Read `evaluation/trace-capture-protocol.md`. Use `search_datadog_spans` with `service:commit-story` (last 7 days). From the most recent complete journal generation run, record `service.instance.id`. Write `evaluation/javascript/commit-story-v2/run-26/trace-artifact.md`.
  18. Append observations to `evaluation/javascript/commit-story-v2/run-26/lessons-for-prd27.md`.

- [ ] **Evaluation run-26** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/javascript/commit-story-v2/run-26/spiny-orb-output.log` using `git add -f` and write `evaluation/javascript/commit-story-v2/run-26/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  AI must create `evaluation/javascript/commit-story-v2/run-26/debug-dumps/` before handing Whitney the command. When writing `run-summary.md`, extract the instrument branch name directly from the log (`grep -m1 'Branch:' spiny-orb-output.log`) — do not write it from context (D-4).

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-26/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-26/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-26 artifacts until the "Copy artifacts to main" milestone runs.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN25-1 fix result — did summary-manager.js commit cleanly with all 9 functions?, (4) attribute selection: any visible improvement from guidance changes?, (5) journal-graph.js result — ninth consecutive?, (6) 3-attempt rate, (7) quality score if visible, (8) cost, (9) push/PR status, (10) overall attempt-count distribution. Keep it conversational, under 12 lines. Wait for acknowledgment before proceeding.

- [ ] **Post-run Datadog verification** — Follow `docs/language-extension-plan.md` step 3b. After the Findings Discussion checkpoint:
  1. Use `search_datadog_spans` with `service:commit-story` filtered to spans newer than the eval run's start timestamp. Check `git.commit.sha` on spans to confirm the new instrument branch is present.
  2. If no spans from the instrument branch appear yet: note in `run-summary.md` and defer.
  3. When confirmed, record the `service.instance.id` in `trace-artifact.md`.
  4. **Log-trace correlation check** *(commit-story-v2 only — pino bridge)*: Use `search_datadog_logs` with `service:commit-story` filtered to logs newer than the eval run's start. Confirm that ≥1 log record has non-empty `trace_id` and `span_id`. Note the correlated vs. uncorrelated count. Run-25 baseline: ~80% of log entries correlated. If zero correlated logs: flag as regression — pino bridge may have been disrupted.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files and committed files with ≥3 attempts AND quality failures.
  Produces: `evaluation/javascript/commit-story-v2/run-26/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/javascript/commit-story-v2/run-26/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **Rule rename note**: NDS-005 (Control Flow Preserved) is called **NDS-007** in spiny-orb's validator output. Use NDS-007 in all per-file evaluation tables.

  **(D-2) Spawn per-file evaluation agents in batches of 5**: Before spawning agents, create: `mkdir -p evaluation/javascript/commit-story-v2/run-26/per-file-sections/`. Spawn individual background Agent() calls with `run_in_background: true` in batches of 5. After each batch returns, write section files to disk immediately. After writing, the user clears context before spawning the next batch. At the start of each new batch, run `ls per-file-sections/` to see what's done and pick the next 5. **Background agents cannot write NEW files** (Write tool blocked for new paths in subagent context) — ask agents to return section content in the result text, then write each file directly. Full protocol: `docs/language-extension-plan.md` step 6 (D-2).

  **COV-005 methodology (attribute presence, not attribute identity)**: COV-005 passes if a span carries ≥1 meaningful domain attribute. Attribute variation between runs is normal. When a committed file's attribute set changes substantially from run-25, note it as a **coverage delta observation** in the per-file narrative — do not fail COV-005 for it.

  **Important**: Per-file evaluation agents must read the instrumented source directly (`git show <instrument-branch>:src/file`); do not rely on agent notes alone. Additionally, each agent must read the `Agent thinking` and `Agent notes` blocks for that file from `spiny-orb-output.log` — this is the primary evidence source for understanding why the agent made specific instrumentation decisions. Note: `--debug-dump-dir` only fires for failed, partial, and zero-span files; if all files succeed, debug-dumps/ is empty and the log is the sole source of agent reasoning. Companion `.instrumentation.md` files on the instrument branch also contain structured rationale per file. (Updated per PRD #146 Decision 5, 2026-06-21.)

  **(D-2 trace supplement)** Each per-file evaluation agent receives the `service.instance.id` from `evaluation/javascript/commit-story-v2/run-26/trace-artifact.md`. Before writing any section, use `search_datadog_spans` with the artifact query + `resource_name:<prefix>.*`. Note: run-26 may not have been organically invoked yet — run-25 traces (`service.instance.id: bcb5e6b0-0bfd-4dcd-afc8-22dd60a389f3`) are from the run-24 instrument branch. Note in each section which run's trace data is being used.

  **(D-1) Track attempt counts**: For each file, note attempts. If a file required ≥3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent.

  **Key watch items for per-file evaluation**:
  - `summary-manager.js` — Did all 9 functions commit? RUN25-1 fix result.
  - `context-capture-tool.js` — Does `commit_story.context.capture` carry `entry_date` and/or `source`? Declining trend watch.
  - `summary-detector.js` — Did the attribute selection improvement (if any) restore schema extension attributes?
  - `git-collector.js` — Is `diff_lines` included this run, and if so, is it type-correct?

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/javascript/commit-story-v2/run-26/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: Find the URL in `evaluation/javascript/commit-story-v2/run-26/run-summary.md`.

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/javascript/commit-story-v2/run-26/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`
  **Use run-25 rubric as the primary precedent reference** (`evaluation/javascript/commit-story-v2/run-25/rubric-scores.md`). Critical precedents:
  1. **CDQ-006 precedent**: Advisory findings are not canonical failures — do NOT fail CDQ-006 for advisory findings.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose output would have passed COV-001 are scored as COV-001 PASS.
  3. **COV-005 delta observation precedent**: Coverage delta observations are narrative only.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-007 is Control Flow Preserved.

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md`.

  **Note**: SPA-001 threshold for commit-story-v2 is 55 (set by PR #142). SPA-002 is de-facto resolved for commit-story-v2 (`SimpleSpanProcessor` + `shutdownAndExit` override — structurally impossible). IS 100/100 in run-25 is the baseline. If IS returns <100/100 in run-26, check for a **different** rule failure — do NOT re-investigate SPA-002.

  **Note on Datadog Agent**: Do NOT run `datadog-agent stop/start`. The Agent's embedded OTLP HTTP receiver is permanently disabled (port 4318 owned by `otelcol-contrib`).

  1. **Claude starts** the OTel Collector in the background:
     ```bash
     vals exec -f ~/Documents/Repositories/spinybacked-orbweaver-eval/.vals.yaml -- ~/.local/bin/otelcol-contrib --config ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/is/otelcol-config.yaml > /tmp/otelcol.log 2>&1 &
     COLLECTOR_PID=$!
     timeout 30 bash -c 'until lsof -i :4318 >/dev/null 2>&1; do sleep 0.5; done' || { kill "$COLLECTOR_PID" 2>/dev/null; exit 1; }
     ```
  2. **Claude checks out** instrument files and runs the app from `~/Documents/Repositories/commit-story-v2`:
     ```bash
     git checkout <instrument-branch> -- src/ examples/
     OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node --import ./examples/instrumentation.js src/index.js HEAD
     git checkout main -- src/ examples/
     ```
     Note: omit `COMMIT_STORY_TRACELOOP=true`.
  3. **Claude stops** the Collector: `kill "$COLLECTOR_PID"`
  4. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json --target commit-story-v2 > evaluation/javascript/commit-story-v2/run-26/is-score.md`
  5. **Confirm IS scoring traces in Datadog**: Record IS scoring run start time, then query `service:commit-story from:<run-start-time>`. Record `service.instance.id`.
  Produces: `evaluation/javascript/commit-story-v2/run-26/is-score.md`

- [ ] **Baseline comparison** — Compare run-26 vs runs 2–25 (run-22 was never executed).
  Produces: `evaluation/javascript/commit-story-v2/run-26/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README** — Add a row for run-26 to the run history table (quality, gates, files, spans, cost, push/PR, IS score). Update the "next run" sentence to reference run-27 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable. At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-26 evaluation artifacts.
  2. **Spoken summary (root cause + generalization)** *(user-facing checkpoint 2)*: Before printing the file path, provide a spoken summary with three elements: (a) **Main points** — key failures, category, priority; (b) **Root cause vs. symptom** — for each fix, state whether it addresses root cause or symptom; (c) **Every-user generalization check** — how each fix helps any spiny-orb user, not just commit-story-v2.
  3. Print the absolute file path of `evaluation/javascript/commit-story-v2/run-26/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #27 until Whitney confirms handoff to spiny-orb team.

  **Handoff framing guidance** (from taze run-16):
  - **Fix language targets spiny-orb components, not target files.** "Fix:" entries should describe the spiny-orb component gap — auto-fix, validator, prompt, or fix-loop. Do not write "remove String() at line 42 of file.ts." Target repo files are overwritten every run; patching them is not durable and can mislead the team about the root cause.
  - **Attribute disappearance is not automatically a finding.** If an attribute appeared in a prior run and is absent now, investigate before calling it wrong. Consider: does the attribute have a semconv basis? Is the absence a defensible agent decision? The spiny-orb team applies their own judgment — give them evidence and honest characterization, not a decision-free list.
  - **Carry-forward table: consider distinguishing findings from observations.** Entries with a plausible spiny-orb root cause ("finding") vs. entries worth watching but without a clear industry basis for calling them wrong ("observation") serve different purposes for the team.
  - **"0 attributes" in the run summary means 0 NEW schema attributes, not 0 attributes used.** Before finalizing any attribute-coverage finding, verify actual usage via `git show <branch>:<path> | grep setAttribute` rather than the summary count — a file using only pre-registered attributes reports "0 attributes" even though it calls `setAttribute` (see `docs/language-extension-plan.md` step 9).

- [ ] **Draft PRD #27** — Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint first. Cascade approved process improvements to three places: (1) the template, (2) all other currently active open eval PRDs, and (3) the affected milestones of PRD #27 itself before committing — a cold AI reading only PRD #27 will not re-read the template during the run. Draft PRD #27 using this PRD as the style reference. Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/javascript/commit-story-v2/run-26/` to copy all artifacts. Commit to main with message `eval: save run-26 artifacts to main [skip ci]`. Add one row to `evaluation/javascript/commit-story-v2/run-log.md` for run-26. Push main. This step runs before `/prd-done`.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | Schema stays as-is for SCH-003 / attribute type mismatches. Agents must comply with declared types. | Inherited from run-24 D-7 via run-25 D-1. Schema is the source of truth; intentional type declarations stay. | 2026-06-20 |
| D-4 | Extract instrument branch name from log output (`grep -m1 'Branch:' spiny-orb-output.log`), never from conversation context or memory. | Prevents recording stale branch names from prior runs. `run-summary.md` is the canonical record. | 2026-06-20 |
| D-5 | SPA-002 is de-facto resolved for commit-story-v2. Do not carry it forward as a watch item. | commit-story-v2 uses `SimpleSpanProcessor` (immediate export) + `shutdownAndExit` override — batch-flush-before-exit is structurally impossible. IS 100/100 in run-25 confirms. Systemic spiny-orb fix tracked in #930. | 2026-06-20 |
| D-6 | Use `git.commit.sha` (not `vcs.ref.head.revision`) to identify which instrument branch is running in Datadog spans. | `vcs.ref.head.revision` on commit-story-v2 spans is the CLI argument (the git commit SHA being processed), not the instrument branch HEAD. Confirmed in run-25 pre-run verification. | 2026-06-20 |

---
