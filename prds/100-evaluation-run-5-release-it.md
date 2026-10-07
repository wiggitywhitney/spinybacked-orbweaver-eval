# PRD #100: JavaScript Evaluation Run-5: release-it — LINT/NDS-003 Indentation Conflict Resolution

**Status:** In Progress
**Created:** 2026-05-07
**GitHub Issue:** #100
**Depends on:** PRD #88 (run-4 complete, findings in `evaluation/javascript/release-it/run-4/actionable-fix-output.md`)

---

## Read This First

Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

---

## Problem Statement

Run-4 achieved Q×F 6.7 on 7 committed files at 24/25 quality — more than double run-3's 3.0. The pre-scan class method fix (RUN3-1) is confirmed working: Git.js committed with 10 spans from async class methods. The new ceiling is structural: 5 of 6 failed files hit the LINT/NDS-003 indentation-width conflict.

| File | Async methods blocked | Conflict mechanism |
|------|----------------------|--------------------|
| lib/plugin/github/GitHub.js | 13 | Agent split long lines → NDS-003 ×8; LINT also fires |
| lib/plugin/GitBase.js | 6 | Agent preserved originals → LINT fails |
| lib/plugin/GitRelease.js | 2 | Agent preserved originals → LINT fails |
| lib/plugin/npm/npm.js | ~8 | Agent split destructuring → NDS-003 ×26 |
| lib/prompt.js | 1 | Agent preserved originals → LINT fails |

The `startActiveSpan` wrapper adds 2 indentation levels. Files with long lines near Prettier's 120-char print width cannot satisfy both LINT (Prettier-compliant output) and NDS-003 (preserve original lines) simultaneously — no matter how many attempts the agent takes. Additionally, GitLab.js has never committed across 3 runs due to separate validator issues.

**Run-4 results (baseline for run-5 comparison)**:

| Metric | Run-4 |
|--------|-------|
| Files processed | 23/23 |
| Committed (net) | 7 |
| Quality | 24/25 (96%) |
| Failed | 6 (5 LINT/NDS-003 conflict; 1 GitLab.js COV-003+SCH-002) |
| Correct skips | 10 |
| Cost | $6.97 |
| Push | YES |
| PR | FAILED (E2BIG — compliance report in PR body) |
| Q×F | 6.7 |
| IS | 100/100 |

### P1 Blockers from Run-4

| # | Blocker | Root cause | Status entering run-5 |
|---|---------|------------|-----------------------|
| RUN4-1 | LINT/NDS-003 indentation-width conflict | `startActiveSpan` adds 2 indent levels; long lines exceed Prettier's 120-char print width; agent can't satisfy both validators | Check if spiny-orb Prettier post-pass fix has landed on main |
| RUN4-2 | PR body E2BIG | Live-check compliance report embedded inline in PR body (~12MB); `gh pr create --body` hits OS argument limit | Check if `--body-file` fix landed; also check if compliance report is now written to file rather than printed inline |

### P2 Issues from Run-4

| # | Issue | Status entering run-5 |
|---|-------|-----------------------|
| RUN4-3 | COV-003 validator gap: `Promise.reject` not detected as rethrow | shell.js quality failure; validator fix pending in spiny-orb |
| RUN4-4 | GitLab.js SCH-002 cross-domain contradiction | Validator flagged `release_it.gitlab.asset_name` as duplicate of `release_it.github.assets_count` — different domains entirely; watch in run-5 |
| RUN3-3 | HOME not forwarded to weaver subprocess | Workaround still active: `HOME="$HOME"` in instrument command |

### Primary Goal

If RUN4-1 fix has landed: instrument the 5 blocked plugin files (GitHub.js with 13 async methods, GitBase.js with 6, GitRelease.js with 2, npm.js, prompt.js). Expected Q×F: ~10–12. If not fixed: run-5 produces valid data at the same ceiling as run-4.

---

## Solution Overview

Same milestone structure as all Type D eval runs. Pre-run verification explicitly checks RUN4-1 and RUN4-2 status.

### Three-Repo Workflow

