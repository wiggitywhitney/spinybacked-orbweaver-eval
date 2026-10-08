# Lessons for Run 6

Observations collected during run-5 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | OK | Present in the release-it fork root |
| semconv/ | OK | `attributes.yaml`, `registry_manifest.yaml` present |
| .js file inventory | OK | 23 `.js` files in `lib/` |
| GITHUB_TOKEN_RELEASE_IT | OK | Referenced in the fork's `.vals.yaml`; `git push --dry-run` to non-existent branch `spiny-orb/auth-test` succeeded |
| GIT_CONFIG_GLOBAL override | OK | `/Users/whitney.lee/.config/spiny-orb-eval/gitconfig` exists |
| @opentelemetry/api | OK | devDependency 1.9.1, peerDependency `>=1.0.0` |
| Working tree | OK | Fork was dirty on entry: leftover OTel SDK devDeps (4 packages) in `package.json`/`package-lock.json` from a prior IS scoring run, restored with `git restore`. Untracked `bin/release-it` symlink (pointed at `../lib/node_modules/release-it/bin/release-it.js`) removed. Untracked `.vals.yaml` is required config and was left in place. Now on `main`, clean apart from `.vals.yaml`. |
| Node.js version | recorded | v25.8.0 (spiny-orb requires >= 24) |
| spiny-orb SHA | recorded | `a55bd92` (`origin/main`), built in a detached worktree at `~/Documents/Repositories/spinybacked-orbweaver-main` (`npm ci` + `npm run build`; `spiny-orb --version` reports 2.0.0). The primary checkout was on `feature/prd-373-python-provider` (129 commits ahead of main, uncommitted work), so it was not used. |
| release-it version | recorded | 20.0.0 (`package.json`) |

**Instrument command path change:** because the build lives in the worktree, the command's `node` path must be `~/Documents/Repositories/spinybacked-orbweaver-main/bin/spiny-orb.js` instead of `~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js`.

### Run-4 blocker status entering run-5

Checked against spiny-orb `origin/main` `a55bd92` by reading source and git history. No file has been instrumented yet, so "fixed in code" is not the same as "verified by the run".

