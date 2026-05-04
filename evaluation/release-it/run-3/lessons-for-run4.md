# Lessons for Run 4

Observations collected during run-3 evaluation that should inform the next evaluation run.

---

## Pre-Run Observations

### Pre-run verification — 2026-05-04

| Item | Status | Detail |
|------|--------|--------|
| spiny-orb.yaml | | |
| semconv/ | | |
| .js file inventory | | |
| GITHUB_TOKEN_RELEASE_IT | | |
| GIT_CONFIG_GLOBAL override | | |
| Node.js version | | |
| spiny-orb version | | Branch `feature/prd-687-smarter-end-of-run-failure-handling` |
| release-it version | | |

**RUN2-1 (OTel devDependency) resolution**: *(fill in)*

**RUN2-2 (PAT / vals.yaml) resolution**: `GITHUB_TOKEN_RELEASE_IT` added to `spinybacked-orbweaver-eval/.vals.yaml` on 2026-05-04. The PAT itself had correct `pull_requests:write` scope all along — the issue was the missing vals.yaml entry. Push auth verified with dry-run before run-3.

**RUN2-3 (arrowParens LINT)**: *(fill in — did feature/prd-687 include the Prettier post-pass fix?)*

**RUN2-4 (NDS-003 GitHub.js)**: *(fill in — did feature/prd-687 include a fix?)*

**RUN2-5 (COV-003/NDS-007 GitLab.js)**: *(fill in — did feature/prd-687 include a fix?)*

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

**Instrument command for run-3** (run from `~/Documents/Repositories/release-it/`):
```bash
caffeinate -s env -u ANTHROPIC_CUSTOM_HEADERS -u ANTHROPIC_BASE_URL GIT_CONFIG_GLOBAL=/Users/whitney.lee/.config/spiny-orb-eval/gitconfig vals exec -i -f .vals.yaml -- bash -c 'GITHUB_TOKEN=$GITHUB_TOKEN_RELEASE_IT node ~/Documents/Repositories/spinybacked-orbweaver/bin/spiny-orb.js instrument lib --verbose 2>&1 | tee ~/Documents/Repositories/spinybacked-orbweaver-eval/evaluation/release-it/run-3/spiny-orb-output.log'
```

Note: source directory is `lib/` (not `src/`). spiny-orb built from `feature/prd-687-smarter-end-of-run-failure-handling`.

---

## Run-3 Observations

*(fill in during and after the run)*

---

## Carry-Forward Items for Run 4

| # | Item | Priority | Type |
|---|------|---------|------|