| Repo | Path | Role |
|------|------|------|
| **release-it** (target) | `~/Documents/Repositories/release-it` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | `~/Documents/Repositories/spinybacked-orbweaver-main` (detached worktree of `origin/main`; the primary `spinybacked-orbweaver` checkout is not used for this run) | The spiny-orb agent |

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-100-evaluation-run-5-release-it`) **never merges to main**. The PR exists for CodeRabbit review only. Run `/prd-done` at completion to close issue #100 without merging the eval branch. Step 13 (Copy artifacts to main) preserves the run artifacts on main before the PR is closed.

---

## Success Criteria

1. Q×F ≥ 10 if RUN4-1 indentation-width fix landed; Q×F > 6.7 if not yet fixed (fallback: at least one more file than run-4)
2. LINT/NDS-003 conflict status assessed — document whether fix landed and which files it unblocked
3. PR created in wiggitywhitney/release-it (auto if RUN4-2 fixed; manual otherwise)
4. All 23 `lib/` files processed
5. Quality score produced across all six dimensions
6. Both user-facing checkpoints completed (Findings Discussion + handoff pause)
7. All evaluation artifacts generated from canonical methodology

---

## Milestones

- [x] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely.
  2. `prds/115-evaluation-run-22.md` — canonical Type D milestone style reference. **Release-it is non-organic** (unlike commit-story-v2): the trace artifact is created during IS scoring (step 9.5), NOT during pre-run verification. The IS scoring milestone and per-file trace supplement timing differ accordingly — read both PRDs side by side to understand where release-it diverges.
  3. `evaluation/javascript/release-it/run-4/actionable-fix-output.md` — prior run findings. RUN4-1 (LINT/NDS-003 indentation-width conflict) and RUN4-2 (PR body E2BIG) are the P1 blockers that drive run-5's pre-run verification.
  **Do not mark this complete until you have read all three documents.**

- [x] **Step 0.5 — Cross-run process review** *(user-facing checkpoint — template changes require user approval)*. Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. In brief: (1) find the most recently completed release-it run (completion signal: `actionable-fix-output.md` present in `evaluation/javascript/release-it/run-N/`); (2) check all other `evaluation/` subdirectories for a more recently completed cross-target run — compare using the `captured:` field in `trace-artifact.md` if it exists, or the file modification time of `actionable-fix-output.md` as a proxy; if release-it has no completed runs, treat it as timestamp zero so any cross-target run qualifies; (3) if a more recent cross-target run exists, read its `actionable-fix-output.md` and any `lessons-for-prd*.md` files; (4) compare findings against the template's milestone structure as instantiated in this PRD (from `docs/language-extension-plan.md`); (5) present the structured three-section checkpoint report to the user (already in template, missing from template with proposed text, target-specific only); (6) after user approves, make the approved template edits. Do NOT make any edits without explicit user approval. If no cross-target run is more recent, note this in the report and proceed.

- [x] **Collect skeleton documents**

  Create `evaluation/javascript/release-it/run-5/` directory in the eval repo with skeleton files:
  - `lessons-for-run6.md` (copy structure from `evaluation/javascript/release-it/run-4/lessons-for-run5.md`)
  - `spiny-orb-findings.md` (fresh skeleton with P1/P2/P3 sections)

- [x] **Pre-run verification**

  Verify run-4 P1 blockers and validate run prerequisites:

  1. **Target repo readiness** *(runs first — later checks assume a clean, on-`main` checkout)*: Verify release-it fork is on `main`, working tree is clean. Run `git status --short --branch` in `~/Documents/Repositories/release-it` — if it is not on `main`, or reports untracked leftover artifact files (e.g., from a prior IS scoring run), switch to `main` and remove the leftovers before proceeding; do not assume the fork returned to `main` after a prior run. If OTel devDeps from a prior IS scoring run are present in package.json/package-lock.json, restore with `git restore package.json package-lock.json`. **Cascaded from taze run-17 (PRD #147)**: if this check or any other pre-run step finds the target's own test suite failing, fix it on a branch + PR — never commit the fix directly to the fork's `main`, even though this is a solo-owned fork.
  2. **RUN4-1 (LINT/NDS-003 indentation-width conflict) — CHECK**: On spiny-orb main, check if the Prettier post-pass fix has landed (look for a PR addressing LINT/NDS-003 conflict or Prettier formatting before NDS-003 validation). Test on `lib/plugin/github/GitHub.js`: if the pre-scan identifies it as instrumentable AND the agent can produce a LINT-passing result, the fix is live. If not, expect ~7 files committed (same set as run-4).
  3. **RUN4-2 (PR body E2BIG) — CHECK**: On spiny-orb main, check if `createPr` now uses `--body-file` or if the compliance report is written to a separate file rather than embedded inline. If fixed, auto PR creation should work. If not, manual PR workaround still required.
  4. **RUN4-3 (COV-003 Promise.reject gap) — CHECK**: Check if the COV-003 validator now recognizes `return Promise.reject(err)` as a rethrow pattern. If fixed, shell.js should pass COV-003.
  5. **RUN4-4 (GitLab.js SCH-002) — CHECK**: Check if the SCH-002 duplicate detection now constrains matching to same-namespace attributes. If fixed, `release_it.gitlab.asset_name` should not be flagged as a duplicate of `release_it.github.assets_count`.
  6. **RUN3-3 (HOME forwarding) — MUST APPLY**: Confirm `HOME="$HOME"` is included in the instrument command regardless of whether spiny-orb fix has landed.
  7. **File inventory**: Confirm 23 `.js` files in `lib/` — run `find lib -name "*.js" | wc -l` from `~/Documents/Repositories/release-it/`.
  8. **Rebuild spiny-orb**: Rebuild from **main**. Record SHA.
  9. **Record versions**: Node.js version, spiny-orb version/SHA, release-it version.
  10. Append observations to `evaluation/javascript/release-it/run-5/lessons-for-run6.md`.

  **If RUN4-1 is not fixed**: proceed anyway. Document the miss. Q×F will remain near 6.7 but run-5 still produces valid evaluation data.

- [x] **Evaluation run-5**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.**

  AI must create `evaluation/javascript/release-it/run-5/debug-dumps/` before handing Whitney the command.

  **Instrument command** (run from `~/Documents/Repositories/release-it/`):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL HOME="$HOME" GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f ~/Documents/Repositories/release-it/.vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver-main/bin/spiny-orb.js instrument lib --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/release-it/run-5/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/release-it/run-5/spiny-orb-output.log'
  ```

  Note: the `node` path points at `spinybacked-orbweaver-main`, a detached git worktree of spiny-orb `origin/main` (SHA `a55bd92` at pre-run verification, built with `npm ci` and `npm run build`), not the primary `spinybacked-orbweaver` checkout, which is used for other in-progress branches. Before handing Whitney the command, confirm the worktree still exists and is still at the SHA recorded in `lessons-for-run6.md`. The RUN4-1 through RUN4-4 status in `lessons-for-run6.md` was checked against that SHA. Do not move the worktree unless Whitney asks; if she does, run `git fetch` in the primary checkout, then `git checkout --detach origin/main` in the worktree, rebuild with `npm ci && npm run build`, record the new SHA, and re-run pre-run verification items 2 through 5 against it.

  Note: `HOME="$HOME"` is required — weaver prerequisite check needs HOME for `~/.weaver/vdir_cache/`. `vals exec` reads from release-it fork's `.vals.yaml` (NOT the eval repo's). Source directory is `lib/`.

  AI role: (1) confirm readiness, (2) once Whitney provides the log output, save it and write `evaluation/javascript/release-it/run-5/run-summary.md`, (3) **push the eval branch to origin immediately** — the branch holds the only copy of run artifacts until step 13 copies them to main, (4) **if auto PR creation failed**, create the PR from the file spiny-orb already wrote to disk — do NOT write a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/release-it/spiny-orb-pr-summary.md --repo wiggitywhitney/release-it --head <instrument-branch> --title "..."`

  **Hard prerequisite check** (cascaded from commit-story-v2 run-28, D-14): confirm Step 0.5 (Cross-run process review, including its user-approval checkpoint), the skeleton documents, and pre-run verification milestones are all fully complete before handing Whitney the instrument command — running out of order forecloses pre-run-only steps permanently. If Step 0.5 found no more-recent cross-target run, record that outcome as its completion; otherwise its checkpoint report and any approved template changes must be done first.

  **Fix-verification claims** (cascaded from commit-story-v2 run-28): do not conclude "no recurrence" of a prior-run finding from the log's Schema Extensions/Agent Notes prose alone — those describe *new* extensions and stated reasoning, not every attribute-setting call on an *existing* key. Label any fix-verification claim in `run-summary.md` as provisional pending per-file evaluation.

- [x] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents: report to Whitney with a raw overview — files committed/failed/partial, quality score if visible in log, cost, push/PR status, top 1-2 surprises. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

  **Process for a cold session**:
  1. Read `evaluation/javascript/release-it/run-5/run-summary.md`. It holds the per-file table and run totals: 9 committed, 4 failed, 10 correct skips, PR #4 created automatically.
  2. Lead the overview with what is new to Whitney. She already saw a per-file comparison table while the run was in progress, so cover the final totals, the two regressions, and the PR. The regressions are Git.js (LINT) and shell.js (SCH-002), which committed in run-4 and fail in run-5. Also mention that prompt.js, GitRelease.js, GitHub.js, and GitLab.js now commit, and that GitHub.js has 13 spans with 0 attributes.
  3. The full run log is `evaluation/javascript/release-it/run-5/spiny-orb-output.log`, committed with `git add -f` because the repository's `*.log` ignore rule would otherwise exclude it. The failure deep-dives and per-file evaluation need it, because agent notes and full validator messages live there. Run-1 through run-4 of this target have untracked logs that exist only on the local machine.
  4. When counting attempts per file, read each file's own result block in the log. The count appears in three places: on the `✅ SUCCESS` line after the span and attribute counts, on a line beginning with three backticks for LINT failures, and at the end of the wrapped validator message for NDS-003 failures. A single grep misses at least one of these.

- [x] **Failure deep-dives**

  Root cause analysis for each failed/partial file and run-level failures.
  Produces: `evaluation/javascript/release-it/run-5/failure-deep-dives.md`

  **Lead from the CodeRabbit review of the debug dumps** (the review's findings are not linked here; the dumps are the primary evidence, and each site below was confirmed present in them): the dumps under `evaluation/javascript/release-it/run-5/debug-dumps/lib/` for GitBase.js (`getRemoteUrl` and `getSecondLatestTagName`), npm.js (`getLatestRegistryVersion`), and shell.js (`execFormattedCommand`) return an un-awaited promise inside a `try/finally`, so `span.end()` runs before the call settles. Run-4's GitBase.js agent notes describe the same timing limitation: see `evaluation/javascript/release-it/run-4/spiny-orb-output.log` lines 602-697 (that log is untracked and exists only on the local machine). Those notes say the agent kept the original `return` because `return await` would modify an original line and its earlier attempt had failed NDS-003, so read run-5's own agent notes for the same reasoning before concluding anything. Check whether this pattern is why the agent kept the original `return` lines and hit LINT or NDS-003 instead, and whether any validator rule covers it. The dumps are the agent's rejected output and must stay unedited as evidence. A second lead from the same review: the shell.js dump sets `release_it.shell.command` to the full command string (`cacheKey` at line 36, `command.join(' ')` at line 99), which is the inconsistent value source behind the SCH-002 failure, and full command strings can contain credentials or tokens. Check whether a validator rule covers sensitive command arguments in span attributes. The file never committed, so PR #4 does not contain it.
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

- [ ] **Per-file evaluation**

  **Progress (2026-10-07): both per-file batches and correct-skip verification (a) are done; (b) and (c) are still owed before this milestone can be checked.** Read these before doing anything else in this milestone:
  - `evaluation/javascript/release-it/run-5/exemption-scope.md` has fourteen interpretation decisions and a thirteen-item "Rule-fit issues for the handoff" list. Items 1–8 governed batch 1. Items 9–13 came out of batch 2 and do not change any batch-1 verdict. Item 14 came out of correct-skip verification. Whitney delegated further interpretation calls to the coordinating session on the condition that no rule or clause is ignored: decide them, write each into `exemption-scope.md`, and add every place a rule does not fit to the rule-fit list. Ask her only about calls that would reverse an earlier run's or another target's precedent.
  - `per-file-evaluation.md` has the per-run gates, the per-run rules, and sections 1–9 for all nine committed files. One verdict changed in reconciliation, GitRelease.js COV-003 (FAIL to PASS, item 9), and the row says so. Un-awaited-return sites are listed on the `**Unrubriced findings**` lines of GitRelease.js (2 sites) and GitHub.js (5 sites); the rubric scoring milestone carries them.
  - `run-summary.md`'s RUN4-4 row was corrected: the GitLab.js SCH-002 duplicate recurred in attempt 1 on `release_it.gitlab.request.method`, and the agent deleted the attribute to commit.
  - **Next, in this order:**
    1. **(a) Correct-skip verification — done 2026-10-07.** Result: 8 confirmed, 2 questionable (`lib/index.js`, `lib/cli.js`), both pre-scan false negatives reproduced by rerunning spiny-orb a55bd92's `preInstrumentationAnalysis` on the originals. Written as "Correct Skips (10)" and "Failed Files (4)" at the end of `per-file-evaluation.md`; `exemption-scope.md` item 14 (questionable skips are handoff findings and enter no rubric score) and rule-fit items 12–13 record the causes; `run-summary.md` carries a correction note. Do not redo it. The original instructions follow for reference. Correct-skip verification for the 10 skipped files. The procedure is the "**Correct-skip verification:**" paragraph in `docs/language-extension-plan.md` (search for that bold label; it sits under item 6 of the per-run step list, not under the later "Step 6 — Python eval setup" heading). That procedure greps each file's pre-instrumentation-analysis block for an unacted COV-001/COV-004 flag, but `run-summary.md` ("Correct Skips (10)") records all ten as pre-scan skips with no LLM call, so there may be no analysis block to grep. Confirm that in the log first; if so, verify each skip from source instead (`git -C ~/Documents/Repositories/release-it show main:<path>`): list every exported and every async function, and mark a skip questionable if an async function doing I/O, or the orchestrator's entry point, got no span. Format reference: the "Correct Skips" table in `docs/templates/eval-run-style-reference/per-file-evaluation.md` (`| File | Skip Reason |`), plus a "Questionable skips" note for any that fail the check. Confirmed 2026-10-07: each skipped file's log block holds only the one-line note "Pre-scan: no instrumentable functions — all are pure sync utilities or unexported helpers. No LLM call made.", so verify from source. Lead to confirm, not a verdict: `lib/index.js` gets that same note, yet its default export `runTasks` (L9, `export default runTasks` L159) is async and is release-it's main entry point, which would make the pre-scan claim false for that file and the skip questionable under COV-001. The log reports each skip as `✅ SUCCESS — 0 spans, 0 attributes` on the line after `Processing file N of 23`, not as "skip". The 10 are files 1 `lib/args.js`, 2 `lib/cli.js`, 4 `lib/index.js`, 5 `lib/log.js`, 6 `lib/plugin/github/util.js`, 7 `lib/plugin/npm/prompts.js`, 13 `lib/plugin/git/prompts.js`, 15 `lib/plugin/github/prompts.js`, 17 `lib/plugin/gitlab/prompts.js`, and 23 `lib/spinner.js`. Note that `lib/index.js` is the orchestrator and has async functions, so check its skip especially against COV-001 and COV-004. Write a "Correct Skips (10)" section in `per-file-evaluation.md` after section 9. The 4 failed files are covered in `failure-deep-dives.md`; add a short "Failed Files (4)" section that points there instead of re-scoring them.
    2. **(b) Cross-file reconciliation** over all 9 sections. Inputs gathered so far: `release_it.is_ci` is set from `options.ci` in config.js and from the broader `Config.isCI` getter in Version.js, GitHub.js, and GitLab.js; `release_it.plugin.namespace` (Plugin.js, factory.js) duplicates `release_it.prompt.namespace` (prompt.js, SCH-004 FAIL); `release_it.version.increment` is set in config.js and Version.js (both SCH-003 FAIL); count attributes `enabled_count`/`external_count` (factory.js), `collection_size` (util.js), and `milestones_count` (GitLab.js) are `String(len)` casts (SCH-003 FAIL), while `changelog.length` (GitRelease.js, GitHub.js, GitLab.js) and `commits_since_tag` (GitHub.js) are raw ints; `release_it.git.tag_name` holds the new tag everywhere except GitHub.js L603 (previous tag, SCH-002 FAIL); `release_it.prompt.name` is guarded in Plugin.js and unguarded in prompt.js. Check the verdicts agree across sections and note each cross-file pattern once.
    3. **(c) Trace reconciliation**, after the IS scoring milestone writes `trace-artifact.md` (see "Step 0" and "Reconciliation of trace evidence into results" below). Leave the milestone unchecked until then, or check it after (a) and (b) with a note that (c) is applied during IS scoring.
  - **zsh gotcha**: in `git show $B:semconv/...`, zsh reads `$B:s` as a substitution modifier and the command fails with "ambiguous argument". Quote it as `"${B}:path"`.

  **Step 0 — Trace supplement:** Release-it is a non-organic target — the trace artifact is created during IS scoring, which is a later milestone in this PRD's listed order. **Do not block per-file evaluation on IS scoring having already run.** Write every file's section from static code review first; if IS scoring hasn't run yet by the time this milestone executes, mark trace supplementation "unavailable (IS scoring not yet run)" for every section and proceed — the "Reconciliation of trace evidence into results" step below is exactly the mechanism that folds trace evidence back in once IS scoring's trace-artifact.md exists, so nothing is lost by not blocking here. Once the artifact exists (whether at this point or later, applied via that reconciliation step), after all per-file batches return and section files are written, the coordinating session (not delegated per-file agents — see "Trace supplementation ownership" below) reads `evaluation/trace-capture-protocol.md` for full guidance, then reads `evaluation/javascript/release-it/run-5/trace-artifact.md`. **If it has no `query` field** (trace capture recorded no spans): mark trace supplementation "unavailable" and proceed with static-only evaluation for every section — do not query Datadog. **If a `query` field is present**: use the `search_datadog_spans` Datadog MCP tool with that field as the base query. First run the base query without a prefix filter, inspect the returned `resource_name` values to derive the correct prefix for the file under review, then rerun with `resource_name:<derived_prefix>.*` appended, per affected file, before the reconciliation pass. The prefix comes from actual span data — do not hardcode it. Example: if the artifact's `query` is `service:release-it @service.instance.id:a1b2c3d4...` and returned spans show `resource_name: release_it.publish`, rerun as `service:release-it @service.instance.id:a1b2c3d4... resource_name:release_it.*`. Use live trace data to supplement — not override — static code review for: attribute values at runtime, parent-child span relationships, early exit detection (span with `gen_ai.operation.name` but no `gen_ai.response.id`), and CDQ-001 double-end signal. If the trace has no spans for the file's namespace, note it — do not fail the file solely on trace absence.

  **Reconciliation of trace evidence into results**: After trace supplementation completes (or is marked unavailable) for every affected file, update each file's already-written section in `per-file-evaluation.md` with the trace findings before PR artifact evaluation and rubric scoring begin — gathering trace evidence without folding it back into the per-file verdicts leaves those verdicts static-only despite the supplementation work. Files with no trace data keep their static-only result as-is.

  Full 32-rule rubric on ALL processed files.
  Produces: `evaluation/javascript/release-it/run-5/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **Batching constraint**: spawn per-file subagents in batches of up to 5 — no more per message. Launching more exhausts the context window and causes agent rejections. Per batch: spawn up to 5 agents → collect results → append to `per-file-evaluation.md` → `/prd-update-progress` → `/clear` → spawn the next batch. Run-5 has 9 committed files, so that is 2 batches. `per-file-evaluation.md` is written incrementally. Full wording: `docs/language-extension-plan.md`, per-file evaluation step.

  **Cascaded from commit-story-v2 run-28** — apply all of the following during this milestone:
  - **Trace supplementation ownership**: delegated per-file evaluation subagents do not reliably have Datadog MCP access even when the coordinating session does. Treat trace supplementation as the coordinating session's own responsibility, scheduled as a separate pass after all batches return, not assumed inline per subagent.
  - **PII redaction on citation**: any live-trace value pulled in as evidence for a PII-adjacent finding must be redacted in the same edit that adds it to a document, never as a follow-up cleanup step.
  - **Rule-ID label audit**: before any reconciliation pass, check every per-file section's row against its stated rule ID's canonical definition — not a sample — since one unchecked row can carry an incorrect rule ID undetected.
  - **Exemption-scope pre-commitment**: where a rubric rule's exemption conditions are ambiguous, write down the chosen interpretation explicitly before per-file evaluation starts, and apply it uniformly across every section in this run. Write it to `evaluation/javascript/release-it/run-5/exemption-scope.md` (`evaluation/typescript/taze/run-17/exemption-scope.md` is the format reference) and paste its text into every delegated subagent's prompt, since subagents have no session context.
  - **Fix-verification confirmation**: per-file evaluation is the authoritative check for whether a prior-run finding actually recurred — it supersedes, and may correct, `run-summary.md`'s provisional fix-verification claims.
  - **Read `evaluation/javascript/release-it/run-5/failure-deep-dives.md` first** (written in the Failure deep-dives milestone). It already corrects one provisional claim: `run-summary.md` first said RUN4-3 (COV-003 `Promise.reject`) was "not observed", and its RUN4-3 row now carries the corrected verdict. The log shows COV-003 firing on shell.js's inner catch in attempt 1 and the agent then adding `recordException` to it, so the fix mechanism fired. shell.js never committed, so it is outside this milestone's scope; take the RUN4-3 verdict from the deep-dives and do not try to re-derive it from the committed files. The deep-dives also record that the un-awaited-return pattern is present in the debug dumps of failed files. The pattern is a `return <call>` with no `await`, inside a `try` whose `finally` calls `span.end()`, so the span ends before the returned promise settles. Check whether the same pattern appears in the 9 committed files, where it would ship in PR #4.
  - **Where the code to evaluate lives**: the 9 committed files are on instrument branch `spiny-orb/instrument-1790686416741` of `~/Documents/Repositories/release-it` (PR #4 in `wiggitywhitney/release-it`), which is also what that checkout currently has checked out. Read an instrumented file with `git -C ~/Documents/Repositories/release-it show spiny-orb/instrument-1790686416741:<path>` and its original with `git -C ~/Documents/Repositories/release-it show main:<path>` (for example `lib/config.js`). Do not change that checkout's branch during per-file evaluation; the IS scoring milestone's step 2 is where it switches to `main`. Delegated per-file subagents should be given these two commands, since they have no session context.
  - **Git hooks are live in this repo as of 2026-10-02.** Commit-msg, pre-commit, and pre-push now run on commits and pushes, and post-commit writes a journal entry for each non-journal commit. The entry appears as a modified or untracked file under `journal/`, so `git status` is rarely fully clean: ignore `journal/` changes when judging whether the tree is clean: run `git status --short | grep -v ' journal/'`, where no output means clean (`grep` exits 1 when nothing matches, which is the clean result, not an error), and read any other line it prints. Commit the journal changes separately with a `journal:` message. The pre-push gate prints an advisory warning that integration and e2e test tiers are missing; that is not a failure. Whitney authorized the `.skip-integration` and `.skip-e2e` opt-outs on 2026-10-05, to be added to `main` with the issue #175 change; do not create them on this branch yourself, and expect the warning until then (the Draft Run-6 PRD milestone says how they reach this branch). If a hook blocks, read what it says and fix that; never use `--no-verify`. Delegated subagents return section text only; the coordinating session writes and commits the files.

- [ ] **PR artifact evaluation**

  Produces: `evaluation/javascript/release-it/run-5/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

  **Cross-file attribute attribution** (cascaded from taze run-17, PRD #147): when compiling the schema-accuracy table, copy each attribute's exact name and file from that file's own `per-file-evaluation.md` section — do not reconstruct the pairing from the narrative summary. Two files handling structurally similar operations can carry differently-named attributes for the same concept, which is easy to conflate when writing from memory.

  **Self-reported findings are a lead, not ground truth** (cascaded from taze run-17, PRD #147, via `docs/language-extension-plan.md`): spiny-orb's own PR-embedded self-flagged findings (e.g., an "Advisory Findings" section) can misattribute line numbers or misapply a rubric rule to the wrong attribute. Treat them as a starting lead for per-file evaluation, not a substitute for it — verify every self-reported finding against the instrumented source directly before accepting or rejecting it during rubric scoring.

- [ ] **Rubric scoring**

  Produces: `evaluation/javascript/release-it/run-5/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

  **Unrubriced findings from per-file evaluation**: every site listed on a `**Unrubriced findings**` line in `per-file-evaluation.md` goes into this file's standing "Unrubriced Findings" section and does not change any dimension score (see the 2026-10-07 Decision Log rows and `exemption-scope.md` item 1). Score each rule by the readings in `exemption-scope.md`, not by a fresh reading of the rubric.

- [ ] **IS scoring run** — **AI runs all commands.** If 0 files committed on the instrument branch: write `NOT EVALUABLE — 0 files committed` to `evaluation/javascript/release-it/run-5/is-score.md` and stop.

  **IS scoring gotchas for release-it**: (1) Docker may be blocked by Datadog MDM policy — download `otelcol-contrib` binary directly from GitHub releases (darwin_arm64) if Docker is unavailable; (2) OTel SDK packages (`@opentelemetry/sdk-node`, `exporter-trace-otlp-http`, `sdk-trace-base`, `resources`) are not in release-it devDependencies — temporarily install via `npm install --save-dev` for the IS scoring run, then revert with `git restore package.json package-lock.json`; (3) `--dry-run` flag is required — without it, release-it will attempt an actual release.

  1. **Prerequisites**: Check whether the persistent `otelcol-contrib` LaunchAgent already holds port 4318: `lsof -i :4318 -sTCP:LISTEN`. If it shows `otelcol-c`, reuse it and skip starting a collector. If a different process holds the port, resolve the conflict first. If nothing is listening, start the Collector with `evaluation/is/otelcol-config.yaml` — use binary if Docker is unavailable (see `evaluation/is/README.md` for binary download instructions). Pre-create output file if missing: `touch evaluation/is/eval-traces.json`. Full setup details: `~/.claude/rules/is-scoring-gotchas.md`.
  2. **Setup**: First run `git switch main` in `~/Documents/Repositories/release-it`. The instrument run leaves the fork on the instrument branch, and both the partial checkout below and the restore in step 4 assume `main` is checked out. On the instrument branch the restore would leave the instrumented files in place while `git status --short` still reported clean. An untracked `.vals.yaml` in that status output is expected. Then find the instrument branch name from the end of `evaluation/javascript/release-it/run-5/spiny-orb-output.log` (look for `Branch:` in the final summary box) or run `gh pr list --repo wiggitywhitney/release-it --json number,headRefName`. In `~/Documents/Repositories/release-it`, run: `git fetch && git checkout <instrument-branch> -- lib/ examples/`. Install SDK packages temporarily: `npm install --save-dev @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-trace-base @opentelemetry/resources`.
  3. **Action**: Record the run's start and end as nanosecond timestamps (`python3 -c 'import time; print(time.time_ns())'`), once immediately before the run and once immediately after it, and write both values into `run-summary.md`. Run release-it with the Collector receiving: `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/release-it.js --dry-run`. Run `sleep 10` so the collector flushes. Then **filter before scoring**: `evaluation/is/eval-traces.json` is append-only and holds spans from every target and every earlier run, so scoring it directly can score another target's spans (commit-story-v2 run-27 got a false 70/100 this way). From the eval repo root, run `node evaluation/is/filter-traces.js --input evaluation/is/eval-traces.json --output evaluation/javascript/release-it/run-5/eval-traces-run5.json --service release-it --start-ns <start-ns> --end-ns <end-ns> --target release-it`. The script keeps only that service's spans that started between the two recorded times (span start times are event times, so no window extension is needed), keeps each span inside its original OTLP envelope, redacts `process.owner`, `host.name`, `host.id`, `process.command_args`, `process.executable.path`, `process.command` and any attribute value that is an absolute path under `/Users`, `/home`, `/private`, `/var`, `/tmp`, `/opt`, `/root`, `/etc`, `/usr`, or a Windows drive (the README lists them), and refuses to write the file if redaction changes the IS score. It must exist on this branch; if it is missing, run `git checkout origin/main -- evaluation/is/filter-traces.js` first. The output file is JSON Lines (one object per line) despite the `.json` extension, so do not convert it to an array. Do not filter by hand (for example with `jq` or your own script): output that loses the OTLP envelope scores as empty or wrong. Score it: `node evaluation/is/score-is.js evaluation/javascript/release-it/run-5/eval-traces-run5.json --target release-it > evaluation/javascript/release-it/run-5/is-score.md`
  4. **Restore**: `git restore package.json package-lock.json` in the release-it fork. Restore `lib/` and `examples/` with the exact-path sequence in `~/.claude/rules/is-scoring-gotchas.md` ("Restoring the target repo after a partial-path branch checkout"), because `git checkout main -- lib/ examples/` alone leaves the instrument branch's added `.instrumentation.md` files behind. Verify with `git status --short`.
  5. **Capture trace artifact** (release-it is a non-organic target — traces only exist during IS scoring, not from daily developer use): Read `evaluation/trace-capture-protocol.md` for the artifact format and full guidance. Then use the `search_datadog_spans` Datadog MCP tool with query `service:release-it from:now-30m` (IS scoring takes several minutes so a 5-minute window is too tight). Retrieve `service.instance.id` from any span in the result. Write `evaluation/javascript/release-it/run-5/trace-artifact.md` — the `query` field should be `service:release-it @service.instance.id:<uuid>`. If no spans appear, wait up to 5 minutes for Datadog ingestion and retry once; if still empty, record trace absence in the artifact and note it in `run-summary.md`.

  **Check for a missing root span** (from per-file correct-skip verification): `lib/index.js` `runTasks` and `lib/cli.js`'s default export got no span (see "Correct Skips (10)" in `per-file-evaluation.md`), so the committed spans have no common root. Static reading predicts that one dry run shows up as several separate traces, each rooted at a `release_it.config.*` or plugin lifecycle span. Count the distinct trace IDs and root spans in the filtered `eval-traces-run5.json` and in `trace-artifact.md`, say whether the prediction held, and carry the result into the per-file "(c) Trace reconciliation" step and the handoff.

  Produces: `evaluation/javascript/release-it/run-5/is-score.md`, `evaluation/javascript/release-it/run-5/trace-artifact.md`

- [ ] **Baseline comparison**

  Compare run-5 against run-4 and run-3, and against the most recent commit-story-v2 run (check `evaluation/javascript/commit-story-v2/run-log.md`). Highlight dimensions that differ by more than 1 point from commit-story-v2.
  Produces: `evaluation/javascript/release-it/run-5/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README**

  After baseline comparison: (1) add a row for run-5 to the release-it run history table in `README.md`; (2) update the "next run" sentence below the release-it run history table to reference run-6 and its primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2)*

  1. Run the cross-document audit agent to verify consistency across all run-5 evaluation artifacts.
  2. Give Whitney an interpreted summary of key findings — failures, root causes, notable patterns, what to watch for in run-6.
  3. Print the absolute file path of `evaluation/javascript/release-it/run-5/actionable-fix-output.md`.
  4. **Pause.** Do not proceed until Whitney confirms handoff.

  **Handoff framing guidance** (from taze run-16):
  - **Fix language targets spiny-orb components, not target files.** "Fix:" entries should describe the spiny-orb component gap — auto-fix, validator, prompt, or fix-loop. Do not write "remove X at line Y of file.ts." Target repo files are overwritten every run; patching them is not durable.
  - **Attribute disappearance is not automatically a finding.** Investigate before calling it wrong — consider semconv basis and whether the absence is a defensible agent decision. Give the spiny-orb team evidence and honest characterization, not a decision-free action list.
  - **Carry-forward table: consider distinguishing findings from observations** — entries with a plausible spiny-orb root cause vs. watch items without a clear basis for calling them wrong.
  - **Fix scope precision** (cascaded from commit-story-v2 run-28): for any fix originally reported across N files, a bare "M of N fixed" ratio conflates "confirmed still broken" with "not evaluated this run" (e.g. a skipped or failed file). State fixed/evaluated and evaluated/total separately (e.g. "5 of 6 evaluated files fixed; 1 of 7 original files not evaluated this run — failed to commit"), or list which specific files are fixed, still-broken, and not-evaluated, so no file's status is ambiguous. Distinguish "the failure pattern no longer reproduces" from "the fix mechanism actually fired" — a file can pass by omission, not because the fix worked. Only the latter is evidence the fix generalizes.

  **Carry in the open questions from `failure-deep-dives.md`** (final section, "What This Deep-Dive Could Not Establish"): (1) validator output for GitBase.js and Git.js attempt 2 is not in the log; (2) which four of npm.js's six changed lines produced the NDS-003 ×4; (3) whether the agent prompt states that LINT is a blocking check; (4) whether NDS-003's Prettier normalization accepts the split form of a return-value-capture line, which needs a reproduction against spiny-orb. Present these as questions for the spiny-orb team, not as findings. The deep-dives also record two validator findings with source evidence: SCH-002's meaning-consistency check is lexical (`cacheKey` versus `command.join(' ')` in shell.js), and no rule checks command-string attribute values for credentials.

  **Carry in the "Rule-fit issues for the handoff" list from `exemption-scope.md`.** Each item is a place where a rule, or the document describing it, does not fit what this run found. Examples: CDQ-001 cannot see a span that ends before its returned promise settles, and `docs/research/evaluation-rubric.md`'s COV-004 text has drifted from `cov004.ts` and `rules-reference.md`. Frame each one as a gap for the spiny-orb team to judge, following the framing guidance above. Also add the process-level items to `lessons-for-run6.md`, so the end-of-run template checkpoint can decide whether other targets' open eval PRDs should adopt the "score the implemented rule where the research rubric has drifted" reading.

  Produces: `evaluation/javascript/release-it/run-5/actionable-fix-output.md`

- [ ] **Draft Run-6 PRD**

  Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint first. Cascade approved process improvements to three places: (1) the template, (2) all other currently active open eval PRDs, and (3) the affected milestones of the Run-6 PRD itself before committing — a cold AI reading only the Run-6 PRD will not re-read the template during the run. Use Type D structure from `docs/language-extension-plan.md` and this PRD as the milestone style reference. Carry forward both user-facing checkpoints. Trace filter for IS scoring (already fixed, verify only): the template (`docs/language-extension-plan.md`, IS scoring step), PRD #168, and the global rule `~/.claude/rules/is-scoring-gotchas.md` were missing the filter or had a too-short window. The fix is a script, `evaluation/is/filter-traces.js`, plus changes that call it. They were opened as PRs: `wiggitywhitney/spinybacked-orbweaver-eval` #172 (script, template, scoring README; merge first), #171 (PRD #168; depends on #172), and `wiggitywhitney/claude-config` #127 (global rule; references the script). All three merged on 2026-10-02 (#172 as `9438c65`, #171 as `12659c2`, #127 as `214b8d7`), so only the live-copy check below remains. The live global rule is a symlink (`~/.claude/rules` points to `claude-config/rules`), so it shows whatever branch the `claude-config` checkout is on, not `main`. Verify both live copies: `grep -c "within a few seconds of this run" ~/.claude/rules/is-scoring-gotchas.md` should print 0 (that is the old wording, so 0 means the rewritten rule is live), `grep -c "filter-traces.js" ~/.claude/rules/is-scoring-gotchas.md` should print at least 1, and `grep -c "Exception: a clean incremental" ~/.claude/rules/git-workflow.md` should print 1 (that paragraph came from `claude-config` #132). A bare `grep "few seconds"` always matches, because the merged rule explains why a few-seconds window is wrong. All three passed on 2026-10-07, after the checkout (branch `feature/prd-109-milestone-b1-capability-spike`) merged `origin/main` (`33d5838` on 2026-10-06 and `a6a53ba` on 2026-10-07). The live rules read that checkout through a symlink, so they fall behind `main` again whenever a PR merges and the branch is not merged forward. If a check fails, find the `claude-config` session with `ListAgents` (its name changes; on 2026-10-07 it was `claude-config-14`), and use `SendMessage` to ask it to merge `origin/main` into its branch, because it owns that checkout. If no such session exists, tell Whitney. Do not edit that checkout from here. Do not re-derive the filter design: span start times are event times, so the window is exactly the recorded start to the recorded end, with a 10-second flush wait and no padding. Trace-scoring follow-ups found 2026-10-02 (cascade scope for the filter script): PRD #143 (content-manager) scores the raw shared `evaluation/is/eval-traces.json` with no filter and with the old `evaluation/content-manager/run-1/` path layout, so its IS step needs to call `evaluation/is/filter-traces.js` with `--service content-manager` (its own step 5 already queries `service:content-manager`); that change is in PR #176 (open as of 2026-10-05; check its state before relying on it). PRD #161 (commit-story-v2 run-29) already filters, more strictly than the script, so do not replace its step with the script as it stands. Migrating #161 first needs a change to `filter-traces.js` adding an `--instance-id` option and a repeatable `--redact-attribute` option; that follow-up is tracked as issue #175, with its ROADMAP entry in PR #176. Whitney authorized the `.skip-integration` and `.skip-e2e` opt-outs on 2026-10-05; they are a criterion on issue #175 and arrive with that PR, after which they can be copied onto this branch with `git checkout origin/main -- .skip-integration .skip-e2e`. Merge the PRD-only PR to main so `/prd-start` can pick it up.

- [ ] **Copy artifacts to main**

  From main, run:
  ```bash
  git checkout feature/prd-100-evaluation-run-5-release-it -- evaluation/javascript/release-it/run-5/
  ```
  Commit with message `eval: save release-it run-5 artifacts to main [skip ci]`. Also bring this branch's journal files to `main`: this branch holds journal entries and summaries that are not on `main`, and the branch never merges, so they would otherwise be stranded (journal files are exempt from the feature-branch requirement, and the global rule forbids deleting a branch whose journal commits are not on `main`). First run `git diff --name-status origin/main feature/prd-100-evaluation-run-5-release-it -- journal`. `A` only means the file is absent from `origin/main`; untracked journal files carry over when you switch branches, so a path can already exist in your working tree on `main`. For each `A` path, test `[ -e <path> ]` on `main` first. Copy only paths that do not exist, with `git checkout feature/prd-100-evaluation-run-5-release-it -- <path>`. For a path that already exists, and for any path marked `M`, merge by hand and never overwrite: journal files are append-only, so for a file under `journal/entries/` append only the sections whose `Commit: <hash>` is missing from the existing file. Files under `journal/summaries/` are whole generated documents with no commit sections to merge: keep the existing file, save the branch's copy outside the repo (for example under `~/journal-alternates/`), and tell Whitney. As of 2026-10-05 every branch file was `A`. Run these from `main` as a separate commit after the artifacts commit, with a message like `docs: bring release-it run-5 journal entries to main [skip ci]`. Then update `evaluation/javascript/release-it/run-log.md` with a new row for this run. Push. This step runs before `/prd-done` so artifacts land on main while the eval branch is still reachable.

---

## Score Projections

**Conservative** (RUN4-1 indentation fix not landed):

- 5 LINT/NDS-003 conflict files still fail
- GitLab.js may still fail (SCH-002 contradiction not fixed)
- **Files committed**: ~7 (same set as run-4)
- **Quality**: 24/25 (COV-003 shell.js may persist until validator fix)
- **Q×F**: ~6.7
- **Cost**: ~$5–7

**Target** (RUN4-1 fix landed):

- GitHub.js (13 methods), GitBase.js (6), GitRelease.js (2), npm.js, and prompt.js now commit cleanly
- GitLab.js uncertain (depends on SCH-002 fix)
- **Files committed**: 11–13
- **Quality**: 24–25/25
- **Q×F**: ~10–12
- **Cost**: ~$8–12 (more LLM calls for class-heavy plugin files)

**Stretch** (RUN4-1 + RUN4-2 both fixed):

- Auto PR creation works
- Full plugin layer instrumented
- **Files committed**: 12–15
- **Quality**: 25/25 if COV-003 validator gap also fixed
- **Q×F**: ~12–15

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| RUN4-1 not fixed (LINT/NDS-003 conflict persists) | Accept result; run-5 still validates run-4's committed files at quality; document gap for run-6 |
| GitLab.js COV-003/SCH-002 persists | Document new failure mode count; add to spiny-orb-findings.md |
| New failure modes surface in previously-blocked plugin files | Document fully in failure-deep-dives; don't count against RUN4-1 fix assessment |
| IS scoring unavailable if 0 committed files | Mark NOT EVALUABLE; do not block milestone |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-07 | Run-5 proceeds regardless of whether RUN4-1 indentation-width fix has landed | Even without the fix, run-5 validates quality on run-4's committed files and produces a valid data point for the trend |
| 2026-05-07 | HOME="$HOME" stays in instrument command | Safe workaround with no downside; removing without confirming spiny-orb fix would risk repeating the weaver timeout failure |
| 2026-05-07 | IS scoring is fully automated — AI runs all commands | Canonical instructions in CLAUDE.md "IS Scoring Runs" section and `docs/language-extension-plan.md` step 9 |
| 2026-09-29 | Build spiny-orb for run-5 from a detached worktree of `origin/main` at `~/Documents/Repositories/spinybacked-orbweaver-main`, not from the primary checkout | The primary checkout was on `feature/prd-373-python-provider` (129 commits ahead of main, including edits to shared files such as `src/validation/chain.ts` and the TypeScript provider) with uncommitted work. Building there would make results non-comparable to prior runs and unattributable to a SHA. A worktree leaves that checkout untouched; the cost is that the instrument command's `node` path changes. |
| 2026-09-29 | Commit the run-5 `spiny-orb-output.log` with `git add -f` | The repository's `*.log` ignore rule excludes it, and tracking is inconsistent across targets (commit-story-v2 tracks 12 of 25 logs, taze 5 of 16, release-it 0 of 5 before this run). The recent taze and commit-story-v2 runs track theirs, and the log is the main evidence for failure deep-dives (agent notes, full validator messages). This eval branch never merges, so file size does not matter, and the Copy artifacts to main milestone carries tracked files to main. |
| 2026-09-29 | Leave the debug dumps unedited when CodeRabbit flags un-awaited returns in them | The dumps are the agent's rejected output for failed files, so fixing them would falsify the evidence. Do not edit anything under `evaluation/javascript/release-it/run-5/debug-dumps/`. The pattern is recorded as a lead in the Failure deep-dives milestone instead. |
| 2026-10-02 | IS scoring filters the shared trace file with `evaluation/is/filter-traces.js` instead of prose steps | Prose steps copied across the template, the global rule, and PRDs drew six separate review findings (spans losing their OTLP envelope, no baseline score before redaction, an unclear clock domain, a missing flush delay, incomplete redaction, an over-wide window). The script keeps each span inside its envelope, redacts, and refuses to write its output if redaction changes the IS score. On the committed taze run-17 traces it kept all 140 spans and scored 77.8 before and after redaction, matching the recorded score. |
| 2026-10-02 | Leave the three early commits that carry a `Co-Authored-By` line (`8f7e684`, `22f01f1`, `1014a0f`) | Removing the line means rewriting about 28 later commits, which would give them new hashes, orphan the hash-keyed journal entries regenerated on 2026-10-02, and force-push a branch that holds the only copy of the run artifacts until step 13. The branch never merges and only file contents reach `main`, so the line never enters `main`'s history. Revisit only after step 13 if the branch is to be archived publicly. |
| 2026-10-02 | Remove the eval repo's stale local `core.hooksPath` instead of repointing it | The setting pointed at `~/Documents/Repositories/commit-story-v2-eval/.git/hooks`, the repo's pre-rename directory, which no longer exists, and a local value overrides the global Datadog hook shim, so no commit-msg, pre-commit, pre-push, or post-commit hook ran here. Removing it matches the other repos that use the global path. Repointing to the repo's own hooks directory would bypass the shim and keep a path-based setting that can go stale again. Verified with a live journal entry from a commit-triggered hook and a push through the live pre-push gate. The config backup is `~/hook-backups-2026-10-02/spinybacked-orbweaver-eval.git-config.before-hooksPath-fix.bak`. |
| 2026-10-02 | Do not point PRD #161's trace scoring at `evaluation/is/filter-traces.js` yet; do point PRD #143's at it | #161 already filters more strictly than the script: it matches `service.instance.id` (commit-story-v2 runs itself concurrently, so service name plus a time window can include another session), scores a pre-redaction baseline, and redacts `commit_story.commit.author`. The script has no `--instance-id` or extra-redaction option. #143 scores the raw shared file with no filter at all and should be pointed at the script; that change is not yet made (see the Draft Run-6 PRD milestone). |
| 2026-10-05 | Commit hook-written journal files on the eval branch as they appear, and bring them to `main` in step 13 | The hook writes journal entries into whichever branch is checked out. This branch never merges, so by 2026-10-05 it held 9 journal files not on `main`. Committing them here preserves them on origin immediately, and step 13 moves them to `main` using the repo's earlier "bring journal to main" practice. Committing straight to `main` now would need a separate worktree and would move only some of the files. Leaving them uncommitted risks losing them. |
| 2026-10-05 | Opt this repo out of the integration and e2e test-tier warnings with `.skip-integration` and `.skip-e2e`, added in the #175 PR and not in a dedicated PR | The tier check is advisory only (the hook script always exits 0) and detects tiers by file and directory names, so this repo's real-CLI tests in `filter-traces.test.js` are not recognized. The repo is evaluation data plus two small scripts with unit tests, so a waiver is honest. The testing rules require explicit authorization to skip a tier, which Whitney gave on 2026-10-05. A dedicated PR plus review to silence an advisory warning was judged not worth it, so the files ride with the next PR to `main`. Revisit if the scripts grow substantially. |
| 2026-10-07 | Score un-awaited returns inside a span's `try`/`finally` as unrubriced findings, and keep CDQ-001 PASS when `span.end()` is in `finally` | CDQ-001's mechanism is the finally-block check, so a span that ends before its returned promise settles passes it literally. Scoring that as a FAIL would make CDQ-001 incomparable with runs 1–4, which probably had the pattern unscored. The fix work goes into the handoff as two gaps: no validator rule detects it, and NDS-003 rejects the `await` that would fix it. The pattern ships in PR #4 (GitRelease.js, GitHub.js). Decided with Whitney. |
| 2026-10-07 | Score per the implemented spiny-orb rule where `docs/research/evaluation-rubric.md` has drifted from it (COV-004), but apply the rubric mechanism where the implemented narrowing is a visibility limit rather than a design choice (RST-003 cross-file wrappers) | `cov004.ts` and `rules-reference.md` deliberately exclude sync functions, while the research rubric still lists I/O-library calls. `rules-reference.md` calls RST-003's same-file narrowing "a known accepted gap" because the per-file validator cannot see other files, and this evaluation can. Both drifts are on the rule-fit list for the handoff. Whitney asked that no clause be ignored and that misfits be recorded rather than dropped. |
| 2026-10-07 | Interpretation calls during per-file evaluation are made by the coordinating session and recorded in `exemption-scope.md` | Whitney delegated them after six consecutive questions, on the condition that no rule or clause is ignored and every misfit is listed for the handoff. She raised the concern that the questions came up more often than in past runs. The reasons are that the pre-commitment step is new (added 2026-09-18), this run scores 28 rows per file against run-4's 21, and this run is the first to check the rubric against the implemented rules. |
| 2026-10-07 | Keep COV-003 PASS at un-awaited-return sites and let the item-1 unrubriced finding carry the missed rejection (`exemption-scope.md` item 9) | The span callback returns a promise and does not throw, so the COV-003 path test does not apply; scoring the same defect under COV-003 too would count it twice. Batch 2 also fixed four more readings (token-identical reflow passes NDS-003, nullable-source CDQ-007, wrapper spans pass COV-006, value-concept SCH-002), none reversing a precedent. |
| 2026-10-07 | Record the two questionable skips (`lib/index.js`, `lib/cli.js`) as handoff findings, not COV-001 or COV-004 FAILs (`exemption-scope.md` item 14) | The rubric's evaluation scope note says a never-instrumented file "cannot fail a coverage rule — it is a coverage gap for the run", and commit-story-v2 run-27 handled `reflection-tool.js` the same way. The skips come from two pre-scan gaps reproduced on a55bd92: export detection misses `export default <name>` and anonymous default arrows, and the `process.exit()` carve-out then drops `runTasks`. Runs 3 and 4 accepted the "pure sync" label for both files without checking |

---

## Prior Art

- **PRD #53**: run-1 evaluation (this repo, branch `feature/prd-53-javascript-eval-setup`)
- **PRD #68**: run-2 evaluation (this repo, branch `feature/prd-68-evaluation-run-2-release-it`)
- **PRD #77**: run-3 evaluation (this repo, branch `feature/prd-77-evaluation-run-3-release-it`)
- **PRD #88**: run-4 evaluation (this repo, branch `feature/prd-88-evaluation-run-4-release-it`)
- **evaluation/javascript/release-it/run-4/actionable-fix-output.md**: P1/P2 findings, blockers for run-5
- **spinybacked-orbweaver/research/evaluation-rubric.md**: 32-rule rubric