| # | Blocker | Status | Evidence |
|---|---------|--------|----------|
| RUN4-1 | LINT/NDS-003 indentation-width conflict | Fixes landed in code; effect on GitHub.js unverified | PRDs #820 (Prettier-normalized NDS-003), #845, #875, #885 are in `prds/done/`; `instrument-with-retry.ts` normalizes through Prettier before comparison. |
| RUN4-2 | PR body E2BIG | Fixed | `src/deliverables/git-workflow.ts` writes the body to a temp file and passes `--body-file`. |
| RUN4-3 | COV-003 `Promise.reject` not seen as rethrow | Fixed in code | `src/languages/javascript/rules/cov003.ts` handles `return Promise.reject(err)`. |
| RUN4-4 | GitLab.js SCH-002 cross-domain duplicate | Not confirmed fixed | The recent SCH-002 change (#1056) covers the same new key reused for a different concept in one pass, which is a different problem. No namespace scoping found in the duplicate detection. Expect `release_it.gitlab.asset_name` to be flagged again. |
| RUN3-3 | HOME not forwarded to weaver | Workaround kept | `HOME="$HOME"` stays in the instrument command per the PRD decision log. |

---

## Run-5 Observations

### Process observations

- **Run-log tracking is inconsistent across the eval repo.** The `*.log` ignore rule excludes `spiny-orb-output.log`, and only some runs were force-added: commit-story-v2 tracks 12 of 25 logs, taze 5 of 16, and release-it had 0 of 5 before run-5. Run-5's log was force-added on the eval branch so step 13 carries it to main. Run-1 through run-4 logs for release-it exist only on the local machine. Whether the template should require the force-add (or the ignore rule should carve out `evaluation/**/spiny-orb-output.log`) is a template change and needs user approval at the Draft Run-6 PRD checkpoint.
- **Live progress checks worked well from a polling script.** During the run, a script parsed `spiny-orb-output.log` into per-file results next to the run-4 baseline, and Whitney read the output as a table with ✅ / ❌ / 🟡 markers. The script lived at `/tmp/run-progress.py`, outside the repository, so it does not survive a restart. Its attempt count under-reads for wrapped NDS-003 failures (it showed one attempt for npm.js, whose log shows two). Whether to commit a corrected version under `evaluation/` is an open question for Whitney.
- **Stalls of 5 to 10 minutes on large files were normal.** The log paused on Git.js, GitHub.js, and npm.js while the process stayed alive, then resumed on its own.
- **CodeRabbit reviews of the committed branch vary between runs.** Reviews of an unchanged head returned 0 findings twice and 3 findings once, and the 3 findings were about the unedited debug dumps.

- **Datadog cannot tell a boolean attribute from a string one.** In trace reconciliation the `search_datadog_spans` results showed `is_ci: "true"` and `draft: "false"`, quoted like the real string counts `enabled_count: "3"`, while the run's OTLP export had `boolValue` for the first two and `stringValue` for the third. Take attribute types for SCH-003 from the filtered `eval-traces-run<N>.json`, and use Datadog for structure and values. Whether `evaluation/trace-capture-protocol.md` should say this for every target is a template question for the end-of-run checkpoint.

### Run-5 results entering evaluation

- 9 of 23 files committed (run-4: 7), 33 spans and 13 attributes (run-4: 20 and 8), 10 harness-labeled correct skips (8 confirmed and 2 questionable in per-file evaluation: `lib/index.js` and `lib/cli.js`), PR #4 created automatically. See `run-summary.md`.
- Git.js and shell.js regressed against run-4. Four run-4 failures now commit. GitHub.js committed 13 spans and 0 new schema keys (33 `setAttribute` calls across 10 registered keys, per `per-file-evaluation.md`).

---

## Carry-Forward Items for Run 6

| # | Item | Priority | Type |
|---|------|---------|------|
| 1 | Decide the run-log tracking policy: require `git add -f` of `spiny-orb-output.log` in the template, or carve out `evaluation/**/spiny-orb-output.log` in the ignore rule. Run-5's log is already committed. | P2 | Template change, needs user approval at the Draft Run-6 PRD checkpoint |
| 2 | Decide whether to commit a corrected live-progress script under `evaluation/`. The current copy at `/tmp/run-progress.py` is outside the repository and under-reads attempts for wrapped NDS-003 failures. | P3 | Process tooling, decision for Whitney |
| 3 | Add `set -o pipefail;` to the start of the inner `bash -c` in the template instrument command (`docs/language-extension-plan.md`, copied into each run PRD). Without it, `... 2>&1 \| tee <log>` exits with `tee`'s status, so a crashed `spiny-orb instrument` reads as success to anything checking the exit code. Found by a CodeRabbit review of PRD #100 on 2026-10-08. Run-5 itself is unaffected, since the run was judged from the log, not the exit code. Template change, so it needs approval at the end-of-run template checkpoint. | Low | Process |
| 4 | Replace the IS scoring command in the run-6 PRD with the one that ran: `vals exec -i -f ~/Documents/Repositories/release-it/.vals.yaml -- env OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces node --import ./examples/instrumentation.js ./bin/release-it.js --dry-run --ci --no-npm --git.requireCleanWorkingDir=false`. The run-5 PRD's command stops at the npm login check after 4 spans. Keep the post-run check that no tag or release was created. Record the exact command in `run-summary.md` so the next run's span count can be compared with this one (run-4's command was never recorded). | P1 | Run-6 PRD milestone text (release-it specific, not a template change) |
| 5 | Make the IS scoring bootstrap flush spans on a normal exit. In run-5, `release_it.github.comment_on_resolved_items` ran (its dry-run line printed) but is missing from both the OTLP export and Datadog. release-it ends with `process.exit(0)` (`bin/release-it.js` L9), and `examples/instrumentation.js` on the instrument branch calls `sdk.shutdown()` only on SIGTERM and SIGINT, so a span that ends just before exit can lose its in-flight export. Not verified; to confirm, rerun the scored command with a shutdown hook and compare span counts. Run-5's IS score of 18 spans under-counts what ran by at least one. See "Trace Reconciliation" in `per-file-evaluation.md`. | P2 | IS scoring harness (release-it specific; check other CLI targets' bootstraps before generalizing) |
