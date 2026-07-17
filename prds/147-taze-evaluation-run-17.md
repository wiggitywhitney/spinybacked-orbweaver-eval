# PRD #147: TS Evaluation Run-17: taze — COV-005 + SCH-003 + CDQ-006 Resolution Verification

**Status:** Active
**Created:** 2026-06-22
**GitHub Issue:** [#147](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/147)
**Depends on:** PRD #146 (run-16 complete, actionable fix output delivered, findings TAZE-RUN3-1 through TAZE-RUN3-4 filed)

---

## Problem Statement

Run-16 ended at 26/29 (90%) quality and Q×F 11.7 — an improvement in coverage (+2 files recovered) but a regression in quality (-1 from the COV-005 packument.ts drop). Three carry-forward quality findings remain open:

- **TAZE-RUN3-1 (COV-005)**: `taze.package.latest_version` dropped from both fetch spans in `packument.ts`. The attribute is registered in the schema and the data is directly available in both response objects.
- **TAZE-RUN3-2 (CDQ-006)**: Three `setAttribute` calls in `loadBunWorkspace` (`bunWorkspaces.ts`) placed after `await readFile(...)` without `if (span.isRecording())` guard. The write side of the same file correctly guards its calls.
- **TAZE-RUN3-3 and TAZE-RUN3-4 (SCH-003)**: `String()` cast applied to int-typed attributes at two call sites — `String(deps.length)` in `checkGlobal.ts` and `String(catalogs.length)` in `bunWorkspaces.ts` — despite the schema correctly declaring them as `type: int`. The same attributes are passed as raw ints in `pnpmWorkspaces.ts` and `yarnWorkspaces.ts`.

Two additional watch items carried from run-16:
- **resolves.ts stability**: Recovered in run-16 (6 spans) after the run-15 oscillation. #954/#958 are still open — the recovery may be stochastic. Run-17 is the first stability check.
- **IS SPA-002 (orphan span)**: New in run-16 with the resolves.ts recovery. One span's parent context is lost across an async boundary. Run-17 determines whether this is consistent (fix needed in instrumentation) or transient.

### Primary Goals

1. **COV-005 packument.ts** — verify `taze.package.latest_version` is recovered on both fetch spans
2. **SCH-003 String() cast pattern** — verify the `String()` wrapper is removed from `checkGlobal.ts` and `bunWorkspaces.ts` call sites
3. **CDQ-006 bunWorkspaces.ts** — verify `isRecording` guard added to 3 post-await setAttribute calls in `loadBunWorkspace`
4. **resolves.ts stability** — verify the run-16 recovery holds (stochastic check; if it drops, oscillation confirmed stochastic and #954 becomes high priority)
5. **IS SPA-002** — verify whether orphan span persists or was transient

### Run-16 Scores (baseline)

| Dimension | Run-16 | Run-15 | Run-13 |
|-----------|--------|--------|--------|
| NDS | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| COV | 5/6 (83%) | 6/6 (100%) | 6/6 (100%) |
| RST | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | 3/4 (75%) | 3/4 (75%) | 3/4 (75%) |
| CDQ | 6/7 (86%) | 6/7 (86%) | 6/7 (86%) |
| **Overall quality** | **26/29 (90%)** | **27/29 (93%)** | **27/29 (93%)** |
| **Gates** | **2/2 (100%)** | **2/2 (100%)** | **2/2 (100%)** |
| **Files committed** | **13** | **11** | **14** |
| **Correct skips** | **20** | **20** | **19** |
| **Failed** | **0** | **1 (yarnWorkspaces.ts)** | **0** |
| **Cost** | **$4.36** | **$4.82** | **$4.93** |
| **Q×F** | **11.7** | **10.2** | **13.0** |
| **IS Score** | **88.9/100** | **80/100** | **60/100** |
| **Push/PR** | **YES (PR #11)** | **YES (PR #10)** | **YES (PR #8)** |

### Carry-Forward Findings

| # | Finding | Priority | Source |
|---|---------|----------|--------|
| TAZE-RUN3-1 | COV-005: `packument.ts` drops `taze.package.latest_version` from both fetch spans | Low | run-16 |
| TAZE-RUN3-2 | CDQ-006: `bunWorkspaces.ts` `loadBunWorkspace` — 3 post-await setAttribute calls without isRecording guard | Low | run-16 |
| TAZE-RUN3-3 | SCH-003: `checkGlobal.ts` uses `String(deps.length)` for `taze.package.deps_count` (int schema) | Low | run-16 |
| TAZE-RUN3-4 | SCH-003: `bunWorkspaces.ts` uses `String(catalogs.length)` for `taze.catalog.count` (int schema) | Low | run-16 |
| TAZE-RUN1-6 | IS SPA-001: INTERNAL span count exceeds threshold — structural (CLI design) | Info | run-13 |

---

## Solution Overview

Same four-phase structure as run-16:

1. **Pre-run verification** — Confirm spiny-orb SHA and known issue status; validate taze fork state
2. **Evaluation run** — Execute `spiny-orb instrument` on taze with current spiny-orb build
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including both user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #148

### Eval Branch Convention

The eval execution branch (`feature/prd-147-taze-evaluation-run-17`) **never merges to main**. The PR to main is docs-only (landing this PRD file); after that PR merges, the branch continues as the eval execution branch. Eval artifacts are copied to main separately via `git checkout` in step 13. When `/prd-done` runs at completion, close issue #147 without merging or deleting the eval branch.

### Key Inputs

- **Run-16 actionable fix output**: `evaluation/typescript/taze/run-16/actionable-fix-output.md`
- **Run-16 lessons for run-17**: `evaluation/typescript/taze/run-16/lessons-for-run17.md`
- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`
- **Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## Success Criteria

1. Pre-run verification confirms current spiny-orb SHA and documents which of #954/#958/#1008/#1009/#1010/#1011 are resolved
2. COV-005 (packument.ts `taze.package.latest_version`) status documented — resolved or still absent with root cause characterization
3. SCH-003 String() cast pattern status documented for both call sites — resolved or recurrence confirmed with updated finding
4. CDQ-006 bunWorkspaces.ts `loadBunWorkspace` status documented — resolved or recurrence confirmed
5. resolves.ts stability documented — held or dropped, with debug dump captured if dropped
6. IS SPA-002 orphan span status documented — consistent or transient
7. Quality score ≥ 26/29 (no regression from run-16); target 29/29 if all carry-forward findings are resolved
8. Push/PR succeeds
9. IS score ≥ 88/100 (no regression from run-16)
10. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
11. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) Type D structure and full step sequence including step 9.6 (correlated signals check); (b) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (c) eval branch convention (never merges to main); (d) step 13 (copy artifacts to main before closing); (e) step 9.5 (capture trace artifact after IS scoring — taze is non-organic).
  2. `prds/done/146-taze-evaluation-run-16.md` — the immediately prior taze run PRD. Note: taze is non-organic (trace artifact created during IS scoring step 9.5, NOT during pre-run verification).
  3. `evaluation/typescript/taze/run-16/actionable-fix-output.md` — prior run findings. TAZE-RUN3-1 (packument.ts COV-005), TAZE-RUN3-2 (bunWorkspaces.ts CDQ-006), TAZE-RUN3-3/4 (SCH-003 String() cast) are the primary goals for this run.
  4. `evaluation/typescript/taze/run-16/lessons-for-run17.md` — process notes including the correct IS scoring invocation (`taze major` mode) and the parallel subagent evidence set requirements.
  **Do not mark this complete until you have read all four documents.**

- [ ] **Step 0.5 — Cross-run process review** *(user-facing checkpoint — template changes require user approval)*. Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. In brief: (1) find the most recently completed taze run (run-16, `evaluation/typescript/taze/run-16/actionable-fix-output.md`); (2) check all other `evaluation/` subdirectories for a more recently completed cross-target run — compare using the `captured:` field in `trace-artifact.md` or the file modification time of `actionable-fix-output.md`; (3) if a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; (4) compare against the template structure in this PRD; (5) present the structured three-section checkpoint report; (6) after user approves, make approved template edits. Do NOT make any edits without explicit user approval.

- [ ] **Collect skeleton documents** — Create `evaluation/typescript/taze/run-17/` directory with `lessons-for-run18.md` and `spiny-orb-findings.md` skeleton files. Also create `evaluation/typescript/taze/run-17/debug-dumps/` directory — required before providing the instrument command. Must run before pre-run verification.

- [ ] **Pre-run verification** — Confirm prerequisites and validate taze fork state:

  1. **Datadog MCP health check**: Before any other setup work, run a sanity check: `search_datadog_spans` with `service:taze` for the last 1 hour. If it fails with an unexpected error (not just "no results"), re-run `/ddsetup` and `/reload-plugins` before proceeding.
  2. **Spiny-orb build** (P1): Check current spiny-orb SHA: `cd ~/Documents/Repositories/spinybacked-orbweaver && git log --oneline -5`. Run `npm run build` to produce current binaries. Record SHA in `lessons-for-run18.md`.
  3. **Issue status check** (P1 — determines run-17 goals): Check whether the following spiny-orb issues are closed:
     - #954 (resolves.ts oscillation root cause investigation)
     - #958 (resolves.ts oscillation fix)
     - #1008 (TAZE-RUN3-1: COV-005 packument.ts)
     - #1009 (TAZE-RUN3-2: CDQ-006 bunWorkspaces.ts)
     - #1010 (TAZE-RUN3-3/4: SCH-003 String() cast)
     - #1011 (IS SPA-002 orphan span)
     Document open/closed status and update the run-17 primary goals accordingly.
  4. **Schema type state**: Confirm `semconv/agent-extensions.yaml` in `~/Documents/Repositories/taze` correctly declares `taze.catalog.count` as `type: int` (added in run-16). If absent, leave it absent — do not pre-seed schema attributes before the run.
  5. **provenanceDowngraded skip on taze fork main**: Confirm `it.skip(...)` for provenanceDowngraded test is still in place in `test/resolves.test.ts` (commit `6a25b4d`). Required for `pnpm test` to pass.
  6. **Target repo readiness**: Verify taze fork on `main`, clean working tree, `spiny-orb.yaml` present with `language: typescript` and `testCommand: pnpm test`, `pnpm test` passes with the skip in place.
  7. **Push auth**: Dry-run push to verify `GITHUB_TOKEN_TAZE` still works:
      ```bash
      vals exec -i -f .vals.yaml -- bash -c 'git -C ~/Documents/Repositories/taze push --dry-run https://x-access-token:$GITHUB_TOKEN_TAZE@github.com/wiggitywhitney/taze.git HEAD:refs/heads/spiny-orb/auth-test'
      ```
  8. **File inventory**: Count `.ts` files in `~/Documents/Repositories/taze/src/` — should be 33.
  9. **Record environment**: Append spiny-orb SHA, Node version, and pnpm version to `evaluation/typescript/taze/run-17/lessons-for-run18.md`.

- [ ] **Evaluation run-17** — Whitney runs `spiny-orb instrument` in her terminal. The `debug-dumps/` directory must exist before running (created in skeleton step above).

  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/typescript/taze/run-17/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/typescript/taze/run-17/spiny-orb-output.log'
  ```

  After the run: save artifacts, commit with `git add -f` for the `.log` file, push the eval branch to origin immediately. Create PR to taze fork (`gh pr create --repo wiggitywhitney/taze`). Update PR title after rubric and IS scoring complete: `eval(prd-147): taze run-17 — <quality>/29 quality, Q×F <score>, IS <score>/100`.

  **If auto PR creation fails**: use `~/Documents/Repositories/taze/spiny-orb-pr-summary.md` with `--body-file`.

  **resolves.ts watch**: After the run, immediately check `evaluation/typescript/taze/run-17/debug-dumps/` for a `resolves.ts` debug dump. If present (meaning resolves.ts oscillated again): run `tsc --noEmit` on that file from the taze fork root to capture the actual error. Document in `spiny-orb-findings.md`. If absent (meaning resolves.ts committed spans again): note the continued stability.

  **debug-dumps note**: `--debug-dump-dir` fires only for failed, partial, and zero-span files. If all 33 files succeed, the debug-dumps directory will be empty — the `spiny-orb-output.log` is the sole source of agent reasoning (via `Agent thinking` and `Agent notes` blocks).

- [ ] **Findings Discussion** *(user-facing checkpoint 1 — raw signal before analysis)* — Present raw findings from the log: committed files, failed files, pre-scan skips, cost, resolves.ts outcome, COV-005/SCH-003/CDQ-006 guard status. Do not interpret yet. Wait for Whitney's response before proceeding to failure deep-dives.

- [ ] **Failure deep-dives** — For each failed file (0 committed spans), partially committed file, and committed file requiring ≥ 3 attempts with a quality failure: analyze debug dumps, verbose log, thinking blocks, companion `.instrumentation.md` files. Follow the diagnostic protocol from `docs/language-extension-plan.md` (all 5 dimensions). Document in `evaluation/typescript/taze/run-17/spiny-orb-findings.md`.

- [ ] **Per-file evaluation** *(complete IS scoring and step 9.5 trace capture first — taze is non-organic; trace artifact does not exist until after IS scoring)* — Evaluate each committed file against the rubric.

  **Use parallel subagent evaluation — up to 5 files at a time, one subagent per file.** Single-pass single-context evaluation misses findings that per-file subagents catch. Do NOT write the evaluation as a single sequential document. For spawning mechanics, follow the D-2 protocol in `docs/language-extension-plan.md` step 6.

  **Spawn up to 5 agents per batch — no more than 5.** Required sequence per batch: spawn up to 5 agents → collect results → append results to `per-file-evaluation.md` → `/prd-update-progress` → `/clear` → spawn next batch. Number of batches: ⌈committed_files/5⌉. `per-file-evaluation.md` is written incrementally across batches — do not wait for all files before writing.

  **Output format**: Follow the per-file format from `prds/done/146-taze-evaluation-run-16.md` exactly — one section per committed file, rule table per span, failures summary table at the end.

  **Entry point — read these produced artifacts before starting**:
  - `evaluation/typescript/taze/run-17/spiny-orb-findings.md` — failure deep-dives are already documented here. Start here rather than re-deriving from the log.
  - `evaluation/typescript/taze/run-17/spiny-orb-output.log` — full run output. Contains `Agent thinking` blocks (per-attempt reasoning) and `Agent notes` (structured instrumentation rationale) for ALL committed files. This is the primary evidence source for agent decision-making. Each file's section is bounded by `Processing file N of M: src/path/to/file.ts` at the start and the next `Processing file` line at the end. To extract a specific file's section, search for the filename in the log and read forward to the next `Processing file` line.
  - `evaluation/typescript/taze/run-17/lessons-for-run18.md` — process observations including any clarifications added during the run.
  - Companion `.instrumentation.md` files on the instrument branch — written for every file including skips. Explain what was instrumented and why in structured form.

  **Per-subagent evidence set**: each subagent must read — (1) the instrumented `.ts` file from the instrument branch; (2) the `Agent thinking` and `Agent notes` blocks from `spiny-orb-output.log` for that file (extracted by filename as described above); (3) the companion `.instrumentation.md` for that file on the instrument branch; (4) the run-16 baseline entry for that file from `evaluation/typescript/taze/run-16/per-file-evaluation.md`; (5) the evaluation rubric at `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`.

  **Note on debug-dumps**: `--debug-dump-dir` only fires for failed, partial, and zero-span files. If all files succeed, `evaluation/typescript/taze/run-17/debug-dumps/` will be empty. The thinking blocks in `spiny-orb-output.log` are the agent reasoning evidence for all successful files.

  **Trace supplement**: complete IS scoring (step 9) and trace capture (step 9.5) before returning here for trace supplement on each file. Use `search_datadog_spans` with the artifact query to supplement static code review. For each committed file, record the new-schema-attribute count (not total attribute usage — see `docs/language-extension-plan.md`, step 9) vs. run-16 baseline. If the baseline is 0 (file was not committed or failed in run-16), flag any non-zero count explicitly; otherwise, flag any file where count changed by ≥50% in either direction. Keep this trace-derived schema-registration count separate from the code-coverage inspection above — they measure different things and should not be conflated in findings.

- [ ] **PR artifact evaluation** — Evaluate the instrument branch PR: diff completeness, span registration accuracy, schema accuracy in `agent-extensions.yaml`, `traceloop-init.ts` registration block.

- [ ] **Rubric scoring** — Score all dimensions against the rubric. Compare to run-16 baseline. COV-005/SCH-003/CDQ-006 resolution status are the primary data points.

- [ ] **IS scoring run** — See `evaluation/is/README.md` for collector setup.

  IS scoring invocation for taze (from `evaluation/typescript/taze/run-16/lessons-for-run17.md`):
  ```bash
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/taze.mjs major
  ```
  Run from `~/Documents/Repositories/taze` on the instrument branch. OTel SDK packages are already in node_modules on the instrument branch — no `npm install` needed. OTel Collector must be running on port 4318 (Docker or binary). See `~/.claude/rules/is-scoring-gotchas.md` for full sequence.

  Then score:
  ```bash
  node evaluation/is/score-is.js evaluation/is/eval-traces.json --target taze > evaluation/typescript/taze/run-17/is-score.md
  ```

  **SPA-001 note**: taze is a CLI app. If SPA-001 fires, this is structural — document but do not treat as a regression.
  **SPA-002 watch**: Compare SPA-002 orphan span result to run-16. If the orphan persists, the fix belongs in spiny-orb's context propagation across async boundaries for resolves.ts.

- [ ] **Capture trace artifact (step 9.5)** — Immediately after IS scoring completes, use the `search_datadog_spans` Datadog MCP tool with query `service:taze from:now-30m`. Retrieve `service.instance.id` from any span. Write `evaluation/typescript/taze/run-17/trace-artifact.md` (five fields: service.instance.id, captured, target, instrument_branch, query) using the format in `evaluation/trace-capture-protocol.md`. If no spans appear, wait up to 5 minutes and retry once.

- [ ] **Correlated signals check (step 9.6)** — Use the `service.instance.id` from `trace-artifact.md` as the correlation handle:
  - **Traces**: `search_datadog_spans` with `service:taze @service.instance.id:<uuid>` — confirm spans appear.
  - **Logs**: `search_datadog_logs` with `service:taze @otel_resource_attributes.service.instance.id:<uuid>` — confirm log records carry `trace_id` and `span_id` fields.
  - **Metrics**: `search_datadog_metrics` for `traces.span.metrics.calls` and `traces.span.metrics.duration` filtered to `service:taze`.
  Note any gaps in `run-summary.md` — do not block the eval run on signals gaps.

- [ ] **Baseline comparison** — Compare run-17 results to run-16 across all dimensions. Calculate Q×F. Update root README: add a run-17 row to the taze run history table; update the "Run-18 is next" note with primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2 — interpreted summary + handoff pause)* — Write `evaluation/typescript/taze/run-17/actionable-fix-output.md` with the full structured format: what happened, COV-005/SCH-003/CDQ-006 resolution status, resolves.ts stability outcome, IS SPA-002 status, new findings, updated carry-forward table. Before finalizing attribute-coverage findings, apply the diagnostic-protocol clarification in `docs/language-extension-plan.md` (step 9): a "0 attributes" run-summary count means 0 NEW schema attributes, not 0 attributes used — inspect the committed code directly, searching for all attribute-writing paths (`setAttribute`, `setAttributes`, span-start `attributes` maps, wrapper helpers), rather than relying on the summary count or a single grep. When complete, print the absolute path: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/typescript/taze/run-17/actionable-fix-output.md`. Pause until Whitney confirms she has handed the document to the spiny-orb team. Do not proceed to the next PRD until confirmed.

  **Handoff framing guidance**:
  - **Fix language targets spiny-orb components, not target files.** "Fix:" entries should describe the spiny-orb component gap — auto-fix, validator, prompt, or fix-loop. Do not write "remove X at line Y of file.ts." Target repo files are overwritten every run; patching them is not durable and misleads the team about where the root cause is.
  - **Attribute disappearance is not automatically a finding.** If an attribute appeared in a prior run and is absent now, investigate before calling it wrong — consider whether there is a semconv basis for the attribute and whether the absence is a defensible agent decision. Give the spiny-orb team evidence and honest characterization, not a decision-free action list.
  - **Carry-forward table: consider distinguishing findings from observations.** Entries with a plausible spiny-orb root cause ("finding") vs. entries worth watching but without a clear industry basis for calling them wrong ("observation") serve different purposes for the team.

- [ ] **Draft next PRD** *(includes template-update checkpoint before drafting)* — Follow `docs/language-extension-plan.md` step 12: (1) review `lessons-for-run18.md` and `actionable-fix-output.md` for process observations; (2) present two-section checkpoint to user (target-specific vs. generalizable); (3) after approval, commit any template changes as a separate commit; (4) draft the next taze run PRD using this PRD as the style reference; (5) run `/write-prompt` before committing.

- [ ] **Copy artifacts to main** — Switch to main, pull, then run:
  ```bash
  git checkout feature/prd-147-taze-evaluation-run-17 -- evaluation/typescript/taze/run-17/
  ```
  Commit to main with message `eval: save taze run-17 artifacts to main [skip ci]`. The run-17 row in `evaluation/typescript/taze/run-log.md` and the taze run history section in `README.md` were added on the eval branch — verify they are present after the checkout and do NOT duplicate them. Push to origin/main. Then return to the eval branch and run `/prd-done`.

---

## Score Projections

### Conservative (carry-forward findings recur, resolves.ts drops)

- **Quality**: 26/29 (90%) — carry-forward findings (COV-005, CDQ-006, SCH-003) persist unfixed; resolves.ts oscillation drops 6 spans but does not add a new dimension failure
- **Files**: 12 (resolves.ts oscillates back to 0)
- **IS Score**: 88/100 (stable)
- **Q×F**: ~10.8

### Target (all three carry-forward quality findings resolved, resolves.ts holds)

- **Quality**: 29/29 (100%) — COV-005 recovered, SCH-003 both sites fixed, CDQ-006 guarded
- **Files**: 13 (stable)
- **IS Score**: 90+/100 (SPA-002 resolved)
- **Q×F**: ~13.0

### Partial (some findings resolved, resolves.ts holds)

- **Quality**: 27–28/29 (93–97%) — 1–2 of the 3 carry-forward findings resolved
- **Files**: 13
- **IS Score**: 88–90/100
- **Q×F**: ~11.5–12.5

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| resolves.ts oscillation recurs | `--debug-dump-dir` captures the debug dump; run `tsc --noEmit` to get actual error; document in `spiny-orb-findings.md` — this is the primary diagnostic data for #954 |
| COV-005 not fixed in this spiny-orb build | Document as carry-forward; characterize the gap in `loadPackument` response handling for the spiny-orb team |
| SCH-003 String() cast recurs again | Confirm which files are affected; update carry-forward table; characterize as a systematic prompt gap in type coercion handling |
| GITHUB_TOKEN_TAZE expired | Pre-run step 7 dry-run catches this. Regenerate per `~/.claude/rules/eval-github-pat.md`. |
| IS Docker blocked | Use otelcol-contrib binary (arm64). See `evaluation/is/README.md`. |
| debug-dumps empty (all files succeed) | Expected — use `spiny-orb-output.log` Agent thinking blocks as the sole agent reasoning source |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-22 | Per-file evaluation must use the parallel subagent approach (up to 5 at a time, one per file) | Validated during run-16 per Decision 4 in PRD #146: parallel agents found gaps that sequential evaluation missed. Required process for all future runs. |
| 2026-06-22 | `spiny-orb-output.log` is the primary agent reasoning source when debug-dumps is empty | When all files succeed, `--debug-dump-dir` writes nothing (confirmed in run-16: 0 failures → empty debug-dumps). The `Agent thinking` and `Agent notes` blocks in the log are the only window into agent decision-making for successful files. Each per-file subagent must read the log excerpt for its file. |
