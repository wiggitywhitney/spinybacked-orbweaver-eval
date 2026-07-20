// ABOUTME: PRD for JS Evaluation Run-27 — SCH-003 int-type String() cast check and CDQ-007 self-identified-fix guidance verification.
# PRD #27: JS Evaluation Run-27: commit-story-v2 — SCH-003 AST Check + CDQ-007 Self-Identified-Fix Verification

**Status:** Ready
**Created:** 2026-07-20
**GitHub Issue:** #153
**Depends on:** PRD #26 (run-26 complete, actionable fix output delivered to spiny-orb team)

---

## Problem Statement

Run-26 scored 23/25 (92%) with a clean sweep (14 committed, 0 partial, 0 failed). Gates 5/5. IS 100/100 (second consecutive perfect score). Q×F 12.88. RUN25-1 (COV-004 ENOENT validator false positive) confirmed resolved via a genuine validation journey, not a lucky pass.

Two new rule findings emerged:

1. **RUN26-1 (P1)** — `journal-manager.js` SCH-003: `commit_story.journal.reflections_count` is declared `type: int` in `semconv/agent-extensions.yaml`, but the agent emitted `String(reflections.length)`. The validator's SCH-003 check appears to only compare declared type against direct literal/variable assignments — it does not flag an explicit `String(...)` wrapper around a value passed to `setAttribute` for an int/float/bool-typed registry key. Confirmed live via a run-26-branch trace (`git.commit.sha` matches the instrument branch HEAD; trace `3722a802e3cf1bc1c0bc5428509d2ce7`).

2. **RUN26-2 (P2)** — `journal-paths.js` CDQ-007: raw filesystem path set as `commit_story.journal.file_path`; the agent's own generation-time notes self-identified "missing `basename` import" as the fix and declined to apply it. This is the first run where a CDQ-007 finding crossed from advisory to canonical FAIL specifically because the agent named a concrete, cost-free remediation and didn't apply it — the other six CDQ-007 findings this run remained advisory. `ensureDirectory(filePath)` derives its directory via `dirname(filePath)` on the full path, so a straight swap to `basename(filePath)` would drop that directory context — the correct fix depends on which representation the spiny-orb team confirms satisfies CDQ-007 without losing diagnostic value.

Additionally, run-26 surfaced a broader methodology issue (not a rule failure): `attributesCreated`/"N attributes" figures in `run-summary.md` and `spiny-orb-output.log` count only *new schema extensions*, not total attributes set in code. This produced a false "declining richness" narrative for `context-capture-tool.js` across runs 23–25 that source inspection disproved. Full detail: `evaluation/javascript/commit-story-v2/run-26/actionable-fix-output.md` §3, §4, §7, §8.

### Primary Goals

Verify whether RUN26-1 and RUN26-2 are resolved:
- `journal-manager.js` emits `reflections_count` as a true int, not a quoted string (SCH-003 passes)
- `journal-paths.js` resolves its CDQ-007 finding via whichever representation the spiny-orb team confirmed — either a directory-preserving fix, or documented as an accepted advisory if no fix landed. Do not treat "an attribute was added alongside the original raw path" as a resolution; the original raw-path attribute must actually be gone or corrected.

### Secondary Goals

- **Attribute-count undercounting**: Check whether spiny-orb's run-summary language changed (e.g., "N new schema-extension attributes" instead of bare "N attributes"), or whether a total-`setAttribute`-count metric was added. If not, per-file evaluation must independently verify attribute counts against source for any file the run summary reports as "0 attributes" before drawing any coverage conclusion.
- **RUN21-6 watch** (sixth run): any new agent notes vs. committed code divergence. spiny-orb issue #927.
- **IS score**: does 100/100 hold for a third consecutive run?
- **Cost trend**: does retry volume normalize from run-26's $11.15 high (driven by three files needing 3 attempts each, not one outlier), or continue climbing?
- **journal-graph.js**: tenth consecutive success expected (runs 18–21, 23–26).

### Run-26 Scores (baseline for run-27 comparison)

