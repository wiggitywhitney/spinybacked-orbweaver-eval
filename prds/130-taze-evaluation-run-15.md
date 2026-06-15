# PRD #130: TS Evaluation Run-15: taze — CDQ-006, SCH-003, and IS RES-001 Verification (Post-Bug-Fix)

**Status:** Ready
**Created:** 2026-06-15
**GitHub Issue:** [#130](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/130)
**Depends on:** PRD #82 (run-14 aborted, actionable fix output delivered, four spiny-orb bugs filed: #933–#936)

---

## Problem Statement

Run-14 aborted after 5/33 files due to two interacting spiny-orb bugs:

1. **#933 — CDQ-006 isRecording guard generated without block body**: The CDQ-006 fix from #728 (PR #749) generates `if (span.isRecording())` guards, but in at least one case the guard lacked a block body, causing a ts-morph child-count mismatch crash.
2. **#934 — `stoppedByCheckpoint` fires even when baseline is already known failing**: After the crash on file 4, the run stopped at the first checkpoint test failure rather than continuing with rollback disabled.

Two additional UX issues were filed: **#935** (pre-run test gate — run tests before cost ceiling prompt, exit on pre-existing failures) and **#936** (dep-graph cycle noise — suppress `[dep-graph] cycle detected:` messages behind `--verbose`).

Run-14 produced no usable evaluation data. The schema type fix (TAZE-RUN1-1), IS RES-001 service.instance.id fix (TAZE-RUN1-5), and the provenanceDowngraded skip (commit `6a25b4d`) were all applied to taze fork main during pre-run-14, but none were verified by the aborted run.

### Primary Goals

1. **CDQ-006** (post-#933 fix): Verify violations drop from run-13's 8 instances across 5 files to 0 — this is the primary question #728 was meant to answer
2. **SCH-003** (applied in pre-run-14, unverified): Confirm the schema type fix resolves the 3 type mismatches from run-13
3. **IS RES-001** (applied in pre-run-14, unverified): Confirm `service.instance.id` addition brings IS score above run-13 baseline (60/100)

**Target repo**: wiggitywhitney/taze (fork of antfu-collective/taze, `~/Documents/Repositories/taze`)

### Secondary Goals

- Confirm `provenanceDowngraded` skip (commit `6a25b4d`) is still in place on taze fork main
- Advisory contradiction rate: measure against run-13's ~78% (gated on 2+ completed TS runs — run-14 was aborted so run-15 is the second)
- IS SPA-001: 164 INTERNAL spans from run-13 — structural not a regression (see step 9.5 note)
- Confirm `checkSyntax()` moduleResolution fix remains active (NodeNext for taze)

### Run-13 Scores (baseline — run-14 aborted and invalid)

| Dimension | Run-13 |
|-----------|--------|
| NDS | 4/4 (100%) |
| COV | 6/6 (100%) |
| RST | 5/5 (100%) |
| API | 3/3 (100%) |
| SCH | 3/4 (75%) |
| CDQ | 6/7 (86%) |
| **Overall quality** | **27/29 (93%)** |
| **Gates** | **2/2 (100%)** |
| **Files committed** | **14** |
| **Correct skips** | **19** |
| **Cost** | **$4.93** |
| **Q×F** | **13.0** |
| **IS Score** | **60/100** |
| **Push/PR** | **YES (#8)** |

### Carry-Forward Findings

| # | Finding | Priority | Source |
|---|---------|----------|--------|
| TAZE-RUN1-1 | SCH-003 schema type fix — applied in pre-run-14, unverified | Low | run-13 |
| TAZE-RUN1-2 | CDQ-006 isRecording guard — #728 landed, #933 blocks verification | Low | run-13 |
| TAZE-RUN1-3 | Advisory contradiction rate ~78% | Low | run-13 (gated 2+ completed runs) |
| TAZE-RUN1-5 | IS RES-001 service.instance.id — applied in pre-run-14, unverified | Low | run-13 |
| TAZE-RUN1-6 | IS SPA-001 164 INTERNAL spans — structural, not a regression | Low | run-13 (gated 2+ completed runs) |

---

## Solution Overview

Same four-phase structure as run-13:

1. **Pre-run verification** — Confirm all four run-14 bugs (#933–#936) are merged; validate taze fork state
2. **Evaluation run** — Execute `spiny-orb instrument` on taze
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including two user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #129

### Eval Branch Convention

The eval execution branch (`feature/prd-83-taze-evaluation-run-15`) **never merges to main**. The PR to main is docs-only (landing this PRD file); after that PR merges, the branch continues as the eval execution branch. Eval artifacts are copied to main separately via `git checkout` in step 13. When `/prd-done` runs at completion, close issue #130 without merging or deleting the eval branch.

### Key Inputs

- **Run-14 actionable fix output**: `evaluation/taze/run-14/actionable-fix-output.md`
- **Run-14 lessons**: `evaluation/taze/run-14/lessons-for-run15.md`
- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`
- **Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## Success Criteria

1. Pre-run verification confirms spiny-orb #933, #934, #935 are all merged (or documents current status if not)
2. CDQ-006 violations drop from run-13's 8 instances to 0 (if #933 fix is confirmed correct) — or same pattern documented with updated root cause
3. SCH-003 does not recur (schema type fix confirmed active)
4. Quality score ≥ 27/29 (at minimum, no regression from run-13)
5. Push/PR succeeds
6. IS score > 60/100 (RES-001 fix verified)
7. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
8. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) Type D structure and step sequence; (b) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (c) eval branch convention (never merges to main); (d) step 13 (copy artifacts to main before closing); (e) step 9.5 (SPA-001 calibration note for CLI apps — taze had 164 INTERNAL spans in run-13; treat this as structural, not a regression).
  2. `prds/82-taze-evaluation-run-14.md` — the immediately prior taze run PRD. **Taze is non-organic** (unlike commit-story-v2): the trace artifact is created during IS scoring (step 9.5), NOT during pre-run verification. The IS scoring milestone and per-file trace supplement timing differ accordingly.
  3. `evaluation/taze/run-14/actionable-fix-output.md` — prior run findings. The carry-forward items (CDQ-006 after #933, SCH-003, IS RES-001) are the primary goals for this run.
  **Do not mark this complete until you have read all three documents.**

- [ ] **Step 0.5 — Cross-run process review** *(user-facing checkpoint — template changes require user approval)*. Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. In brief: (1) find the most recently completed taze run (completion signal: `actionable-fix-output.md` present in `evaluation/taze/run-N/` — note run-14 was aborted so run-13 is the most recent completed taze run); (2) check all other `evaluation/` subdirectories for a more recently completed cross-target run — compare using the `captured:` field in `trace-artifact.md` if it exists, or the file modification time of `actionable-fix-output.md` as a proxy; (3) if a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; (4) compare findings against the template's milestone structure as instantiated in this PRD; (5) present the structured three-section checkpoint report to the user; (6) after user approves, make approved template edits. Do NOT make any edits without explicit user approval. If no cross-target run is more recent, note this and proceed.

- [ ] **Collect skeleton documents** — Create `evaluation/taze/run-15/` directory with `lessons-for-run16.md` and `spiny-orb-findings.md` skeleton files. Must run before pre-run verification.

- [ ] **Pre-run verification** — Confirm all four run-14 blockers are resolved and validate prerequisites:

  1. **#933 merged** (P1 — critical blocker for run-15): Confirm spiny-orb issue #933 (CDQ-006 guard template produces block bodies in all cases) is merged to spiny-orb main. Check the current spiny-orb SHA and verify the fix is present. If #933 is not merged, stop and document — run-15 will produce the same crash.
  2. **#934 merged** (P1 — critical blocker): Confirm spiny-orb issue #934 (`stoppedByCheckpoint` fires even when baseline is already failing) is resolved. If not merged, document expected behavior: run will likely stop early again on the first checkpoint failure after a crash.
  3. **#935 merged or confirmed design decision** (P2 — blocker for clean run): Confirm spiny-orb issue #935 (pre-run test gate — run tests before cost ceiling prompt, exit on pre-existing failures) is resolved. If not merged, the provenanceDowngraded failure will be detected mid-run rather than at startup; note this but proceed.
  4. **#936 merged** (P3 — UX only): Confirm spiny-orb issue #936 (dep-graph cycle noise) is merged. If not, dep-graph lines will appear before the cost ceiling prompt; note but proceed.
  5. **Schema type fix on taze fork main** (TAZE-RUN1-1): Confirm `semconv/agent-extensions.yaml` in `~/Documents/Repositories/taze` still has the corrected types: `taze.config.sources_found → type: int`, `taze.cache.hit → type: boolean`, `taze.cache.changed → type: boolean`. Applied in pre-run-14 (commit on taze fork main).
  6. **IS RES-001 fix on taze fork main** (TAZE-RUN1-5): Confirm `examples/instrumentation.js` still has `service.instance.id: randomUUID()` with `randomUUID` imported from `node:crypto`. Applied in pre-run-14 (commit `f16b763`).
  7. **provenanceDowngraded skip on taze fork main**: Confirm the `it.skip(...)` block for the provenanceDowngraded test is still in place in `test/resolves.test.ts` (commit `6a25b4d`). This is required for `pnpm test` to pass and for spiny-orb #935 to not abort the run immediately.
  8. **checkSyntax() moduleResolution gate**: Confirm spiny-orb's per-file tsc check reads the project's `tsconfig.json` moduleResolution (NodeNext for taze). If regressed, NDS-001 will fire on every file.
  9. **Target repo readiness**: Verify taze fork on `main`, clean working tree, `spiny-orb.yaml` present, `pnpm test` passes with the skip in place.
  10. **Push auth**: Dry-run push to verify `GITHUB_TOKEN_TAZE` still works:
      ```bash
      vals exec -i -f .vals.yaml -- bash -c 'git -C ~/Documents/Repositories/taze push --dry-run https://x-access-token:$GITHUB_TOKEN_TAZE@github.com/wiggitywhitney/taze.git HEAD:refs/heads/spiny-orb/auth-test'
      ```
  11. **File inventory**: Count `.ts` files in `~/Documents/Repositories/taze/src/` — should be 33.
  12. **Rebuild spiny-orb**: `cd ~/Documents/Repositories/spinybacked-orbweaver && npm run build`
  13. **Record environment**: Append spiny-orb SHA, Node version, and pnpm version to `evaluation/taze/run-15/lessons-for-run16.md`. **This SHA is critical for bug verification** — the four #933–#936 fixes must all be in this SHA.

- [ ] **Evaluation run-15** — Whitney runs `spiny-orb instrument` in her terminal. Create `evaluation/taze/run-15/debug-dumps/` before providing the command.

  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-15/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/taze/run-15/spiny-orb-output.log'
  ```

  After the run: save artifacts, commit with `git add -f` for the `.log` file, push the eval branch to origin immediately. Create PR to taze fork (`gh pr create --repo wiggitywhitney/taze`). Update PR title after rubric and IS scoring complete: `eval(prd-130): taze run-15 — <quality>/29 quality, Q×F <score>, IS <score>/100`.

  **If auto PR creation fails**: use `~/Documents/Repositories/taze/spiny-orb-pr-summary.md` with `--body-file`.

- [ ] **Findings Discussion** *(user-facing checkpoint 1 — raw signal before analysis)* — Present raw findings from the log: committed files, failed files, pre-scan skips, cost, CDQ-006 guard status, any crashes. Do not interpret yet. Wait for Whitney's response before proceeding to failure deep-dives.

- [ ] **Failure deep-dives** — For each failed file (0 committed spans), partially committed file, and committed file requiring ≥ 3 attempts with a quality failure: analyze debug dumps, verbose log, thinking blocks. Follow the diagnostic protocol from `docs/language-extension-plan.md` (all 5 dimensions). Document in `evaluation/taze/run-15/spiny-orb-findings.md`.

- [ ] **Per-file evaluation** *(complete IS scoring and step 9.5 trace capture first — taze is non-organic; trace artifact does not exist until after IS scoring)* — Evaluate each committed file against the rubric. **Step 0 — Trace supplement**: the trace artifact is created in step 9.5 after IS scoring. Complete IS scoring (step 9) and trace capture (step 9.5) before returning here for trace supplement on each file. After trace data is available, use `search_datadog_spans` with the artifact query to supplement static code review. Follow the per-file format from the most recent completed taze run PRD.

- [ ] **PR artifact evaluation** — Evaluate the instrument branch PR: diff completeness, span registration accuracy, schema accuracy in `agent-extensions.yaml`, `traceloop-init.ts` registration block.

- [ ] **Rubric scoring** — Score all dimensions against the rubric. Compare to run-13 baseline. CDQ-006 result (pass or fail) is the primary data point for this run.

- [ ] **IS scoring run** — See `evaluation/is/README.md` for collector setup. Run IS scoring:
  ```bash
  node evaluation/is/score-is.js evaluation/is/eval-traces.json > evaluation/taze/run-15/is-score.md
  ```
  **SPA-001 note**: taze is a CLI app. If SPA-001 fires (span count > 10 INTERNAL spans), this is structural — taze had 164 INTERNAL spans in run-13. Document but do not treat as a regression.
  **RES-001 note**: If the `service.instance.id` fix (applied in pre-run-14) is working, RES-001 should pass for the first time. This is one of the primary verification goals.

- [ ] **Capture trace artifact (step 9.5)** — Immediately after IS scoring completes, use the `search_datadog_spans` Datadog MCP tool with query `service:taze from:now-30m`. Retrieve `service.instance.id` from any span. Write `evaluation/taze/run-15/trace-artifact.md` (five fields: service.instance.id, captured, target, instrument_branch, query) using the format in `evaluation/trace-capture-protocol.md`. If no spans appear, wait up to 5 minutes and retry once.

- [ ] **Baseline comparison** — Compare run-15 results to run-13 across all dimensions. Note: run-14 was aborted and has no valid scores. Calculate Q×F. Update root README: add a run-15 row to the taze run history table; update the "Run-16 is next" note with primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2 — interpreted summary + handoff pause)* — Write `evaluation/taze/run-15/actionable-fix-output.md` with the full structured format: what happened, CDQ-006 status (pass/fail/partial), SCH-003 status, IS score status, new findings, updated carry-forward table. Pause for Whitney to review before handing off to the spiny-orb team. Print the absolute path when done.

- [ ] **Draft next PRD** *(includes template-update checkpoint before drafting)* — Follow `docs/language-extension-plan.md` step 12: (1) review `lessons-for-run16.md` and `actionable-fix-output.md` for process observations; (2) present two-section checkpoint to user (target-specific vs. generalizable); (3) after approval, commit any template changes as a separate commit; (4) draft the next taze run PRD using this PRD as the style reference; (5) run `/write-prompt` before committing.

- [ ] **Copy artifacts to main** — Switch to main, pull, then run:
  ```bash
  git checkout feature/prd-83-taze-evaluation-run-15 -- evaluation/taze/run-15/
  ```
  Commit to main with message `eval: save taze run-15 artifacts to main [skip ci]`. Update `evaluation/taze/run-log.md` with a run-15 row. Push to origin/main. Then return to the eval branch and run `/prd-done`.

---

## Score Projections

### Conservative (bugs fixed but CDQ-006 still fails for another reason)

- **Quality**: 27/29 (93%) — SCH-003 resolved, CDQ-006 still fails
- **Files**: 14
- **Cost**: ~$4.50–5.50
- **IS Score**: ~67 (RES-001 resolved)

### Target (all three primary goals verified)

- **Quality**: 29/29 (100%) — CDQ-006 violations zero, SCH-003 resolved
- **Files**: 14
- **Cost**: ~$4.50
- **IS Score**: ~70+ (RES-001 resolved)
- **Q×F**: ~14.0

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| spiny-orb #933 not yet merged | Pre-run step 1 checks. If not merged, CDQ-006 crash will likely recur. Stop and wait for fix. |
| spiny-orb #934 not yet merged | Pre-run step 2 checks. If not merged, run may terminate early on checkpoint failure. Document. |
| #933 fix incomplete — new crash variant | Debug dumps will show the failure. File as #933 follow-up. |
| provenanceDowngraded skip missing from taze fork | Pre-run step 7 confirms. Re-apply commit `6a25b4d` if missing. |
| GITHUB_TOKEN_TAZE expired | Pre-run step 10 dry-run catches this. Regenerate per `~/.claude/rules/eval-github-pat.md`. |
| IS Docker blocked | Use otelcol-contrib binary (arm64). See `evaluation/is/README.md`. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-15 | Name this run "run-15" (not "run-14 re-run") | Run-14 was aborted and produced no valid evaluation data. A clean re-run with a confirmed post-fix spiny-orb SHA deserves its own run number. |
| 2026-06-15 | Skip Findings Discussion and handoff checkpoint 2 for run-14 | Both user-facing checkpoints are omitted from the abbreviated PRD #82 close-out; they carry forward to this PRD as normal full-run checkpoints. |
| 2026-06-15 | Template checkpoint completed during PRD #82 close-out — no changes to `docs/language-extension-plan.md` needed | The proposed addition (pre-run test gate) was confirmed covered by spiny-orb #935 (the tool will abort before instrumentation if baseline tests fail). No eval process template change warranted. |
