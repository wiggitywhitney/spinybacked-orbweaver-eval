# Run Summary — release-it Run 5

**Date**: 2026-09-29
**Duration**: 1h 17m 23.9s
**spiny-orb SHA**: a55bd92 (`origin/main`, built in the detached worktree `~/Documents/Repositories/spinybacked-orbweaver-main`)
**Node.js**: v25.8.0
**release-it version**: 20.0.0
**Instrument branch**: spiny-orb/instrument-1790686416741
**PR**: https://github.com/wiggitywhitney/release-it/pull/4 (created automatically)

Every fix-verification statement below is provisional. It comes from the run log and the final summary box, not from per-file evaluation, which is the authoritative check.

---

## Results

| Metric | Run-5 | Run-4 |
|--------|-------|-------|
| Files committed | 9 | 7 |
| Files failed | 4 | 6 |
| Files partial | 0 | 0 |
| Correct skips (harness-labeled; 8 confirmed, 2 questionable per per-file evaluation) | 10 | 10 |
| Total processed | 23 | 23 |
| Total spans | 33 | 20 |
| Total attributes (new schema keys only, as the log counts them; emitted keys are in `per-file-evaluation.md`) | 13 | 8 |
| Attempts (committed files) | 17 | 11 |
| Attempts (all files sent to the agent) | 28 | 26 |
| Input tokens | 219.7K | 218.8K |
| Output tokens | 254.8K (199.7K cached) | 334.7K (219.1K cached) |
| Cost | $6.55 (claude-sonnet-4-6) | ~$5–6 |
| Push | SUCCEEDED, branch pushed to wiggitywhitney/release-it | SUCCEEDED |
| PR | SUCCEEDED, PR #4 created automatically | FAILED (E2BIG) |
| Live-check | "OK" with a partial warning: 1239 spans, 5555 advisory findings, 4 files failed instrumentation | OK, 2173 spans, 15389 advisory findings |

Quality score, Q×F, and IS score come from later milestones and are not part of this summary.

---

## Committed Files

| File | Spans | New schema keys | Attempts | Run-4 |
|------|-------|-----------|---------|-------|
| lib/config.js | 3 | 1 | 3 | committed, 1 attempt |
| lib/plugin/Plugin.js | 1 | 0 | 1 | committed, 1 attempt |
| lib/plugin/factory.js | 2 | 2 | 2 | committed, 1 attempt |
| lib/plugin/version/Version.js | 1 | 0 | 1 | committed, 3 attempts |
| lib/util.js | 1 | 1 | 2 | committed, 1 attempt |
| lib/prompt.js | 1 | 4 | 2 | **failed** (LINT) |
| lib/plugin/GitRelease.js | 2 | 1 | 2 | **failed** (LINT) |
| lib/plugin/github/GitHub.js | 13 | 0 | 2 | **failed** (NDS-003 ×8) |
| lib/plugin/gitlab/GitLab.js | 9 | 4 | 2 | **failed** (COV-003, SCH-002 ×2) |