| Dimension | Run-26 | Run-25 | Run-24 | Run-23 |
|-----------|--------|--------|--------|--------|
| NDS | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) | 2/2 (100%) |
| COV | 5/5 (100%) | 4/5 (80%) | 5/5 (100%) | 5/5 (100%) |
| RST | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | **3/4 (75%)** | 4/4 (100%) | 3/4 (75%) | 3/4 (75%) |
| CDQ | **6/7 (86%)** | 7/7 (100%) | 6/7 (86%) | 7/7 (100%) |
| **Total** | **23/25 (92%)** | **24/25 (96%)** | **23/25 (92%)** | **24/25 (96%)** |
| **Gates** | **5/5** | **5/5** | **5/5** | **5/5** |
| **Files** | **14 (clean sweep)** | **13+1p** | **14 (0p, 0f)** | **13+1p** |
| **Cost** | **$11.15** | **$7.38** | **~$3.70** | **~$5.60** |
| **Push/PR** | **MANUAL (#91, see D-7)** | **AUTO (#86)** | **AUTO (#81)** | **AUTO (#75)** |
| **IS** | **100/100** | **100/100** | **80/100** | **80/100** |
| **Q×F** | **12.88** | **12.48** | **12.88** | **12.48** |

### Unresolved from Prior Runs

| Item | Origin | Runs Open | Status |
|------|--------|-----------|--------|
| RUN26-1: journal-manager.js SCH-003 — `reflections_count` emitted as `String(x.length)` against an int-typed registry key | RUN26-1 | 1 run | P1 — needs a static AST check for `setAttribute(key, String(...))` against numeric-typed registry keys |
| RUN26-2: journal-paths.js CDQ-007 — raw path, `basename` self-identified and not applied | RUN26-2 | 1 run | P2 — prompt guidance or validator escalation for self-identified-but-unapplied fixes |
| Log attribute undercounting — `attributesCreated` counts only new schema extensions, not total attributes set | RUN25 (implicit) / RUN26 (confirmed) | 2+ runs | P2 — produced a false "declining richness" narrative for context-capture-tool.js; needs a spiny-orb run-summary language fix |
| RUN21-6: Agent notes vs committed code divergence | RUN21-6 | 6 runs | Watch — spiny-orb issue #927; sixth watch run in run-27 |
| IS SPA-001: INTERNAL span count structural | Structural | 12 runs | Structural — threshold raised to 55 by PR #142; research spike #929 still open |

---

## Solution Overview

Same four-phase structure as runs 5–26:

1. **Pre-run verification** — Verify RUN26-1/RUN26-2 fix status; check for attribute-count language changes since run-26
2. **Evaluation run** — Execute `spiny-orb instrument` on commit-story-v2
3. **Structured evaluation** — Per-file evaluation with per-agent methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #28

### Two-Repo Workflow

Same as runs 9–26.

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

1. `journal-manager.js` emits `reflections_count` as a true int (RUN26-1 fix confirmed) — SCH returns to 4/4
2. `journal-paths.js` CDQ-007 finding resolved per the spiny-orb team's confirmed representation, or documented as an intentionally accepted advisory — CDQ returns to 7/7 only if an actual fix landed
3. Quality score ≥ 23/25 (92%, no regression from run-26); 25/25 if both fixes land (Q×F 14.0, all-time record target)
4. Push/PR succeeds automatically (nineteenth consecutive attempt; run-26 was a manual recovery during a paused run, not a spiny-orb defect — see D-7)
5. Per-file span counts verified by post-hoc counting, cross-checked against source for any file the run summary reports as "0 attributes"
6. All evaluation artifacts generated from canonical methodology (per-agent approach, batches of 5)
7. Both user-facing checkpoints completed (Findings Discussion + handoff pause with spoken summary)
8. IS ≥ 100/100 (run-25 and run-26 both hit 100/100; this is now the expected baseline, not a stretch target)

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) step 9.5 (SPA-001 calibration note — commit-story-v2 threshold is 55, set by PR #142); (b) step 9 (IS scoring protocol); (c) step 6 (per-file trace supplement procedure and D-2 batch-of-5 approach); (d) step 3 (branch-name extraction fallback and approval-prompt check — added from run-26's RUN26-3 finding: before treating an apparently stalled run as failed, check whether it's paused at its own `Proceed? [y/N]` approval prompt rather than genuinely stuck); (e) step 10 (attribute-count trend caution — added from run-26's undercounting finding: before flagging any cross-run "declining richness" trend, verify reported attribute counts against direct source inspection rather than trusting logged figures alone).
  2. `prds/144-evaluation-run-26.md` — the immediately prior commit-story-v2 run PRD; use it as a style reference for the IS scoring milestone format and per-file evaluation structure.
  3. `evaluation/javascript/commit-story-v2/run-26/actionable-fix-output.md` — drives the current run's goals. RUN26-1 (SCH-003 journal-manager.js) and RUN26-2 (CDQ-007 journal-paths.js) are the primary goals for this run; §4 (attribute undercounting) and §7/§8 (carry-forward tracker and score projection) inform pre-run verification and success criteria.
  **Do not mark this complete until you have read all three documents.**

- [ ] **Cross-run process review** *(Step 0.5 — before any other milestones except Step 0)* — Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Check whether any other eval target (taze, release-it, content-manager) has a completed run more recent than run-26 (`evaluation/javascript/commit-story-v2/run-26/actionable-fix-output.md`). If so, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; present a structured checkpoint report; wait for user approval before making any template changes.

- [ ] **Collect skeleton documents** — Create `evaluation/javascript/commit-story-v2/run-27/` directory (already created with `debug-dumps/`) with a `lessons-for-prd28.md` skeleton. Must run before pre-run verification begins.

- [ ] **Pre-run verification** — Verify spiny-orb fixes and validate run prerequisites:
  1. **Datadog MCP health check** *(first, before any other pre-run step)*: Run `search_datadog_spans` with `service:commit-story` for the last 1 hour. If it fails or returns an unexpected error (not just "no results"), re-run `/ddsetup`, then `/reload-plugins`. Do not proceed until Datadog MCP queries succeed.
  2. **Handoff triage review**: Read the spiny-orb team's triage of `evaluation/javascript/commit-story-v2/run-26/actionable-fix-output.md`. Check which findings were filed and their current status.
  3. **RUN26-1 fix** (P1): Verify whether a validator or generation-time check now catches `setAttribute(key, String(...))` calls where `key` resolves to an int/float/bool-typed registry attribute. If not fixed, still proceed — run-27 will confirm the gap persists.
  4. **RUN26-2 fix** (P2): Verify whether journal-paths.js's raw-path CDQ-007 finding has a confirmed resolution path from the spiny-orb team — either a specific representation fix or an explicit decision to leave it as an accepted advisory. Note which.
  5. **Attribute-count undercounting fix** (P2): Check whether spiny-orb's run-summary language changed to distinguish "new schema-extension attributes" from total attributes set, or whether a total-count metric was added.
  6. **RUN21-6 watch** (Watch, sixth run): Check whether any further changes landed for issue #927. Note any new instances in run-27.
  7. **Other spiny-orb fixes since run-26**: Check spiny-orb main for any merged PRs relevant to commit-story-v2 evaluation.
  8. **Target repo readiness** (commit-story-v2): Verify on `main`, clean working tree, `spiny-orb.yaml` and `semconv/` exist. Check that target is NOT on the run-26 instrument branch at session start.
  9. **Push auth stability check**: Verify token still works (dry-run push to non-existent branch).
  10. **File inventory**: Count `.js` files in commit-story-v2's `src/` directory (expect 31; verify count and check for any new files added since run-26).
  11. Rebuild spiny-orb from **main**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm install && npm run build`
  12. Record version and findings status.
  13. **README check**: Verify `README.md` on main has a row for run-26.
  14. **Datadog pre-run health check**: Use `search_datadog_spans` with `service:commit-story` (last 7 days). If no results, check Datadog Agent status. Do not start the eval run until spans appear.
  15. **Instrument branch confirmation**: Check `git.commit.sha` on recent `commit_story.journal.save_journal_entry` spans (note: NOT `vcs.ref.head.revision` — see D-6). The run-26 instrument branch was `spiny-orb/instrument-1784302707982` — to get its HEAD SHA: `git -C ~/Documents/Repositories/commit-story-v2 rev-parse spiny-orb/instrument-1784302707982`. If target is still on the run-26 branch organically, that is expected and fine — confirm the target repo itself is on `main`.
  16. **Capture trace artifact** (organic target): Read `evaluation/trace-capture-protocol.md`. Use `search_datadog_spans` with `service:commit-story` (last 7 days). From the most recent complete journal generation run, record `service.instance.id`. Write `evaluation/javascript/commit-story-v2/run-27/trace-artifact.md`.
  17. Append observations to `evaluation/javascript/commit-story-v2/run-27/lessons-for-prd28.md`.

- [ ] **Evaluation run-27** — Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.** AI role: (1) confirm readiness with Whitney, (2) once Whitney provides the log output, save it to `evaluation/javascript/commit-story-v2/run-27/spiny-orb-output.log` using `git add -f` and write `evaluation/javascript/commit-story-v2/run-27/run-summary.md`, (3) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote: `gh pr create --body-file ~/Documents/Repositories/commit-story-v2/spiny-orb-pr-summary.md --repo wiggitywhitney/commit-story-v2 --head <instrument-branch> --title "..."`

  **Before treating an apparently stalled run as failed**: check whether it's paused at its own `Proceed? [y/N]` approval prompt rather than genuinely stuck or errored — see `docs/language-extension-plan.md` step 3. Run-26's "push/PR failure" (RUN26-3) turned out to be a ~27.5-hour approval-prompt pause, not a spiny-orb defect; a premature manual recovery during that window produced a downstream duplicate-PR conflict that required correction after the fact. If the run appears stalled, check the terminal state before concluding it needs manual recovery.

  AI must create `evaluation/javascript/commit-story-v2/run-27/debug-dumps/` before handing Whitney the command (already created). When writing `run-summary.md`, extract the instrument branch name directly from the log (`grep -m1 'Branch:' spiny-orb-output.log`) — do not write it from context (D-4).

  **Exact command** (run from `~/Documents/Repositories/commit-story-v2`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-27/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/commit-story-v2/run-27/spiny-orb-output.log
  ```

  **After saving artifacts and committing, push the eval branch to origin immediately** (`git push -u origin <eval-branch>`). The branch holds the only copy of run-27 artifacts until the "Copy artifacts to main" milestone runs.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)* — After `run-summary.md` is written, before any evaluation documents are started: report to Whitney: (1) files committed / failed / partial, (2) whether any checkpoint failures occurred, (3) RUN26-1 fix result — does journal-manager.js emit `reflections_count` as a true int?, (4) RUN26-2 fix result — is journal-paths.js's CDQ-007 finding resolved?, (5) journal-graph.js result — tenth consecutive?, (6) 3-attempt rate, (7) quality score if visible, (8) cost, (9) push/PR status, (10) overall attempt-count distribution. Keep it conversational, under 12 lines. Wait for acknowledgment before proceeding.

