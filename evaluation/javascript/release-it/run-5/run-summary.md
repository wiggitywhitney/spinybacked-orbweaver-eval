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
| Correct skips | 10 | 10 |
| Total processed | 23 | 23 |
| Total spans | 33 | 20 |
| Total attributes | 13 | 8 |
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

| File | Spans | Attributes | Attempts | Run-4 |
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

---

## Run-4 Blocker Status (provisional)

| # | Blocker | Status after run-5 | Evidence |
|---|---------|--------------------|----------|
| RUN4-1 | LINT/NDS-003 indentation-width conflict | Partly resolved | 3 of 5 blocked files now commit (GitHub.js, GitRelease.js, prompt.js). GitBase.js still fails LINT and npm.js still fails NDS-003 (26 violations down to 4). Git.js newly fails LINT. |
| RUN4-2 | PR body E2BIG | Resolved | PR #4 created automatically; the summary file was also written to disk. |
| RUN4-3 | COV-003 `Promise.reject` gap | Fix fired (corrected from "not observed" after reading the log) | COV-003 flagged shell.js's inner `return Promise.reject(err)` catch on attempt 1, and the agent then added `recordException` to it. shell.js still failed, later on SCH-002. See `failure-deep-dives.md`. |
| RUN4-4 | GitLab.js SCH-002 cross-domain duplicate | Not seen this run, provisional | GitLab.js committed with no SCH-002 failure. The pre-run check found no namespace scoping in the duplicate detection, so this may be run-to-run variation rather than a fix. |
| RUN3-3 | HOME not forwarded to weaver | Workaround kept | `HOME="$HOME"` was in the instrument command; no weaver failure occurred. |

"Fix mechanism fired" is established for RUN4-3 only, and only from the shell.js log and debug dump (`failure-deep-dives.md` has the evidence). It is not established for any other row. A file can pass because the agent wrote differently, not because a fix worked.

---

## Observations for Later Milestones

- PR #4 lists 31 changed files, including `semconv/agent-extensions.yaml`, `spiny-orb-live-check-report.json`, and `spiny-orb-pr-summary.md`. The PR adds about 153K lines, which is dominated by the live-check report and warrants a look in PR artifact evaluation.
- The live-check line reads "OK" while the next line warns that 4 files failed instrumentation.
- `spiny-orb-output.log` is committed on the eval branch with `git add -f`, because the repository's `*.log` ignore rule would otherwise exclude it. Run-4's log was not committed and exists only on the local machine.