Four files committed that failed in run-4. GitLab.js had never committed in an earlier run of this target (per this PRD's problem statement and run-4). GitHub.js committed 13 spans with 0 attributes, which per-file evaluation should examine.

## Failed Files

| File | Failure mode | Attempts | Run-4 |
|------|-------------|---------|-------|
| lib/plugin/GitBase.js | LINT (Prettier would reformat the instrumented output) | 3 | failed, same LINT |
| lib/plugin/git/Git.js | LINT (Prettier would reformat the instrumented output) | 3 | **committed** (10 spans, 4 attributes) |
| lib/plugin/npm/npm.js | NDS-003 ×4 (original lines modified or missing) | 2 | failed, NDS-003 ×26 |
| lib/shell.js | SCH-002 (`release_it.shell.command` declared with an inconsistent value source) | 3 | **committed** (2 spans, 0 attributes) |

Git.js and shell.js are regressions against run-4. Together they cost 12 spans that run-4 had (10 in Git.js, 2 in shell.js). Root causes belong to the failure deep-dives; the log and `debug-dumps/` hold the evidence.

## Correct Skips (10)

All ten were pre-scan skips with no LLM call: lib/args.js, lib/cli.js, lib/index.js, lib/log.js, lib/spinner.js, lib/plugin/git/prompts.js, lib/plugin/github/prompts.js, lib/plugin/github/util.js, lib/plugin/gitlab/prompts.js, lib/plugin/npm/prompts.js. This is the same count as run-4.

Corrected in per-file evaluation: 8 of the 10 are confirmed correct skips, and 2 are questionable. `lib/index.js` (`runTasks`, the async orchestrator) and `lib/cli.js` (the async CLI entry point) were skipped because of pre-scan false negatives, which reproduce on a55bd92. See `per-file-evaluation.md`, "Correct Skips (10)".

---

## Run-4 Blocker Status (provisional)

| # | Blocker | Status after run-5 | Evidence |
|---|---------|--------------------|----------|
| RUN4-1 | LINT/NDS-003 indentation-width conflict | Partly resolved | 3 of 5 blocked files now commit (GitHub.js, GitRelease.js, prompt.js). GitBase.js still fails LINT and npm.js still fails NDS-003 (26 violations down to 4). Git.js newly fails LINT. |
| RUN4-2 | PR body E2BIG | Resolved | PR #4 created automatically; the summary file was also written to disk. |
| RUN4-3 | COV-003 `Promise.reject` gap | Fix fired (corrected from "not observed" after reading the log) | COV-003 flagged shell.js's inner `return Promise.reject(err)` catch on attempt 1, and the agent then added both `recordException` and `setStatus(ERROR)` to it. shell.js did not commit, so the evidence for those added calls is the log and the debug dump only. It still failed, later on SCH-002. See `failure-deep-dives.md`. |
| RUN4-4 | GitLab.js SCH-002 cross-domain duplicate | Recurred during the run, did not block the commit (corrected in per-file evaluation) | GitLab.js attempt 1 failed SCH-002 ×2 on `release_it.gitlab.request.method` with the same "semantic duplicate" plus "not found in registry" pair as run-4. The agent deleted the attribute in attempt 2 and the file committed. The log has no validator message text, so whether the match was cross-domain or the legitimate OTel `http.request.method` is unconfirmed. The pre-run check found no namespace scoping in the duplicate detection. |
| RUN3-3 | HOME not forwarded to weaver | Workaround kept | `HOME="$HOME"` was in the instrument command; no weaver failure occurred. |

"Fix mechanism fired" is established for RUN4-3 only, and only from the shell.js log and debug dump (`failure-deep-dives.md` has the evidence). It is not established for any other row. A file can pass because the agent wrote differently, not because a fix worked.

---

## Observations for Later Milestones

- PR #4 lists 31 changed files, including `semconv/agent-extensions.yaml`, `spiny-orb-live-check-report.json`, and `spiny-orb-pr-summary.md`. The PR adds about 153K lines, which is dominated by the live-check report and warrants a look in PR artifact evaluation.
- The live-check line reads "OK" while the next line warns that 4 files failed instrumentation.
- `spiny-orb-output.log` is committed on the eval branch with `git add -f`, because the repository's `*.log` ignore rule would otherwise exclude it. Run-4's log was not committed and exists only on the local machine.

---

## IS Scoring Run (2026-10-08)

**IS score: 100/100** (8 of 8 applicable rules pass; 7 not applicable). Run-4 also scored 100/100.

**Run-4 and run-5 span counts are not strictly comparable.** Run-5's scored trace has 18 spans and run-4's had 9, but run-5 used a modified dry-run command (below) and run-4's exact command was never recorded. Treat the two counts as two separate observations, not as a trend.

### Commands and changes from the PRD command

The PRD's command (`node --import ./examples/instrumentation.js ./bin/release-it.js --dry-run`) stops at release-it's npm login check (`ERROR Not authenticated with npm`). That point comes before any Git, GitHub, prompt, or shell code runs, so the trace would hold only config loading and plugin discovery. Three attempts ran against the instrument branch's `lib/` and `examples/`:

| Attempt | Command additions | Start ns | End ns | Outcome | Spans |
|---------|-------------------|----------|--------|---------|-------|
| 1 | `--ci` | 1791470181087747000 | 1791470182181105000 | Stopped at the npm login check | 4 (2 traces) |
| 2 | `--ci --no-npm`, run under `vals exec -f ~/Documents/Repositories/release-it/.vals.yaml` for `GITHUB_TOKEN_RELEASE_IT` | 1791471341277407000 | 1791471343313055000 | Stopped at the Git plugin's clean-working-directory check (the instrumented checkout and the temporary SDK install make the tree dirty) | not scored |
| **3 (scored)** | `--ci --no-npm --git.requireCleanWorkingDir=false`, same `vals exec` wrapper | **1791471356820887000** | **1791471360007383000** | Completed, exit 0 | **18 (10 traces)** |

- `--ci` stops release-it from waiting on interactive prompts. It does not change where attempt 1 stopped, because the npm check comes before any prompt.
- `--no-npm` disables the npm plugin, so the npm.js code paths are not exercised. npm.js failed instrumentation in this run, so it has no committed spans to lose.
- The `after:init` hook in the fork's `.release-it.json` (lint, knip, tests) did not run; the dry run finished in about 3 seconds.
- The dry run printed its skipped writes (`git commit`, `git tag`, `git push`, `octokit repos.createRelease`, `octokit issues.createComment`) with the `!` prefix. Checked afterward: there is no local or remote `20.0.1` tag, and `gh release view 20.0.1` returns "release not found".

Scored file: `eval-traces-run5.json` (filtered with `filter-traces.js` for service `release-it` between attempt 3's timestamps; 18 of the 26 `release-it` spans in the shared file fall in that window; redaction left the score unchanged; `grep --count "$(whoami)"` returns 0).

### Trace artifact

Captured: `trace-artifact.md` (`service.instance.id` 7719aa1c-8095-4835-be12-f08c3eb837b3; 18 spans in Datadog after one retry, matching the filtered file).

### Missing-root-span check

The prediction held. One dry run produced **10 distinct trace IDs, each with its own root span, and no orphans** (all spans share `service.instance.id` 7719aa1c-8095-4835-be12-f08c3eb837b3). Roots: `release_it.config.init`, `release_it.plugin.get_plugins`, `release_it.github.init`, five separate `release_it.util.reduce_until`, `release_it.git_release.before_release`, and `release_it.github.release`. Only three traces have children: `config.init` (a two-level chain), `github.init` (two direct children), and `github.release` (a four-level chain: `create_release` → `get_octokit_release_options` → `render_release_notes` → `get_commits`, per the Datadog parent IDs in `trace-artifact.md`). Without spans on `lib/index.js` `runTasks` and the `lib/cli.js` default export, there is no common root.

Leads for the per-file trace reconciliation step (not yet assessed):

- `release_it.github.is_collaborator` and `release_it.github.is_authenticated` last 0.0ms under a 1.3ms `github.init`.
- The four spans under `release_it.github.release` are nested one inside the next, and each lasts about 848-850ms. Check whether that nesting matches the call structure in GitHub.js or comes from active-context propagation across calls that are not nested in the source.
- No `release_it.git.*`, `release_it.shell.*`, or `release_it.npm.*` spans appear; Git.js, shell.js, and npm.js failed instrumentation in this run. Of the committed files, prompt.js and Plugin.js (prompt spans, skipped by `--ci`) and GitLab.js (not configured) emit nothing. factory.js, GitRelease.js, and GitHub.js emit some of their span names (1 of 2, 1 of 2, 7 of 13).
- Version.js's `release_it.version.get_incremented_version` is absent although the run computed version 20.0.1.
