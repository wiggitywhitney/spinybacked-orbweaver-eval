# PRD #177: JavaScript Evaluation Run-6: release-it — Schema Fidelity, Span Timing, and the LINT/NDS-003 Remainder

**Status:** Not Started
**Created:** 2026-10-12
**GitHub Issue:** [#177](https://github.com/wiggitywhitney/spinybacked-orbweaver-eval/issues/177)
**Depends on:** PRD #100 (run-5 complete, findings in `evaluation/javascript/release-it/run-5/actionable-fix-output.md`)

---

## Read This First

Read `docs/language-extension-plan.md` completely before proceeding with any other milestone.

---

## Problem Statement

Run-5 committed more files and spans than any earlier release-it run, for less money: 9 of 23 files, 33 spans, $6.55, Q×F 7.0. Four run-4 failures now commit, including GitHub.js (13 spans) and GitLab.js (never committed before), and the PR was created automatically for the first time. Quality fell on the shared rule set (18/24 against run-4's 23/24). Most of that drop is not a regression: 7 of the 14 per-file failures are in files committed for the first time, and 3 are stricter scoring of unchanged code. Schema fidelity (SCH) is the only dimension that moved by more than 1 point (4/4 → 1/4).

**Run-5 results (baseline for run-6 comparison)**:

| Metric | Run-5 |
|--------|-------|
| Files processed | 23/23 |
| Committed | 9 |
| Failed | 4 (GitBase.js LINT, Git.js LINT, npm.js NDS-003 ×4, shell.js SCH-002) |
| Skips | 10 (8 confirmed correct, 2 questionable: `lib/index.js`, `lib/cli.js`) |
| Quality | 21/27 (78%) on run-5's rule set; 18/24 (75%) on the 24 rules shared with run-4 |
| Gates | 5/5 |
| Spans | 33 |
| Cost | $6.55 |
| Push / PR | YES / auto PR #4 |
| Q×F | 7.0 (6.8 shared) |
| IS | 100/100 (18 spans in 10 traces) |

### Run-5 findings and their spiny-orb sequencing

spiny-orb triaged the run-5 handoff into issues #1082–#1093 plus evidence comments on #1072, #1036, #1060, and #927. As of 2026-10-12 every issue below is **open**, and spiny-orb's `docs/ROADMAP.md` on `main` places all of them after the Go language provider ships. None is guaranteed to land before run-6, so a recurrence of any finding below is expected, not a surprise. Pre-run verification re-checks each one.

| Finding | spiny-orb issue | ROADMAP tier (2026-10-12) | Expected in run-6 if not landed |
|---------|-----------------|---------------------------|---------------------------------|
| RUN5-1 counts recorded as text (SCH-003 auto-fix ordering bug) | #1072 | Short-term (after Go) | factory.js, GitLab.js, util.js casts recur |
| RUN5-9 deliverables publish absolute local paths | #1092 | Short-term (after Go) | Live-check report and PR body carry the home path |
| RUN4-1 remainder: whole-file path does not Prettier-normalize output | #1093 | Short-term (after Go) | GitBase.js, Git.js, npm.js commit or fail by attempt luck |
| RUN5-2 / RUN5-6 SCH-002 meaning check (too loose on registered keys, too strict on identifiers) | #1084 | Short-term (after Go) | shell.js fails SCH-002 again; registered-key reuse passes |
| RUN5-4 spans end before their returned promise settles | #1083 | Short-term (after Go) | 7 committed un-awaited-return sites recur |
| RUN5-5 pre-scan misses `export default` entry points | #1085 | Short-term (after Go) | `lib/index.js` and `lib/cli.js` skipped; trace has no root |
| PR summary undercounts attributes | #1036 | Short-term (after Go) | "Attrs Reused" reads 0 |
| RUN4-4 semantic-duplicate judge messages and namespace scope | #1086 | Medium-term | GitLab.js contradictory SCH-002 pair recurs |
| RUN5-7 validator feedback that left code worse | #1089 | Medium-term | factory.js COV-003, GitLab.js double exception events |
| RUN5-10 / RUN5-15 CDQ-007 accuracy and credential values | #1088 | Medium-term | Advisory false positives; credential-bearing values pass |
| RUN5-14 notes contradict committed code | #1087 | Medium-term | Companion notes diverge from diffs |
| CDQ-007 sub-checks collapse in PR summary | #1060 | Medium-term | One undifferentiated bullet |
| RUN5-3 schema-type precision (string default, guard-admitted types, SCH-004 namespace tokens) | #1091 (depends on #1072) | Medium-term | prompt.js boolean declared `string`; `false` reaches `increment` |
| RUN5-11 / RUN5-12 / RUN5-13 live-check and PR-body accuracy | #1090 | Long-term | "OK" over partial report; oversized failed-file rows |
| Rule-fit items and rubric drift | #1082 | Long-term | Scored under the standing readings in `docs/language-extension-plan.md` step 6 |

### Primary Goal

Produce a run-6 data point on the current spiny-orb `main`, and for each finding above record whether its fix landed before the run and whether it reproduced. If no fix lands, run-6 measures run-to-run variance on the same failure set (Conservative projection). If #1093 and #1084 land, run-6 tests whether Git.js, shell.js, GitBase.js, and npm.js commit (Target projection).

---

## Solution Overview

Same milestone structure as all Type D eval runs (`docs/language-extension-plan.md`). Pre-run verification checks each spiny-orb issue's state and whether its merge commit is in the build. The IS scoring run uses the command that worked in run-5 and checks whether the bootstrap drops spans at `process.exit(0)`.

### Three-Repo Workflow

| Repo | Path | Role |
|------|------|------|
| **release-it** (target) | `~/Documents/Repositories/release-it` | spiny-orb instruments this repo |
| **spinybacked-orbweaver-eval** (evaluation) | `~/Documents/Repositories/spinybacked-orbweaver-eval` | Evaluation artifacts live here |
| **spinybacked-orbweaver** (agent) | Decided in pre-run verification (item 8): the detached worktree `~/Documents/Repositories/spinybacked-orbweaver-main` at `origin/main`, unless the primary `spinybacked-orbweaver` checkout is on a clean `main` | The spiny-orb agent |

### Eval Branch Convention

The feature branch for this PRD (`feature/prd-177-evaluation-run-6-release-it`) **never merges to main**. The PR exists for CodeRabbit review only. Run `/prd-done` at completion to close issue #177 without merging the eval branch. The Copy artifacts to main milestone preserves the run artifacts on main before the PR is closed.

---

## Success Criteria

1. All 23 `lib/` files processed, and a quality score produced across all six dimensions on run-6's rule set and on the rules shared with run-5.
2. For every finding in the sequencing table, the run records whether its fix landed in the build (merge commit is an ancestor of the build SHA) and whether the finding reproduced.
3. Q×F > 7.0 if #1093 or #1084 landed; otherwise Q×F within the Conservative range (about 6.5–7.5), with any move outside it explained.
4. PR created in wiggitywhitney/release-it (auto, or from `spiny-orb-pr-summary.md` if auto creation fails).
5. IS scoring run records the exact command and checks whether a shutdown hook recovers spans lost at `process.exit(0)`.
6. Both user-facing checkpoints completed (Findings Discussion and handoff pause).
7. All evaluation artifacts generated from the canonical methodology.

---

## Milestones

- [ ] **Step 0 — Bootstrap reading.** Before proceeding with any other milestone, read these documents in order:
  1. `docs/language-extension-plan.md` — completely. Note step 6's "Standing scoring readings" paragraph and the "Attribute types come from the OTLP export" paragraph; both apply to this run.
  2. `prds/115-evaluation-run-22.md` — canonical Type D milestone style reference. **Release-it is non-organic** (unlike commit-story-v2): the trace artifact is created during IS scoring (step 9.5), not during pre-run verification.
  3. `evaluation/javascript/release-it/run-5/actionable-fix-output.md` — prior run findings. §2 (schema-fidelity patterns), §5 (failed files), §6 (new findings), and §9 (unresolved items) drive this run's pre-run verification.
  4. `evaluation/javascript/release-it/run-5/lessons-for-run6.md` — carry-forward items 1–6.
  **Do not mark this complete until you have read all four documents.** Items 3 and 4, and every other `run-5/` file this PRD cites (`exemption-scope.md`, `rubric-scores.md`, `pr-evaluation.md`), reach `main` through PRD #100's "Copy artifacts to main" milestone. If `evaluation/javascript/release-it/run-5/` is missing on `main`, that milestone has not run: stop and tell Whitney rather than reading the files from the `feature/prd-100-evaluation-run-5-release-it` branch.

- [ ] **Step 0.5 — Cross-run process review** *(user-facing checkpoint — template changes require user approval)*. Follow the full procedure in `docs/language-extension-plan.md` Step 0.5. Release-it's most recent completed run is run-5 (`actionable-fix-output.md` present). Compare against the most recent completed run of every other target under `evaluation/<language>/*/`. Present the three-section report and make no template edits without explicit approval. If no cross-target run is more recent than release-it run-5, record that as this step's completion.

- [ ] **Collect skeleton documents**

  Create `evaluation/javascript/release-it/run-6/` in the eval repo with skeleton files:
  - `lessons-for-run7.md` (copy the structure of `evaluation/javascript/release-it/run-5/lessons-for-run6.md`)
  - `spiny-orb-findings.md` (fresh skeleton with P1/P2/P3 sections)

- [ ] **Pre-run verification**

  1. **Target repo readiness** *(runs first — later checks assume a clean, on-`main` checkout)*: run `git status --short --branch` in `~/Documents/Repositories/release-it`. If it is not on `main`, or reports leftover artifact files from run-5's IS scoring (OTel devDependencies in `package.json`/`package-lock.json`, `.instrumentation.md` files, a `bin/release-it` symlink), switch to `main` and remove the leftovers before proceeding. An untracked `.vals.yaml` is required config; leave it. If the target's own test suite fails, fix it on a branch + PR, never by a direct commit to the fork's `main`.
  2. **Datadog MCP health check**: run `search_datadog_spans` with `service:release-it` for the last 1 hour. If it errors (not just "no results"), re-run `/ddsetup`, then `/reload-plugins`, before any other Datadog-dependent step.
  3. **spiny-orb issue status — CHECK each issue in the sequencing table**: re-read the ROADMAP (`gh api "repos/wiggitywhitney/spinybacked-orbweaver/contents/docs/ROADMAP.md?ref=main" -H "Accept: application/vnd.github.raw"`) and run `gh issue view <N> --repo wiggitywhitney/spinybacked-orbweaver --json state,closedAt,closedByPullRequestsReferences` for each of #1072, #1092, #1093, #1084, #1083, #1085, #1036, #1086, #1089, #1088, #1087, #1060, #1091, #1090, #1082. Count a fix as landed only when the issue was closed by a merged PR on spiny-orb `main` whose merge commit is an ancestor of the build SHA from item 8: `git -C <build-checkout> merge-base --is-ancestor <merge-sha> <build-sha>` exits 0. Write one row per issue into `lessons-for-run7.md` (issue, state, merge SHA or "open", landed yes/no). Update the Score Projections section's "which scenario applies" line before the run.
  4. **Targeted re-checks for landed fixes**: for each landed fix, name the run-5 file and line it should change (from `actionable-fix-output.md`) so the Findings Discussion can say whether it fired. If #1085 landed, rerun the pre-scan on the originals of `lib/index.js` and `lib/cli.js` and record whether each is now classified as an entry point. Procedure: copy each original out with `git -C ~/Documents/Repositories/release-it show main:<path>` into a scratch directory outside the repos; symlink the build checkout's `node_modules` into that directory (an ESM import of `dist/` fails with `ERR_MODULE_NOT_FOUND` for `ts-morph` otherwise); then call `preInstrumentationAnalysis(code)` on the provider class exported by `<spiny-orb-checkout>/dist/languages/javascript/index.js`.
  5. **Push-auth dry run**: `vals exec -i -f ~/Documents/Repositories/release-it/.vals.yaml -- bash -c 'git -C ~/Documents/Repositories/release-it push --dry-run https://x-access-token:$GITHUB_TOKEN_RELEASE_IT@github.com/wiggitywhitney/release-it.git HEAD:refs/heads/spiny-orb/auth-test'` must print `[new branch]`. Any authentication error means the token is wrong; stop.
  6. **GIT_CONFIG_GLOBAL override**: confirm `~/.config/spiny-orb-eval/gitconfig` exists.
  7. **File inventory**: `find lib -name "*.js" | wc -l` from `~/Documents/Repositories/release-it/` should print 23. If it differs, record the new count and adjust success criterion 1.
  8. **Build spiny-orb from `main`**: run `git -C ~/Documents/Repositories/spinybacked-orbweaver status --short --branch`. If the primary checkout is on a clean `main`, `git pull` and build there. Otherwise use the detached worktree `~/Documents/Repositories/spinybacked-orbweaver-main`: run `git -C ~/Documents/Repositories/spinybacked-orbweaver fetch`, then in the worktree `git checkout --detach origin/main && npm ci && npm run build`. If the worktree no longer exists, create it with `git -C ~/Documents/Repositories/spinybacked-orbweaver worktree add --detach ~/Documents/Repositories/spinybacked-orbweaver-main origin/main`. Record the build SHA and the checkout path, and use that path in the instrument command.
  9. **Record versions**: Node.js version, spiny-orb version and SHA, release-it version.
  10. Append observations to `evaluation/javascript/release-it/run-6/lessons-for-run7.md`.

- [ ] **Evaluation run-6**

  Whitney runs `spiny-orb instrument` in her own terminal. **Do NOT run the command yourself.**

  Create `evaluation/javascript/release-it/run-6/debug-dumps/` before handing Whitney the command.

  **Instrument command** (run from `~/Documents/Repositories/release-it/`; replace `<spiny-orb-checkout>` with the path recorded in pre-run item 8):
  ```bash
  caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL="$HOME/.config/spiny-orb-eval/gitconfig" vals exec -i -f ~/Documents/Repositories/release-it/.vals.yaml -- bash -c 'set -o pipefail; GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node <spiny-orb-checkout>/bin/spiny-orb.js instrument lib --verbose --thinking --debug-dump-dir ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/release-it/run-6/debug-dumps 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/javascript/release-it/run-6/spiny-orb-output.log'
  ```

  Notes: `HOME="$HOME"` is no longer needed; spiny-orb forwards HOME to every weaver subprocess (2026-10-10 Decision Log row of PRD #100). `set -o pipefail` sits inside the `bash -c` because the pipe runs in that inner shell. `vals exec` reads the release-it fork's `.vals.yaml`, not the eval repo's. Source directory is `lib/`. Run-5 saw 5–10 minute log stalls on Git.js, GitHub.js, and npm.js while the process stayed alive; treat a stall as normal unless it outlasts the stalled-run guidance in `docs/language-extension-plan.md` step 3.

  The instrument branch name is on the `Branch:` line of the log's final summary box; `gh pr list --repo wiggitywhitney/release-it --json number,headRefName` also lists it. Every later `<instrument-branch>` in this PRD means that name.

  AI role: (1) confirm readiness; (2) once Whitney provides the log, save it as `evaluation/javascript/release-it/run-6/spiny-orb-output.log`, stage it with `git add -f`, and write `evaluation/javascript/release-it/run-6/run-summary.md`; (3) push the eval branch to origin immediately; (4) if auto PR creation failed, create the PR from the file spiny-orb already wrote, never a shortened manual body: `gh pr create --body-file ~/Documents/Repositories/release-it/spiny-orb-pr-summary.md --repo wiggitywhitney/release-it --head <instrument-branch> --title "..."`.

  **Eval-branch PR** (`docs/language-extension-plan.md` step 3a): after pushing, open a PR for this PRD's eval branch with `gh pr create --base main` and leave it open; it never merges. Title: `eval(prd-177): release-it run-6 evaluation — <quality score> quality, Q×F <score>, IS <score>/100`. Fill in the scores after rubric scoring and IS scoring.

  **Hard prerequisite check**: confirm Step 0.5, the skeleton documents, and pre-run verification are all fully complete before handing Whitney the command. Running out of order forecloses pre-run-only steps permanently.

  **Fix-verification claims**: do not conclude "no recurrence" of a run-5 finding from the log's Schema Extensions or Agent Notes prose alone. Label every fix-verification claim in `run-summary.md` as provisional pending per-file evaluation.

  **Attempt counts**: read each file's own result block in the log. The count appears on the `✅ SUCCESS` line, on a line beginning with three backticks for LINT failures, and at the end of the wrapped validator message for NDS-003 failures. A single grep misses at least one of these.

- [ ] **Findings Discussion** *(user-facing checkpoint 1)*

  After `run-summary.md` is written, before any evaluation documents: report to Whitney with a raw overview of files committed, failed, and partial, cost, push and PR status, and the top 1–2 surprises. Present it as a ✅ / ❌ / 🟡 table against run-5 plus totals. For each landed fix from pre-run item 3, say whether the run-5 site it targets changed. Conversational, under 10 lines. Wait for acknowledgment before proceeding.

- [ ] **Failure deep-dives**

  Root cause analysis for each failed or partial file, for each committed file that took ≥ 3 attempts and has a quality failure, and for run-level failures (`docs/language-extension-plan.md` step 5).
  Produces: `evaluation/javascript/release-it/run-6/failure-deep-dives.md`
  Style reference: `Read docs/templates/eval-run-style-reference/failure-deep-dives.md`

  Check all three sources before drawing a conclusion: the log, the debug dump, and the diagnostic protocol in `docs/language-extension-plan.md`. Do not edit anything under `debug-dumps/`; the dumps are the agent's rejected output and serve as evidence. Before attributing an edit to the agent, check whether a spiny-orb deterministic fixer made it (RUN5-1 was an auto-fix, not agent behavior): reproduce from the build's `dist/` if the edit is absent from the agent's thinking and notes. Carry forward run-5's open questions (§7 of its handoff) and answer any the run-6 log now settles.

- [ ] **Per-file evaluation**

  Full rubric on ALL committed and partial files.
  Produces: `evaluation/javascript/release-it/run-6/per-file-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/per-file-evaluation.md`

  **Batching constraint**: spawn per-file subagents in batches of up to 5. Per batch: spawn → collect results → append to `per-file-evaluation.md` → `/prd-update-progress` → `/clear` → next batch. Full wording: `docs/language-extension-plan.md` step 6.

  **Exemption-scope pre-commitment** — write `evaluation/javascript/release-it/run-6/exemption-scope.md` before spawning the first batch. Start from run-5's `exemption-scope.md` (seventeen readings) and carry each reading forward unless run-6 evidence contradicts it; say so in the file where it does. Paste the file's text into every delegated subagent's prompt, since subagents have no session context.

  **Cascaded from release-it run-5** (full text in `docs/language-extension-plan.md` step 6):
  - **Standing scoring readings**: score the implemented rule where spiny-orb's research rubric has drifted from it, recording the drift as a rule-fit item, except where the narrowing is a visibility limit (RST-003 same-file delegation), where you score the rubric's mechanism. Score CDQ-011, not CDQ-008. COV-002 and COV-006 are N/A, not PASS, for a file with nothing the rule checks. SCH-004's Jaccard step only flags candidates; the semantic check decides.
  - **Record interpretation calls yourself**: make interpretation calls without pausing for approval on each, record each in `exemption-scope.md`, never drop a rule clause to make a verdict fit, and add every misfit to its "Rule-fit issues for the handoff" list. Ask Whitney only about a call that would reverse an earlier run's or another target's precedent.
  - **Attribute types come from the OTLP export, not Datadog**: Datadog shows booleans as quoted strings. Take SCH-003 types from `boolValue` / `intValue` / `stringValue` in `eval-traces-run6.json`.

  **Cascaded from earlier runs**: trace supplementation is the coordinating session's job, run as a separate pass after all batches return; redact live-trace PII in the same edit that cites it; run the rule-ID label audit over every row before reconciliation; per-file evaluation is the authoritative fix-verification check and may correct `run-summary.md`; run correct-skip verification on every skipped file from source, because release-it's pre-scan skips have no analysis block in the log.

  **Step 0 — Trace supplement**: release-it is non-organic, so the trace artifact exists only after the IS scoring run. Write every section from static review first and mark trace supplementation "unavailable (IS scoring not yet run)". Run the IS scoring run, then a trace reconciliation pass that folds trace evidence into each section, **before** PR artifact evaluation and rubric scoring (PRD #100's 2026-10-08 Decision Log row explains the ordering).

  **Where the code lives**: read an instrumented file with `git -C ~/Documents/Repositories/release-it show <instrument-branch>:<path>` and its original with `git -C ~/Documents/Repositories/release-it show main:<path>`. Give delegated subagents both commands. In zsh, quote branch-and-path arguments as `"${B}:path"`, because `$B:s` reads as a substitution modifier.

  **Key watch items** (each from the run-5 handoff; check whether it recurs, and whether a landed fix changed it):
  - factory.js L100–101, GitLab.js L152, util.js L109 — counts cast to `String()` (RUN5-1, #1072).
  - factory.js L30, GitRelease.js L70, GitHub.js L603 — registered keys holding a related but different value (RUN5-2, #1084).
  - config.js L124, Version.js L84, prompt.js L23 — `false` or a boolean reaching a string attribute (RUN5-3, #1091).
  - GitRelease.js L66/L71, GitHub.js L185/L189/L199/L355/L522 — un-awaited returns inside a span's `try` (RUN5-4, #1083). Score as unrubriced findings, CDQ-001 PASS when `span.end()` is in `finally`, per PRD #100's 2026-10-07 row.
  - factory.js `load` error recording and GitLab.js double exception events (RUN5-7, #1089).
  - Companion notes against the committed code in every file (RUN5-14, #1087).

  **Git hooks**: post-commit writes a journal entry for each non-journal commit. Judge tree cleanliness with `git status --short | grep -v ' journal/'` (no output means clean). Commit journal changes separately with a `journal:` message. The pre-push gate warns that integration and e2e tiers are missing until `.skip-integration` and `.skip-e2e` reach `main` with issue #175; that warning is not a failure. Never use `--no-verify`.

- [ ] **PR artifact evaluation**

  Produces: `evaluation/javascript/release-it/run-6/pr-evaluation.md`
  Style reference: `Read docs/templates/eval-run-style-reference/pr-evaluation.md`

  Read the PR with `gh pr view <N> --repo wiggitywhitney/release-it --json body,files` (always pass `--repo`). Compare against `evaluation/javascript/release-it/run-5/pr-evaluation.md`. Check each run-5 PR finding: local paths in the live-check report and body (RUN5-9, #1092; describe a path, never paste it), advisory accuracy (RUN5-10, #1088), the Span Category Breakdown columns (RUN5-11, #1036), the "OK" status line over a partial report (RUN5-12), and failed-file row size (RUN5-13). Count advisory sites in the PR body and in companion files separately and together, as run-5 did. Copy each attribute's name and file from its own per-file section, not from the narrative. Treat spiny-orb's self-reported findings as leads to verify, not ground truth.

- [ ] **Rubric scoring**

  Run after the IS scoring run and the trace reconciliation pass.
  Produces: `evaluation/javascript/release-it/run-6/rubric-scores.md`
  Style reference: `Read docs/templates/eval-run-style-reference/rubric-scores.md`

  Use `evaluation/javascript/release-it/run-5/rubric-scores.md` as the structure and prior-run comparison. Report the total on run-6's rule set and again on the rules shared with run-5. Score each rule by the readings in `exemption-scope.md`. List unrubriced findings (for example un-awaited returns) in the standing "Unrubriced Findings" section without changing any dimension score. Classify each per-file failure by origin as run-5 did (first-time commit, stricter scoring, validator-driven change, spiny-orb deterministic fixer, unclassified). Q×F is files committed × quality fraction.

- [ ] **IS scoring run** — **AI runs all commands.** If 0 files committed on the instrument branch, write `NOT EVALUABLE — 0 files committed` to `evaluation/javascript/release-it/run-6/is-score.md` and stop.

  1. **Prerequisites**: `lsof -i :4318 -sTCP:LISTEN`. If it shows `otelcol-c`, reuse it. If another process holds the port, resolve that first. If nothing listens, start the Collector per `~/.claude/rules/is-scoring-gotchas.md`.
  2. **Setup**: `git switch main` in `~/Documents/Repositories/release-it`, then `git fetch && git checkout <instrument-branch> -- lib/ examples/`. Install the SDK temporarily: `npm install --save-dev @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/sdk-trace-base @opentelemetry/resources`.
  3. **Action**: record the start time (`python3 -c 'import time; print(time.time_ns())'`), run the command run-5 scored with, record the end time, write both into `run-summary.md`, and `sleep 10`:
     ```bash
     vals exec -i -f ~/Documents/Repositories/release-it/.vals.yaml -- env OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/release-it.js --dry-run --ci --no-npm --git.requireCleanWorkingDir=false
     ```
     Record this exact command in `run-summary.md` so run-7 can compare span counts. Confirm no tag or release was created: `git ls-remote --tags origin <version>` and `gh release view <version> --repo wiggitywhitney/release-it` both find nothing.
  4. **Filter and score**: from the eval repo root, `node evaluation/is/filter-traces.js --input evaluation/is/eval-traces.json --output evaluation/javascript/release-it/run-6/eval-traces-run6.json --service release-it --start-ns <start-ns> --end-ns <end-ns> --target release-it`, then `node evaluation/is/score-is.js evaluation/javascript/release-it/run-6/eval-traces-run6.json --target release-it > evaluation/javascript/release-it/run-6/is-score.md`. If the script is missing on this branch, `git checkout origin/main -- evaluation/is/filter-traces.js` first. Do not filter by hand. Before committing, `grep --count "$(whoami)" evaluation/javascript/release-it/run-6/eval-traces-run6.json` must print `0`.
  5. **Flush check (carry-forward item 5)**: run-5 lost `release_it.github.comment_on_resolved_items` because `examples/instrumentation.js` calls `sdk.shutdown()` only on SIGTERM and SIGINT, while release-it ends with `process.exit(0)`. After the scored run, make a scratch copy of `examples/instrumentation.js` outside the fork, and in that copy wrap `process.exit` so it awaits `sdk.shutdown()` before exiting. A `beforeExit` listener does not work, because `process.exit()` skips `beforeExit`. Rerun step 3's command with `--import` pointing at the scratch copy, recording its own start and end times, filter that run into `evaluation/javascript/release-it/run-6/eval-traces-run6-hooked.json`, and compare its span count with the scored run's. Do not commit the scratch bootstrap to the fork. Record both counts in `run-summary.md`. Score IS on the unmodified bootstrap's run so the figure compares with run-5; report the hooked run's count as the under-count measurement. If the hook recovers spans, add a carry-forward item proposing the fix to the eval's bootstrap copy in `evaluation/examples/`.
  6. **Restore**: `git restore package.json package-lock.json`, then `git reset HEAD -- lib/ examples/ && git checkout -- lib/ examples/ && find lib/ examples/ -name '*.instrumentation.md' -delete`. Verify with `git status --short`.
  7. **Capture trace artifact**: read `evaluation/trace-capture-protocol.md`, then `search_datadog_spans` with `service:release-it from:now-30m`. Write `evaluation/javascript/release-it/run-6/trace-artifact.md` with `query: service:release-it @service.instance.id:<uuid>`. If no spans appear, wait up to 5 minutes and retry once; if still empty, record trace absence.
  8. **Correlated signals check**: per `docs/language-extension-plan.md` step 9.6. Note any gap in `run-summary.md`; do not block on it.

  **Root-span check**: count distinct trace IDs and root spans in `eval-traces-run6.json`. Run-5 had 10 traces with no common root (RUN5-5). If #1085 landed and `lib/index.js` committed, expect a single root.

  Produces: `evaluation/javascript/release-it/run-6/is-score.md`, `evaluation/javascript/release-it/run-6/trace-artifact.md`, `evaluation/javascript/release-it/run-6/eval-traces-run6.json`

- [ ] **Baseline comparison**

  Compare run-6 against run-5 and run-4, and against the most recent commit-story-v2 and taze runs (check each `run-log.md`). Use the shared-rule figures for the "more than 1 point" test, since rule sets differ across runs; leave CDQ-008 out of the shared set. Say which IS command each run used. Run-4's was never recorded, and run-5's 18 spans under-count what ran by at least one.
  Produces: `evaluation/javascript/release-it/run-6/baseline-comparison.md`
  Style reference: `Read docs/templates/eval-run-style-reference/baseline-comparison.md`

- [ ] **Update root README**

  Add a row for run-6 to the release-it run history table in `README.md` and update the "next run" sentence below it to run-7 and its primary goals.

- [ ] **Actionable fix output** *(user-facing checkpoint 2)*

  1. Write `evaluation/javascript/release-it/run-6/actionable-fix-output.md`, using `evaluation/javascript/release-it/run-5/actionable-fix-output.md` as the format model. Then spawn a cross-document audit subagent with the Agent tool. Prompt it to read every run-6 artifact, cross-reference each finding against the handoff, and return one row per gap (source document and section, item, missing or figure mismatch), without editing files. Add each missing item, correct each mismatch at its source, and record any deliberate exclusion with a reason under "Audit exclusions".
  2. Give Whitney an interpreted summary of failures, root causes, notable patterns, and what to watch in run-7.
  3. Print the absolute path of `evaluation/javascript/release-it/run-6/actionable-fix-output.md`.
  4. **Pause.** Do not proceed until Whitney confirms handoff.

  **Rule-fit issues**: carry the "Rule-fit issues for the handoff" list from `exemption-scope.md` into the handoff. Frame each item as a gap for the spiny-orb team to judge, not a prescribed change.

  **Handoff framing** (`docs/language-extension-plan.md` step 11): target the spiny-orb component (auto-fix, validator, prompt, fix loop), not release-it lines. Separate findings from observations in the carry-forward table. For each run-5 finding, state fixed/evaluated and evaluated/total separately, and distinguish "the pattern no longer reproduces" from "the fix mechanism fired". For each finding, cite its spiny-orb issue number from the sequencing table rather than re-describing the whole issue, and add only what run-6 changed. When Whitney confirms the handoff, check each finding's ROADMAP tier and record it for run-7's goals section. Label single-run evidence as an observation to confirm.

- [ ] **Draft Run-7 PRD**

  Follow `docs/language-extension-plan.md` step 12. Complete the template-update checkpoint first, then cascade approved improvements to the template, to every other open eval PRD that runs next for its target, and to the Run-7 PRD's own milestones. Use Type D structure and this PRD as the milestone style reference. Name the file with the target in it (`prds/<issue>-evaluation-run-7-release-it.md`), because `prds/` already holds commit-story-v2's run-7. Merge the PRD-only PR to main so `/prd-start` can pick it up.

- [ ] **Copy artifacts to main**

  From main, run `git checkout feature/prd-177-evaluation-run-6-release-it -- evaluation/javascript/release-it/run-6/` and commit with `eval: save release-it run-6 artifacts to main [skip ci]`. Then add a row for run-6 to `evaluation/javascript/release-it/run-log.md`, taking its figures from `rubric-scores.md`'s Canonical Metrics table, and commit it. Then bring this branch's journal files to `main`: run `git diff --name-status origin/main feature/prd-177-evaluation-run-6-release-it -- journal`; copy each `A` path that does not already exist on `main` (`[ -e <path> ]`) with `git checkout feature/prd-177-evaluation-run-6-release-it -- <path>`; for a path that exists or is marked `M`, merge by hand and never overwrite (append only the `journal/entries/` sections whose `Commit: <hash>` is missing; for `journal/summaries/`, keep the existing file, save the branch copy under `~/journal-alternates/`, and tell Whitney). Include the entries the post-commit hook wrote for the first two commits. Commit the journal last, check that `git status --short journal/` is empty, then push all three commits together. This runs before `/prd-done`, while the eval branch is still reachable.

---

## Score Projections

Which scenario applies is decided in pre-run verification item 3. As of 2026-10-12 no fix has landed, so **Conservative is the default**. Run-5's lesson: newly committed files brought half the per-file failures, so more files does not mean the same quality.

**Conservative** (no fixes land; LLM varies):
- **Files committed**: 8–10 (Git.js and shell.js may or may not commit, by attempt luck)
- **Quality**: about 75–80% on the run-5 rule set; SCH stays low while #1072, #1084, and #1091 are open
- **Q×F**: about 6.5–7.5
- **Cost**: about $6–7

**Target** (#1093 LINT/NDS-003 remainder and #1084 SCH-002 meaning check land):
- **Files committed**: 12–13 (adds Git.js, shell.js, and some of GitBase.js and npm.js)
- **Quality**: about 75–80%, because the newly committed files carry the credential-value and un-awaited-return patterns found in their run-5 dumps
- **Q×F**: about 9–10
- **Cost**: about $6–8

**Stretch** (Target plus #1072, #1091, and #1085):
- **Files committed**: 13–15 (adds `lib/index.js` and possibly `lib/cli.js`)
- **Quality**: about 85–90%
- **Q×F**: about 11–13
- **IS**: 100/100 with a single-root trace

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| No spiny-orb fix lands before the run | Run anyway; run-6 measures run-to-run variance on the same failure set. Pre-run item 3 records which fixes are absent, so recurrences are expected, not surprises. |
| Primary spiny-orb checkout is on a feature branch | Build in the detached `origin/main` worktree (pre-run item 8), as run-5 did. |
| Newly committed files bring new failure types | Classify each failure by origin in rubric scoring rather than reporting the total as a regression. |
| IS dry run creates a tag or release | `--dry-run` is required; step 3 checks the remote for a tag and release afterward. |
| The flush-check rerun changes the fork | Use a scratch copy of the bootstrap; step 6 restores the fork and `git status --short` verifies it. |
| IS scoring unavailable with 0 committed files | Mark NOT EVALUABLE; do not block the milestone. |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-12 | Drop `HOME="$HOME"` from the instrument command | spiny-orb forwards HOME to every weaver subprocess (PRD #100, 2026-10-10 row). |
| 2026-10-12 | Use run-5's IS command (`--dry-run --ci --no-npm --git.requireCleanWorkingDir=false`, wrapped in the fork's `vals exec`) and record it in `run-summary.md` | The original `--dry-run`-only command stops at the npm login check after 4 spans. Recording the command makes run-6's span count comparable with run-7's. |
| 2026-10-12 | Score IS on the unmodified bootstrap and measure the `process.exit(0)` span loss with a separate hooked run | Keeps the IS figure comparable with run-5 while testing carry-forward item 5. The bootstrap is eval-side (PRD #100, 2026-10-10 row), so any fix goes to the eval's copy, not to spiny-orb. |
| 2026-10-12 | Default to the Conservative projection | All fifteen run-5 issues are open and placed after the Go provider in spiny-orb's ROADMAP on 2026-10-12. |
| 2026-10-12 | Carry run-5's seventeen exemption-scope readings forward as the starting point | The standing readings now in the template came from them, and reusing them keeps run-6 verdicts comparable with run-5's. |

---

## Prior Art

- **PRD #53**: run-1 evaluation (branch `feature/prd-53-javascript-eval-setup`)
- **PRD #68**: run-2 evaluation (branch `feature/prd-68-evaluation-run-2-release-it`)
- **PRD #77**: run-3 evaluation (branch `feature/prd-77-evaluation-run-3-release-it`)
- **PRD #88**: run-4 evaluation (branch `feature/prd-88-evaluation-run-4-release-it`)
- **PRD #100**: run-5 evaluation (branch `feature/prd-100-evaluation-run-5-release-it`)
- **evaluation/javascript/release-it/run-5/actionable-fix-output.md**: run-5 findings driving run-6
- **spinybacked-orbweaver `docs/research/evaluation-rubric.md`**: the rubric
