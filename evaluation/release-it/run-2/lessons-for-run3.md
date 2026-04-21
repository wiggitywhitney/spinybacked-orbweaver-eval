# Lessons for Run 3

Observations collected during run-2 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification — 2026-04-21

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | ✅ | `schemaPath: semconv`, `sdkInitFile: examples/instrumentation.js`, `dependencyStrategy: peerDependencies` |
| semconv/ | ✅ | `attributes.yaml` present (updated in issue #67: replaced custom git attrs with semconv refs) |
| .js file inventory | ✅ | 23 files in `lib/` (same as run-1 — fork is frozen) |
| spiny-orb build | ✅ | Built from main (SHA 712a2b8) |
| GITHUB_TOKEN_RELEASE_IT | ✅ | New fine-grained PAT with `pull_requests:write`, resolves via vals |
| GIT_CONFIG_GLOBAL override | ✅ | `/Users/whitney.lee/.config/spiny-orb-eval/gitconfig` — disables `tag.gpgsign` |
| Node.js version | | (fill in at run time) |
| spiny-orb version | 1.0.0 (SHA 712a2b8) | |
| release-it version | 20.0.0 | |

**RUN1-1 (gpgsign) resolution**: Using `GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig` in the instrument command prefix. The override file inherits all normal git identity/credential settings but sets `tag.gpgsign=false` and `commit.gpgsign=false`.

**RUN1-2 (arrowParens LINT oscillation)**: Not confirmed fixed in spiny-orb SHA 712a2b8. `config.js` and `index.js` may fail again. Accepted — plugin files are the target of this run.

**RUN1-3 (PAT pull_request:write) resolution**: New fine-grained PAT scoped to `wiggitywhitney/release-it` with `pull_requests:write`. Stored as `github-token-release-it` in GCP Secret Manager, injected as `GITHUB_TOKEN_RELEASE_IT` via vals. Instrument command uses `bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ...'`.

**Source file inventory (23 .js files in `lib/`):**
```text
lib/args.js                      lib/plugin/GitBase.js
lib/cli.js                       lib/plugin/GitRelease.js
lib/config.js                    lib/plugin/Plugin.js
lib/index.js                     lib/plugin/factory.js
lib/log.js                       lib/plugin/git/Git.js
lib/prompt.js                    lib/plugin/git/prompts.js
lib/shell.js                     lib/plugin/github/GitHub.js
lib/spinner.js                   lib/plugin/github/prompts.js
lib/util.js                      lib/plugin/github/util.js
lib/plugin/npm/npm.js            lib/plugin/gitlab/GitLab.js
lib/plugin/npm/prompts.js        lib/plugin/gitlab/prompts.js
lib/plugin/version/Version.js
```

**Instrument command for run-2** (run from `~/Documents/Repositories/release-it/`):
```bash
caffeinate -s GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-2/spiny-orb-output.log'
```

Note: source directory is `lib/` (not `src/`).

---

## Run-2 Observations

*(fill in during and after the run)*

---

## Carry-Forward Items for Run 3

*(fill in during actionable fix output milestone)*