- [ ] **Post-run Datadog verification** — Follow `docs/language-extension-plan.md` step 3b. After the Findings Discussion checkpoint:
  1. Use `search_datadog_spans` with `service:commit-story` filtered to spans newer than the eval run's start timestamp. Check `git.commit.sha` on spans to confirm the new instrument branch is present.
  2. If no spans from the instrument branch appear yet: note in `run-summary.md` and defer.
  3. When confirmed, record the `service.instance.id` in `trace-artifact.md`.
  4. **Log-trace correlation check** *(commit-story-v2 only — pino bridge)*: Use `search_datadog_logs` with `service:commit-story` filtered to logs newer than the eval run's start. Confirm that ≥1 log record has non-empty `trace_id` and `span_id`. Note the correlated vs. uncorrelated count. Run-26 baseline: check run-26's post-run verification note for the actual figure. If zero correlated logs: flag as regression — pino bridge may have been disrupted.

- [ ] **Failure deep-dives** — For each failed file AND run-level failure. Includes any partial files and committed files with ≥3 attempts AND quality failures.
  Produces: `evaluation/javascript/commit-story-v2/run-27/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation** — Full rubric on ALL files (no spot-checking). Evaluate all rules across all committed and partial files.
  Produces: `evaluation/javascript/commit-story-v2/run-27/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **Rule rename note**: NDS-005 (Control Flow Preserved) is called **NDS-007** in spiny-orb's validator output. Use NDS-007 in all per-file evaluation tables.

  **(D-2) Spawn per-file evaluation agents in batches of 5**: Before spawning agents, create: `mkdir -p evaluation/javascript/commit-story-v2/run-27/per-file-sections/`. Spawn individual background Agent() calls with `run_in_background: true` in batches of 5. After each batch returns, write section files to disk immediately. After writing, the user clears context before spawning the next batch. At the start of each new batch, run `ls per-file-sections/` to see what's done and pick the next 5. **Background agents cannot write NEW files** (Write tool blocked for new paths in subagent context) — ask agents to return section content in the result text, then write each file directly. Full protocol: `docs/language-extension-plan.md` step 6 (D-2).

  **COV-005 methodology (attribute presence, not attribute identity)**: COV-005 passes if a span carries ≥1 meaningful domain attribute. Attribute variation between runs is normal. When a committed file's attribute set changes substantially from run-26, note it as a **coverage delta observation** in the per-file narrative — do not fail COV-005 for it.

  **Attribute-count trend caution**: before flagging any cross-run "declining richness" trend for any file, verify reported attribute counts against direct source inspection rather than trusting `attributesCreated`/"N attributes" figures alone — those figures count only new schema extensions, not total attributes set. See `docs/language-extension-plan.md` step 10 (added from run-26's undercounting finding, which produced a false regression narrative for `context-capture-tool.js` across runs 23–25).

  **Trace provenance labeling**: commit-story-v2 is dogfooded in real operation, so live trace evidence may come from either the instrument branch tip or ordinary main-branch usage — these are not interchangeable. Before citing a trace as support for a per-file finding, check the span's `git.commit.sha` against the instrument branch's actual HEAD SHA (obtained in pre-run verification step 15). Label each cited trace explicitly as "instrument-branch evidence" or "main-branch evidence (corroborating, not direct)" — see `docs/language-extension-plan.md` step 6 (added from run-26's trace provenance split finding, where most cited traces turned out to be main-branch dogfooding traffic rather than run-26-branch evidence).

  **Important**: Per-file evaluation agents must read the instrumented source directly (`git show <instrument-branch>:src/file`); do not rely on agent notes alone. Additionally, each agent must read the `Agent thinking` and `Agent notes` blocks for that file from `spiny-orb-output.log` — this is the primary evidence source for understanding why the agent made specific instrumentation decisions. Note: `--debug-dump-dir` only fires for failed, partial, and zero-span files; if all files succeed, debug-dumps/ is empty and the log is the sole source of agent reasoning. Companion `.instrumentation.md` files on the instrument branch also contain structured rationale per file.

  **(D-2 trace supplement)** Each per-file evaluation agent receives the `service.instance.id` from `evaluation/javascript/commit-story-v2/run-27/trace-artifact.md`. Before writing any section, use `search_datadog_spans` with the artifact query + `resource_name:<prefix>.*`. Note in each section which run's trace data is being used, and apply the trace provenance labeling rule above.

  **(D-1) Track attempt counts**: For each file, note attempts. If a file required ≥3 attempts AND has a quality failure, include the verbose log section as input to the per-file evaluation agent.

  **Key watch items for per-file evaluation**:
  - `journal-manager.js` — Does `reflections_count` emit as a true int? RUN26-1 fix result.
  - `journal-paths.js` — Is the raw-path CDQ-007 finding resolved, and if so, via which representation? RUN26-2 fix result.
  - `context-capture-tool.js` — Cross-check its attribute count against source directly; do not trust the run-summary figure alone (attribute-count trend caution above).
  - `journal-graph.js` — Tenth consecutive success expected.

- [ ] **PR artifact evaluation** — Evaluate PR quality.
  Produces: `evaluation/javascript/commit-story-v2/run-27/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`
  PR: Find the URL in `evaluation/javascript/commit-story-v2/run-27/run-summary.md`.

- [ ] **Rubric scoring** — Synthesize dimension-level scores.
  Produces: `evaluation/javascript/commit-story-v2/run-27/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`
  **Use run-26 rubric as the primary precedent reference** (`evaluation/javascript/commit-story-v2/run-26/rubric-scores.md`). Critical precedents:
  1. **CDQ-006 precedent**: Advisory findings are not canonical failures — do NOT fail CDQ-006 for advisory findings.
  2. **COV-001 failed-file precedent**: Files that failed to commit but whose output would have passed COV-001 are scored as COV-001 PASS.
  3. **COV-005 delta observation precedent**: Coverage delta observations are narrative only.
  4. **CDQ-007 self-identified-fix precedent** (new from run-26): a raw-path/similar advisory finding becomes a canonical FAIL when the agent's own generation-time notes name a specific, cost-free remediation and decline to apply it — do not apply this escalation to any other CDQ-007 finding this run unless the same self-identification condition holds.
  **Rule set**: CDQ dimension is 7/7 max (CDQ-001, CDQ-002, CDQ-003, CDQ-005, CDQ-006, CDQ-007, CDQ-008). NDS-007 is Control Flow Preserved.

- [ ] **IS scoring run** — Follow `docs/language-extension-plan.md` step 9. Full protocol in `evaluation/is/README.md`.

  **Note**: SPA-001 threshold for commit-story-v2 is 55 (set by PR #142). SPA-002 is de-facto resolved for commit-story-v2 (`SimpleSpanProcessor` + `shutdownAndExit` override — structurally impossible). IS 100/100 in run-25 and run-26 is the baseline. If IS returns <100/100 in run-27, check for a **different** rule failure — do NOT re-investigate SPA-002.

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
  4. **Claude runs** the scorer: `node evaluation/is/score-is.js evaluation/is/eval-traces.json --target commit-story-v2 > evaluation/javascript/commit-story-v2/run-27/is-score.md`
  5. **Confirm IS scoring traces in Datadog**: Record IS scoring run start time, then query `service:commit-story from:<run-start-time>`. Record `service.instance.id`.
  Produces: `evaluation/javascript/commit-story-v2/run-27/is-score.md`

- [ ] **Baseline comparison** — Compare run-27 vs runs 2–26 (run-22 was never executed).
  Produces: `evaluation/javascript/commit-story-v2/run-27/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

  **Attribute-count trend caution**: before flagging any cross-run "declining richness" trend, verify reported attribute counts against direct source inspection rather than trusting logged figures alone — see `docs/language-extension-plan.md` step 10 (added from run-26's undercounting finding on commit-story-v2, which produced a false regression narrative for `context-capture-tool.js` that was disproved on source inspection).

- [ ] **Update root README** — Add a row for run-27 to the run history table (quality, gates, files, spans, cost, push/PR, IS score). Update the "next run" sentence to reference run-28 and its primary goals.

- [ ] **Actionable fix output** — Primary handoff deliverable.

  At milestone completion:
  1. Run the cross-document audit agent to verify consistency across all run-27 evaluation artifacts.
  2. **Spoken summary (root cause + generalization)** *(user-facing checkpoint 2)*: Before printing the file path, provide a spoken summary with three elements: (a) **Main points** — key failures, category, priority; (b) **Root cause vs. symptom** — for each fix, state whether it addresses root cause or symptom; (c) **Every-user generalization check** — how each fix helps any spiny-orb user, not just commit-story-v2.
  3. Print the absolute file path of `evaluation/javascript/commit-story-v2/run-27/actionable-fix-output.md`.
  4. **Pause.** Do not proceed to Draft PRD #28 until Whitney confirms handoff to spiny-orb team.

  **Handoff framing guidance** (carried forward from taze run-16 and run-26):
  - **Fix language targets spiny-orb components, not target files.** "Fix:" entries should describe the spiny-orb component gap — auto-fix, validator, prompt, or fix-loop. Do not write "remove String() at line 42 of file.ts." Target repo files are overwritten every run; patching them is not durable and can mislead the team about the root cause.
  - **Attribute disappearance is not automatically a finding.** If an attribute appeared in a prior run and is absent now, investigate before calling it wrong. Consider: does the attribute have a semconv basis? Is the absence a defensible agent decision? The spiny-orb team applies their own judgment — give them evidence and honest characterization, not a decision-free list.
  - **Carry-forward table: consider distinguishing findings from observations.** Entries with a plausible spiny-orb root cause ("finding") vs. entries worth watching but without a clear industry basis for calling them wrong ("observation") serve different purposes for the team.
  - **"0 attributes" in the run summary means 0 NEW schema attributes, not 0 attributes used.** Before finalizing any attribute-coverage finding, inspect the committed code directly rather than relying on the summary count — search for all attribute-writing paths (`setAttribute`, `setAttributes`, span-start `attributes` maps, wrapper helpers), not just a single grep — a file using only pre-registered attributes reports "0 attributes" even though it calls `setAttribute` (see `docs/language-extension-plan.md` step 9).

- [ ] **Draft PRD #28** — Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint first. Cascade approved process improvements to three places: (1) the template, (2) all other currently active open eval PRDs, and (3) the affected milestones of PRD #28 itself before committing — a cold AI reading only PRD #28 will not re-read the template during the run. Draft PRD #28 using this PRD as the style reference. Create on a separate branch from main. Merge the PRD PR to main so `/prd-start` can pick it up. Carry forward both user-facing checkpoints.

- [ ] **Copy artifacts to main** — From main, run `git checkout <eval-branch> -- evaluation/javascript/commit-story-v2/run-27/` to copy all artifacts. Commit to main with message `eval: save run-27 artifacts to main [skip ci]`. Add one row to `evaluation/javascript/commit-story-v2/run-log.md` for run-27. Push main. This step runs before `/prd-done`.

---

## Decision Log

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D-1 | Schema stays as-is for SCH-003 / attribute type mismatches. Agents must comply with declared types. | Inherited from run-24 D-7 via run-25 D-1 and run-26. Schema is the source of truth; intentional type declarations stay. | 2026-06-20 |
| D-4 | Extract instrument branch name from log output (`grep -m1 'Branch:' spiny-orb-output.log`), never from conversation context or memory. | Prevents recording stale branch names from prior runs. `run-summary.md` is the canonical record. | 2026-06-20 |
| D-5 | SPA-002 is de-facto resolved for commit-story-v2. Do not carry it forward as a watch item. | commit-story-v2 uses `SimpleSpanProcessor` (immediate export) + `shutdownAndExit` override — batch-flush-before-exit is structurally impossible. IS 100/100 in run-25 and run-26 confirms. Systemic spiny-orb fix tracked in #930. | 2026-06-20 |
| D-6 | Use `git.commit.sha` (not `vcs.ref.head.revision`) to identify which instrument branch is running in Datadog spans. | `vcs.ref.head.revision` on commit-story-v2 spans is the CLI argument (the git commit SHA being processed), not the instrument branch HEAD. Confirmed in run-25 pre-run verification. | 2026-06-20 |
| D-7 | A run that appears stalled must be checked for a live `Proceed? [y/N]` approval prompt before being treated as failed or manually recovered. | Run-26's apparent push/PR "failure" (RUN26-3) was actually a ~27.5-hour approval-prompt pause, not a spiny-orb defect. Premature manual recovery during that window produced a downstream duplicate-PR conflict. Cascaded to `docs/language-extension-plan.md` step 3 and to all active eval PRDs (#100, #143, #147). | 2026-07-20 |
| D-8 | Before flagging a cross-run attribute-count "declining richness" trend, verify against direct source inspection, not logged `attributesCreated` figures alone. | `attributesCreated` counts only new schema extensions, not total attributes set in code. This produced a false regression narrative for `context-capture-tool.js` across runs 23–25 that source inspection disproved in run-26. Cascaded to `docs/language-extension-plan.md` step 10 and to taze (#147) and release-it (#100). | 2026-07-20 |
| D-9 | For commit-story-v2 (organic/dogfooded target), every cited live trace must be labeled "instrument-branch evidence" or "main-branch evidence (corroborating, not direct)" based on `git.commit.sha`. | Run-26 found most cited per-file traces were ordinary main-branch dogfooding traffic, not run-26-branch evidence — only 2 of the files evaluated had confirmed branch-tip trace evidence. Cascaded to `docs/language-extension-plan.md` step 6 and to content-manager (#143), the only other organic/dogfooded target. | 2026-07-20 |

---
