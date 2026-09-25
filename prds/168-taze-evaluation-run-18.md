# PRD #168: TS Evaluation Run-18: taze — SCH-003 Generalization + CDQ-007 Path Sanitization

**Status:** Active
**Created:** 2026-09-23
**GitHub Issue:** [#168](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/168)
**Depends on:** PRD #147 (run-17 complete, actionable fix output delivered, spiny-orb team filed #1072/#1073, updated #1008/#1071, closed #1070)

---

## Problem Statement

Run-17 ended at 25/29 (86%) quality and Q×F 11.2 — a regression from run-16's 26/29, entirely attributable to SCH (3/4 → 2/4). Two of three run-16 carry-forward goals resolved (COV-005, CDQ-006), but the third (SCH-003) broadened instead of resolving, and a new, larger regression appeared (CDQ-007). Four items carry forward into run-18:

- **RUN17-1 (SCH-003, broadened)**: The run-16 fix (spiny-orb #1012) targeted the `String(count)` cast pattern in exactly 2 files. Run-17 found it in 5 files, including two **disguised** recurrences where the schema itself was retyped to `string` to match the cast rather than the cast being removed: `checkGlobal.ts` (disguised, `taze.check.packages_loaded`), `check/index.ts` (new, `String(resolvePkgs.length)`), `pnpmWorkspaces.ts` (new, `String(catalogs.length)`), `packageYaml.ts` (new, disguised), `yarnWorkspaces.ts` (new, literal, plus a new SCH-004 near-synonym). The #1012 fix did not generalize the underlying judgment across files performing the same `.length`-derived count operation.
- **RUN17-2 (CDQ-007, new)**: Unsanitized absolute filesystem paths in 6 of 13 committed files (`bunWorkspaces.ts`, `packageJson.ts` write side, `packageYaml.ts`, `packages.ts` 3 of 4 sites, `pnpmWorkspaces.ts`, `yarnWorkspaces.ts`) — the largest new finding by file count. Confirmed by reading source directly: `pathe`'s `resolve()` and `pkg.filepath` carry no structural guarantee of relativity.
- **RUN17-3 (IS SPA-002, confirmed consistent)**: The orphan span in `resolves.ts` recurred in the same async-boundary context-loss shape across run-16 and run-17 (different span IDs). This is now a real spiny-orb fix candidate for context propagation, not run-specific noise.
- **RUN17-4 (resolves.ts schema drift, new watch item)**: The #954/#958 compilation oscillation is genuinely fixed (first-attempt success, two runs running). But 4 of 6 span names and 1 attribute (`taze.package.update_available`) drifted or dropped relative to run-16 despite stable compilation — a new instability, not a reopening of #954/#958.

One item resolved this run and one new low-priority finding, both closed out — not carried forward:

- **COV-005 packument.ts**: Recovered with no tracked spiny-orb fix (no issue existed at pre-run time). Posted to #1070 as required; #1070 is now closed.
- **CDQ-006 bunWorkspaces.ts**: Fully resolved (spiny-orb #1012). No further action.
- **RUN17-5 (SCH-004, new, low priority)**: `taze.io.file_path` duplicates existing `taze.write.file_path` in `yarnWorkspaces.ts`. Watch for recurrence; not a primary goal.
- **IS SPA-005 (new, not a defect)**: 24 short spans vs. limit 20 — investigated and assessed as a threshold/rubric artifact from increased span-volume coverage, not a code or instrumentation defect. Do not chase in the target.

### Primary Goals

1. **SCH-003 count-cast pattern** — verify whether the broader fix generalizes across all 5 affected files (checkGlobal.ts, check/index.ts, pnpmWorkspaces.ts, packageYaml.ts, yarnWorkspaces.ts), including whether the two disguised recurrences (schema retyped to `string`) are corrected back to `int`
2. **CDQ-007 unsanitized filesystem paths** — verify whether path sanitization is applied consistently across the 6 affected files, or whether the regression persists/spreads
3. **IS SPA-002** — verify whether the orphan span is fixed (spiny-orb context-propagation fix landed) or still consistent
4. **resolves.ts schema stability** — verify whether span/attribute naming converges this run or continues drifting; compilation stability itself is not at risk (2 consecutive stable runs)
5. **SCH-004 watch** — check whether `taze.io.file_path`/`taze.write.file_path` near-synonym recurs or was a one-off

### Run-17 Scores (baseline)

| Dimension | Run-17 | Run-16 | Run-15 |
|-----------|--------|--------|--------|
| NDS | 4/4 (100%) | 4/4 (100%) | 4/4 (100%) |
| COV | 6/6 (100%) | 5/6 (83%) | 6/6 (100%) |
| RST | 5/5 (100%) | 5/5 (100%) | 5/5 (100%) |
| API | 3/3 (100%) | 3/3 (100%) | 3/3 (100%) |
| SCH | 2/4 (50%) | 3/4 (75%) | 3/4 (75%) |
| CDQ | 6/7 (86%) | 6/7 (86%) | 6/7 (86%) |
| **Overall quality** | **25/29 (86%)** | **26/29 (90%)** | **27/29 (93%)** |
| **Gates** | **2/2 (100%)** | **2/2 (100%)** | **2/2 (100%)** |
| **Files committed** | **13** | **13** | **11** |
| **Correct skips** | **20** | **20** | **20** |
| **Failed** | **0** | **0** | **1 (yarnWorkspaces.ts)** |
| **Q×F** | **11.2** | **11.7** | **10.2** |
| **IS Score** | **77.8/100** | **88.9/100** | **80/100** |
| **Push/PR** | **YES (PR #13)** | **YES (PR #11)** | **YES (PR #10)** |

### Carry-Forward Findings

| # | Finding | Priority | Source |
|---|---------|----------|--------|
| RUN17-1 | SCH-003: count-cast pattern spanning `checkGlobal.ts`, `check/index.ts`, `pnpmWorkspaces.ts`, `packageYaml.ts`, `yarnWorkspaces.ts` (2 disguised via schema retype) | Medium | run-17 |
| RUN17-2 | CDQ-007: unsanitized absolute filesystem paths in 6 of 13 committed files | Medium | run-17 |
| RUN17-3 | IS SPA-002: orphan span, confirmed consistent across run-16/run-17 — spiny-orb context-propagation fix candidate | Medium | run-16, run-17 |
| RUN17-4 | resolves.ts schema drift: 4 of 6 span names + 1 attribute drifted/dropped vs. run-16 despite stable compilation | Low (watch) | run-17 |
| RUN17-5 | SCH-004: `taze.io.file_path` near-synonym of `taze.write.file_path` in `yarnWorkspaces.ts` | Low (watch) | run-17 |
| TAZE-RUN1-6 | IS SPA-001: INTERNAL span count exceeds threshold — structural (CLI design) | Info | run-13 |
| — | IS SPA-005: 24 short spans vs. limit 20 — threshold artifact from span-volume growth, not a defect | Info (not tracked as a fix target) | run-17 |

---

## Solution Overview

Same four-phase structure as run-17:

1. **Pre-run verification** — Confirm spiny-orb SHA and known issue status; validate taze fork state
2. **Evaluation run** — Execute `spiny-orb instrument` on taze with current spiny-orb build
3. **Structured evaluation** — Per-file evaluation with canonical methodology, including both user-facing checkpoints
4. **Process refinements** — Encode methodology changes, draft PRD #169

### Eval Branch Convention

The eval execution branch (`feature/prd-168-taze-evaluation-run-18`) **never merges to main**. The PR to main is docs-only (landing this PRD file); after that PR merges, the branch continues as the eval execution branch. Eval artifacts are copied to main separately via `git checkout` in the "Copy artifacts to main" milestone. When `/prd-done` runs at completion, close issue #168 without merging or deleting the eval branch.

### Key Inputs

- **Run-17 actionable fix output**: `evaluation/typescript/taze/run-17/actionable-fix-output.md`
- **Run-17 lessons for run-18**: `evaluation/typescript/taze/run-17/lessons-for-run18.md`
- **Evaluation rubric** (spiny-orb repo): `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`
- **Schema design reference**: `~/Documents/Repositories/taze/semconv/SCHEMA_DESIGN.md`

---

## Success Criteria

1. Pre-run verification confirms current spiny-orb SHA and documents open/closed status of #1072 (SCH-003/SCH-004 broadening), #1073 (CDQ-007 regression), #1008 (IS SPA-002), and #1071 (resolves.ts schema drift, watch item)
2. SCH-003 status documented for all 5 affected files — resolved, partially resolved, or recurrence confirmed with an updated file list, distinguishing "fix mechanism fired" from "pattern didn't recur by omission" per the fix-scope-precision guidance below
3. CDQ-007 status documented for all 6 affected files — resolved, partially resolved, or recurrence confirmed with an updated file list, using the same fixed/evaluated distinction
4. IS SPA-002 orphan span status documented — resolved or still consistent
5. resolves.ts schema stability documented — converged or still drifting, with the specific span/attribute diffs vs. run-17
6. SCH-004 near-synonym status documented for `yarnWorkspaces.ts`
7. Quality score ≥ 25/29 (no regression from run-17); target 27-29/29 if SCH-003 and CDQ-007 are substantially resolved
8. Push/PR succeeds
9. IS score ≥ 78/100 (no regression from run-17); target 88+/100 if SPA-002 is resolved
10. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
11. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Pay particular attention to: (a) Type D structure and full step sequence including step 9.6 (correlated signals check); (b) "Two User-Facing Checkpoints" section — exact wording for Findings Discussion and handoff pause; (c) eval branch convention (never merges to main); (d) step 13 (copy artifacts to main before closing); (e) step 9.5 (capture trace artifact after IS scoring — taze is non-organic); (f) the two additions cascaded from run-17 in step 2 (target fork branch state + test-suite fix branch discipline) and step 7 (cross-file attribute attribution).
  2. `prds/done/147-taze-evaluation-run-17.md` — the immediately prior taze run PRD, archived after completion. Note: taze is non-organic (trace artifact created during IS scoring step 9.5, NOT during pre-run verification).
  3. `evaluation/typescript/taze/run-17/actionable-fix-output.md` — prior run findings. RUN17-1 (SCH-003 broadening), RUN17-2 (CDQ-007 new regression), RUN17-3 (IS SPA-002 confirmed consistent), RUN17-4 (resolves.ts schema drift) are the primary goals for this run.
  4. `evaluation/typescript/taze/run-17/lessons-for-run18.md` — process notes, including the target-fork branch-state and CDQ-007 structural-guarantee lessons already folded into the template.
  **Do not mark this complete until you have read all four documents.**

- [ ] **Step 0.5 — Cross-run process review** *(user-facing checkpoint — template changes require user approval)*. Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. In brief: (1) find the most recently completed taze run (run-17, `evaluation/typescript/taze/run-17/actionable-fix-output.md`); (2) check all other `evaluation/` subdirectories for a more recently completed cross-target run — compare using the `captured:` field in `trace-artifact.md` or the file modification time of `actionable-fix-output.md`; (3) if a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; (4) compare against the template structure in this PRD; (5) present the structured three-section checkpoint report; (6) after user approves, make approved template edits. Do NOT make any edits without explicit user approval.

- [ ] **Collect skeleton documents** — Create `evaluation/typescript/taze/run-18/` directory with `lessons-for-run19.md` and `spiny-orb-findings.md` skeleton files. Also create `evaluation/typescript/taze/run-18/debug-dumps/` directory — required before providing the instrument command. Must run before pre-run verification.

- [ ] **Pre-run verification** — Confirm prerequisites and validate taze fork state:

  1. **Target repo readiness** *(runs first — later checks assume a clean, on-`main` checkout)*: Run `git status --short --branch` on the taze fork — if it is not on `main`, or reports untracked leftover artifact files (run-17 found the fork left on a stale `spiny-orb/instrument-*` branch with leftover log/report files), switch to `main` and remove the leftovers before proceeding; do not assume the fork returned to `main` after the prior run. Then verify the working tree is clean, `spiny-orb.yaml` present with `language: typescript` and `testCommand: pnpm test`, and `pnpm test` passes with the provenanceDowngraded skip in place. **If this or any other step finds the target's own test suite failing** (e.g., live-registry-data drift — see run-17's `test/versions.test.ts` TypeScript `latest` dist-tag fragility as a precedent to watch for recurrence), fix it on a branch + PR — never commit the fix directly to the fork's `main`, even though this is a solo-owned fork.
  2. **Datadog MCP health check**: Run a sanity check: `search_datadog_spans` with `service:taze` for the last 1 hour. If it fails with an unexpected error (not just "no results"), re-run `/ddsetup` and `/reload-plugins` before proceeding.
  3. **Spiny-orb build** (P1): Check current spiny-orb SHA: `cd ~/Documents/Repositories/spinybacked-orbweaver && git log --oneline -5`. Run `npm run build` to produce current binaries. Record SHA in `lessons-for-run19.md`.
  4. **Issue status check** (P1 — determines run-18 goals): Check whether the following spiny-orb issues are closed:
     - #1072 (RUN17-1: SCH-003/SCH-004 broadening)
     - #1073 (RUN17-2: CDQ-007 regression)
     - #1008 (RUN17-3: IS SPA-002 orphan span, promoted watch→fix candidate)
     - #1071 (RUN17-4: resolves.ts schema drift, watch item)
     Document open/closed status and update the run-18 primary goals accordingly. Per PRD #147's handoff-confirmation depth guidance, also check each issue's actual roadmap tier/sequencing in spiny-orb's `docs/ROADMAP.md` — a finding can be correctly filed while still not scheduled to land before this run; state this explicitly rather than treating an expected recurrence as a surprise.
  5. **Schema type state**: Confirm `semconv/agent-extensions.yaml` in `~/Documents/Repositories/taze` — check specifically whether `taze.check.packages_loaded` (checkGlobal.ts, packageYaml.ts disguised recurrences) is still typed `string` (the run-17 disguised-schema state) or has been corrected to `int`. Record which state it's in — do not assume either.
  6. **provenanceDowngraded skip on taze fork main**: Confirm `it.skip(...)` for provenanceDowngraded test is still in place in `test/resolves.test.ts`. Required for `pnpm test` to pass.
  7. **Push auth**: Dry-run push to verify `GITHUB_TOKEN_TAZE` still works:
      ```bash
      vals exec -i -f .vals.yaml -- bash -c 'git -C ~/Documents/Repositories/taze push --dry-run https://x-access-token:$GITHUB_TOKEN_TAZE@github.com/wiggitywhitney/taze.git HEAD:refs/heads/spiny-orb/auth-test'
      ```
  8. **File inventory**: Count `.ts` files in `~/Documents/Repositories/taze/src/` using a recursive find (not a flat glob — taze's source is organized into subdirectories) — should be 33 unless the fork changed.
  9. **Record environment**: Append spiny-orb SHA, Node version, and pnpm version to `evaluation/typescript/taze/run-18/lessons-for-run19.md`.

- [ ] **Evaluation run-18** — Whitney runs `spiny-orb instrument` in her terminal. The `debug-dumps/` directory must exist before running (created in skeleton step above).

  **Hard prerequisite check** (cascaded from commit-story-v2 run-28, D-14): confirm Step 0.5 (Cross-run process review, including its user-approval checkpoint), the skeleton documents, and pre-run verification milestones are all fully complete — not just started — before handing Whitney the instrument command. Running out of order forecloses pre-run-only steps (Datadog pre-run health check, push-auth dry-run) permanently. Note: unlike commit-story-v2 (organic target), taze has no pre-run trace capture step — its trace artifact is captured in the "Capture trace artifact" milestone, after IS scoring, so that step is unaffected by this milestone's ordering.

  **Fix-verification claims** (cascaded from commit-story-v2 run-28): do not conclude "no recurrence" of a prior-run finding from the log's Schema Extensions/Agent Notes prose alone — those describe *new* extensions and stated reasoning, not every attribute-setting call on an *existing* key. Label any fix-verification claim in `run-summary.md`/`spiny-orb-findings.md` as provisional pending per-file evaluation.

  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- bash -c 'set -o pipefail; GITHUB_TOKEN=$GITHUB_TOKEN_TAZE node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument src --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/typescript/taze/run-18/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/typescript/taze/run-18/spiny-orb-output.log'
  ```
  `set -o pipefail` ensures a failure in the instrument command itself (not just `tee`) is reflected in the pipeline's exit status.

  After the run: save artifacts, commit with `git add -f` for the `.log` file, push the eval branch to origin immediately. Create PR to taze fork (`gh pr create --repo wiggitywhitney/taze`). Update PR title after rubric and IS scoring complete: `eval(prd-168): taze run-18 — <quality>/29 quality, Q×F <score>, IS <score>/100`.

  **If auto PR creation fails**: use `~/Documents/Repositories/taze/spiny-orb-pr-summary.md` with `--body-file` — do NOT write a shortened manual body.

  **resolves.ts watch**: After the run, immediately check `evaluation/typescript/taze/run-18/debug-dumps/` for a `resolves.ts` debug dump. A dump's presence alone only means the file failed, was partial, or committed zero spans — it does not by itself prove oscillation or a #954/#958 reopening; confirm the actual outcome by reading the dump and the corresponding section of `spiny-orb-output.log` before assigning a cause. If the dump and log confirm a compilation failure: run `tsc --noEmit` on that file from the taze fork root to capture the actual error, and document it in `spiny-orb-findings.md` as a #954/#958 reopening. If no dump exists (resolves.ts committed spans again): compare its span names and attributes against run-17's set directly to determine whether RUN17-4's drift converged, continued, or reversed.

  **debug-dumps note**: `--debug-dump-dir` fires only for failed, partial, and zero-span files. If all 33 files succeed, the debug-dumps directory will be empty — the `spiny-orb-output.log` is the sole source of agent reasoning (via `Agent thinking` and `Agent notes` blocks).

  **Before treating an apparently stalled run as failed**: check whether the process is paused at a live interactive prompt rather than genuinely stuck or errored — piped log output (`tee`) does not always show prompt text. Known prompt shapes: a `Proceed? [y/N]` push-confirmation prompt, or a `PROGRESS.md` `[a]ccept/[e]dit/[s]kip` update-confirmation prompt (can pause for many hours if unattended overnight). Neither prompt's text reliably reaches the piped log. Check `ps` for a live process before concluding the run needs manual recovery — do not require nonzero CPU usage as the detection criterion, since a process blocked on terminal input can report 0% CPU; treat CPU usage as supporting evidence only, alongside confirming the process is alive (not exited or crashed). Process existence alone is not sufficient either — a process blocked on network I/O, a deadlock, or a retry loop is also live with 0% CPU. Use elapsed time as the deciding factor: if the run has been alive far longer than either known prompt shape would explain, with no further log activity and no crash, treat it as genuinely stalled rather than assuming an indefinite prompt-pause. (Cascaded from `docs/language-extension-plan.md` step 3, restored there from commit-story-v2 run-27.)

- [ ] **Findings Discussion** *(user-facing checkpoint 1 — raw signal before analysis)* — Present raw findings from the log: committed files, failed files, pre-scan skips, cost, resolves.ts outcome, SCH-003/CDQ-007 pattern status across the affected files. Do not interpret yet. Wait for Whitney's response before proceeding to failure deep-dives.

- [ ] **Failure deep-dives** — For each failed file (0 committed spans), partially committed file, and committed file requiring ≥ 3 attempts with a quality failure: analyze debug dumps, verbose log, thinking blocks, companion `.instrumentation.md` files. Follow the diagnostic protocol from `docs/language-extension-plan.md` (all 5 dimensions). Document in `evaluation/typescript/taze/run-18/spiny-orb-findings.md`.

- [ ] **Per-file evaluation** *(complete IS scoring and trace capture first — taze is non-organic; trace artifact does not exist until after IS scoring)* — Evaluate each committed file against the rubric.

  **Use parallel subagent evaluation — up to 5 files at a time, one subagent per file.** Single-pass single-context evaluation misses findings that per-file subagents catch. Do NOT write the evaluation as a single sequential document. For spawning mechanics, follow the D-2 protocol in `docs/language-extension-plan.md` step 6.

  **Exemption-scope pre-commitment** (cascaded from commit-story-v2 run-28 — **decide this before spawning the first batch below**, not during reconciliation): where a rubric rule's exemption conditions are ambiguous, write down the chosen interpretation explicitly before any agent is spawned, and record it in `evaluation/typescript/taze/run-18/exemption-scope.md` — a decision the agents never see doesn't propagate, since each `Agent()` call is a separate context with no shared memory. Add this file to the Per-subagent evidence set below so every agent applies the same interpretation. Deciding it during reconciliation, after batches return, defeats the purpose — agents would already have scored inconsistently by then. Specifically pre-commit an interpretation for the CDQ-007 "structural guarantee" test (see Reconciliation pass below) before batch 1, since run-17's first pass scored this rule wrong in 6 of 13 files by skipping the source-level verification — do not repeat that gap this run.

  **Spawn up to 5 agents per batch — no more than 5.** Required sequence per batch: spawn up to 5 agents → collect results → append results to `per-file-evaluation.md` → `/prd-update-progress` → `/clear` → spawn next batch. Number of batches: ⌈committed_files/5⌉. `per-file-evaluation.md` is written incrementally across batches — do not wait for all files before writing.

  **Output format**: Follow the per-file format from `prds/done/147-taze-evaluation-run-17.md`'s corresponding milestone exactly — one section per committed file, rule table per span, failures summary table at the end.

  **Entry point — read these produced artifacts before starting**:
  - `evaluation/typescript/taze/run-18/spiny-orb-findings.md` — failure deep-dives are already documented here. Start here rather than re-deriving from the log.
  - `evaluation/typescript/taze/run-18/spiny-orb-output.log` — full run output. Contains `Agent thinking` blocks (per-attempt reasoning) and `Agent notes` (structured instrumentation rationale) for ALL committed files. This is the primary evidence source for agent decision-making. Each file's section is bounded by `Processing file N of M: src/path/to/file.ts` at the start and the next `Processing file` line at the end.
  - `evaluation/typescript/taze/run-18/lessons-for-run19.md` — process observations including any clarifications added during the run.
  - Companion `.instrumentation.md` files on the instrument branch — written for every file including skips.

  **Per-subagent evidence set**: each subagent must read — (1) the instrumented `.ts` file from the instrument branch; (2) the `Agent thinking` and `Agent notes` blocks from `spiny-orb-output.log` for that file; (3) the companion `.instrumentation.md` for that file on the instrument branch; (4) the run-17 baseline entry for that file from `evaluation/typescript/taze/run-17/per-file-evaluation.md`; (5) the evaluation rubric at `~/Documents/Repositories/spinybacked-orbweaver/research/evaluation-rubric.md`; (6) `evaluation/typescript/taze/run-18/exemption-scope.md`.

  **Note on debug-dumps**: `--debug-dump-dir` only fires for failed, partial, and zero-span files. If all files succeed, `evaluation/typescript/taze/run-18/debug-dumps/` will be empty. The thinking blocks in `spiny-orb-output.log` are the agent reasoning evidence for all successful files.

  **Step 0 — Trace supplement**: complete IS scoring and trace capture before returning here for trace supplement on each file. Use `search_datadog_spans` with the artifact query to supplement static code review. For each committed file, record attribute count vs. run-17 baseline. If the baseline is 0 (file was not committed or failed in run-17), flag any non-zero count explicitly; otherwise, flag any file where count changed by ≥50% in either direction.

  **Reconciliation pass (after all batches return, before the first CodeRabbit review):** Independent per-file agents scoring the same underlying pattern (e.g., a shared attribute or helper used across files) can disagree. Before writing the final document, do one targeted pass: for each rule that appears in more than one file's findings, diff the verdicts across those files and flag disagreements for resolution. Reusable tests, per `docs/language-extension-plan.md` step 6: **CDQ-007 "structural guarantee" test** (a raw-path-shaped attribute FAILs unless the source code structurally guarantees the value can never be absolute — an observed relative value in one trace sample is not sufficient; verify by reading the actual source at every call site, not by inferring from a parameter's name, since a parameter named `relative` can still receive an absolute value at a different call site in the same file — this exact gap corrupted run-17's first pass); **SCH-002 "specific wrong noun vs. generic reasonable term" test** (a reused attribute key FAILs if its own name is a specific, different noun from what it holds, PASSes if the name is generic enough to cover all reused values). Also perform a **SCH-003 disguised-recurrence check**: for each of the 5 files flagged in run-17, confirm whether the schema's declared type for the affected attribute is `int` or `string` in `agent-extensions.yaml` — a `string`-typed schema matching a `String()`-cast value passes a naive comparison but is the disguised failure mode run-17 documented; do not let a passing literal type-match alone stand as resolution evidence.

  **Correct-skip verification:** For each file the run summary labels a "correct skip," grep that file's own pre-instrumentation-analysis block in `spiny-orb-output.log` for a COV-001/COV-004 flag the final output didn't act on. A file that flags its own need for a span and then skips anyway with unrelated boilerplate justification is a "questionable skip," not a confirmed correct one.

  **Rule-ID label audit** (cascaded from commit-story-v2 run-28): before the reconciliation pass, check every per-file section's row against its stated rule ID's canonical definition — not a sample — since a row can carry a correct verdict while evaluating the wrong rule's concern, and one unchecked row leaves that undetected.

  **Trace supplementation ownership** (cascaded from commit-story-v2 run-28): delegated per-file evaluation subagents do not reliably have Datadog MCP access even when the coordinating session does. Treat trace supplementation as the coordinating session's own responsibility, scheduled as a separate pass after all batches return, rather than assumed inline per subagent.

  **PII redaction on citation** (cascaded from commit-story-v2 run-28): any live-trace value pulled in as evidence for a PII-adjacent finding must be redacted in the same edit that adds it to a document, never as a follow-up cleanup step.

  **Fix-verification confirmation** (cascaded from commit-story-v2 run-28): per-file evaluation is the authoritative check for whether a prior-run finding (SCH-003, CDQ-007, SCH-004) actually recurred — it supersedes, and may correct, the earlier findings-discussion pass's provisional read. For SCH-003 and CDQ-007 specifically, apply the fix-scope-precision guidance from PRD #147's handoff: state fixed/evaluated and evaluated/total separately per file rather than a bare ratio, and distinguish "the failure pattern didn't recur" (could be omission) from "the fix mechanism demonstrably fired" (only this is evidence the fix generalizes).

- [ ] **PR artifact evaluation** — Evaluate the instrument branch PR: diff completeness, span registration accuracy, schema accuracy in `agent-extensions.yaml`, `traceloop-init.ts` registration block.

  **Cross-file attribute attribution** (cascaded from taze run-17, PRD #147): when compiling the schema-accuracy table, copy each attribute's exact name and file from that file's own `per-file-evaluation.md` section — do not reconstruct the pairing from the narrative summary. Two files handling structurally similar operations (e.g., a count of catalogs vs. a count of packages) can carry differently-named attributes for the same concept, which is easy to conflate when writing from memory. Run-17 attributed `taze.io.catalogs_count` to both `pnpmWorkspaces.ts` and `yarnWorkspaces.ts`, when it belongs only to the latter — caught by CodeRabbit CLI review.

- [ ] **Rubric scoring** — Score all dimensions against the rubric. Compare to run-17 baseline. SCH-003/CDQ-007/SPA-002 resolution status are the primary data points.

  **Unrubriced findings category**: some real failures have no matching rule ID — e.g. an attribute with the correct declared type written to the wrong pre-existing registry key. Score these as canonical failures in the narrative for consistency, but list them separately under a standing "Unrubriced Findings" section rather than folding them into any dimension's score or inventing an ad hoc rule ID. Full detail: `docs/language-extension-plan.md` step 8.

- [ ] **IS scoring run** — See `evaluation/is/README.md` for collector setup.

  IS scoring invocation for taze:
  ```bash
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/taze.mjs major
  ```
  Run the instrumented target command from `~/Documents/Repositories/taze` on the instrument branch. OTel SDK packages are already in node_modules on the instrument branch — no `npm install` needed. OTel Collector must be running on port 4318 (Docker or binary). See `~/.claude/rules/is-scoring-gotchas.md` for full sequence.

  Then change to the evaluation repo root and score (the scorer, trace file, and output path are all relative to `~/Documents/Repositories/spinybacked-orbweaver-eval`, not the taze checkout):
  ```bash
  cd ~/Documents/Repositories/spinybacked-orbweaver-eval
  node evaluation/is/score-is.js evaluation/is/eval-traces.json --target taze > evaluation/typescript/taze/run-18/is-score.md
  ```

  **SPA-001 note**: taze is a CLI app; per-target limit is `not_applicable`. If it fires anyway, this is structural — document but do not treat as a regression.
  **SPA-002 watch**: Compare SPA-002 orphan span result to run-17. If the orphan persists a third consecutive run, this only reinforces RUN17-3's status as a confirmed spiny-orb fix candidate — it does not need re-litigating as a new finding.
  **SPA-005 note**: If short-span count again crosses the flat threshold of 20, do not treat this as a fresh regression without first checking whether it reproduces run-17's assessed cause (early-return code paths in `resolves.ts` that legitimately complete in <5ms) — see run-17's `actionable-fix-output.md` for the investigation detail before re-deriving it from scratch.

- [ ] **Capture trace artifact** — Immediately after IS scoring completes, use the `search_datadog_spans` Datadog MCP tool with query `service:taze from:now-30m`. Retrieve `service.instance.id` from any span. Write `evaluation/typescript/taze/run-18/trace-artifact.md` (five fields: service.instance.id, captured, target, instrument_branch, query) using the format in `evaluation/trace-capture-protocol.md`. If no spans appear, wait up to 5 minutes and retry once; if still empty, record trace absence in the artifact (`service.instance.id: none`) and note it in `run-summary.md` — do not block the eval run on a signals gap. Per-file evaluation then proceeds without trace supplementation for this run, per the template's Step 0 guidance.

- [ ] **Correlated signals check** — Use the `service.instance.id` from `trace-artifact.md` as the correlation handle. **If it is `none`** (trace absence recorded in the previous milestone): mark all three checks below "unavailable (no trace artifact)" and skip them — do not query with a missing ID. Otherwise:
  - **Traces**: `search_datadog_spans` with `service:taze @service.instance.id:<uuid>` — confirm spans appear.
  - **Logs**: `search_datadog_logs` with `service:taze @otel_resource_attributes.service.instance.id:<uuid>` — confirm log records carry `trace_id` and `span_id` fields.
  - **Metrics**: `search_datadog_metrics` for `traces.span.metrics.calls` and `traces.span.metrics.duration` filtered to `service:taze`.
  Note any gaps in `run-summary.md` — do not block the eval run on signals gaps.

- [ ] **Baseline comparison** — Compare run-18 results to run-17 across all dimensions. Calculate Q×F. Update root README: add a run-18 row to the taze run history table; update the "Run-19 is next" note with primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2 — interpreted summary + handoff pause)* — Write `evaluation/typescript/taze/run-18/actionable-fix-output.md` with the full structured format: what happened, SCH-003/CDQ-007/SPA-002 resolution status, resolves.ts schema-drift outcome, SCH-004 status, new findings, updated carry-forward table. When complete, print the absolute path: `/Users/whitney.lee/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/typescript/taze/run-18/actionable-fix-output.md`. Pause until Whitney confirms she has handed the document to the spiny-orb team. Do not proceed to the next PRD until confirmed.

  **Handoff framing guidance** (carried forward from PRD #147, still applicable):
  - **Fix language targets spiny-orb components, not target files.** "Fix:" entries should describe the spiny-orb component gap — auto-fix, validator, prompt, or fix-loop. Do not write "remove X at line Y of file.ts." Target repo files are overwritten every run; patching them is not durable and misleads the team about where the root cause is.
  - **Attribute disappearance is not automatically a finding.** If an attribute appeared in a prior run and is absent now, investigate before calling it wrong — consider whether there is a semconv basis for the attribute and whether the absence is a defensible agent decision. Give the spiny-orb team evidence and honest characterization, not a decision-free action list.
  - **Carry-forward table: distinguish findings from observations.** Entries with a plausible spiny-orb root cause ("finding") vs. entries worth watching but without a clear industry basis for calling them wrong ("observation") serve different purposes for the team.
  - **Fix scope precision**: for any fix originally reported across N files, state fixed/evaluated and evaluated/total separately, or list which specific files are fixed, still-broken, and not-evaluated, so no file's status is ambiguous. Distinguish "the failure pattern no longer reproduces" from "the fix mechanism actually fired" — a file can pass by omission, not because the fix worked. Only the latter is evidence the fix generalizes.
  - **Component maturity classification**: when a resolution status rests on a changed outcome, identify which component changed — auto-fix, validator/gate, prompt/generation, or fix-loop — and state which outcome it achieved: prevented, detected, or repaired. Applies directly to SCH-003 and CDQ-007 in this run if either shows a changed outcome vs. run-17.

  **Handoff-confirmation depth**: When Whitney confirms handoff to the spiny-orb team, verify each finding's actual roadmap tier/sequencing (not just that an issue exists with acceptance criteria) against spiny-orb's `docs/ROADMAP.md`. A finding can be correctly filed and triaged while still not being scheduled to land before the next run — state this explicitly rather than treating an expected recurrence as a surprise.

- [ ] **Draft next PRD** *(includes template-update checkpoint before drafting)* — Follow `docs/language-extension-plan.md` step 12: (1) review `lessons-for-run19.md` and `actionable-fix-output.md` for process observations; (2) present two-section checkpoint to user (target-specific vs. generalizable); (3) after approval, commit any template changes as a separate commit **on a branch that merges to main — never on this PRD's own eval execution branch, which per the Eval Branch Convention never merges** (a template edit committed there is silently stranded, exactly like the "step 3b" bug this template's own history documents); (4) draft the next taze run PRD using this PRD as the style reference; (5) run `/write-prompt` before committing.

- [ ] **Copy artifacts to main** — Switch to main, pull, then run:
  ```bash
  git checkout feature/prd-168-taze-evaluation-run-18 -- evaluation/typescript/taze/run-18/
  ```
  Commit to main with message `eval: save taze run-18 artifacts to main [skip ci]`. The run-18 row in `evaluation/typescript/taze/run-log.md` and the taze run history section in `README.md` were added on the eval branch — verify they are present after the checkout and do NOT duplicate them. Push to origin/main. Then return to the eval branch and run `/prd-done`.

---

## Score Projections

### Conservative (carry-forward findings recur unchanged, resolves.ts schema drift continues)

- **Quality**: 25/29 (86%) — SCH-003 (5 files) and CDQ-007 (6 files) persist unresolved; resolves.ts compilation stays stable but naming continues drifting
- **Files**: 13 (stable)
- **IS Score**: 78/100 (SPA-002 and SPA-005 both recur)
- **Q×F**: ~11.2

### Target (SCH-003 and CDQ-007 both substantially resolved, SPA-002 fixed)

- **Quality**: 28–29/29 (97–100%) — SCH-003 corrected across all 5 files including disguised recurrences retyped back to `int`; CDQ-007 sanitized across all 6 files; SCH-004 not recurring
- **Files**: 13 (stable)
- **IS Score**: 90+/100 (SPA-002 resolved; SPA-005 remains a documented threshold artifact, not chased)
- **Q×F**: ~13.0

### Partial (some findings resolved, resolves.ts holds)

- **Quality**: 26–27/29 (90–93%) — 1–2 of SCH-003/CDQ-007 substantially resolved, the other persists
- **Files**: 13
- **IS Score**: 78–88/100
- **Q×F**: ~11.5–12.5

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| SCH-003 disguised recurrence recurs in a new file | The reconciliation pass's SCH-003 disguised-recurrence check (schema type vs. `String()` cast) applies to all committed files this run, not just the 5 already known — do not scope the check to only the run-17 file list |
| CDQ-007 spreads to files not yet flagged | Per-file evaluation's structural-guarantee test applies to every file with a path-shaped attribute, regardless of run-17 history |
| resolves.ts oscillation recurs (reopening #954/#958) | `--debug-dump-dir` captures the debug dump; run `tsc --noEmit` to get actual error; document in `spiny-orb-findings.md` |
| GITHUB_TOKEN_TAZE expired | Pre-run step 7 dry-run catches this. Regenerate per `~/.claude/rules/eval-github-pat.md`. |
| IS Docker blocked | Use otelcol-contrib binary (arm64). See `evaluation/is/README.md`. |
| debug-dumps empty (all files succeed) | Expected — use `spiny-orb-output.log` Agent thinking blocks as the sole agent reasoning source |
| Target fork left on a stale branch from run-17 | Pre-run verification's target-repo-readiness step now explicitly checks `git status --short --branch` before assuming `main` |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-23 | Bakes the two run-17-cascaded process improvements (target-fork branch-state check + test-fix branch discipline in pre-run verification; cross-file attribute attribution in PR artifact evaluation) directly into this PRD's own affected milestones, rather than only pointing to `docs/language-extension-plan.md` | A cold AI reading only this PRD during execution will not re-read the template — per the template's own step 12.4 cascade requirement, consistent with how the same cascade was applied to PRDs #100, #143, #161, #51, #52 in the same session. |
| 2026-09-23 | Per-file evaluation must use the parallel subagent approach (up to 5 at a time, one per file) | Validated during run-16 (PRD #146, Decision 4): parallel agents found gaps that sequential evaluation missed. Required process for all future runs, carried forward unchanged from PRD #147. |
