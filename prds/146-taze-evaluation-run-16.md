# PRD #146: TS Evaluation Run-16: taze — resolves.ts Oscillation Investigation with Expanded Debug Coverage

**Status:** Active
**Created:** 2026-06-21
**GitHub Issue:** [#146](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/146)
**Depends on:** PRD #130 (run-15 complete, actionable fix output delivered, findings TAZE-RUN2-1 through TAZE-RUN2-7 filed)

---

## Problem Statement

Run-15 ended at 27/29 (93%) quality and Q×F 10.2 — down from run-13's Q×F 13.0. The primary driver of the regression is `resolves.ts`: 6 async functions × 2 NDS-001 oscillation attempts = 0 spans committed despite genuine instrumentable content. The actual tsc error text was never captured because spiny-orb's debug dumps only wrote for `status: failed` files. `resolves.ts` committed 0 spans but reported `✅ SUCCESS`, so no debug dump was written.

Two spiny-orb prerequisites for diagnosis have now merged to spiny-orb main (SHA `8a08f5b`):
- **#752** — companion file thinking blocks (`.instrumentation.md` files written for all files; `--thinking` now shows thinking for all files; `--verbose-fail` and `--thinking-fail` flags added)
- **#989** — debug dump coverage extended to `partial` and `success-with-0-spans` files, and `lastInstrumentedCode` populated for skipped functions

With `#989` merged, a `resolves.ts` oscillation in run-16 will write a debug dump showing the actual instrumented code — enabling `#954` root cause diagnosis.

### Primary Goal

Diagnose `resolves.ts` NDS-001 oscillation root cause using the new debug dump coverage:
- If oscillation recurs: debug dump captures the generated code; run `tsc --noEmit` manually to get the actual error message
- If `#954`/`#958` are resolved before run-16 runs: verify the fix committed 6 spans in resolves.ts

### Secondary Goals

- **CDQ-006**: 5 isRecording guard violations remain in 4 files (`checkGlobal.ts` ×2, `interactive.ts` ×1, `bunWorkspaces.ts` ×1, `pnpmWorkspaces.ts` ×1). Verify whether spiny-orb prompt fix (#728 follow-up) reduces violations.
- **SCH-003**: `bunWorkspaces.ts` `taze.io.catalogs_found` declared as `string` but assigned `catalogs.length` (int). Pattern has recurred across two runs — verify whether schema-gen heuristic for count attributes has been fixed.
- **yarnWorkspaces.ts**: All 3 attempts produced `/\./ g` (space before `g` flag) causing TS1005. Was failing in run-13 (different error) and run-15 (regex error). Verify whether NDS-001 generation for this file is fixed.
- **TAZE-RUN2-7**: `resolves.ts` classified as "correct skip" despite 12 failed oscillation attempts. Verify whether oscillation/success-with-0-spans telemetry now surfaces correctly in run summary.

### Run-15 Scores (baseline)

| Dimension | Run-15 | Run-13 |
|-----------|--------|--------|
| NDS | 4/4 (100%) | 4/4 (100%) |
| COV | 6/6 (100%) | 6/6 (100%) |
| RST | 5/5 (100%) | 5/5 (100%) |
| API | 3/3 (100%) | 3/3 (100%) |
| SCH | 3/4 (75%) | 3/4 (75%) |
| CDQ | 6/7 (86%) | 6/7 (86%) |
| **Overall quality** | **27/29 (93%)** | **27/29 (93%)** |
| **Gates** | **2/2 (100%)** | **2/2 (100%)** |
| **Files committed** | **11** | **14** |
| **Correct skips** | **20** | **19** |
| **Failed** | **1 (yarnWorkspaces.ts)** | **0** |
| **Cost** | **$4.82** | **$4.93** |
| **Q×F** | **10.2** | **13.0** |
| **IS Score** | **80/100** | **60/100** |
| **Push/PR** | **YES (PR #10)** | **YES (PR #8)** |

### Carry-Forward Findings

| # | Finding | Priority | Source |
|---|---------|----------|--------|
| TAZE-RUN2-1 | CDQ-006: pnpmWorkspaces.ts guard removed (regression from reference implementation) | Low | run-15 |
| TAZE-RUN2-2 | CDQ-006: interactive.ts new violation (flatDeps.flatMap.filter without guard) | Low | run-15 |
| TAZE-RUN2-3 | SCH-003: `taze.io.catalogs_found` auto-generated as `string` not `int` | Low | run-15 |
| TAZE-RUN2-4 | resolves.ts oscillation: 6 functions × 2 NDS-001 attempts, unknown tsc error | Medium | run-15 |
| TAZE-RUN2-5 | yarnWorkspaces.ts: `/\./ g` regex syntax error on all 3 attempts | Low | run-15 |
| TAZE-RUN2-7 | Oscillation classified as "correct skip" in run summary — telemetry gap | Medium | run-15 |
| TAZE-RUN1-6 | IS SPA-001: 37 INTERNAL spans > 30 threshold — structural (design discussion) | Info | run-13 |

---

## Solution Overview

Same four-phase structure as run-15:

1. **Pre-run verification** — Confirm spiny-orb #752 and #989 are on the SHA used; check if #954/#958 resolved; validate taze fork state
2. **Evaluation run** — Execute `spiny-orb instrument` on taze with current spiny-orb build
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including both user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #147

### Eval Branch Convention

The eval execution branch (`feature/prd-146-taze-evaluation-run-16`) **never merges to main**. The PR to main is docs-only (landing this PRD file); after that PR merges, the branch continues as the eval execution branch. Eval artifacts are copied to main separately via `git checkout` in step 13. When `/prd-done` runs at completion, close issue #146 without merging or deleting the eval branch.

### Key Inputs

- **Run-15 actionable fix output**: `evaluation/taze/run-15/actionable-fix-output.md`
- **Run-15 lessons for run-16**: `evaluation/taze/run-15/lessons-for-run16.md`
- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`
- **Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## Success Criteria

1. Pre-run verification confirms spiny-orb SHA `8a08f5b` (or newer) includes #752 and #989 fixes
2. `resolves.ts` oscillation root cause is identified: either (a) debug dump + manual tsc run produces the actual error message, or (b) #954/#958 are resolved and 6 spans committed
3. CDQ-006 violation count documented — improvement from run-15's 5, or same with updated root cause
4. SCH-003 status documented — recurrence or resolution
5. Quality score ≥ 27/29 (at minimum, no regression from run-15)
6. Push/PR succeeds
7. IS score ≥ 80/100 (no regression)
8. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
9. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [x] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) Type D structure and full step sequence including step 9.6 (correlated signals check); (b) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (c) eval branch convention (never merges to main); (d) step 13 (copy artifacts to main before closing); (e) step 9.5 (capture trace artifact after IS scoring — taze is non-organic).
  2. `prds/done/130-taze-evaluation-run-15.md` — the immediately prior taze run PRD. Note: taze is non-organic (trace artifact created during IS scoring step 9.5, NOT during pre-run verification).
  3. `evaluation/taze/run-15/actionable-fix-output.md` — prior run findings. TAZE-RUN2-4 (resolves.ts oscillation) is the primary goal for this run.
  4. `evaluation/taze/run-15/lessons-for-run16.md` — process notes specific to taze including the correct IS scoring invocation (`taze major` mode, not `taze check`).
  **Do not mark this complete until you have read all four documents.**

- [x] **Step 0.5 — Cross-run process review** *(user-facing checkpoint — template changes require user approval)*. Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. In brief: (1) find the most recently completed taze run (run-15, `evaluation/taze/run-15/actionable-fix-output.md`); (2) check all other `evaluation/` subdirectories for a more recently completed cross-target run — compare using the `captured:` field in `trace-artifact.md` or the file modification time of `actionable-fix-output.md`; (3) if a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; (4) compare against the template structure in this PRD; (5) present the structured three-section checkpoint report; (6) after user approves, make approved template edits. Do NOT make any edits without explicit user approval.

- [x] **Collect skeleton documents** — Create `evaluation/taze/run-16/` directory with `lessons-for-run17.md` and `spiny-orb-findings.md` skeleton files. Also create `evaluation/taze/run-16/debug-dumps/` directory — required before providing the instrument command. Must run before pre-run verification.

- [x] **Pre-run verification** — Confirm prerequisites and validate taze fork state:

  1. **Datadog MCP health check**: Before any other setup work, run a sanity check: `search_datadog_spans` with `service:taze` for the last 1 hour. If it fails with an unexpected error (not just "no results"), re-run `/ddsetup` and `/reload-plugins` before proceeding. Catching plugin configuration issues here avoids a ~30 min interruption mid-setup.
  2. **Spiny-orb build** (P1): Confirm current spiny-orb SHA includes both #752 and #989. Check: `cd ~/Documents/Repositories/spinybacked-orbweaver && git log --oneline -5`. Expected: SHA `8a08f5b` or newer. Run `npm run build` to produce current binaries.
  3. **#954 resolved?** (P1 — determines run-16 goal): Check whether spiny-orb issue #954 (resolves.ts oscillation root cause investigation) is closed. If closed: check #958 (the fix). If #958 is also closed, run-16 verifies the fix. If #954 is still open, run-16's primary goal is to capture the debug dump that enables diagnosis.
  4. **#958 resolved?**: Check whether spiny-orb issue #958 (resolves.ts oscillation fix) is closed. Update the primary run-16 goal accordingly.
  5. **Schema type state** (TAZE-RUN2-3): Per Decision Log (2026-06-21), `taze.io.catalogs_found` is intentionally absent from taze fork main — do not pre-seed `type: int`. The attribute was only written to the run-15 instrument branch (never merged); leaving it absent tests whether the agent independently infers the correct type for count attributes on a second encounter. Confirm `semconv/agent-extensions.yaml` in `~/Documents/Repositories/taze` does NOT contain `taze.io.catalogs_found`.
  6. **provenanceDowngraded skip on taze fork main**: Confirm `it.skip(...)` for provenanceDowngraded test is still in place in `test/resolves.test.ts` (commit `6a25b4d`). Required for `pnpm test` to pass.
  7. **Target repo readiness**: Verify taze fork on `main`, clean working tree, `spiny-orb.yaml` present with `language: typescript` and `testCommand: pnpm test`, `pnpm test` passes with the skip in place.
  8. **Push auth**: Dry-run push to verify `GITHUB_TOKEN_TAZE` still works:
      ```bash
      vals exec -i -f .vals.yaml -- bash -c 'git -C ~/Documents/Repositories/taze push --dry-run https://x-access-token:$GITHUB_TOKEN_TAZE@github.com/wiggitywhitney/taze.git HEAD:refs/heads/spiny-orb/auth-test'
      ```
  9. **File inventory**: Count `.ts` files in `~/Documents/Repositories/taze/src/` — should be 33.
  10. **Record environment**: Append spiny-orb SHA, Node version, and pnpm version to `evaluation/taze/run-16/lessons-for-run17.md`.

- [x] **Evaluation run-16** — Whitney runs `spiny-orb instrument` in her terminal. The `debug-dumps/` directory must exist before running (created in skeleton step above).

  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-16/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-16/spiny-orb-output.log'
  ```

  After the run: save artifacts, commit with `git add -f` for the `.log` file, push the eval branch to origin immediately. Create PR to taze fork (`gh pr create --repo wiggitywhitney/taze`). Update PR title after rubric and IS scoring complete: `eval(prd-146): taze run-16 — <quality>/29 quality, Q×F <score>, IS <score>/100`.

  **If auto PR creation fails**: use `~/Documents/Repositories/taze/spiny-orb-pr-summary.md` with `--body-file`.

  **resolves.ts debug dump watch**: After the run, immediately check `evaluation/taze/run-16/debug-dumps/` for a `resolves.ts` debug dump. If present: run `tsc --noEmit` on that file from the taze fork root to capture the actual error. Document the error in `spiny-orb-findings.md`. This is the key diagnostic data for #954.

- [x] **Findings Discussion** *(user-facing checkpoint 1 — raw signal before analysis)* — Present raw findings from the log: committed files, failed files, pre-scan skips, cost, resolves.ts outcome (debug dump captured? oscillation or fix?), CDQ-006 guard status. Do not interpret yet. Wait for Whitney's response before proceeding to failure deep-dives.

- [x] **Failure deep-dives** — For each failed file (0 committed spans), partially committed file, and committed file requiring ≥ 3 attempts with a quality failure: analyze debug dumps, verbose log, thinking blocks, companion `.instrumentation.md` files. Follow the diagnostic protocol from `docs/language-extension-plan.md` (all 5 dimensions). For `resolves.ts`: if a debug dump exists, run `tsc --noEmit` manually and capture the full error output. Document in `evaluation/taze/run-16/spiny-orb-findings.md`.

- [x] **Per-file evaluation** *(complete IS scoring and step 9.5 trace capture first — taze is non-organic; trace artifact does not exist until after IS scoring)* — Evaluate each committed file against the rubric.

  **Updated per Decision 4 (2026-06-21): use parallel subagent evaluation — 5 files at a time, one subagent per file.** Single-pass single-context evaluation misses findings that per-file subagents catch. Do NOT write the evaluation as a single sequential document. For spawning mechanics, follow the D-2 protocol in `docs/language-extension-plan.md` step 6.

  **Updated per Decision 7 (2026-06-21): spawn up to 5 agents per batch — no more than 5.** Each batch of 5 generates enough output to exhaust the context window. Required sequence per batch: spawn 5 agents → collect results → append results to `per-file-evaluation.md` → `/prd-update-progress` → `/clear` → spawn next 5. With 13 committed files: batch 1 = files 1–5, batch 2 = files 6–10, batch 3 = files 11–13. `per-file-evaluation.md` is written incrementally across batches — do not wait for all 13 before writing.

  **Output format**: Follow the per-file format from `prds/done/130-taze-evaluation-run-15.md` exactly — one section per committed file, rule table per span, failures summary table at the end.

  **Entry point — read these produced artifacts before starting**:
  - `evaluation/taze/run-16/spiny-orb-findings.md` — failure deep-dives are already documented here (CDQ-006 table, config.ts/resolves.ts corrections, interactive.ts 3-attempt analysis, packageJson.ts new attribute, SCH-003 status). Start here rather than re-deriving from the log.
  - `evaluation/taze/run-16/spiny-orb-output.log` — full run output. Contains `Agent thinking` blocks (per-attempt reasoning) and `Agent notes` (structured instrumentation rationale) for ALL 13 committed files. This is the primary evidence source for agent decision-making. Each file's section is bounded by `Processing file N of 33: src/path/to/file.ts` at the start and the next `Processing file` line at the end. To extract a specific file's section, search for the filename in the log and read forward to the next `Processing file` line.
  - `evaluation/taze/run-16/lessons-for-run17.md` — process observations including "0 attributes = 0 NEW attributes" clarification and artifact-checking protocol.
  - Companion `.instrumentation.md` files on the instrument branch (`spiny-orb/instrument-1782059121456`) — written for every file including skips. Explain what was instrumented and why in structured form.

  **Per-subagent evidence set**: each subagent must read — (1) the instrumented `.ts` file from the instrument branch; (2) the `Agent thinking` and `Agent notes` blocks from `spiny-orb-output.log` for that file (extracted by filename as described above); (3) the companion `.instrumentation.md` for that file on the instrument branch; (4) the run-15 baseline entry for that file from `prds/done/130-taze-evaluation-run-15.md`; (5) the evaluation rubric at `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`.

  **Note on debug-dumps**: `--debug-dump-dir` only fires for failed, partial, and zero-span files — NOT for clean successes. Run-16 had 0 failures, so `evaluation/taze/run-16/debug-dumps/` is empty. The thinking blocks in `spiny-orb-output.log` are the agent reasoning evidence for all files.

  **Step 0 — Trace supplement**: complete IS scoring (step 9) and trace capture (step 9.5) before returning here for trace supplement on each file. Use `search_datadog_spans` with the artifact query to supplement static code review. For each committed file, record attribute count vs. run-15 baseline. If the baseline is 0 (file was not committed or failed in run-15), flag any non-zero count explicitly; otherwise, flag any file where count changed by ≥50% in either direction. This is the primary signal for attribute selection guidance regressions (e.g., CDQ-006 guard removal leading to zero attributes on formerly-instrumented spans).

- [x] **PR artifact evaluation** — Evaluate the instrument branch PR: diff completeness, span registration accuracy, schema accuracy in `agent-extensions.yaml`, `traceloop-init.ts` registration block.

- [x] **Rubric scoring** — Score all dimensions against the rubric. Compare to run-15 baseline. resolves.ts outcome (fixed vs. still oscillating) is the primary data point.

- [x] **IS scoring run** — See `evaluation/is/README.md` for collector setup.

  IS scoring invocation for taze (from `evaluation/taze/run-15/lessons-for-run16.md`):
  ```bash
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/taze.mjs major
  ```
  Run from `~/Documents/Repositories/taze` on the instrument branch. OTel SDK packages are already in node_modules on the instrument branch — no `npm install` needed. OTel Collector must be running on port 4318 (Docker or binary). See `~/.claude/rules/is-scoring-gotchas.md` for full sequence.

  Then score:
  ```bash
  node evaluation/is/score-is.js evaluation/is/eval-traces.json --target taze > evaluation/taze/run-16/is-score.md
  ```

  **SPA-001 note**: taze is a CLI app. If SPA-001 fires, this is structural — taze had 37 INTERNAL spans in run-15. Document but do not treat as a regression.

- [x] **Capture trace artifact (step 9.5)** — Immediately after IS scoring completes, use the `search_datadog_spans` Datadog MCP tool with query `service:taze from:now-30m`. Retrieve `service.instance.id` from any span. Write `evaluation/taze/run-16/trace-artifact.md` (five fields: service.instance.id, captured, target, instrument_branch, query) using the format in `evaluation/trace-capture-protocol.md`. If no spans appear, wait up to 5 minutes and retry once.

- [x] **Correlated signals check (step 9.6)** — Use the `service.instance.id` from `trace-artifact.md` as the correlation handle:
  - **Traces**: `search_datadog_spans` with `service:taze @service.instance.id:<uuid>` — confirm spans appear.
  - **Logs**: `search_datadog_logs` with `service:taze @otel_resource_attributes.service.instance.id:<uuid>` — confirm log records carry `trace_id` and `span_id` fields.
  - **Metrics**: `search_datadog_metrics` for `traces.span.metrics.calls` and `traces.span.metrics.duration` filtered to `service:taze`.
  Note any gaps in `run-summary.md` — do not block the eval run on signals gaps.

- [x] **Baseline comparison** — Compare run-16 results to run-15 across all dimensions. Calculate Q×F. Update root README: add a run-16 row to the taze run history table; update the "Run-17 is next" note with primary goals.

- [x] **Actionable fix output** *(user-facing checkpoint 2 — interpreted summary + handoff pause)* — Write `evaluation/taze/run-16/actionable-fix-output.md` with the full structured format: what happened, resolves.ts outcome (oscillation diagnosed/fixed/still unknown), CDQ-006 status, SCH-003 status, IS score, new findings, updated carry-forward table. When complete, print the absolute path: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-16/actionable-fix-output.md`. Pause until Whitney confirms she has handed the document to the spiny-orb team. Do not proceed to the next PRD until confirmed.

- [ ] **Draft next PRD** *(includes template-update checkpoint before drafting)* — Follow `docs/language-extension-plan.md` step 12: (1) review `lessons-for-run17.md` and `actionable-fix-output.md` for process observations; (2) present two-section checkpoint to user (target-specific vs. generalizable); (3) after approval, commit any template changes as a separate commit; (4) draft the next taze run PRD using this PRD as the style reference; (5) run `/write-prompt` before committing.

  **Steps 1–3 complete** (committed separately): three process improvements added to `docs/language-extension-plan.md` step 11 and cascaded to: `evaluation/taze/run-16/lessons-for-run17.md`, `.claude/CLAUDE.md`, PRD #144 (commit-story-v2 run-26), PRD #100 (release-it run-5). Step 12.3 also updated: "Do NOT propagate" changed to cascade requirement.

  **Remaining: draft PRD #147.** Key inputs for the draft:
  - Run-17 primary goals: `evaluation/taze/run-16/actionable-fix-output.md` §"Run-17 Priority Goals" (COV-005 packument.ts, SCH-003 String() cast pattern, CDQ-006 bunWorkspaces.ts, resolves.ts stability, IS SPA-002 watch)
  - Run-16 scores (baseline): 26/29 (90%) quality, Q×F 11.7, IS 88.9/100, 13 committed files
  - Style reference: this PRD (`prds/146-taze-evaluation-run-16.md`)
  - `git add -f prds/147-taze-evaluation-run-17.md` required (global .gitignore blocks prds/)

  **Updated per Decisions 4, 5, and 6 (2026-06-21)**: The template changes in step 3 must include updating `docs/language-extension-plan.md` to codify: (a) per-file evaluation uses the parallel subagent approach — one subagent per file, 5 in parallel; (b) each subagent's required evidence set includes the `Agent thinking` and `Agent notes` blocks from `spiny-orb-output.log` for that file, plus the companion `.instrumentation.md` from the instrument branch; (c) `--debug-dump-dir` only fires for failures/partials/zero-span — when all files succeed, the debug-dumps directory is empty and the log is the sole source of agent reasoning. These are now required process elements, not optional enhancements.

- [ ] **Copy artifacts to main** — Switch to main, pull, then run:
  ```bash
  git checkout feature/prd-146-taze-evaluation-run-16 -- evaluation/taze/run-16/
  ```
  Commit to main with message `eval: save taze run-16 artifacts to main [skip ci]`. The run-16 row in `evaluation/taze/run-log.md` and the taze run history section in `README.md` were added on the eval branch — verify they are present after the checkout and do NOT duplicate them. Push to origin/main. Then return to the eval branch and run `/prd-done`.

---

## Score Projections

### Conservative (resolves.ts oscillation recurs, no CDQ-006 prompt fix)

- **Quality**: 27/29 (93%) — CDQ-006 and SCH-003 likely to recur; yarnWorkspaces.ts may still fail
- **Files**: 10–11 (resolves.ts still oscillates)
- **IS Score**: 80/100 (stable)
- **Q×F**: ~9–10

### Target (#954/#958 resolved, resolves.ts fixed; CDQ-006 prompt fix applied)

- **Quality**: 29/29 (100%)
- **Files**: 17 (resolves.ts recovered + yarnWorkspaces.ts recovered)
- **IS Score**: 80/100
- **Q×F**: ~17.0

### Diagnostic (resolves.ts debug dump captured, root cause identified, fix not yet applied)

- **Quality**: 27/29 (93%) — same as run-15
- **Files**: 11–12
- **IS Score**: 80/100
- **Q×F**: ~10–11
- **Key outcome**: `evaluation/taze/run-16/debug-dumps/resolves.ts` + tsc error captured → #954 can now be fixed before run-17

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| resolves.ts oscillation recurs AND no debug dump written | #989 merged — debug dumps now cover success-with-0-spans; if still absent, check spiny-orb SHA and #989 merge commit |
| #954 diagnosis reveals a TypeScript-specific root cause outside spiny-orb's prompt | Document in findings; may require taze-specific schema or code changes |
| GITHUB_TOKEN_TAZE expired | Pre-run step 8 dry-run catches this. Regenerate per `~/.claude/rules/eval-github-pat.md`. |
| IS Docker blocked | Use otelcol-contrib binary (arm64). See `evaluation/is/README.md`. |
| CDQ-006 violations increase | Run-15 had 5 violations; prompt fix may not be in this spiny-orb build. Document count; compare to run-15. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-21 | Primary goal: resolves.ts oscillation investigation (not CDQ-006 prompt fix) | #752 and #989 just merged, making debug capture possible for the first time. resolves.ts recovering 6 functions raises Q×F from ~10 to ~17 — the highest-impact single action available. CDQ-006 prompt fix is secondary and depends on spiny-orb team. |
| 2026-06-21 | Use `--thinking` (not `--thinking-fail`) for full visibility | Companion `.instrumentation.md` files now always written regardless. Full thinking output is valuable for understanding oscillation patterns on any file, not just failed ones. |
| 2026-06-21 | Leave `taze.io.catalogs_found` absent from main (do not pre-seed `type: int`) | The attribute was only written to the run-15 instrument branch, which never merged. Pre-seeding `type: int` on main would prevent SCH-003 from appearing but mask whether the agent independently infers the correct type for count attributes. Run-16 tests genuine type inference on second encounter. If SCH-003 recurs, two data points confirm a systematic issue. Do not apply a pre-run fix for this attribute in future runs unless the spiny-orb team ships a prompt fix for count-attribute type inference. |
| 2026-06-21 | Per-file evaluation must use the parallel subagent approach: one subagent per file, 5 files in parallel (Decision 4) | Validated in run-17: 16 parallel agents found gaps that 8+ sequential runs missed (~$10-12 token cost). Single-pass single-context evaluation produces plausible-but-shallower analysis. Per-agent evaluation is now the required standard; do not write per-file-evaluation.md as a single sequential document. |
| 2026-06-21 | `spiny-orb-output.log` (not debug-dumps) is the primary evidence source for agent reasoning; debug-dumps are empty when all files succeed (Decision 5) | `--debug-dump-dir` fires only for failed, partial, and zero-span files per the spiny-orb README. Run-16 had 0 failures, so debug-dumps/ is empty. The `--thinking` flag writes `Agent thinking` blocks to the terminal output (captured in the log) for ALL files. Each subagent in the per-file evaluation must read the relevant file's thinking and notes sections from the log. Additionally, companion `.instrumentation.md` files on the instrument branch (PR #752) provide structured instrumentation rationale for all files including skips. |
| 2026-06-21 | Redo per-file-evaluation.md using the parallel subagent approach and full evidence set (Decision 6) | The per-file-evaluation.md written mid-session used single-pass analysis without reading Agent thinking blocks, Agent notes, or companion .instrumentation.md files. It must be replaced with a subagent-parallel evaluation. Update `docs/language-extension-plan.md` to codify the parallel approach and the log as a required evidence source for all future eval runs. |
| 2026-06-21 | Per-file evaluation agents: spawn 5 at a time max, write results to disk after each batch (Decision 7) | Each batch of 5 subagents generates enough output to exhaust the context window. Launching more than 5 in one message causes context overflow and agent rejections. Required sequence: spawn 5 agents → collect results → write to per-file-evaluation.md → /prd-update-progress → /clear → spawn next 5. With 13 committed files this means 3 batches (5 + 5 + 3). Do not launch more than 5 agents in a single message. |
